package candidature

import (
	"astro-backend/config"
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/internal/mail_config"
	"astro-backend/middleware"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	mailPkg "astro-backend/pkg/mail"
	"context"
	"crypto/subtle"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type CandidatureService struct {
	db *bun.DB
}

const defaultStep = "cv_screening"

// Listes fixes (whitelist) : l'index 1..5 est la seule entrée variable,
// les noms de colonnes ne sont JAMAIS construits depuis une entrée utilisateur.
var pipelineStageIDs = [5]string{"cv", "quiz", "online", "f2f", "final"}
var pipelineDBSteps = [5]string{"cv_screening", "online_quiz", "online_meeting", "f2f_meeting", "final_decision"}

func currentStepScore(c *domain.Candidature) int {
	return scoreForStep(c, currentIndex(c))
}

// stageIndex convertit un step (string) en index d'étape 1..5.
func stageIndex(step string) int {
	switch normalizeStage(step) {
	case "quiz":
		return 2
	case "online":
		return 3
	case "f2f":
		return 4
	case "final":
		return 5
	default:
		return 1
	}
}

func normalizeStage(step string) string {
	s := strings.TrimSpace(strings.ToLower(step))
	if s == "" {
		return "cv"
	}
	if s == "cv" || s == "cv_screening" || strings.Contains(s, "cv_screening") {
		return "cv"
	}
	if s == "quiz" || s == "online_quiz" || strings.Contains(s, "quiz") {
		return "quiz"
	}
	if s == "online" || s == "online_meeting" || strings.Contains(s, "online_meeting") {
		return "online"
	}
	if s == "f2f" || s == "f2f_meeting" || strings.Contains(s, "f2f") {
		return "f2f"
	}
	if s == "final" || s == "final_decision" || strings.Contains(s, "final") {
		return "final"
	}
	return "cv"
}

func normalizeStatus(status string) string {
	s := strings.TrimSpace(strings.ToLower(status))
	if s == "accepted" || s == "invited" || s == "approved" {
		return "accepted"
	}
	if s == "rejected" || s == "refused" || s == "declined" || s == "failed" {
		return "rejected"
	}
	return "pending"
}

func clampStep(n int) int {
	if n < 1 {
		return 1
	}
	if n > 5 {
		return 5
	}
	return n
}

// currentIndex retourne l'étape courante 1..5 (repli sur step si current_step invalide).
func currentIndex(c *domain.Candidature) int {
	if c.CurrentStep >= 1 && c.CurrentStep <= 5 {
		return c.CurrentStep
	}
	return stageIndex(c.Step)
}

func getStepStatus(c *domain.Candidature, n int) string {
	var v *string
	switch clampStep(n) {
	case 1:
		v = c.Step1Status
	case 2:
		v = c.Step2Status
	case 3:
		v = c.Step3Status
	case 4:
		v = c.Step4Status
	default:
		v = c.Step5Status
	}
	if v == nil {
		return ""
	}
	return *v
}

func setStepStatus(c *domain.Candidature, n int, v string) {
	switch clampStep(n) {
	case 1:
		c.Step1Status = &v
	case 2:
		c.Step2Status = &v
	case 3:
		c.Step3Status = &v
	case 4:
		c.Step4Status = &v
	default:
		c.Step5Status = &v
	}
}

func scoreForStep(c *domain.Candidature, n int) int {
	switch clampStep(n) {
	case 2:
		return c.ScoreOnlineQuiz
	case 3:
		return c.ScoreOnlineMeeting
	case 4:
		return c.ScoreF2FMeeting
	case 5:
		return c.ScoreFinalDecision
	default:
		return c.ScoreCVScreening
	}
}

// resolveStatus retourne le statut de l'étape ACTUELLE (jamais une autre étape).
func resolveStatus(c *domain.Candidature) string {
	if s := getStepStatus(c, currentIndex(c)); s != "" {
		return s
	}
	if c.Status != "" {
		return c.Status
	}
	return "pending"
}

// applyDecision applique accept/reject à l'étape courante N, en UN SEUL update
// sur la ligne existante (jamais de nouvelle ligne ni de nouvelle table).
// Accept N : stepN=accepted ; si N<5 stepN+1=pending + current=N+1, si N==5 statut global accepted.
// Reject N : stepN=rejected + statut global rejected (flow email de rejet inchangé).
func applyDecisionToRow(c *domain.Candidature, decision string) error {
	n := currentIndex(c)
	if decision == "accepted" || decision == "rejected" {
		if scoreForStep(c, n) <= 0 {
			return fmt.Errorf("cannot set status to %s: a score is required for the current step (%s)", decision, pipelineDBSteps[n-1])
		}
	}
	now := time.Now().Format("2006-01-02 15:04:05")
	switch decision {
	case "accepted":
		setStepStatus(c, n, "accepted")
		if n < 5 {
			setStepStatus(c, n+1, "pending")
			c.CurrentStep = n + 1
			c.Step = pipelineDBSteps[n]
			c.Status = "pending"
		} else {
			c.Status = "accepted"
		}
	case "rejected":
		setStepStatus(c, n, "rejected")
		c.Status = "rejected"
	case "pending":
		setStepStatus(c, n, "pending")
		c.Status = "pending"
	}
	c.UpdatedAt = now
	return nil
}

func (s *CandidatureService) updateDecisionWithAudit(ctx context.Context, candidature *domain.Candidature, decision, reasonCode string) error {
	// Server-local wall clock: audit timestamps are stored naive and
	// displayed verbatim, so they must follow the server clock (no UTC).
	actionAt := time.Now()
	stepIndex := currentIndex(candidature)
	step := pipelineDBSteps[stepIndex-1]
	oldValue := getStepStatus(candidature, stepIndex)
	nextStep := ""
	if decision == "accepted" && stepIndex < len(pipelineDBSteps) {
		nextStep = pipelineDBSteps[stepIndex]
	}

	if err := applyDecisionToRow(candidature, decision); err != nil {
		return err
	}
	candidature.RejectionReason = reasonCode
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("could not begin candidature decision transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.NewUpdate().Model(candidature).Where("id = ?", candidature.ID).Exec(ctx); err != nil {
		return fmt.Errorf("could not update candidature status: %w", err)
	}
	action := "reject"
	if decision == "accepted" {
		action = "accept"
	}
	if err := audit.LogCandidatureStepAction(ctx, tx, candidature.ID, action, step, oldValue, nextStep, reasonCode, actionAt); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("could not commit candidature decision: %w", err)
	}
	return nil
}

// transitionRowWithoutAudit applies a pipeline decision to a row without
// writing an audit entry. Used for grouped bulk operations where a single
// mail (and its single audit on the representative row) covers several rows.
func (s *CandidatureService) transitionRowWithoutAudit(ctx context.Context, candidature *domain.Candidature, decision, reasonCode string) error {
	if err := applyDecisionToRow(candidature, decision); err != nil {
		return err
	}
	candidature.RejectionReason = reasonCode
	if _, err := s.db.NewUpdate().Model(candidature).Where("id = ?", candidature.ID).Exec(ctx); err != nil {
		return fmt.Errorf("could not update candidature status: %w", err)
	}
	return nil
}

