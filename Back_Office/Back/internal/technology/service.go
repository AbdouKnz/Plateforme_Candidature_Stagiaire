package technology

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type TechnologyService struct {
	db *bun.DB
}

func (s *TechnologyService) GetAllTechnologies(ctx context.Context, params TechnologyParams) ([]*domain.Technology, error) {
	log.Info().Msg("Fetching all technologies...")
	var technologies []*domain.Technology

	query := s.db.NewSelect().Model(&technologies)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("tech.name ILIKE ?", searchPattern)
	}
	if params.Status != nil {
		query = query.Where("tech.status = ?", *params.Status)
	}

	err := query.Order("tech.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Technology{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching technologies")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(technologies)).Msg("Successfully retrieved technologies")
	return technologies, nil
}

func (s *TechnologyService) GetTechnologyByID(ctx context.Context, id int) (*domain.Technology, error) {
	log.Info().Int("technology_id", id).Msg("Fetching technology by ID...")

	technology := &domain.Technology{}
	err := s.db.NewSelect().Model(technology).Where("tech.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("technology_id", id).Msg("Technology not found")
			return nil, fmt.Errorf("technology with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("technology_id", id).Msg("Database error while fetching technology")
		return nil, fmt.Errorf("could not fetch technology: %w", err)
	}

	log.Info().Int("technology_id", id).Msg("Successfully retrieved technology")
	return technology, nil
}

func (s *TechnologyService) CreateTechnology(ctx context.Context, technology *domain.Technology) (*domain.Technology, error) {
	log.Info().Str("technology", technology.Name).Msg("Creating a new technology...")
	technology.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	technology.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	technology.Status = true

	_, err := s.db.NewInsert().Model(technology).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("technology", technology.Name).Msg("Could not create technology")
		return nil, fmt.Errorf("could not create technology: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				CreatedValues: technology.Name,
				Changed:       true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.TECHNOLOGY_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateTechnology")
	}

	log.Info().Str("technology", technology.Name).Msg("Technology created successfully")
	return technology, nil
}

func (s *TechnologyService) UpdateTechnology(ctx context.Context, id int, request UpdateTechnologyRequest) (*domain.Technology, error) {
	log.Info().Int("technology_id", id).Msg("Updating technology...")

	technology, err := s.GetTechnologyByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldName := technology.Name
	oldStatus := technology.Status

	if request.Name != "" {
		technology.Name = request.Name
	}
	if request.Status != nil {
		technology.Status = *request.Status
	}

	technology.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(technology).Where("id = ?", technology.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update technology with ID %d: %w", technology.ID, err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				OldValues: oldName,
				NewValues: technology.Name,
				Changed:   oldName != technology.Name,
			},
			"Status": {
				OldValues: oldStatus,
				NewValues: technology.Status,
				Changed:   oldStatus != technology.Status,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.TECHNOLOGY_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateTechnology")
	}

	log.Info().Int("technology_id", id).Msg("Successfully updated technology")
	return technology, nil
}

func (s *TechnologyService) DeleteTechnology(ctx context.Context, id int) error {
	log.Info().Int("technology_id", id).Msg("Attempting to delete technology...")

	technology, err := s.GetTechnologyByID(ctx, id)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(technology).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("technology_id", id).Msg("Database error during technology deletion")
		return fmt.Errorf("could not delete technology with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("technology_id", id).Msg("Delete failed: Technology not found at execution time")
		return fmt.Errorf("technology with ID %d not found", id)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name": {DeletedValues: technology.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.TECHNOLOGY_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteTechnology")
	}

	log.Info().Int("technology_id", id).Msg("Successfully deleted technology")
	return nil
}
