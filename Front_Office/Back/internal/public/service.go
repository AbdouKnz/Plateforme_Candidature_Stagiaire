package public

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"front-office-backend/domain"
	"front-office-backend/pkg/mail"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type smtpConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

func (s *PublicService) getSMTPConfig(ctx context.Context) (*smtpConfig, error) {
	keys := []string{"host", "port", "username", "password", "from", "from_name"}
	var settings []*domain.Setting
	err := s.db.NewSelect().Model(&settings).Where(`"group" = ? AND "key" IN (?)`, "mail_config", bun.In(keys)).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch smtp config: %w", err)
	}
	cfg := &smtpConfig{}
	for _, st := range settings {
		switch st.Key {
		case "host":
			cfg.Host = st.Value
		case "port":
			cfg.Port, _ = strconv.Atoi(st.Value)
		case "username":
			cfg.Username = st.Value
		case "password":
			cfg.Password = st.Value
		case "from":
			cfg.From = st.Value
		case "from_name":
			cfg.FromName = st.Value
		}
	}
	if cfg.Port == 0 {
		cfg.Port = 587
	}
	if cfg.Host == "" {
		return nil, fmt.Errorf("SMTP not configured")
	}
	return cfg, nil
}

type PublicService struct {
	db *bun.DB
}

func NewPublicService(db *bun.DB) *PublicService {
	return &PublicService{db: db}
}

func (s *PublicService) GetActiveDegrees(ctx context.Context) ([]*domain.Degree, error) {
	log.Info().Msg("Fetching active degrees for front office...")
	var degrees []*domain.Degree
	err := s.db.NewSelect().Model(&degrees).
		Where("deg.status = ?", true).
		Order("deg.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Degree{}, nil
		}
		return nil, fmt.Errorf("database error: %w", err)
	}
	return degrees, nil
}

func (s *PublicService) GetActiveTypes(ctx context.Context) ([]*domain.Type, error) {
	log.Info().Msg("Fetching active types for front office...")
	var types []*domain.Type
	err := s.db.NewSelect().Model(&types).
		Where("typ.status = ?", true).
		Order("typ.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Type{}, nil
		}
		return nil, fmt.Errorf("database error: %w", err)
	}
	return types, nil
}

func (s *PublicService) GetActiveDurations(ctx context.Context) ([]*domain.Duration, error) {
	log.Info().Msg("Fetching active durations for front office...")
	var durations []*domain.Duration
	err := s.db.NewSelect().Model(&durations).
		Where("dur.status = ?", true).
		Order("dur.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Duration{}, nil
		}
		return nil, fmt.Errorf("database error: %w", err)
	}
	return durations, nil
}

func (s *PublicService) GetActiveTechnologies(ctx context.Context) ([]*domain.Technology, error) {
	log.Info().Msg("Fetching active technologies for front office...")
	var technologies []*domain.Technology
	err := s.db.NewSelect().Model(&technologies).
		Where("tech.status = ?", true).
		Order("tech.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Technology{}, nil
		}
		return nil, fmt.Errorf("database error: %w", err)
	}
	return technologies, nil
}