func (s *CandidatureService) GetEmailTemplateByType(ctx context.Context, templateType string, step string) (*domain.EmailTemplate, error) {
	var template domain.EmailTemplate
	if step != "" {
		err := s.db.NewSelect().Model(&template).
			Where("type = ? AND step = ?", templateType, step).
			Limit(1).
			Scan(ctx)
		if err == nil {
			return &template, nil
		}
	}
	err := s.db.NewSelect().Model(&template).
		Where("type = ?", templateType).
		Where("(step = '' OR step IS NULL)").
		Limit(1).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (s *CandidatureService) getSubjectQuizLink(ctx context.Context, subjectName string) string {
	names := strings.Split(subjectName, ",")
	if len(names) == 0 {
		return ""
	}
	name := strings.TrimSpace(names[0])
	if name == "" {
		return ""
	}
	var link string
	_ = s.db.NewSelect().Column("online_quiz_link").Model((*domain.Subject)(nil)).Where("TRIM(name) = ?", name).Scan(ctx, &link)
	return link
}

func (s *CandidatureService) getSubjectMeetingLink(ctx context.Context, subjectName string) string {
	names := strings.Split(subjectName, ",")
	if len(names) == 0 {
		return ""
	}
	name := strings.TrimSpace(names[0])
	if name == "" {
		return ""
	}
	var link string
	_ = s.db.NewSelect().Column("online_meeting_link").Model((*domain.Subject)(nil)).Where("TRIM(name) = ?", name).Scan(ctx, &link)
	return link
}

func (s *CandidatureService) getSubjectF2FMeetingLink(ctx context.Context, subjectName string) string {
	names := strings.Split(subjectName, ",")
	if len(names) == 0 {
		return ""
	}
	name := strings.TrimSpace(names[0])
	if name == "" {
		return ""
	}
	var link string
	_ = s.db.NewSelect().Column("f2f_meeting_link").Model((*domain.Subject)(nil)).Where("TRIM(name) = ?", name).Scan(ctx, &link)
	return link
}

// asterOideaMapsURL is the fixed office location used for the "Address" line
// in face-to-face meeting invitation emails.

const asterOideaMapsURL = "https://www.google.com/maps/place/Asteroidea/@36.7683782,10.2420193,909m/data=!3m2!1e3!4b1!4m6!3m5!1s0x12fd370003d7b35b:0xba18eae5e43a8557!8m2!3d36.7683739!4d10.2445942!16s%2Fg%2F11vy5k2_b2?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D"

// asterOideaAddressLink renders the office address as a clickable link whose
// visible text is "Address".
func asterOideaAddressLink() string {
	return fmt.Sprintf(`<a href="%s">Address</a>`, asterOideaMapsURL)
}

// truncateError caps stored SMTP errors so email_logs stays readable.
func truncateError(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) <= max {
		return s
	}
	return s[:max]
}

// emailRenderVars carries the dynamic values used to fill an email template.
type emailRenderVars struct {
	interviewDate   string
	interviewTime   string
	startDate       string
	rejectionReason string
	link            string
	mapsLink        string
}

// resolveEmailLink picks the first non-empty link among quiz / meeting / f2f
// links so the single [Link] placeholder works for every invitation type.
func resolveEmailLink(quiz, meeting, f2f string) string {
	if quiz != "" {
		return quiz
	}
	if meeting != "" {
		return meeting
	}
	return f2f
}

// renderEmailPlaceholders replaces the only supported placeholders in s. All
// other tokens are left untouched (removed from templates):
//
//	[Date]   -> interview date, or the start date when no interview was set
//	[Time]   -> interview time
//	[Reason] -> rejection reason
//	[Link]   -> the relevant link (quiz or meeting)
//	[Maps]   -> Google Maps link
func renderEmailPlaceholders(s string, v emailRenderVars) string {
	date := v.interviewDate
	if strings.TrimSpace(date) == "" {
		date = v.startDate
	}

	s = strings.ReplaceAll(s, "[Date]", date)
	s = strings.ReplaceAll(s, "[Time]", v.interviewTime)
	s = strings.ReplaceAll(s, "[Reason]", v.rejectionReason)
	s = strings.ReplaceAll(s, "[Link]", v.link)
	s = strings.ReplaceAll(s, "[Maps]", v.mapsLink)

	return s
}

func (s *CandidatureService) GetRecent(ctx context.Context) ([]*domain.Candidature, error) {
	log.Info().Msg("Fetching recent 10 candidatures...")
	var candidatures []*domain.Candidature
	err := s.db.NewSelect().Model(&candidatures).
		Order("cnd.id DESC").
		Limit(10).
		Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Candidature{}, nil
		}
		return nil, fmt.Errorf("database error: %w", err)
	}
	return candidatures, nil
}

func (s *CandidatureService) GetAll(ctx context.Context, params CandidatureParams) ([]*domain.Candidature, error) {
	log.Info().Msg("Fetching all candidatures...")
	var candidatures []*domain.Candidature

	query := s.db.NewSelect().Model(&candidatures)
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		searchLower := strings.ToLower(params.Search)
		conds := []string{
			"cnd.full_name ILIKE ?",
			"cnd.full_name2 ILIKE ?",
			"cnd.email1 ILIKE ?",
			"cnd.subject_name ILIKE ?",
			"cnd.status ILIKE ?",
		}
		args := []interface{}{searchPattern, searchPattern, searchPattern, searchPattern, searchPattern}
		if searchLower == "solo" {
			conds = append(conds, "(cnd.full_name2 IS NULL OR cnd.full_name2 = '')")
		} else if searchLower == "pair" || searchLower == "binôme" {
			conds = append(conds, "(cnd.full_name2 IS NOT NULL AND cnd.full_name2 != '')")
		}
		query = query.Where("("+strings.Join(conds, " OR ")+")", args...)
	}

	if params.FullName != "" {
		searchName := "%" + params.FullName + "%"
		query = query.Where("(cnd.full_name ILIKE ? OR cnd.full_name2 ILIKE ?)", searchName, searchName)
	}

	if params.CandidatureType == "solo" {
		query = query.Where("cnd.full_name2 = '' OR cnd.full_name2 IS NULL")
	} else if params.CandidatureType == "pair" {
		query = query.Where("cnd.full_name2 != '' AND cnd.full_name2 IS NOT NULL")
	}

	if params.Gender != "" {
		query = query.Where("(cnd.gender1 = ? OR cnd.gender2 = ?)", params.Gender, params.Gender)
	}

	if params.Degree != "" {
		query = query.Where("(cnd.degree1 = ? OR cnd.degree2 = ?)", params.Degree, params.Degree)
	}

	if params.SubjectName != "" {
		query = query.Where("cnd.subject_name ILIKE ?", "%"+params.SubjectName+"%")
	}

	if params.Status != "" {
		query = query.Where("cnd.status = ?", params.Status)
	}

	if params.Step != "" {
		query = query.Where("cnd.step = ?", params.Step)
	}

	query = applyScoreRangeFilter(query, params)

	if sort := scoreSortClause(params.ScoreSortStep, params.ScoreSortDirection); sort != "" {
		query = query.Order(sort)
	} else {
		query = query.Order("cnd.id DESC")
	}

	err := query.Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Candidature{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching candidatures")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(candidatures)).Msg("Successfully retrieved candidatures")
	return candidatures, nil
}

// scoreStepColumns whitelists step names to their score column. Shared by the
// sort clause and the score-range filter so both resolve steps identically.
var scoreStepColumns = map[string]string{
	"cv_screening":   "score_cv_screening",
	"online_quiz":    "score_online_quiz",
	"online_meeting": "score_online_meeting",
	"f2f_meeting":    "score_f2f_meeting",
	"final_decision": "score_final_decision",
}

// scoreSortClause builds the ORDER BY clause for a step-based score sort using
// a safe column whitelist. Returns "" when no sort is requested, so callers
// fall back to the default ordering.
func scoreSortClause(step, direction string) string {
	col := scoreStepColumns[step]
	if col == "" {
		return ""
	}
	dir := strings.ToUpper(direction)
	if dir != "ASC" && dir != "DESC" {
		dir = "ASC"
	}
	return fmt.Sprintf("cnd.%s %s NULLS LAST", col, dir)
}

// currentStepScoreExpr resolves each row's own current-step score, mirroring
// scoreForStep/currentIndex (1→cv default, 2→quiz, 3→online meeting,
// 4→f2f, 5→final decision).
const currentStepScoreExpr = `CASE cnd.current_step WHEN 2 THEN cnd.score_online_quiz WHEN 3 THEN cnd.score_online_meeting WHEN 4 THEN cnd.score_f2f_meeting WHEN 5 THEN cnd.score_final_decision ELSE cnd.score_cv_screening END`

// applyScoreRangeFilter restricts rows to the [min, max] score range on the
// requested step's column (or each row's current-step score when step is
// empty/"all"). Absent bounds are open-ended; no bounds → query unchanged.
func applyScoreRangeFilter(query *bun.SelectQuery, params CandidatureParams) *bun.SelectQuery {
	if params.ScoreMin == nil && params.ScoreMax == nil {
		return query
	}
	expr := currentStepScoreExpr
	if col := scoreStepColumns[params.ScoreStep]; col != "" {
		expr = "cnd." + col
	}
	if params.ScoreMin != nil && params.ScoreMax != nil {
		return query.Where(expr+" BETWEEN ? AND ?", *params.ScoreMin, *params.ScoreMax)
	}
	if params.ScoreMin != nil {
		return query.Where(expr+" >= ?", *params.ScoreMin)
	}
	return query.Where(expr+" <= ?", *params.ScoreMax)
}

