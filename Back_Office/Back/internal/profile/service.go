package profile

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

type ProfileService struct {
	db *bun.DB
}

func (s *ProfileService) GetAllProfiles(ctx context.Context, params ProfileParams) ([]*domain.Profile, error) {
	log.Info().Msg("Fetching all profiles...")
	var profiles []*domain.Profile

	query := s.db.NewSelect().Model(&profiles)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("prof.name ILIKE ?", searchPattern)
	}
	if params.Status != nil {
		query = query.Where("prof.status = ?", *params.Status)
	}

	err := query.Order("prof.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Profile{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching profiles")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().Int("count", len(profiles)).Msg("Successfully retrieved profiles")
	return profiles, nil
}

func (s *ProfileService) GetProfileByID(ctx context.Context, id int) (*domain.Profile, error) {
	log.Info().Int("profile_id", id).Msg("Fetching profile by ID...")

	profile := &domain.Profile{}
	err := s.db.NewSelect().Model(profile).Where("prof.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("profile_id", id).Msg("Profile not found")
			return nil, fmt.Errorf("profile with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("profile_id", id).Msg("Database error while fetching profile")
		return nil, fmt.Errorf("could not fetch profile: %w", err)
	}

	log.Info().Int("profile_id", id).Msg("Successfully retrieved profile")
	return profile, nil
}

func (s *ProfileService) CreateProfile(ctx context.Context, profile *domain.Profile) (*domain.Profile, error) {
	log.Info().Str("profile", profile.Name).Msg("Creating a new profile...")
	profile.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	profile.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	profile.Status = true

	_, err := s.db.NewInsert().Model(profile).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("profile", profile.Name).Msg("Could not create profile")
		return nil, fmt.Errorf("could not create profile: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				CreatedValues: profile.Name,
				Changed:       true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.PROFILE_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateProfile")
	}

	log.Info().Str("profile", profile.Name).Msg("Profile created successfully")
	return profile, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, id int, request UpdateProfileRequest) (*domain.Profile, error) {
	log.Info().Int("profile_id", id).Msg("Updating profile...")

	profile, err := s.GetProfileByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldName := profile.Name
	oldStatus := profile.Status

	if request.Name != "" {
		profile.Name = request.Name
	}
	if request.Status != nil {
		profile.Status = *request.Status
	}

	profile.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(profile).Where("id = ?", profile.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update profile with ID %d: %w", profile.ID, err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				OldValues: oldName,
				NewValues: profile.Name,
				Changed:   oldName != profile.Name,
			},
			"Status": {
				OldValues: oldStatus,
				NewValues: profile.Status,
				Changed:   oldStatus != profile.Status,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.PROFILE_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateProfile")
	}

	log.Info().Int("profile_id", id).Msg("Successfully updated profile")
	return profile, nil
}

func (s *ProfileService) DeleteProfile(ctx context.Context, id int) error {
	log.Info().Int("profile_id", id).Msg("Attempting to delete profile...")

	profile, err := s.GetProfileByID(ctx, id)
	if err != nil {
		return err
	}

	res, err := s.db.NewDelete().Model(profile).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("profile_id", id).Msg("Database error during profile deletion")
		return fmt.Errorf("could not delete profile with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("profile_id", id).Msg("Delete failed: Profile not found at execution time")
		return fmt.Errorf("profile with ID %d not found", id)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name": {DeletedValues: profile.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.PROFILE_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteProfile")
	}

	log.Info().Int("profile_id", id).Msg("Successfully deleted profile")
	return nil
}