func (s *PublicService) GetActiveSubjects(ctx context.Context) ([]*domain.Subject, error) {
	log.Info().Msg("Fetching active subjects for front office...")
	var subjects []*domain.Subject
	err := s.db.NewSelect().Model(&subjects).
		Where("sub.status = ?", true).
		Order("sub.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Subject{}, nil
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	for _, subj := range subjects {
		var techIDs []int
		err := s.db.NewSelect().Model((*domain.SubjectTechnology)(nil)).
			Column("technology_id").
			Where("subject_id = ?", subj.ID).
			Scan(ctx, &techIDs)
		if err != nil {
			log.Warn().Err(err).Int("subject_id", subj.ID).Msg("Failed to load technology IDs")
			continue
		}
		if len(techIDs) > 0 {
			err = s.db.NewSelect().Model(&subj.Technologies).
				Where("id IN (?)", bun.In(techIDs)).Scan(ctx)
			if err != nil {
				log.Warn().Err(err).Int("subject_id", subj.ID).Msg("Failed to load technologies")
			}
		}
	}

	return subjects, nil
}

func (s *PublicService) CreateCandidature(ctx context.Context, c *domain.Candidature) (*domain.Candidature, error) {
	log.Info().Str("full_name", c.FullName).Msg("Creating candidature from front office...")
	c.DateApplication = time.Now().Format("2006-01-02")
	c.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	c.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	if c.Status == "" {
		c.Status = "pending"
	}

	var id int
	err := s.db.NewRaw(`
		INSERT INTO candidature (
			full_name, email1, gender1, phone1, degree1,
			full_name2, email2, gender2, phone2, degree2,
			duration, methode, start_date, subject_name, university,
			date_application, path_cv, path_lettre_motivation,
			path_cv2, path_lettre_motivation2,
			status, created_at, updated_at
		) VALUES (
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?,
			?, ?,
			?, ?, ?
		)
		RETURNING id
	`,
		c.FullName, c.Email1, c.Gender1, c.Phone1, c.Degree1,
		c.FullName2, c.Email2, c.Gender2, c.Phone2, c.Degree2,
		c.Duration, c.Methode, c.StartDate, c.SubjectName, c.University,
		c.DateApplication, c.PathCV, c.PathLettreMotivation,
		c.PathCV2, c.PathLettreMotivation2,
		c.Status, c.CreatedAt, c.UpdatedAt,
	).Scan(ctx, &id)
	if err != nil {
		log.Error().Err(err).Str("full_name", c.FullName).Msg("Could not create candidature")
		return nil, fmt.Errorf("could not create candidature: %w", err)
	}
	c.ID = id

	go s.sendConfirmationEmail(context.Background(), c)

	log.Info().Int("id", id).Str("full_name", c.FullName).Msg("Candidature created successfully from front office")
	return c, nil
}

func (s *PublicService) ensureWasEnabledSetting(ctx context.Context, initialValue string) {
	count, err := s.db.NewSelect().Model((*domain.FrontOfficeStatus)(nil)).
		Where(`"group" = ?`, "front_office").
		Where(`"key" = ?`, "was_enabled").
		Count(ctx)
	if err != nil || count > 0 {
		return
	}
	// Create the was_enabled setting with the same value as the current enabled state
	_, err = s.db.NewInsert().Model(&domain.FrontOfficeStatus{
		Group: "front_office",
		Key:   "was_enabled",
		Value: initialValue,
		Type:  "text",
	}).Exec(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to create was_enabled setting")
	}
}

func (s *PublicService) GetFrontOfficeStatus(ctx context.Context) (bool, string, error) {
	var settings []*domain.FrontOfficeStatus
	err := s.db.NewSelect().Model(&settings).
		Where("st.group = ?", "front_office").
		Where("st.key IN (?)", bun.In([]string{"enabled", "reopening_date", "was_enabled"})).
		Scan(ctx)
	if err != nil {
		return true, "", err
	}

	var isEnabled = true
	var wasEnabled *bool
	var reopeningDate string
	for _, setting := range settings {
		switch setting.Key {
		case "enabled":
			isEnabled = setting.Value == "true"
		case "was_enabled":
			v := setting.Value == "true"
			wasEnabled = &v
		case "reopening_date":
			reopeningDate = setting.Value
		}
	}

	// If was_enabled doesn't exist yet, create it matching current state to avoid false triggers
	if wasEnabled == nil {
		initialValue := "false"
		if isEnabled {
			initialValue = "true"
		}
		s.ensureWasEnabledSetting(ctx, initialValue)
		wasEnabled = &isEnabled
	}

	// Detect transition from closed → open and send waitlist notifications
	if isEnabled && !*wasEnabled {
		log.Info().Msg("Front office reactivated — waitlist subscribers already handled by Back_Office")
		_, err = s.db.NewUpdate().
			Model((*domain.FrontOfficeStatus)(nil)).
			Set("value = ?", "true").
			Where(`"group" = ?`, "front_office").
			Where(`"key" = ?`, "was_enabled").
			Exec(ctx)
		if err != nil {
			log.Warn().Err(err).Msg("Failed to update was_enabled setting")
		}
	}

	// Track that it's now disabled for future transition detection
	if !isEnabled && *wasEnabled {
		_, err = s.db.NewUpdate().
			Model((*domain.FrontOfficeStatus)(nil)).
			Set("value = ?", "false").
			Where(`"group" = ?`, "front_office").
			Where(`"key" = ?`, "was_enabled").
			Exec(ctx)
		if err != nil {
			log.Warn().Err(err).Msg("Failed to update was_enabled setting")
		}
	}

	return isEnabled, reopeningDate, nil
}

func (s *PublicService) SubscribeWaitlist(ctx context.Context, email string) error {
	existing := &domain.WaitlistSubscriber{}
	err := s.db.NewSelect().Model(existing).Where("email = ?", email).Limit(1).Scan(ctx)
	if err == nil {
		return fmt.Errorf("already subscribed")
	}

	sub := &domain.WaitlistSubscriber{
		Email:  email,
		Status: "pending",
	}
	_, err = s.db.NewInsert().Model(sub).Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not subscribe: %w", err)
	}
	return nil
}