// storedRelPath returns the path portion after the last "uploads/" segment,
// so polluted rows (already-prefixed full URLs) are normalized to "cvs/file.pdf".
func storedRelPath(path string) string {
	idx := strings.LastIndex(path, "uploads/")
	if idx < 0 {
		return path
	}
	return path[idx+len("uploads/"):]
}

// getStoredByID loads a candidature from the database WITHOUT mutating the
// stored file paths into public URLs. Persistence flows must use this so they
// never write API-rendered (prefixed) paths back into the database.
func (s *CandidatureService) getStoredByID(ctx context.Context, id int) (*domain.Candidature, error) {
	log.Info().Int("id", id).Msg("Fetching candidature by ID...")

	candidature := &domain.Candidature{}
	err := s.db.NewSelect().Model(candidature).
		Where("cnd.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("id", id).Msg("Candidature not found")
			return nil, fmt.Errorf("candidature with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("id", id).Msg("Database error while fetching candidature")
		return nil, fmt.Errorf("could not fetch candidature: %w", err)
	}

	return candidature, nil
}

func (s *CandidatureService) GetByID(ctx context.Context, id int) (*domain.Candidature, error) {
	backendUrl := config.Configvar.Server.BackendUrl

	candidature, err := s.getStoredByID(ctx, id)
	if err != nil {
		return nil, err
	}

	addBackendURL := func(path string) string {
		if path == "" {
			return path
		}
		return strings.TrimRight(backendUrl, "/") + "/api/uploads/" + storedRelPath(path)
	}

	candidature.PathCV = addBackendURL(candidature.PathCV)
	candidature.PathLettreMotivation = addBackendURL(candidature.PathLettreMotivation)
	candidature.PathCV2 = addBackendURL(candidature.PathCV2)
	candidature.PathLettreMotivation2 = addBackendURL(candidature.PathLettreMotivation2)

	log.Info().Int("id", id).Msg("Successfully retrieved candidature")
	return candidature, nil
}

func (s *CandidatureService) Create(ctx context.Context, candidature *domain.Candidature) (*domain.Candidature, error) {
	log.Info().Str("full_name", candidature.FullName).Msg("Creating a new candidature...")
	if candidature.Step == "" {
		candidature.Step = defaultStep
	}
	if candidature.Status == "" {
		candidature.Status = "pending"
	}
	// Nouvelle candidature : étape 1 en pending, le reste NULL (pas encore atteinte).
	candidature.CurrentStep = 1
	pending := "pending"
	candidature.Step1Status = &pending
	candidature.Step2Status = nil
	candidature.Step3Status = nil
	candidature.Step4Status = nil
	candidature.Step5Status = nil
	candidature.DateApplication = time.Now().Format("2006-01-02")
	candidature.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	candidature.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err := s.db.NewInsert().Model(candidature).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("full_name", candidature.FullName).Msg("Could not create candidature")
		return nil, fmt.Errorf("could not create candidature: %w", err)
	}

	log.Info().Str("full_name", candidature.FullName).Msg("Candidature created successfully")
	return candidature, nil
}

func (s *CandidatureService) Update(ctx context.Context, id int, request UpdateCandidatureRequest) (*domain.Candidature, error) {
	log.Info().Int("id", id).Msg("Updating candidature...")

	candidature, err := s.getStoredByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if request.FullName != "" {
		candidature.FullName = request.FullName
	}
	if request.Email1 != "" {
		candidature.Email1 = request.Email1
	}
	if request.Gender1 != "" {
		candidature.Gender1 = request.Gender1
	}
	if request.Phone1 != "" {
		candidature.Phone1 = request.Phone1
	}
	if request.Degree1 != "" {
		candidature.Degree1 = request.Degree1
	}
	if request.FullName2 != "" {
		candidature.FullName2 = request.FullName2
	}
	if request.Email2 != "" {
		candidature.Email2 = request.Email2
	}
	if request.Gender2 != "" {
		candidature.Gender2 = request.Gender2
	}
	if request.Phone2 != "" {
		candidature.Phone2 = request.Phone2
	}
	if request.Degree2 != "" {
		candidature.Degree2 = request.Degree2
	}
	if request.Duration != "" {
		candidature.Duration = request.Duration
	}
	if request.Methode != "" {
		candidature.Methode = request.Methode
	}
	if request.StartDate != "" {
		candidature.StartDate = request.StartDate
	}
	if request.SubjectName != "" {
		candidature.SubjectName = request.SubjectName
	}
	if request.University != "" {
		candidature.University = request.University
	}
	if request.University2 != "" {
		candidature.University2 = request.University2
	}
	if request.PathCV != "" {
		candidature.PathCV = request.PathCV
	}
	if request.PathLettreMotivation != "" {
		candidature.PathLettreMotivation = request.PathLettreMotivation
	}
	if request.PathCV2 != "" {
		candidature.PathCV2 = request.PathCV2
	}
	if request.PathLettreMotivation2 != "" {
		candidature.PathLettreMotivation2 = request.PathLettreMotivation2
	}
	if request.ScoreCVScreening != nil {
		candidature.ScoreCVScreening = int(*request.ScoreCVScreening)
	}
	if request.ScoreOnlineQuiz != nil {
		candidature.ScoreOnlineQuiz = int(*request.ScoreOnlineQuiz)
	}
	if request.ScoreOnlineMeeting != nil {
		candidature.ScoreOnlineMeeting = int(*request.ScoreOnlineMeeting)
	}
	if request.ScoreF2FMeeting != nil {
		candidature.ScoreF2FMeeting = int(*request.ScoreF2FMeeting)
	}
	if request.ScoreFinalDecision != nil {
		candidature.ScoreFinalDecision = int(*request.ScoreFinalDecision)
	}
	// Notes is always synced so users can also clear an existing note
	candidature.Notes = request.Notes
	// Persist the rejection reason when supplied directly (without a status
	// transition) so it can be edited/cleared through the update endpoint too.
	if request.RejectionReason != "" {
		candidature.RejectionReason = request.RejectionReason
	}

	// Déplacement manuel explicite (sans décision) : resynchronise current_step
	// sur le step demandé, sans toucher aux statuts par étape.
	if request.Step != "" && request.Status == "" {
		if idx := stageIndex(request.Step); pipelineDBSteps[idx-1] != candidature.Step {
			candidature.Step = pipelineDBSteps[idx-1]
			candidature.CurrentStep = idx
			if getStepStatus(candidature, idx) == "" {
				setStepStatus(candidature, idx, "pending")
			}
			candidature.Status = resolveStatus(candidature)
		}
	}

	decisionUpdated := false
	candidature.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	// Décision accept/reject => transition par étape et audit dans la même transaction.
	if reqStatus := normalizeStatus(request.Status); request.Status != "" && reqStatus != "pending" {
		if err := s.updateDecisionWithAudit(ctx, candidature, reqStatus, request.RejectionReason); err != nil {
			return nil, err
		}
		decisionUpdated = true
	} else if request.Status != "" {
		// Réouverture manuelle : repasse l'étape courante en pending.
		setStepStatus(candidature, currentIndex(candidature), "pending")
		candidature.Status = "pending"
	}

	if !decisionUpdated {
		_, err = s.db.NewUpdate().Model(candidature).Where("id = ?", candidature.ID).Exec(ctx)
		if err != nil {
			log.Error().Err(err).Int("id", id).Msg("Could not update candidature")
			return nil, fmt.Errorf("could not update candidature: %w", err)
		}
	}

	log.Info().Int("id", id).Msg("Successfully updated candidature")
	return candidature, nil
}

