package degree

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

type DegreeService struct {
	db *bun.DB
}

func NewDegreeService(db *bun.DB, auditService *audit.AuditService) *DegreeService {
	return &DegreeService{
		db: db,
	}
}

func (s *DegreeService) GetAllDegrees(ctx context.Context, params DegreeParams) ([]*domain.Degree, error) {
	log.Info().Msg("Fetching all degrees...")
	var degrees []*domain.Degree

	query := s.db.NewSelect().Model(&degrees)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("deg.name ILIKE ?", searchPattern)
	}
	if params.Status != nil {
		query = query.Where("deg.status = ?", *params.Status)
	}

	err := query.Order("deg.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Degree{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching degrees")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(degrees)).Msg("Successfully retrieved degrees")
	return degrees, nil
}

func (s *DegreeService) GetDegreeByID(ctx context.Context, id int) (*domain.Degree, error) {
	log.Info().Int("degree_id", id).Msg("Fetching degree by ID...")

	degree := &domain.Degree{}
	err := s.db.NewSelect().Model(degree).Where("deg.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("degree_id", id).Msg("Degree not found")
			return nil, fmt.Errorf("degree with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("degree_id", id).Msg("Database error while fetching degree")
		return nil, fmt.Errorf("could not fetch degree: %w", err)
	}

	log.Info().Int("degree_id", id).Msg("Successfully retrieved degree")
	return degree, nil
}

func (s *DegreeService) CreateDegree(ctx context.Context, degree *domain.Degree) (*domain.Degree, error) {
	log.Info().Str("degree", degree.Name).Msg("Creating a new degree...")
	degree.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	degree.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	degree.Status = true

	_, err := s.db.NewInsert().Model(degree).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("degree", degree.Name).Msg("Could not create degree")
		return nil, fmt.Errorf("could not create degree: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				CreatedValues: degree.Name,
				Changed:       true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.DEGREE_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateDegree")
	}

	log.Info().Str("degree", degree.Name).Msg("Degree created successfully")
	return degree, nil
}

func (s *DegreeService) UpdateDegree(ctx context.Context, id int, request UpdateDegreeRequest) (*domain.Degree, error) {
	log.Info().Int("degree_id", id).Msg("Updating degree...")

	degree, err := s.GetDegreeByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldName := degree.Name
	oldStatus := degree.Status

	if request.Name != "" {
		degree.Name = request.Name
	}
	if request.Status != nil && *request.Status != degree.Status {
		// Prevent disabling the last active degree
		if !*request.Status {
			count, err := s.db.NewSelect().Model((*domain.Degree)(nil)).Where("status = ?", true).Count(ctx)
			if err != nil {
				return nil, fmt.Errorf("could not check active degrees: %w", err)
			}
			if count <= 1 {
				return nil, fmt.Errorf("at_least_one_degree_active")
			}
		}
		degree.Status = *request.Status
	}

	degree.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(degree).Where("id = ?", degree.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update degree with ID %d: %w", degree.ID, err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				OldValues: oldName,
				NewValues: degree.Name,
				Changed:   oldName != degree.Name,
			},
			"Status": {
				OldValues: oldStatus,
				NewValues: degree.Status,
				Changed:   oldStatus != degree.Status,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.DEGREE_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateDegree")
	}

	log.Info().Int("degree_id", id).Msg("Successfully updated degree")
	return degree, nil
}

func (s *DegreeService) DeleteDegree(ctx context.Context, id int) error {
	log.Info().Int("degree_id", id).Msg("Attempting to delete degree...")

	degree, err := s.GetDegreeByID(ctx, id)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(degree).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("degree_id", id).Msg("Database error during degree deletion")
		return fmt.Errorf("could not delete degree with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("degree_id", id).Msg("Delete failed: Degree not found at execution time")
		return fmt.Errorf("degree with ID %d not found", id)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name": {DeletedValues: degree.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.DEGREE_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteDegree")
	}

	log.Info().Int("degree_id", id).Msg("Successfully deleted degree")
	return nil
}
