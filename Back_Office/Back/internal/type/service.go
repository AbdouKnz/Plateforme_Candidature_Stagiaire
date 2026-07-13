package typ

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

type TypeService struct {
	db *bun.DB
}

func (s *TypeService) GetAllTypes(ctx context.Context, params TypeParams) ([]*domain.Type, error) {
	log.Info().Msg("Fetching all types...")
	var types []*domain.Type

	query := s.db.NewSelect().Model(&types)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("typ.name ILIKE ?", searchPattern)
	}
	if params.Status != nil {
		query = query.Where("typ.status = ?", *params.Status)
	}

	err := query.Order("typ.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Type{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching types")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(types)).Msg("Successfully retrieved types")
	return types, nil
}

func (s *TypeService) GetTypeByID(ctx context.Context, id int) (*domain.Type, error) {
	log.Info().Int("type_id", id).Msg("Fetching type by ID...")

	typ := &domain.Type{}
	err := s.db.NewSelect().Model(typ).Where("typ.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("type_id", id).Msg("Type not found")
			return nil, fmt.Errorf("type with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("type_id", id).Msg("Database error while fetching type")
		return nil, fmt.Errorf("could not fetch type: %w", err)
	}

	log.Info().Int("type_id", id).Msg("Successfully retrieved type")
	return typ, nil
}

func (s *TypeService) CreateType(ctx context.Context, typ *domain.Type) (*domain.Type, error) {
	log.Info().Str("type", typ.Name).Msg("Creating a new type...")
	typ.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	typ.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	typ.Status = true

	_, err := s.db.NewInsert().Model(typ).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("type", typ.Name).Msg("Could not create type")
		return nil, fmt.Errorf("could not create type: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				CreatedValues: typ.Name,
				Changed:       true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.TYPE_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateType")
	}

	log.Info().Str("type", typ.Name).Msg("Type created successfully")
	return typ, nil
}

func (s *TypeService) UpdateType(ctx context.Context, id int, request UpdateTypeRequest) (*domain.Type, error) {
	log.Info().Int("type_id", id).Msg("Updating type...")

	typ, err := s.GetTypeByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldName := typ.Name
	oldStatus := typ.Status

	if request.Name != "" {
		typ.Name = request.Name
	}
	if request.Status != nil && *request.Status != typ.Status {
		// Prevent disabling the last active type
		if !*request.Status {
			count, err := s.db.NewSelect().Model((*domain.Type)(nil)).Where("status = ?", true).Count(ctx)
			if err != nil {
				return nil, fmt.Errorf("could not check active types: %w", err)
			}
			if count <= 1 {
				return nil, fmt.Errorf("at_least_one_type_active")
			}
		}
		typ.Status = *request.Status
	}

	typ.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(typ).Where("id = ?", typ.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update type with ID %d: %w", typ.ID, err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				OldValues: oldName,
				NewValues: typ.Name,
				Changed:   oldName != typ.Name,
			},
			"Status": {
				OldValues: oldStatus,
				NewValues: typ.Status,
				Changed:   oldStatus != typ.Status,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.TYPE_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateType")
	}

	log.Info().Int("type_id", id).Msg("Successfully updated type")
	return typ, nil
}

func (s *TypeService) DeleteType(ctx context.Context, id int) error {
	log.Info().Int("type_id", id).Msg("Attempting to delete type...")

	typ, err := s.GetTypeByID(ctx, id)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(typ).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("type_id", id).Msg("Database error during type deletion")
		return fmt.Errorf("could not delete type with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("type_id", id).Msg("Delete failed: Type not found at execution time")
		return fmt.Errorf("type with ID %d not found", id)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name": {DeletedValues: typ.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.TYPE_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteType")
	}

	log.Info().Int("type_id", id).Msg("Successfully deleted type")
	return nil
}