func (s *CandidatureService) GetEmailPreview(ctx context.Context, id int, templateType string, step string, interviewDate string, interviewTime string, rejectionReason string, quizLink string, meetingLink string, startDate string, f2fMeetingLink string, quizLink2 ...string) (*EmailPreviewResponse, error) {
	candidature, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// For acceptance, use the provided step or candidature's current step to pick per-step fixed template
	effectiveStep := step
	if templateType == "acceptance" && effectiveStep == "" {
		effectiveStep = candidature.Step
	}
	// Auto-fill fixed links from subject if not provided (for fixed per-step templates)
	if (effectiveStep == "online_quiz" || templateType == "online_quiz") && quizLink == "" {
		if ql := s.getSubjectQuizLink(ctx, candidature.SubjectName); ql != "" {
			quizLink = ql
		}
	}
	if (effectiveStep == "online_meeting" || templateType == "online_meeting") && meetingLink == "" {
		if ml := s.getSubjectMeetingLink(ctx, candidature.SubjectName); ml != "" {
			meetingLink = ml
		}
	}
	if (effectiveStep == "f2f_meeting" || templateType == "f2f_meeting") && f2fMeetingLink == "" {
		if fl := s.getSubjectF2FMeetingLink(ctx, candidature.SubjectName); fl != "" {
			f2fMeetingLink = fl
		}
	}

	template, err := s.GetEmailTemplateByType(ctx, templateType, effectiveStep)
	if err != nil {
		return nil, fmt.Errorf("no email template found for type %s", templateType)
	}

	to := strings.TrimSpace(candidature.Email1)
	// Pair application (binôme) : preview the recipients exactly as SendEmail
	// will send them — both members, even when the two addresses are identical.
	recipients := []string{}
	if to != "" {
		recipients = append(recipients, to)
	}
	if email2 := strings.TrimSpace(candidature.Email2); email2 != "" {
		recipients = append(recipients, email2)
	}
	to = strings.Join(recipients, ", ")
	link := resolveEmailLink(quizLink, meetingLink, f2fMeetingLink)
	vars := emailRenderVars{
		interviewDate:   interviewDate,
		interviewTime:   interviewTime,
		startDate:       startDate,
		rejectionReason: rejectionReason,
		link:            link,
		mapsLink:        asterOideaAddressLink(),
	}
	subject := renderEmailPlaceholders(template.Subject, vars)

	body := renderEmailPlaceholders(template.Body, vars)

	// Pair with a distinct second link: also render member 2's own version so
	// the frontend can show both cards. Member 1 keeps `link`, member 2 gets
	// quizLink2 when provided (otherwise the same link).
	resp := &EmailPreviewResponse{
		To:      to,
		Subject: subject,
		Body:    body,
	}
	if email2 := strings.TrimSpace(candidature.Email2); email2 != "" {
		second := ""
		if len(quizLink2) > 0 {
			second = strings.TrimSpace(quizLink2[0])
		}
		if second == "" {
			second = link
		}
		if second != "" && second != link {
			memberVars := vars
			memberVars.link = second
			resp.To2 = email2
			resp.Body2 = renderEmailPlaceholders(template.Body, memberVars)
		}
	}

	return resp, nil
}

// dedupeRejectionRecipients collapses duplicate addresses (case-insensitive,
// order-preserving) for rejection mails so one inbox receives exactly one
// mail. Invitations/acceptances keep per-member sends (independent links).
func dedupeRejectionRecipients(recipients []string, reqType string) []string {
	if reqType != "disapproval" {
		return recipients
	}
	seen := make(map[string]struct{}, len(recipients))
	out := make([]string, 0, len(recipients))
	for _, r := range recipients {
		key := strings.ToLower(strings.TrimSpace(r))
		if key == "" {
			continue
		}
		if _, dup := seen[key]; dup {
			log.Info().Str("recipient", r).Msg("Skipping duplicate rejection email for same address")
			continue
		}
		seen[key] = struct{}{}
		out = append(out, r)
	}
	return out
}

