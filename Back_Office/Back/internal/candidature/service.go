package candidature

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/internal/mail_config"
	"astro-backend/pkg"
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

func (s *CandidatureService) GetEmailTemplateByType(ctx context.Context, templateType string) (*domain.EmailTemplate, error) {
	var template domain.EmailTemplate
	err := s.db.NewSelect().Model(&template).
		Where("type = ?", templateType).
		Limit(1).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (s *CandidatureService) GetAll(ctx context.Context, params CandidatureParams) ([]*domain.Candidature, error) {
	log.Info().Msg("Fetching all candidatures...")
	var candidatures []*domain.Candidature

	query := s.db.NewSelect().Model(&candidatures)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("cnd.full_name ILIKE ? OR cnd.email1 ILIKE ? OR cnd.subject_name ILIKE ?", searchPattern, searchPattern, searchPattern)
	}

	err := query.Order("cnd.id ASC").Scan(ctx)
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

func (s *CandidatureService) GetByID(ctx context.Context, id int) (*domain.Candidature, error) {
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

	log.Info().Int("id", id).Msg("Successfully retrieved candidature")
	return candidature, nil
}

func (s *CandidatureService) Create(ctx context.Context, candidature *domain.Candidature) (*domain.Candidature, error) {
	log.Info().Str("full_name", candidature.FullName).Msg("Creating a new candidature...")
	candidature.DateApplication = time.Now().Format("2006-01-02")
	candidature.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	candidature.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err := s.db.NewInsert().Model(candidature).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("full_name", candidature.FullName).Msg("Could not create candidature")
		return nil, fmt.Errorf("could not create candidature: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"FullName": {CreatedValues: candidature.FullName, Changed: true},
			"Email1":   {CreatedValues: candidature.Email1, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.CANDIDATURE_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateCandidature")
	}

	log.Info().Str("full_name", candidature.FullName).Msg("Candidature created successfully")
	return candidature, nil
}

func (s *CandidatureService) Update(ctx context.Context, id int, request UpdateCandidatureRequest) (*domain.Candidature, error) {
	log.Info().Int("id", id).Msg("Updating candidature...")

	candidature, err := s.GetByID(ctx, id)
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
	if request.DateApplication != "" {
		candidature.DateApplication = request.DateApplication
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
	if request.Status != "" {
		candidature.Status = request.Status
	}

	candidature.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(candidature).Where("id = ?", candidature.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update candidature with ID %d: %w", candidature.ID, err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"FullName": {OldValues: "", NewValues: candidature.FullName, Changed: true},
			"Email1":   {OldValues: "", NewValues: candidature.Email1, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.CANDIDATURE_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateCandidature")
	}

	log.Info().Int("id", id).Msg("Successfully updated candidature")
	return candidature, nil
}

func (s *CandidatureService) GetEmailPreview(ctx context.Context, id int, templateType string, interviewDate string, interviewTime string) (*EmailPreviewResponse, error) {
	candidature, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	template, err := s.GetEmailTemplateByType(ctx, templateType)
	if err != nil {
		return nil, fmt.Errorf("no email template found for type %s", templateType)
	}

	to := candidature.Email1
	subject := template.Subject
	subject = strings.ReplaceAll(subject, "{{NomCandidat}}", candidature.FullName)
	subject = strings.ReplaceAll(subject, "[Nom du candidat]", candidature.FullName)
	subject = strings.ReplaceAll(subject, "[Nom Candidat]", candidature.FullName)
	subject = strings.ReplaceAll(subject, "{{TitreSujet}}", candidature.SubjectName)
	subject = strings.ReplaceAll(subject, "[nom]", candidature.FullName)
	subject = strings.ReplaceAll(subject, "{{DateEntretien}}", interviewDate)
	subject = strings.ReplaceAll(subject, "{{HeureEntretien}}", interviewTime)

	body := template.Body
	body = strings.ReplaceAll(body, "{{NomCandidat}}", candidature.FullName)
	body = strings.ReplaceAll(body, "[Nom du candidat]", candidature.FullName)
	body = strings.ReplaceAll(body, "[Nom Candidat]", candidature.FullName)
	body = strings.ReplaceAll(body, "{{TitreSujet}}", candidature.SubjectName)
	body = strings.ReplaceAll(body, "[nom]", candidature.FullName)
	body = strings.ReplaceAll(body, "{{DateEntretien}}", interviewDate)
	body = strings.ReplaceAll(body, "{{HeureEntretien}}", interviewTime)
	body = strings.ReplaceAll(body, "[Date]", interviewDate)
	body = strings.ReplaceAll(body, "[Heure]", interviewTime)

	body = strings.ReplaceAll(body, "{{LienGoogleMaps}}", "Adresse")
	body = strings.ReplaceAll(body, "[LienGoogleMaps]", "Adresse")
	body = strings.ReplaceAll(body, "[Adresse]", "Adresse")

	return &EmailPreviewResponse{
		To:      to,
		Subject: subject,
		Body:    body,
	}, nil
}

func (s *CandidatureService) SendEmail(ctx context.Context, id int, req SendEmailRequest) error {
	log.Info().Int("id", id).Str("type", req.Type).Msg("Sending email for candidature...")

	candidature, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	template, err := s.GetEmailTemplateByType(ctx, req.Type)
	if err != nil {
		return fmt.Errorf("no email template found for type %s", req.Type)
	}

	to := candidature.Email1
	if to == "" {
		return fmt.Errorf("candidature has no email address")
	}

	subject := template.Subject
	subject = strings.ReplaceAll(subject, "{{NomCandidat}}", candidature.FullName)
	subject = strings.ReplaceAll(subject, "[Nom du candidat]", candidature.FullName)
	subject = strings.ReplaceAll(subject, "[Nom Candidat]", candidature.FullName)
	subject = strings.ReplaceAll(subject, "{{TitreSujet}}", candidature.SubjectName)
	subject = strings.ReplaceAll(subject, "[nom]", candidature.FullName)
	subject = strings.ReplaceAll(subject, "{{DateEntretien}}", req.InterviewDate)
	subject = strings.ReplaceAll(subject, "{{HeureEntretien}}", req.InterviewTime)

	body := template.Body
	body = strings.ReplaceAll(body, "{{NomCandidat}}", candidature.FullName)
	body = strings.ReplaceAll(body, "[Nom du candidat]", candidature.FullName)
	body = strings.ReplaceAll(body, "[Nom Candidat]", candidature.FullName)
	body = strings.ReplaceAll(body, "{{TitreSujet}}", candidature.SubjectName)
	body = strings.ReplaceAll(body, "[nom]", candidature.FullName)
	body = strings.ReplaceAll(body, "{{DateEntretien}}", req.InterviewDate)
	body = strings.ReplaceAll(body, "{{HeureEntretien}}", req.InterviewTime)
	body = strings.ReplaceAll(body, "[Date]", req.InterviewDate)
	body = strings.ReplaceAll(body, "[Heure]", req.InterviewTime)

	googleMapsLink := `<a href="https://www.google.com/maps/place/Asteroidea/@36.7683782,10.2420193,909m/data=!3m2!1e3!4b1!4m6!3m5!1s0x12fd370003d7b35b:0xba18eae5e43a8557!8m2!3d36.7683739!4d10.2445942!16s%2Fg%2F11vy5k2_b2?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D">Adresse</a>`
	body = strings.ReplaceAll(body, "{{LienGoogleMaps}}", googleMapsLink)
	body = strings.ReplaceAll(body, "[LienGoogleMaps]", googleMapsLink)
	body = strings.ReplaceAll(body, "[Adresse]", googleMapsLink)
	subject = strings.ReplaceAll(subject, "{{LienGoogleMaps}}", "Adresse")
	subject = strings.ReplaceAll(subject, "[LienGoogleMaps]", "Adresse")
	subject = strings.ReplaceAll(subject, "[Adresse]", "Adresse")

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

	email := mailPkg.Email{
		To:      []string{to},
		Subject: subject,
		Body:    body,
	}

	sendErr := mailer.Send(email)
	if sendErr != nil {
		log.Error().Err(sendErr).Int("id", id).Msg("Failed to send email")
		emailLog.Status = "failed"
		if _, uErr := s.db.NewUpdate().Model(emailLog).Column("status").Where("id = ?", emailLog.ID).Exec(ctx); uErr != nil {
			log.Error().Err(uErr).Int("id", id).Msg("Failed to update email log status to failed")
		}
		return fmt.Errorf("failed to send email: %w", sendErr)
	}

	emailLog.Status = "sent"
	if _, err := s.db.NewUpdate().Model(emailLog).Column("status").Where("id = ?", emailLog.ID).Exec(ctx); err != nil {
		log.Error().Err(err).Int("id", id).Msg("Failed to update email log status to sent")
	}

	status := "invited"
	if req.Type == "disapproval" {
		status = "rejected"
	}
	candidature.Status = status
	candidature.UpdatedAt = now

	_, err = s.db.NewUpdate().Model(candidature).Where("id = ?", candidature.ID).Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not update candidature status: %w", err)
	}

	log.Info().Int("id", id).Str("status", status).Msg("Email sent and candidature status updated")
	return nil
}

func (s *CandidatureService) Export(ctx context.Context, params CandidatureParams) (*export.ExportOptions, error) {
	log.Info().Str("Type", params.FileType).Msg("Exporting Candidatures")

	var candidatures []*domain.Candidature
	query := s.db.NewSelect().Model(&candidatures)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("cnd.full_name ILIKE ? OR cnd.email1 ILIKE ? OR cnd.subject_name ILIKE ?", searchPattern, searchPattern, searchPattern)
	}

	err := query.Order("cnd.id ASC").Scan(ctx)

	headers := []string{"Status", "Type", "Full Name 1", "Full Name 2", "Project", "Start Date"}
	pdfWidths := []float64{40, 30, 60, 60, 60, 40}

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
			c.Status,
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

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"FullName": {DeletedValues: candidature.FullName, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.CANDIDATURE_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteCandidature")
	}

	log.Info().Int("id", id).Msg("Successfully deleted candidature")
	return nil
}
