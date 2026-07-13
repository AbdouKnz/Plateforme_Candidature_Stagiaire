package duration

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

type DurationService struct {
	db *bun.DB
}

func (s *DurationService) GetAllDurations(ctx context.Context, params DurationParams) ([]*domain.Duration, error) {
	log.Info().Msg("Fetching all durations...")
	var durations []*domain.Duration

	query := s.db.NewSelect().Model(&durations)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("dur.name ILIKE ?", searchPattern)
	}
	if params.Status != nil {
		query = query.Where("dur.status = ?", *params.Status)
	}

	err := query.Order("dur.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Duration{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching durations")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(durations)).Msg("Successfully retrieved durations")
	return durations, nil
}

func (s *DurationService) GetDurationByID(ctx context.Context, id int) (*domain.Duration, error) {
	log.Info().Int("duration_id", id).Msg("Fetching duration by ID...")

	duration := &domain.Duration{}
	err := s.db.NewSelect().Model(duration).Where("dur.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("duration_id", id).Msg("Duration not found")
			return nil, fmt.Errorf("duration with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("duration_id", id).Msg("Database error while fetching duration")
		return nil, fmt.Errorf("could not fetch duration: %w", err)
	}

	log.Info().Int("duration_id", id).Msg("Successfully retrieved duration")
	return duration, nil
}

func (s *DurationService) CreateDuration(ctx context.Context, duration *domain.Duration) (*domain.Duration, error) {
	log.Info().Str("duration", duration.Name).Msg("Creating a new duration...")
	duration.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	duration.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	duration.Status = true

	_, err := s.db.NewInsert().Model(duration).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("duration", duration.Name).Msg("Could not create duration")
		return nil, fmt.Errorf("could not create duration: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				CreatedValues: duration.Name,
				Changed:       true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.DURATION_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateDuration")
	}

	log.Info().Str("duration", duration.Name).Msg("Duration created successfully")
	return duration, nil
}

func (s *DurationService) UpdateDuration(ctx context.Context, id int, request UpdateDurationRequest) (*domain.Duration, error) {
	log.Info().Int("duration_id", id).Msg("Updating duration...")

	duration, err := s.GetDurationByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldName := duration.Name
	oldStatus := duration.Status

	if request.Name != "" {
		duration.Name = request.Name
	}
	if request.Status != nil && *request.Status != duration.Status {
		// Prevent disabling the last active duration
		if !*request.Status {
			count, err := s.db.NewSelect().Model((*domain.Duration)(nil)).Where("status = ?", true).Count(ctx)
			if err != nil {
				return nil, fmt.Errorf("could not check active durations: %w", err)
			}
			if count <= 1 {
				return nil, fmt.Errorf("at_least_one_duration_active")
			}
		}
		duration.Status = *request.Status
	}

	duration.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(duration).Where("id = ?", duration.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update duration with ID %d: %w", duration.ID, err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				OldValues: oldName,
				NewValues: duration.Name,
				Changed:   oldName != duration.Name,
			},
			"Status": {
				OldValues: oldStatus,
				NewValues: duration.Status,
				Changed:   oldStatus != duration.Status,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.DURATION_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateDuration")
	}

	log.Info().Int("duration_id", id).Msg("Successfully updated duration")
	return duration, nil
}

func (s *DurationService) DeleteDuration(ctx context.Context, id int) error {
	log.Info().Int("duration_id", id).Msg("Attempting to delete duration...")

	duration, err := s.GetDurationByID(ctx, id)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(duration).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("duration_id", id).Msg("Database error during duration deletion")
		return fmt.Errorf("could not delete duration with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("duration_id", id).Msg("Delete failed: Duration not found at execution time")
		return fmt.Errorf("duration with ID %d not found", id)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name": {DeletedValues: duration.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.DURATION_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteDuration")
	}

	log.Info().Int("duration_id", id).Msg("Successfully deleted duration")
	return nil
}