func (s *CandidatureService) SendEmail(ctx context.Context, id int, req SendEmailRequest) error {
	log.Info().Int("id", id).Str("type", req.Type).Msg("Sending email for candidature...")

	candidature, err := s.getStoredByID(ctx, id)
	if err != nil {
		return err
	}

	effectiveStep := req.Step
	if req.Type == "acceptance" && effectiveStep == "" {
		effectiveStep = candidature.Step
	}
	if (effectiveStep == "online_quiz" || req.Type == "online_quiz") && req.QuizLink == "" {
		if ql := s.getSubjectQuizLink(ctx, candidature.SubjectName); ql != "" {
			req.QuizLink = ql
		}
	}
	if (effectiveStep == "online_meeting" || req.Type == "online_meeting") && req.MeetingLink == "" {
		if ml := s.getSubjectMeetingLink(ctx, candidature.SubjectName); ml != "" {
			req.MeetingLink = ml
		}
	}
	if (effectiveStep == "f2f_meeting" || req.Type == "f2f_meeting") && req.F2FMeetingLink == "" {
		if fl := s.getSubjectF2FMeetingLink(ctx, candidature.SubjectName); fl != "" {
			req.F2FMeetingLink = fl
		}
	}
	template, err := s.GetEmailTemplateByType(ctx, req.Type, effectiveStep)
	if err != nil {
		return fmt.Errorf("no email template found for type %s step %s", req.Type, effectiveStep)
	}

	// When the caller supplies an explicit body (HR edited the email), use it
	// as-is instead of the template-generated body. This preserves any edit
	// while still letting the mailer send it as HTML.
	//
	// Pair applications (binôme): each member receives their own edited view
	// card — member 1 gets Body rendered with QuizLink, member 2 gets Body2
	// rendered with QuizLink2. When the caller sent a single shared text
	// (Body2 empty, e.g. bulk accept), member 2 falls back to Body rendered
	// with their own link. Each send is logged separately so every
	// recipient/body pair stays traceable.
	if strings.TrimSpace(req.Body) != "" {
		to := strings.TrimSpace(candidature.Email1)
		if to == "" {
			return fmt.Errorf("candidature has no email address")
		}
		recipients := []string{to}
		if email2 := strings.TrimSpace(candidature.Email2); email2 != "" {
			recipients = append(recipients, email2)
		}
		recipients = dedupeRejectionRecipients(recipients, req.Type)
		if len(req.Recipients) > 0 {
			recipients = dedupeRejectionRecipients(req.Recipients, req.Type)
		}

		link := resolveEmailLink(req.QuizLink, req.MeetingLink, req.F2FMeetingLink)
		link2 := link
		if strings.TrimSpace(req.QuizLink2) != "" {
			link2 = strings.TrimSpace(req.QuizLink2)
		}
		baseVars := emailRenderVars{
			interviewDate:   req.InterviewDate,
			interviewTime:   req.InterviewTime,
			startDate:       req.StartDate,
			rejectionReason: req.RejectionReason,
			link:            link,
			mapsLink:        asterOideaAddressLink(),
		}
		subject := renderEmailPlaceholders(template.Subject, baseVars)

		bodies := make([]string, len(recipients))
		for i := range recipients {
			memberVars := baseVars
			override := req.Body
			if i == 1 {
				memberVars.link = link2
				if strings.TrimSpace(req.Body2) != "" {
					override = req.Body2
				}
			}
			bodies[i] = renderEmailPlaceholders(override, memberVars)
		}

		now := time.Now().Format("2006-01-02 15:04:05")
		emailLogs := make([]*domain.EmailLog, len(recipients))
		for i, r := range recipients {
			emailLogs[i] = &domain.EmailLog{
				CandidatureID: id,
				Recipient:     r,
				Subject:       subject,
				Body:          bodies[i],
				TemplateType:  req.Type,
				CandidatName:  candidature.FullName,
				SubjectName:   candidature.SubjectName,
				Status:        "pending",
				SentAt:        now,
			}
			if _, err := s.db.NewInsert().Model(emailLogs[i]).Exec(ctx); err != nil {
				log.Error().Err(err).Int("id", id).Msg("Failed to create email log")
				return fmt.Errorf("failed to create email log: %w", err)
			}
		}

		cfg, err := mail_config.GetSMTPConfig(ctx, s.db)
		if err != nil {
			log.Error().Err(err).Int("id", id).Msg("Failed to get SMTP config")
			return fmt.Errorf("failed to get SMTP config: %w", err)
		}
		mailer := mailPkg.NewMailer(cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.From, cfg.FromName)

		// Send one email per member (binôme): even when the two addresses are
		// identical (e.g. a pair sharing a mailbox), each member gets their own
		// email with their own edited body instead of a single message with a
		// duplicated To list.
		for i, r := range recipients {
			email := mailPkg.Email{To: []string{r}, Subject: subject, Body: bodies[i]}
			if sendErr := mailer.Send(email); sendErr != nil {
				log.Error().Err(sendErr).Int("id", id).Str("to", r).Str("smtp_host", cfg.Host).Int("smtp_port", cfg.Port).Msg("Failed to send email")
				emailLogs[i].Status = "failed"
				emailLogs[i].ErrorMessage = truncateError(sendErr.Error(), 2000)
				if _, uErr := s.db.NewUpdate().Model(emailLogs[i]).Column("status", "error_message").Where("id = ?", emailLogs[i].ID).Exec(ctx); uErr != nil {
					log.Error().Err(uErr).Int("id", id).Msg("Failed to update email log status to failed")
				}
				return fmt.Errorf("failed to send email: %w", sendErr)
			}
		}

		for _, l := range emailLogs {
			l.Status = "sent"
			l.ErrorMessage = ""
			if _, err := s.db.NewUpdate().Model(l).Column("status", "error_message").Where("id = ?", l.ID).Exec(ctx); err != nil {
				log.Error().Err(err).Int("id", id).Msg("Failed to update email log status to sent")
			}
		}

		// Advance the candidature step exactly like the normal (template) path.
		status := "accepted"
		if req.Type == "disapproval" {
			status = "rejected"
		}
		if err := s.updateDecisionWithAudit(ctx, candidature, status, req.RejectionReason); err != nil {
			return err
		}
		return nil
	}

	to := strings.TrimSpace(candidature.Email1)
	if to == "" {
		return fmt.Errorf("candidature has no email address")
	}
	// Pair application (binôme) : notify both members, sending one email per
	// member. Even when the two addresses are identical, two separate emails
	// are sent (each member must receive their own invitation), except for
	// rejections which are deduped to one mail per address. The pipeline
	// transition below still applies once to the whole application.
	recipients := []string{to}
	if email2 := strings.TrimSpace(candidature.Email2); email2 != "" {
		recipients = append(recipients, email2)
	}
	recipients = dedupeRejectionRecipients(recipients, req.Type)
	if len(req.Recipients) > 0 {
		recipients = dedupeRejectionRecipients(req.Recipients, req.Type)
	}
	// Per-member links: when QuizLink2 is set and the candidature is a pair,
	// member 2 (email2) gets their own [Link] value while member 1 (email1)
	// keeps QuizLink. All other invitation types share a single link.
	to = strings.Join(recipients, ", ")

	link := resolveEmailLink(req.QuizLink, req.MeetingLink, req.F2FMeetingLink)
	link2 := link
	if strings.TrimSpace(req.QuizLink2) != "" {
		link2 = strings.TrimSpace(req.QuizLink2)
	}
	perMemberLinks := []string{}
	for i := range recipients {
		if i == 1 && strings.TrimSpace(candidature.Email2) != "" {
			perMemberLinks = append(perMemberLinks, link2)
		} else {
			perMemberLinks = append(perMemberLinks, link)
		}
	}
	// Subject has no per-member variation today: render once from the shared
	// vars. Bodies are rendered per member so each pair member gets their own
	// [Link] value.
	sharedVars := emailRenderVars{
		interviewDate:   req.InterviewDate,
		interviewTime:   req.InterviewTime,
		startDate:       req.StartDate,
		rejectionReason: req.RejectionReason,
		link:            link,
		mapsLink:        asterOideaAddressLink(),
	}
	subject := renderEmailPlaceholders(template.Subject, sharedVars)

	// One body per member so each pair member gets their own [Link] value.
	// When the caller supplied an explicit per-member override (HR edited a
	// view card), that member's body is used as-is; otherwise the template
	// body is rendered with the member's own link. This keeps each
	// applicant's email fully independent (own text + own link).
	bodies := make([]string, len(recipients))
	for i, memberLink := range perMemberLinks {
		if i == 0 && strings.TrimSpace(req.Body) != "" {
			memberVars := sharedVars
			memberVars.link = memberLink
			bodies[i] = renderEmailPlaceholders(req.Body, memberVars)
			continue
		}
		if i == 1 && strings.TrimSpace(candidature.Email2) != "" && strings.TrimSpace(req.Body2) != "" {
			memberVars := sharedVars
			memberVars.link = memberLink
			bodies[i] = renderEmailPlaceholders(req.Body2, memberVars)
			continue
		}
		memberVars := sharedVars
		memberVars.link = memberLink
		bodies[i] = renderEmailPlaceholders(template.Body, memberVars)
	}

	now := time.Now().Format("2006-01-02 15:04:05")

	// One email log per member so each recipient/link pair is traceable.
	// The subject/body stored are exactly what that member received.
	emailLogs := make([]*domain.EmailLog, len(recipients))
	for i, r := range recipients {
		emailLogs[i] = &domain.EmailLog{
			CandidatureID: id,
			Recipient:     r,
			Subject:       subject,
			Body:          bodies[i],
			TemplateType:  req.Type,
			CandidatName:  candidature.FullName,
			SubjectName:   candidature.SubjectName,
			Status:        "pending",
			SentAt:        now,
		}
		if _, err := s.db.NewInsert().Model(emailLogs[i]).Exec(ctx); err != nil {
			log.Error().Err(err).Int("id", id).Msg("Failed to create email log")
			return fmt.Errorf("failed to create email log: %w", err)
		}
	}

	cfg, err := mail_config.GetSMTPConfig(ctx, s.db)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("Failed to get SMTP config")
		return fmt.Errorf("failed to get SMTP config: %w", err)
	}
	mailer := mailPkg.NewMailer(cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.From, cfg.FromName)

	// Send one email per member (binôme): even when the two addresses are
	// identical (e.g. a pair sharing a mailbox), each member gets their own
	// email instead of a single message with a duplicated To list.
	// Each member's body carries their own [Link] (perMemberLinks).
	for i, r := range recipients {
		email := mailPkg.Email{
			To:      []string{r},
			Subject: subject,
			Body:    bodies[i],
		}

		sendErr := mailer.Send(email)
		if sendErr != nil {
			log.Error().Err(sendErr).Int("id", id).Str("to", r).Str("smtp_host", cfg.Host).Int("smtp_port", cfg.Port).Msg("Failed to send email")
			emailLogs[i].Status = "failed"
			emailLogs[i].ErrorMessage = truncateError(sendErr.Error(), 2000)
			if _, uErr := s.db.NewUpdate().Model(emailLogs[i]).Column("status", "error_message").Where("id = ?", emailLogs[i].ID).Exec(ctx); uErr != nil {
				log.Error().Err(uErr).Int("id", id).Msg("Failed to update email log status to failed")
			}
			return fmt.Errorf("failed to send email: %w", sendErr)
		}
	}

	for _, l := range emailLogs {
		l.Status = "sent"
		l.ErrorMessage = ""
		if _, err := s.db.NewUpdate().Model(l).Column("status", "error_message").Where("id = ?", l.ID).Exec(ctx); err != nil {
			log.Error().Err(err).Int("id", id).Msg("Failed to update email log status to sent")
		}
	}

	status := "accepted"
	if req.Type == "disapproval" {
		status = "rejected"
	}

	// Transition par étape sur la même ligne (le flow d'email de rejet est réutilisé tel quel).
	if err := s.updateDecisionWithAudit(ctx, candidature, status, req.RejectionReason); err != nil {
		return err
	}

	log.Info().Int("id", id).Str("status", status).Msg("Email sent and candidature status updated")
	return nil
}

