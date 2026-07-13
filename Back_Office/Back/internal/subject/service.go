package subject

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

type SubjectService struct {
	db *bun.DB
}

func (s *SubjectService) loadRelations(ctx context.Context, subject *domain.Subject) error {
	var techIDs []int
	err := s.db.NewSelect().Model((*domain.SubjectTechnology)(nil)).
		Column("technology_id").
		Where("subject_id = ?", subject.ID).
		Scan(ctx, &techIDs)
	if err != nil {
		return err
	}

	if len(techIDs) > 0 {
		err = s.db.NewSelect().Model(&subject.Technologies).
			Where("id IN (?)", bun.In(techIDs)).Scan(ctx)
		if err != nil {
			return err
		}
	}

	var profIDs []int
	err = s.db.NewSelect().Model((*domain.SubjectProfile)(nil)).
		Column("profile_id").
		Where("subject_id = ?", subject.ID).
		Scan(ctx, &profIDs)
	if err != nil {
		return err
	}

	if len(profIDs) > 0 {
		err = s.db.NewSelect().Model(&subject.Profiles).
			Where("id IN (?)", bun.In(profIDs)).Scan(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *SubjectService) GetAllSubjects(ctx context.Context, params SubjectParams) ([]*domain.Subject, error) {
	log.Info().Msg("Fetching all subjects...")
	var subjects []*domain.Subject

	query := s.db.NewSelect().Model(&subjects)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("sub.name ILIKE ? OR sub.code ILIKE ?", searchPattern, searchPattern)
	}
	if params.Status != nil {
		query = query.Where("sub.status = ?", *params.Status)
	}

	err := query.Order("sub.id ASC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []*domain.Subject{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching subjects")
		return nil, fmt.Errorf("database error: %w", err)
	}

	for _, subj := range subjects {
		if err := s.loadRelations(ctx, subj); err != nil {
			log.Warn().Err(err).Int("subject_id", subj.ID).Msg("Failed to load relations for subject")
		}
	}

	log.Info().Int("count", len(subjects)).Msg("Successfully retrieved subjects")
	return subjects, nil
}

func (s *SubjectService) GetSubjectByID(ctx context.Context, id int) (*domain.Subject, error) {
	log.Info().Int("subject_id", id).Msg("Fetching subject by ID...")

	subject := &domain.Subject{}
	err := s.db.NewSelect().Model(subject).
		Where("sub.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("subject_id", id).Msg("Subject not found")
			return nil, fmt.Errorf("subject with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("subject_id", id).Msg("Database error while fetching subject")
		return nil, fmt.Errorf("could not fetch subject: %w", err)
	}

	if err := s.loadRelations(ctx, subject); err != nil {
		log.Warn().Err(err).Int("subject_id", id).Msg("Failed to load relations for subject")
	}

	log.Info().Int("subject_id", id).Msg("Successfully retrieved subject")
	return subject, nil
}

func (s *SubjectService) CreateSubject(ctx context.Context, subject *domain.Subject, technologyIDs, profileIDs []int) (*domain.Subject, error) {
	log.Info().Str("subject", subject.Name).Msg("Creating a new subject...")
	subject.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	subject.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("could not start transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.NewInsert().Model(subject).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("subject", subject.Name).Msg("Could not create subject")
		return nil, fmt.Errorf("could not create subject: %w", err)
	}

	if err := insertSubjectRelations(ctx, tx, subject.ID, technologyIDs, profileIDs); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("could not commit transaction: %w", err)
	}

	if err := s.loadRelations(ctx, subject); err != nil {
		log.Warn().Err(err).Msg("Could not fetch subject relations after creation")
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Code": {CreatedValues: subject.Code, Changed: true},
			"Name": {CreatedValues: subject.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.SUBJECT_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateSubject")
	}

	log.Info().Str("subject", subject.Name).Msg("Subject created successfully")
	return subject, nil
}

func (s *SubjectService) UpdateSubject(ctx context.Context, id int, request UpdateSubjectRequest) (*domain.Subject, error) {
	log.Info().Int("subject_id", id).Msg("Updating subject...")

	subject, err := s.GetSubjectByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldCode := subject.Code
	oldName := subject.Name
	oldStatus := subject.Status

	if request.Code != "" {
		subject.Code = request.Code
	}
	if request.Name != "" {
		subject.Name = request.Name
	}
	if request.Description != "" {
		subject.Description = request.Description
	}
	if request.PriorityRank != "" {
		subject.PriorityRank = request.PriorityRank
	}
	if request.Status != nil {
		subject.Status = *request.Status
	}

	subject.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("could not start transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.NewUpdate().Model(subject).Where("id = ?", subject.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update subject with ID %d: %w", subject.ID, err)
	}

	if request.TechnologyIDs != nil || request.ProfileIDs != nil {
		if err := replaceSubjectRelations(ctx, tx, subject.ID, request.TechnologyIDs, request.ProfileIDs); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("could not commit transaction: %w", err)
	}

	if err := s.loadRelations(ctx, subject); err != nil {
		log.Warn().Err(err).Msg("Could not fetch subject relations after update")
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Code":   {OldValues: oldCode, NewValues: subject.Code, Changed: oldCode != subject.Code},
			"Name":   {OldValues: oldName, NewValues: subject.Name, Changed: oldName != subject.Name},
			"Status": {OldValues: oldStatus, NewValues: subject.Status, Changed: oldStatus != subject.Status},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.SUBJECT_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateSubject")
	}

	log.Info().Int("subject_id", id).Msg("Successfully updated subject")
	return subject, nil
}