func (s *PublicService) sendConfirmationEmail(ctx context.Context, c *domain.Candidature) {
	template := &domain.EmailTemplate{}
	err := s.db.NewSelect().Model(template).
		Where("type = ?", "confirmation").
		Where("status = ?", true).
		Limit(1).Scan(ctx)
	if err != nil {
		log.Warn().Err(err).Str("full_name", c.FullName).Msg("No confirmation email template found")
		return
	}

	subject := strings.ReplaceAll(template.Subject, "{{NomCandidat}}", c.FullName)
	subject = strings.ReplaceAll(subject, "{{TitreSujet}}", c.SubjectName)

	body := strings.ReplaceAll(template.Body, "{{NomCandidat}}", c.FullName)
	body = strings.ReplaceAll(body, "{{TitreSujet}}", c.SubjectName)

	m, err := s.getSMTPConfig(ctx)
	if err != nil {
		log.Warn().Err(err).Str("full_name", c.FullName).Str("email", c.Email1).Msg("Failed to get SMTP config, skipping email")
		return
	}

	now := time.Now().Format("2006-01-02 15:04:05")

	emailLog := &domain.EmailLog{
		CandidatureID: c.ID,
		Recipient:     c.Email1,
		Subject:       subject,
		Body:          body,
		TemplateType:  "confirmation",
		CandidatName:  c.FullName,
		SubjectName:   c.SubjectName,
		Status:        "pending",
		SentAt:        now,
	}
	if _, logErr := s.db.NewInsert().Model(emailLog).Exec(ctx); logErr != nil {
		log.Warn().Err(logErr).Str("full_name", c.FullName).Msg("Failed to log confirmation email")
	}

	mailer := mail.NewMailer(m.Host, m.Port, m.Username, m.Password, m.From, m.FromName)

	email := mail.Email{
		To:      []string{c.Email1},
		Subject: subject,
		Body:    body,
	}

	if sendErr := mailer.Send(email); sendErr != nil {
		log.Warn().Err(sendErr).Str("full_name", c.FullName).Str("email", c.Email1).Msg("Failed to send confirmation email")
		emailLog.Status = "failed"
		s.db.NewUpdate().Model(emailLog).Column("status").Where("id = ?", emailLog.ID).Exec(ctx)
		return
	}

	emailLog.Status = "sent"
	if _, uErr := s.db.NewUpdate().Model(emailLog).Column("status").Where("id = ?", emailLog.ID).Exec(ctx); uErr != nil {
		log.Warn().Err(uErr).Str("full_name", c.FullName).Msg("Failed to update email log status")
	}

	log.Info().Str("full_name", c.FullName).Str("email", c.Email1).Msg("Confirmation email sent successfully")
}