// BulkReject rejects every candidature in ids with the same rejection reason.
// Mail is deduped by address across the whole selection: rows sharing an
// inbox are all transitioned (status + audit each), but only one rejection
// mail goes out per address, listing every rejected subject for it.
func (s *CandidatureService) BulkReject(ctx context.Context, ids []int, rejectionReason string) (int, error) {
	if len(ids) == 0 {
		return 0, fmt.Errorf("no candidatures selected")
	}
	if strings.TrimSpace(rejectionReason) == "" {
		return 0, fmt.Errorf("rejection reason is required")
	}
	// Load all rows first (fail fast on unknown ids, before sending anything).
	rows := make([]*domain.Candidature, 0, len(ids))
	for _, id := range ids {
		c, err := s.getStoredByID(ctx, id)
		if err != nil {
			return 0, err
		}
		rows = append(rows, c)
	}
	// Group row indexes by normalized email1, preserving input order.
	type addressGroup struct {
		address string
		rowIdx  []int
	}
	groups := []*addressGroup{}
	groupByAddr := make(map[string]*addressGroup)
	for i, c := range rows {
		addr := strings.ToLower(strings.TrimSpace(c.Email1))
		g, ok := groupByAddr[addr]
		if !ok {
			g = &addressGroup{address: strings.TrimSpace(c.Email1)}
			groupByAddr[addr] = g
			groups = append(groups, g)
		}
		g.rowIdx = append(g.rowIdx, i)
	}
	mailed := make(map[string]struct{})
	sent := 0
	for _, g := range groups {
		// Extra pair members across the group's rows: one mail each, unless
		// already mailed for another group.
		extra := []string{}
		seenExtra := make(map[string]struct{})
		for _, i := range g.rowIdx {
			if e2 := strings.TrimSpace(rows[i].Email2); e2 != "" {
				key := strings.ToLower(e2)
				if _, dup := seenExtra[key]; !dup {
					seenExtra[key] = struct{}{}
					extra = append(extra, e2)
				}
			}
		}
		recipients := []string{}
		if g.address != "" {
			recipients = append(recipients, g.address)
		}
		for _, e := range extra {
			recipients = append(recipients, e)
		}
		fresh := make([]string, 0, len(recipients))
		for _, r := range recipients {
			if _, dup := mailed[strings.ToLower(strings.TrimSpace(r))]; !dup {
				fresh = append(fresh, r)
			}
		}
		if len(fresh) > 0 {
			rep := rows[g.rowIdx[0]]
			if err := s.SendEmail(ctx, rep.ID, SendEmailRequest{Type: "disapproval", RejectionReason: rejectionReason, Recipients: fresh}); err != nil {
				log.Error().Err(err).Str("address", g.address).Msg("Bulk reject failed for address group")
				return sent, fmt.Errorf("failed to reject applications for %s: %w", g.address, err)
			}
			for _, r := range fresh {
				mailed[strings.ToLower(strings.TrimSpace(r))] = struct{}{}
			}
			sent++
			// Transition the group's remaining rows silently: the group's
			// single mail (and its single audit on the representative row)
			// already covers them.
			for _, i := range g.rowIdx[1:] {
				if err := s.transitionRowWithoutAudit(ctx, rows[i], "rejected", rejectionReason); err != nil {
					log.Error().Err(err).Int("id", rows[i].ID).Msg("Bulk reject failed for candidature")
					return sent, fmt.Errorf("failed to reject candidature %d: %w", rows[i].ID, err)
				}
				sent++
			}
		} else {
			// Address already mailed for another group: transition silently.
			for _, i := range g.rowIdx {
				if err := s.transitionRowWithoutAudit(ctx, rows[i], "rejected", rejectionReason); err != nil {
					log.Error().Err(err).Int("id", rows[i].ID).Msg("Bulk reject failed for candidature")
					return sent, fmt.Errorf("failed to reject candidature %d: %w", rows[i].ID, err)
				}
				sent++
			}
		}
	}
	log.Info().Int("count", sent).Str("reason", rejectionReason).Msg("Bulk rejection complete")
	return sent, nil
}

// BulkAccept invites several candidatures to their own next pipeline step
// with ONE shared payload. Type/Step come from the frontend using the exact
// same mapping as the single-send modal, so each row goes through the
// identical SendEmail path (same template, same links handling, same audit).
// All ids must share the same current step, otherwise the template would
// be ambiguous.
func (s *CandidatureService) BulkAccept(ctx context.Context, ids []int, req BulkAcceptRequest) (int, error) {
	if len(ids) == 0 {
		return 0, fmt.Errorf("no candidatures selected")
	}
	if strings.TrimSpace(req.Type) == "" {
		return 0, fmt.Errorf("email type is required")
	}
	expectedStep := -1
	for _, id := range ids {
		c, err := s.getStoredByID(ctx, id)
		if err != nil {
			return 0, err
		}
		if expectedStep == -1 {
			expectedStep = currentIndex(c)
		} else if currentIndex(c) != expectedStep {
			return 0, fmt.Errorf("all selected candidatures must be in the same pipeline step")
		}
	}
	sent := 0
	for _, id := range ids {
		single := SendEmailRequest{
			Type:           req.Type,
			Step:           req.Step,
			QuizLink:       req.QuizLink,
			QuizLink2:      req.QuizLink2,
			MeetingLink:    req.MeetingLink,
			F2FMeetingLink: req.F2FMeetingLink,
			InterviewDate:  req.InterviewDate,
			InterviewTime:  req.InterviewTime,
			StartDate:      req.StartDate,
			Body:           req.Body,
		}
		if err := s.SendEmail(ctx, id, single); err != nil {
			log.Error().Err(err).Int("id", id).Msg("Bulk accept failed for candidature")
			return sent, fmt.Errorf("failed to invite candidature %d: %w", id, err)
		}
		sent++
	}
	log.Info().Int("count", sent).Msg("Bulk accept complete")
	return sent, nil
}

// GetPipeline retourne, pour chacune des 5 étapes, les compteurs
// pending / accepted / rejected en dépivotant les 5 colonnes
// (LATERAL VALUES, NULL exclus : étape pas encore atteinte).
func (s *CandidatureService) GetPipeline(ctx context.Context) ([]PipelineStage, error) {
	type row struct {
		Stage  string `bun:"stage"`
		Status string `bun:"status"`
		Cnt    int    `bun:"cnt"`
	}
	var rows []row
	err := s.db.NewRaw(`
		SELECT v.stage AS stage, v.status AS status, COUNT(*) AS cnt
		FROM candidature, LATERAL (VALUES
			('cv', step1_status),
			('quiz', step2_status),
			('online', step3_status),
			('f2f', step4_status),
			('final', step5_status)
		) AS v(stage, status)
		WHERE v.status IS NOT NULL
		GROUP BY v.stage, v.status
	`).Scan(ctx, &rows)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("pipeline query failed: %w", err)
	}

	counts := map[string]map[string]int{
		"cv":     {"pending": 0, "accepted": 0, "rejected": 0},
		"quiz":   {"pending": 0, "accepted": 0, "rejected": 0},
		"online": {"pending": 0, "accepted": 0, "rejected": 0},
		"f2f":    {"pending": 0, "accepted": 0, "rejected": 0},
		"final":  {"pending": 0, "accepted": 0, "rejected": 0},
	}
	for _, r := range rows {
		if _, ok := counts[r.Stage]; !ok {
			continue
		}
		if _, ok := counts[r.Stage][r.Status]; !ok {
			continue
		}
		counts[r.Stage][r.Status] = r.Cnt
	}

	stages := []PipelineStage{
		{ID: "cv", Index: "01", Name: "CV Screening", Short: "CV", Counts: PipelineCounts{Pending: counts["cv"]["pending"], Accepted: counts["cv"]["accepted"], Rejected: counts["cv"]["rejected"]}},
		{ID: "quiz", Index: "02", Name: "Online Quiz", Short: "Quiz", Counts: PipelineCounts{Pending: counts["quiz"]["pending"], Accepted: counts["quiz"]["accepted"], Rejected: counts["quiz"]["rejected"]}},
		{ID: "online", Index: "03", Name: "Online Meeting", Short: "Online", Counts: PipelineCounts{Pending: counts["online"]["pending"], Accepted: counts["online"]["accepted"], Rejected: counts["online"]["rejected"]}},
		{ID: "f2f", Index: "04", Name: "F2F Meeting", Short: "F2F", Counts: PipelineCounts{Pending: counts["f2f"]["pending"], Accepted: counts["f2f"]["accepted"], Rejected: counts["f2f"]["rejected"]}},
		{ID: "final", Index: "05", Name: "Final Decision", Short: "Final", Final: true, Counts: PipelineCounts{Pending: counts["final"]["pending"], Accepted: counts["final"]["accepted"], Rejected: counts["final"]["rejected"]}},
	}
	return stages, nil
}

