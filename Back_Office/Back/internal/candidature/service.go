package candidature

import (
	"astro-backend/config"
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/internal/mail_config"
	"astro-backend/pkg/export"
	mailPkg "astro-backend/pkg/mail"
	"context"
	"database/sql"
	"errors"
	"fmt"
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
	actionAt := time.Now().UTC()
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
	_ = s.db.NewSelect().Column("online_quiz_link").Model((*domain.Subject)(nil)).Where("name = ?", name).Scan(ctx, &link)
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
	_ = s.db.NewSelect().Column("online_meeting_link").Model((*domain.Subject)(nil)).Where("name = ?", name).Scan(ctx, &link)
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
	_ = s.db.NewSelect().Column("f2f_meeting_link").Model((*domain.Subject)(nil)).Where("name = ?", name).Scan(ctx, &link)
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

// scoreSortClause builds the ORDER BY clause for a step-based score sort using
// a safe column whitelist. Returns "" when no sort is requested, so callers
// fall back to the default ordering.
func scoreSortClause(step, direction string) string {
	columns := map[string]string{
		"cv_screening":   "score_cv_screening",
		"online_quiz":    "score_online_quiz",
		"online_meeting": "score_online_meeting",
		"f2f_meeting":    "score_f2f_meeting",
		"final_decision": "score_final_decision",
	}
	col := columns[step]
	if col == "" {
		return ""
	}
	dir := strings.ToUpper(direction)
	if dir != "ASC" && dir != "DESC" {
		dir = "ASC"
	}
	return fmt.Sprintf("cnd.%s %s NULLS LAST", col, dir)
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

func (s *CandidatureService) GetEmailPreview(ctx context.Context, id int, templateType string, step string, interviewDate string, interviewTime string, rejectionReason string, quizLink string, meetingLink string, startDate string, f2fMeetingLink string) (*EmailPreviewResponse, error) {
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

	return &EmailPreviewResponse{
		To:      to,
		Subject: subject,
		Body:    body,
	}, nil
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
	if strings.TrimSpace(req.Body) != "" {
		link := resolveEmailLink(req.QuizLink, req.MeetingLink, req.F2FMeetingLink)
		vars := emailRenderVars{
			interviewDate:   req.InterviewDate,
			interviewTime:   req.InterviewTime,
			startDate:       req.StartDate,
			rejectionReason: req.RejectionReason,
			link:            link,
			mapsLink:        asterOideaAddressLink(),
		}
		subject := renderEmailPlaceholders(template.Subject, vars)
		body := renderEmailPlaceholders(req.Body, vars)
		to := strings.TrimSpace(candidature.Email1)
		if to == "" {
			return fmt.Errorf("candidature has no email address")
		}
		recipients := []string{to}
		if email2 := strings.TrimSpace(candidature.Email2); email2 != "" {
			recipients = append(recipients, email2)
		}
		to = strings.Join(recipients, ", ")

		now := time.Now().Format("2006-01-02 15:04:05")
		emailLog := &domain.EmailLog{
			CandidatureID: id,
			Recipient:     to,
			Subject:       subject,
			Body:          body,
			TemplateType:  req.Type,
			CandidatName:  candidature.FullName,
			SubjectName:   candidature.SubjectName,
			Status:        "pending",
			SentAt:        now,
		}
		if _, err := s.db.NewInsert().Model(emailLog).Exec(ctx); err != nil {
			log.Error().Err(err).Int("id", id).Msg("Failed to create email log")
			return fmt.Errorf("failed to create email log: %w", err)
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
		for _, r := range recipients {
			email := mailPkg.Email{To: []string{r}, Subject: subject, Body: body}
			if sendErr := mailer.Send(email); sendErr != nil {
				log.Error().Err(sendErr).Int("id", id).Str("to", to).Str("smtp_host", cfg.Host).Int("smtp_port", cfg.Port).Msg("Failed to send email")
				emailLog.Status = "failed"
				emailLog.ErrorMessage = truncateError(sendErr.Error(), 2000)
				if _, uErr := s.db.NewUpdate().Model(emailLog).Column("status", "error_message").Where("id = ?", emailLog.ID).Exec(ctx); uErr != nil {
					log.Error().Err(uErr).Int("id", id).Msg("Failed to update email log status to failed")
				}
				return fmt.Errorf("failed to send email: %w", sendErr)
			}
		}

		emailLog.Status = "sent"
		emailLog.ErrorMessage = ""
		if _, err := s.db.NewUpdate().Model(emailLog).Column("status", "error_message").Where("id = ?", emailLog.ID).Exec(ctx); err != nil {
			log.Error().Err(err).Int("id", id).Msg("Failed to update email log status to sent")
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
	// are sent (each member must receive their own invitation). The pipeline
	// transition below still applies once to the whole application.
	recipients := []string{to}
	if email2 := strings.TrimSpace(candidature.Email2); email2 != "" {
		recipients = append(recipients, email2)
	}
	to = strings.Join(recipients, ", ")

	link := resolveEmailLink(req.QuizLink, req.MeetingLink, req.F2FMeetingLink)
	vars := emailRenderVars{
		interviewDate:   req.InterviewDate,
		interviewTime:   req.InterviewTime,
		startDate:       req.StartDate,
		rejectionReason: req.RejectionReason,
		link:            link,
		mapsLink:        asterOideaAddressLink(),
	}
	subject := renderEmailPlaceholders(template.Subject, vars)

	body := renderEmailPlaceholders(template.Body, vars)

	now := time.Now().Format("2006-01-02 15:04:05")

	emailLog := &domain.EmailLog{
		CandidatureID: id,
		Recipient:     to,
		Subject:       subject,
		Body:          body,
		TemplateType:  req.Type,
		CandidatName:  candidature.FullName,
		SubjectName:   candidature.SubjectName,
		Status:        "pending",
		SentAt:        now,
	}
	if _, err := s.db.NewInsert().Model(emailLog).Exec(ctx); err != nil {
		log.Error().Err(err).Int("id", id).Msg("Failed to create email log")
		return fmt.Errorf("failed to create email log: %w", err)
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
	for _, r := range recipients {
		email := mailPkg.Email{
			To:      []string{r},
			Subject: subject,
			Body:    body,
		}

		sendErr := mailer.Send(email)
		if sendErr != nil {
			log.Error().Err(sendErr).Int("id", id).Str("to", to).Str("smtp_host", cfg.Host).Int("smtp_port", cfg.Port).Msg("Failed to send email")
			emailLog.Status = "failed"
			emailLog.ErrorMessage = truncateError(sendErr.Error(), 2000)
			if _, uErr := s.db.NewUpdate().Model(emailLog).Column("status", "error_message").Where("id = ?", emailLog.ID).Exec(ctx); uErr != nil {
				log.Error().Err(uErr).Int("id", id).Msg("Failed to update email log status to failed")
			}
			return fmt.Errorf("failed to send email: %w", sendErr)
		}
	}

	emailLog.Status = "sent"
	emailLog.ErrorMessage = ""
	if _, err := s.db.NewUpdate().Model(emailLog).Column("status", "error_message").Where("id = ?", emailLog.ID).Exec(ctx); err != nil {
		log.Error().Err(err).Int("id", id).Msg("Failed to update email log status to sent")
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

// BulkReject sends the rejection email to every candidature in ids with the
// same rejection reason, then marks each row rejected. Each candidature goes
// through the exact same path as a single rejection (template rendering, one
// email per member for pairs, audit log, status update).
func (s *CandidatureService) BulkReject(ctx context.Context, ids []int, rejectionReason string) (int, error) {
	if len(ids) == 0 {
		return 0, fmt.Errorf("no candidatures selected")
	}
	if strings.TrimSpace(rejectionReason) == "" {
		return 0, fmt.Errorf("rejection reason is required")
	}
	sent := 0
	for _, id := range ids {
		if err := s.SendEmail(ctx, id, SendEmailRequest{Type: "disapproval", RejectionReason: rejectionReason}); err != nil {
			log.Error().Err(err).Int("id", id).Msg("Bulk reject failed for candidature")
			return sent, fmt.Errorf("failed to reject candidature %d: %w", id, err)
		}
		sent++
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

	if sort := scoreSortClause(params.ScoreSortStep, params.ScoreSortDirection); sort != "" {
		query = query.Order(sort)
	} else {
		query = query.Order("cnd.id DESC")
	}

	err := query.Scan(ctx)

	headers := []string{"Step", "Type", "Full Name 1", "Full Name 2", "Project", "Start Date"}
	pdfWidths := []float64{35, 25, 55, 55, 75, 32}

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
		row := []string{
			stepExportLabel(c.Step),
			candidatureType,
			c.FullName,
			c.FullName2,
			c.SubjectName,
			c.StartDate,
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