func (s *SubjectService) DeleteSubject(ctx context.Context, id int) error {
	log.Info().Int("subject_id", id).Msg("Attempting to delete subject...")

	subject, err := s.GetSubjectByID(ctx, id)
	if err != nil {
		return err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("could not start transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.NewDelete().Model((*domain.SubjectTechnology)(nil)).Where("subject_id = ?", id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not clean subject_technologies: %w", err)
	}
	_, err = tx.NewDelete().Model((*domain.SubjectProfile)(nil)).Where("subject_id = ?", id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not clean subject_profiles: %w", err)
	}

	res, err := tx.NewDelete().Model(subject).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("subject_id", id).Msg("Database error during subject deletion")
		return fmt.Errorf("could not delete subject with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("subject_id", id).Msg("Delete failed: Subject not found at execution time")
		return fmt.Errorf("subject with ID %d not found", id)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("could not commit transaction: %w", err)
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name": {DeletedValues: subject.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.SUBJECT_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteSubject")
	}

	log.Info().Int("subject_id", id).Msg("Successfully deleted subject")
	return nil
}

// helpers

func insertSubjectRelations(ctx context.Context, tx bun.Tx, subjectID int, technologyIDs, profileIDs []int) error {
	for _, techID := range technologyIDs {
		_, err := tx.NewInsert().Model(&domain.SubjectTechnology{
			SubjectID:    subjectID,
			TechnologyID: techID,
		}).Exec(ctx)
		if err != nil {
			log.Error().Err(err).Int("subject_id", subjectID).Int("technology_id", techID).Msg("Failed to link technology to subject")
			return fmt.Errorf("could not link technology %d: %w", techID, err)
		}
	}

	for _, profID := range profileIDs {
		_, err := tx.NewInsert().Model(&domain.SubjectProfile{
			SubjectID: subjectID,
			ProfileID: profID,
		}).Exec(ctx)
		if err != nil {
			log.Error().Err(err).Int("subject_id", subjectID).Int("profile_id", profID).Msg("Failed to link profile to subject")
			return fmt.Errorf("could not link profile %d: %w", profID, err)
		}
	}

	return nil
}

func replaceSubjectRelations(ctx context.Context, tx bun.Tx, subjectID int, technologyIDs, profileIDs []int) error {
	if technologyIDs != nil {
		_, err := tx.NewDelete().Model((*domain.SubjectTechnology)(nil)).Where("subject_id = ?", subjectID).Exec(ctx)
		if err != nil {
			return fmt.Errorf("could not clear subject_technologies: %w", err)
		}
		if err := insertSubjectRelations(ctx, tx, subjectID, technologyIDs, nil); err != nil {
			return err
		}
	}

	if profileIDs != nil {
		_, err := tx.NewDelete().Model((*domain.SubjectProfile)(nil)).Where("subject_id = ?", subjectID).Exec(ctx)
		if err != nil {
			return fmt.Errorf("could not clear subject_profiles: %w", err)
		}
		if err := insertSubjectRelations(ctx, tx, subjectID, nil, profileIDs); err != nil {
			return err
		}
	}

	return nil
}