// stepExportLabels maps internal pipeline step codes to readable export labels.
var stepExportLabels = map[string]string{
	"cv_screening":   "CV Screening",
	"online_quiz":    "Online Quiz",
	"online_meeting": "Online Meeting",
	"f2f_meeting":    "F2F Meeting",
	"final_decision": "Final Decision",
}

func stepExportLabel(step string) string {
	if label, ok := stepExportLabels[strings.ToLower(strings.TrimSpace(step))]; ok {
		return label
	}
	if strings.TrimSpace(step) == "" {
		return "—"
	}
	return step
}

func (s *CandidatureService) Export(ctx context.Context, params CandidatureParams) (*export.ExportOptions, error) {
	log.Info().Str("Type", params.FileType).Msg("Exporting Candidatures")

	var candidatures []*domain.Candidature
	query := s.db.NewSelect().Model(&candidatures)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		searchLower := strings.ToLower(params.Search)
		conds := []string{
			"cnd.full_name ILIKE ?",
			"cnd.full_name2 ILIKE ?",
			"cnd.email1 ILIKE ?",
			"cnd.subject_name ILIKE ?",
			"cnd.status ILIKE ?",
		}
		args := []interface{}{searchPattern, searchPattern, searchPattern, searchPattern, searchPattern}
		if searchLower == "solo" {
			conds = append(conds, "(cnd.full_name2 IS NULL OR cnd.full_name2 = '')")
		} else if searchLower == "pair" || searchLower == "binôme" {
			conds = append(conds, "(cnd.full_name2 IS NOT NULL AND cnd.full_name2 != '')")
		}
		query = query.Where("("+strings.Join(conds, " OR ")+")", args...)
	}

	if params.FullName != "" {
		searchName := "%" + params.FullName + "%"
		query = query.Where("(cnd.full_name ILIKE ? OR cnd.full_name2 ILIKE ?)", searchName, searchName)
	}

	if params.CandidatureType == "solo" {
		query = query.Where("cnd.full_name2 = '' OR cnd.full_name2 IS NULL")
	} else if params.CandidatureType == "pair" {
		query = query.Where("cnd.full_name2 != '' AND cnd.full_name2 IS NOT NULL")
	}

	if params.Gender != "" {
		query = query.Where("(cnd.gender1 = ? OR cnd.gender2 = ?)", params.Gender, params.Gender)
	}

	if params.Degree != "" {
		query = query.Where("(cnd.degree1 = ? OR cnd.degree2 = ?)", params.Degree, params.Degree)
	}

	if params.SubjectName != "" {
		query = query.Where("cnd.subject_name ILIKE ?", "%"+params.SubjectName+"%")
	}

	if params.Status != "" {
		query = query.Where("cnd.status = ?", params.Status)
	}

	if params.Step != "" {
		query = query.Where("cnd.step = ?", params.Step)
	}

	query = applyScoreRangeFilter(query, params)

	if sort := scoreSortClause(params.ScoreSortStep, params.ScoreSortDirection); sort != "" {
		query = query.Order(sort)
	} else {
		query = query.Order("cnd.id DESC")
	}

	err := query.Scan(ctx)

	headers := []string{"Step", "Type", "Full Name 1", "Full Name 2", "Project", "Gender"}
	pdfWidths := []float64{35, 25, 55, 55, 65, 42}

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &export.ExportOptions{
				TableOrientation: "L",
				Data:             [][]string{},
				Widths:           pdfWidths,
				FileName:         "Candidatures",
				Title:            "No candidatures data",
				Headers:          headers,
			}, nil
		}
		log.Error().Err(err).Msg("Failed to fetch candidatures for export")
		return nil, fmt.Errorf("failed to fetch candidatures: %w", err)
	}

	var data [][]string
	for _, c := range candidatures {
		candidatureType := "Solo"
		if c.FullName2 != "" {
			candidatureType = "Binôme"
		}
		gender := strings.TrimSpace(c.Gender1)
		if strings.TrimSpace(c.Gender2) != "" {
			if gender == "" {
				gender = strings.TrimSpace(c.Gender2)
			} else if !strings.EqualFold(gender, strings.TrimSpace(c.Gender2)) {
				gender = gender + " / " + strings.TrimSpace(c.Gender2)
			}
		}
		row := []string{
			stepExportLabel(c.Step),
			candidatureType,
			gender,
			c.FullName,
			c.FullName2,
			c.SubjectName,
		}
		data = append(data, row)
	}

	return &export.ExportOptions{
		TableOrientation: "L",
		Data:             data,
		Widths:           pdfWidths,
		FileName:         "Candidatures",
		Title:            "Candidatures Report",
		Headers:          headers,
	}, nil
}

func (s *CandidatureService) Delete(ctx context.Context, id int) error {
	log.Info().Int("id", id).Msg("Attempting to delete candidature...")

	candidature, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(candidature).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("Database error during candidature deletion")
		return fmt.Errorf("could not delete candidature with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("id", id).Msg("Delete failed: Candidature not found at execution time")
		return fmt.Errorf("candidature with ID %d not found", id)
	}

	log.Info().Int("id", id).Msg("Successfully deleted candidature")
	return nil
}

var ErrInvalidResetPassword = errors.New("incorrect reset password")

func verifyResetPassword(provided string) bool {
	expected := os.Getenv("Reset_PWD")
	if expected == "" {
		expected = config.Configvar.Reset.Password
	}
	if expected == "" {
		expected = os.Getenv("Rest_PWD")
	}
	if expected == "" || provided == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) == 1
}

func (s *CandidatureService) ResetPrepare(ctx context.Context, password string) ([]byte, error) {
	if !verifyResetPassword(password) {
		return nil, ErrInvalidResetPassword
	}

	return s.buildSessionResetWorkbook(ctx)
}

// VerifyResetPassword checks the reset password without generating anything.
// Used to gate the reset flow (password screen) before the filename step.
func (s *CandidatureService) VerifyResetPassword(password string) error {
	if !verifyResetPassword(password) {
		return ErrInvalidResetPassword
	}
	return nil
}

// buildSessionResetWorkbook snapshots subjects, candidatures and pipeline
// stats, then renders the same 3-sheet Excel used for the reset backup
// (Subjects, Applications, Statistics & KPIs). Shared by ResetPrepare and
// ResetConfirm so the confirm-step attachment is identical to the download.
func (s *CandidatureService) buildSessionResetWorkbook(ctx context.Context) ([]byte, error) {
	log.Info().Msg("Generating session reset Excel backup...")

	// 1. Fetch all subjects
	var subjects []*domain.Subject
	err := s.db.NewSelect().Model(&subjects).Order("sub.id ASC").Scan(ctx)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to fetch subjects: %w", err)
	}

	// Load relations for subjects
	for _, subj := range subjects {
		if subj.DurationID != nil {
			var d domain.Duration
			if err := s.db.NewSelect().Model(&d).Where("id = ?", *subj.DurationID).Scan(ctx); err == nil {
				subj.Duration = &d
			}
		}
		var techIDs []int
		_ = s.db.NewSelect().Model((*domain.SubjectTechnology)(nil)).Column("technology_id").Where("subject_id = ?", subj.ID).Scan(ctx, &techIDs)
		if len(techIDs) > 0 {
			_ = s.db.NewSelect().Model(&subj.Technologies).Where("id IN (?)", bun.In(techIDs)).Scan(ctx)
		}
		var profIDs []int
		_ = s.db.NewSelect().Model((*domain.SubjectProfile)(nil)).Column("profile_id").Where("subject_id = ?", subj.ID).Scan(ctx, &profIDs)
		if len(profIDs) > 0 {
			_ = s.db.NewSelect().Model(&subj.Profiles).Where("id IN (?)", bun.In(profIDs)).Scan(ctx)
		}
	}

	// 2. Fetch all candidatures
	var candidatures []*domain.Candidature
	err = s.db.NewSelect().Model(&candidatures).Order("cnd.id ASC").Scan(ctx)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to fetch candidatures: %w", err)
	}

	// 3. Fetch pipeline stages
	stages, err := s.GetPipeline(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to fetch pipeline for reset export, proceeding with empty counts")
	}

	var pipelineStats []export.PipelineStageStats
	for _, stage := range stages {
		pipelineStats = append(pipelineStats, export.PipelineStageStats{
			StageName: stage.Name,
			Pending:   stage.Counts.Pending,
			Accepted:  stage.Counts.Accepted,
			Rejected:  stage.Counts.Rejected,
		})
	}

	// 4. Generate multi-sheet workbook entirely in memory
	exportData := export.SessionExportData{
		Subjects:     subjects,
		Candidatures: candidatures,
		Pipeline:     pipelineStats,
	}

	workbookBytes, err := export.GenerateSessionResetWorkbook(exportData)
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate session reset Excel workbook")
		return nil, fmt.Errorf("failed to generate Excel workbook: %w", err)
	}

	log.Info().Int("subjects", len(subjects)).Int("candidatures", len(candidatures)).Msg("Session reset Excel workbook successfully generated in memory")
	return workbookBytes, nil
}

