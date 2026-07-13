package email_template

import (
	"astro-backend/domain"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type EmailTemplateService struct {
	db *bun.DB
}

func (s *EmailTemplateService) GetAll(ctx context.Context, params EmailTemplateParams) ([]*domain.EmailTemplate, error) {
	log.Info().Msg("Fetching all email templates...")
	var emailTemplates []*domain.EmailTemplate

	query := s.db.NewSelect().Model(&emailTemplates)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("et.subject ILIKE ? OR et.type ILIKE ?", searchPattern, searchPattern)
	}

	err := query.Order("et.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.EmailTemplate{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching email templates")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(emailTemplates)).Msg("Successfully retrieved email templates")
	return emailTemplates, nil
}

func (s *EmailTemplateService) GetByID(ctx context.Context, id int) (*domain.EmailTemplate, error) {
	log.Info().Int("id", id).Msg("Fetching email template by ID...")

	emailTemplate := &domain.EmailTemplate{}
	err := s.db.NewSelect().Model(emailTemplate).
		Where("et.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("id", id).Msg("Email template not found")
			return nil, fmt.Errorf("email template with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("id", id).Msg("Database error while fetching email template")
		return nil, fmt.Errorf("could not fetch email template: %w", err)
	}

	log.Info().Int("id", id).Msg("Successfully retrieved email template")
	return emailTemplate, nil
}

func (s *EmailTemplateService) Create(ctx context.Context, emailTemplate *domain.EmailTemplate) (*domain.EmailTemplate, error) {
	log.Info().Msg("Creating a new email template...")
	now := time.Now().Format("2006-01-02 15:04:05")
	emailTemplate.CreatedAt = now
	emailTemplate.UpdatedAt = now

	err := s.db.NewInsert().Model(emailTemplate).
		Column("type", "subject", "body", "status", "created_at", "updated_at").
		Returning("id").
		Scan(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Could not create email template")
		return nil, fmt.Errorf("could not create email template: %w", err)
	}

	log.Info().Int("id", emailTemplate.ID).Msg("Email template created successfully")
	return emailTemplate, nil
}

func (s *EmailTemplateService) Update(ctx context.Context, id int, request UpdateEmailTemplateRequest) (*domain.EmailTemplate, error) {
	log.Info().Int("id", id).Msg("Updating email template...")

	emailTemplate, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if request.Type != "" {
		emailTemplate.Type = request.Type
	}
	if request.Subject != "" {
		emailTemplate.Subject = request.Subject
	}
	if request.Body != "" {
		emailTemplate.Body = request.Body
	}
	if request.Status != nil {
		emailTemplate.Status = *request.Status
	}

	emailTemplate.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(emailTemplate).Where("id = ?", emailTemplate.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update email template with ID %d: %w", emailTemplate.ID, err)
	}

	log.Info().Int("id", id).Msg("Successfully updated email template")
	return emailTemplate, nil
}

func (s *EmailTemplateService) Delete(ctx context.Context, id int) error {
	log.Info().Int("id", id).Msg("Attempting to delete email template...")

	emailTemplate := &domain.EmailTemplate{}
	err := s.db.NewSelect().Model(emailTemplate).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(emailTemplate).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("Database error during email template deletion")
		return fmt.Errorf("could not delete email template with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("id", id).Msg("Delete failed: Email template not found at execution time")
		return fmt.Errorf("email template with ID %d not found", id)
	}

	log.Info().Int("id", id).Msg("Successfully deleted email template")
	return nil
}