func (s *CandidatureService) ResetConfirm(ctx context.Context, password string) error {
	if !verifyResetPassword(password) {
		return ErrInvalidResetPassword
	}

	// Snapshot the backup workbook BEFORE the destructive transaction: after
	// the deletes there is nothing left to export. The bytes are reused as the
	// notification-email attachment once the commit succeeds.
	workbookBytes, err := s.buildSessionResetWorkbook(ctx)
	if err != nil {
		return err
	}
	resetAt := time.Now()

	// Resolve the acting admin's email from the auth context (actorID), NOT
	// from the reset password. Needed after commit for the notification email.
	adminEmail := ""
	adminName := ""
	if actor, aErr := middleware.GetActorFromContext(ctx); aErr != nil {
		log.Warn().Err(aErr).Msg("Could not resolve acting admin from context for session reset notification")
	} else {
		var admin domain.User
		if uErr := s.db.NewSelect().Model(&admin).Where("u.id = ?", actor.UserID).Scan(ctx); uErr != nil {
			log.Warn().Err(uErr).Int("admin_id", actor.UserID).Msg("Could not fetch acting admin for session reset notification")
		} else {
			adminEmail = strings.TrimSpace(admin.Email)
			adminName = strings.TrimSpace(strings.TrimSpace(admin.FirstName) + " " + strings.TrimSpace(admin.LastName))
		}
	}

	log.Warn().Msg("Executing database reset for recruitment session...")

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("could not start reset transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Delete all email logs associated with candidatures
	if _, err := tx.NewDelete().Model((*domain.EmailLog)(nil)).Where("1 = 1").Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to delete email logs in reset transaction")
		return fmt.Errorf("could not delete email logs: %w", err)
	}

	// 2. Delete subject audit logs. Candidature ("applications") audit logs are
	// deliberately kept across resets so the pipeline history survives.
	if _, err := tx.NewDelete().Model((*domain.AuditLog)(nil)).Where("LOWER(module) = ?", "subject").Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to delete subject audit logs in reset transaction")
		return fmt.Errorf("could not delete audit logs: %w", err)
	}

	// 3. Delete all candidatures
	if _, err := tx.NewDelete().Model((*domain.Candidature)(nil)).Where("1 = 1").Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to delete candidatures in reset transaction")
		return fmt.Errorf("could not delete candidatures: %w", err)
	}

	// 4. Delete subject relations (technologies & profiles) and all subjects
	if _, err := tx.NewDelete().Model((*domain.SubjectTechnology)(nil)).Where("1 = 1").Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to delete subject technologies in reset transaction")
		return fmt.Errorf("could not delete subject technologies: %w", err)
	}
	if _, err := tx.NewDelete().Model((*domain.SubjectProfile)(nil)).Where("1 = 1").Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to delete subject profiles in reset transaction")
		return fmt.Errorf("could not delete subject profiles: %w", err)
	}
	if _, err := tx.NewDelete().Model((*domain.Subject)(nil)).Where("1 = 1").Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to delete subjects in reset transaction")
		return fmt.Errorf("could not delete subjects: %w", err)
	}

	if err := tx.Commit(); err != nil {
		log.Error().Err(err).Msg("Failed to commit session reset transaction")
		return fmt.Errorf("could not commit reset transaction: %w", err)
	}

	log.Info().Msg("Recruitment session and subjects successfully reset in database")

	// 5. Record audit log of the session reset
	changeDetails := domain.ChangeDetail{
		Type: pkg.RESET_ACTION,
		Fields: map[string]domain.FieldChange{
			"Session": {DeletedValues: "All candidatures, subjects, email logs, and recruitment pipeline data", Changed: true},
		},
	}
	if _, err := audit.LogAction(ctx, s.db, pkg.SESSION_MODULE, pkg.RESET_ACTION, changeDetails); err != nil {
		log.Warn().Err(err).Msg("Failed to record audit log for session reset")
	}

	// Notify the acting admin asynchronously with the backup attached.
	// Fire-and-forget on a background context: a send failure only logs and
	// never rolls back or fails the (already committed) reset.
	if adminEmail != "" {
		go s.sendSessionResetNotification(adminEmail, adminName, resetAt, workbookBytes)
	} else {
		log.Warn().Msg("Skipping session reset notification email: acting admin email unknown")
	}

	return nil
}

// Session reset notification email (hardcoded, no admin-configurable template).
const (
	sessionResetEmailSubject      = "Session reset"
	sessionResetEmailTemplateType = "session_reset"
)

// sendSessionResetNotification sends the post-reset email to the admin with
// the 3-sheet backup attached, then records it in email_logs like other
// system emails. Runs in background: failures are logged only, never
// propagated.
func (s *CandidatureService) sendSessionResetNotification(adminEmail, adminName string, resetAt time.Time, workbook []byte) {
	bgCtx := context.Background()
	body := fmt.Sprintf("We would like to inform you that the session reset process has been completed %s at %s. \n You will find the excel recap attached .",
		resetAt.Format("02/01/2006"), resetAt.Format("15:04:05"))
	now := resetAt.Format("2006-01-02 15:04:05")
	attachmentName := fmt.Sprintf("Session_Recap_%s.xlsx", resetAt.Format("2006-01-02_15-04-05"))

	cfg, err := mail_config.GetSMTPConfig(bgCtx, s.db)
	if err != nil {
		log.Error().Err(err).Str("to", adminEmail).Msg("Session reset notification: SMTP config unavailable")
		s.logSessionResetEmail(bgCtx, adminEmail, adminName, sessionResetEmailSubject, body, now, "failed", err)
		return
	}
	mailer := mailPkg.NewMailer(cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.From, cfg.FromName)
	email := mailPkg.Email{
		To:      []string{adminEmail},
		Subject: sessionResetEmailSubject,
		Body:    body,
		Attachments: []mailPkg.Attachment{
			{
				Filename:    attachmentName,
				ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				Data:        workbook,
			},
		},
	}
	if sendErr := mailer.Send(email); sendErr != nil {
		log.Error().Err(sendErr).Str("to", adminEmail).Msg("Session reset notification email failed to send")
		s.logSessionResetEmail(bgCtx, adminEmail, adminName, sessionResetEmailSubject, body, now, "failed", sendErr)
		return
	}
	log.Info().Str("to", adminEmail).Msg("Session reset notification email sent")
	s.logSessionResetEmail(bgCtx, adminEmail, adminName, sessionResetEmailSubject, body, now, "sent", nil)
}

// logSessionResetEmail records the notification in email_logs (recipient,
// subject, timestamp, success/failure). Log-only: insert errors are logged,
// never returned — the reset already succeeded.
func (s *CandidatureService) logSessionResetEmail(ctx context.Context, recipient, candidatName, subject, body, sentAt, status string, sendErr error) {
	errMsg := ""
	if sendErr != nil {
		errMsg = truncateError(sendErr.Error(), 2000)
	}
	entry := &domain.EmailLog{
		CandidatureID: 0,
		Recipient:     recipient,
		Subject:       subject,
		Body:          body,
		TemplateType:  sessionResetEmailTemplateType,
		CandidatName:  candidatName,
		SubjectName:   "Session reset",
		Status:        status,
		SentAt:        sentAt,
		ErrorMessage:  errMsg,
	}
	if _, err := s.db.NewInsert().Model(entry).Exec(ctx); err != nil {
		log.Error().Err(err).Str("to", recipient).Msg("Failed to log session reset notification email")
	}
}
