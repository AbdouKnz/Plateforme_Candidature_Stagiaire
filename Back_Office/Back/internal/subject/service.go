package subject

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/driver/pgdriver"
)

type SubjectService struct {
	db *bun.DB
}

// Sentinel errors so handlers can map duplicates to 400 with a clear message.
// Code and Name are each unique on their own — never checked as a pair.
var (
	ErrSubjectCodeExists = errors.New("subject_code_exists")
	ErrSubjectNameExists = errors.New("subject_name_exists")
)

// subjectCodeExists reports whether another subject already uses code.
// excludeID is skipped (use 0 on create).
func (s *SubjectService) subjectCodeExists(ctx context.Context, code string, excludeID int) (bool, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return false, nil
	}
	q := s.db.NewSelect().Model((*domain.Subject)(nil)).Where("code = ?", code)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	return q.Exists(ctx)
}

// subjectNameExists reports whether another subject already uses name.
// excludeID is skipped (use 0 on create).
func (s *SubjectService) subjectNameExists(ctx context.Context, name string, excludeID int) (bool, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return false, nil
	}
	q := s.db.NewSelect().Model((*domain.Subject)(nil)).Where("name = ?", name)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	return q.Exists(ctx)
}

// mapUniqueViolation converts a Postgres unique-violation into the matching
// sentinel error by inspecting the constraint / detail message.
func mapUniqueViolation(err error, code, name string) error {
	var pgErr pgdriver.Error
	if !errors.As(err, &pgErr) {
		return fmt.Errorf("could not create subject: %w", err)
	}
	if pgErr.Field('C') != "23505" {
		return fmt.Errorf("could not create subject: %w", err)
	}
	msg := strings.ToLower(pgErr.Error() + " " + pgErr.Field('M') + " " + pgErr.Field('n') + " " + pgErr.Field('D'))
	switch {
	case strings.Contains(msg, "name"):
		log.Warn().Str("name", name).Msg("Duplicate subject name")
		return ErrSubjectNameExists
	default:
		// Anything else on this table is treated as a code conflict
		// (code has the UNIQUE constraint; name check above catches name).
		log.Warn().Str("code", code).Msg("Duplicate subject code")
		return ErrSubjectCodeExists
	}
}

func (s *SubjectService) loadRelations(ctx context.Context, subject *domain.Subject) error {
	if subject.DurationID != nil {
		var duration domain.Duration
		err := s.db.NewSelect().Model((*domain.Duration)(nil)).
			Where("id = ?", *subject.DurationID).
			Scan(ctx, &duration)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		if err == nil {
			subject.Duration = &duration
		}
	}

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

func (s *SubjectService) ExportSubjects(ctx context.Context, params SubjectParams) (*export.ExportOptions, error) {
	log.Info().Str("type", params.FileType).Msg("Exporting subjects data")

	subjects, err := s.GetAllSubjects(ctx, params)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch subjects for export")
		return nil, fmt.Errorf("failed to fetch subjects: %w", err)
	}

	headers := []string{"Code", "Name", "Profiles", "Period"}
	if params.FileType == "excel" {
		headers = []string{"code", "name", "profiles", "period"}
	}
	widths := []float64{40, 110, 47, 80}

	if len(subjects) == 0 {
		log.Warn().Msg("No subjects found matching criteria")
		return &export.ExportOptions{
			TableOrientation: "L",
			Data:             [][]string{},
			Widths:           widths,
			FileName:         "Subjects",
			Title:            "No subjects data",
			Headers:          headers,
		}, nil
	}

	var data [][]string
	for _, subj := range subjects {
		period := ""
		if subj.Duration != nil {
			period = subj.Duration.Name
		}

		profileNames := make([]string, 0, len(subj.Profiles))
		for _, prof := range subj.Profiles {
			if prof != nil {
				profileNames = append(profileNames, prof.Name)
			}
		}

		row := []string{
			subj.Code,
			subj.Name,
			strings.Join(profileNames, ", "),
			period,
		}
		data = append(data, row)
	}

	return &export.ExportOptions{
		TableOrientation: "L",
		Data:             data,
		Widths:           widths,
		FileName:         "Subjects",
		Title:            "Subjects Report",
		Headers:          headers,
	}, nil
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

	// Code alone must be unique.
	codeTaken, err := s.subjectCodeExists(ctx, subject.Code, 0)
	if err != nil {
		return nil, fmt.Errorf("could not check subject code uniqueness: %w", err)
	}
	if codeTaken {
		log.Warn().Str("code", subject.Code).Msg("Duplicate subject code")
		return nil, ErrSubjectCodeExists
	}

	// Name alone must be unique (independent from code).
	nameTaken, err := s.subjectNameExists(ctx, subject.Name, 0)
	if err != nil {
		return nil, fmt.Errorf("could not check subject name uniqueness: %w", err)
	}
	if nameTaken {
		log.Warn().Str("name", subject.Name).Msg("Duplicate subject name")
		return nil, ErrSubjectNameExists
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("could not start transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.NewInsert().Model(subject).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("subject", subject.Name).Msg("Could not create subject")
		// Race-condition safety net: map DB unique violations to the same sentinels.
		return nil, mapUniqueViolation(err, subject.Code, subject.Name)
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

	// Code alone must be unique (ignore the current row).
	if request.Code != "" && strings.TrimSpace(request.Code) != subject.Code {
		codeTaken, err := s.subjectCodeExists(ctx, request.Code, id)
		if err != nil {
			return nil, fmt.Errorf("could not check subject code uniqueness: %w", err)
		}
		if codeTaken {
			log.Warn().Str("code", request.Code).Int("subject_id", id).Msg("Duplicate subject code")
			return nil, ErrSubjectCodeExists
		}
		subject.Code = request.Code
	}
	// Name alone must be unique (ignore the current row, independent from code).
	if request.Name != "" && strings.TrimSpace(request.Name) != subject.Name {
		nameTaken, err := s.subjectNameExists(ctx, request.Name, id)
		if err != nil {
			return nil, fmt.Errorf("could not check subject name uniqueness: %w", err)
		}
		if nameTaken {
			log.Warn().Str("name", request.Name).Int("subject_id", id).Msg("Duplicate subject name")
			return nil, ErrSubjectNameExists
		}
		subject.Name = request.Name
	}
	if request.Description != "" {
		subject.Description = request.Description
	}
	if request.ImagePath != nil {
		subject.ImagePath = *request.ImagePath
	}
	if request.Status != nil {
		subject.Status = *request.Status
	}
	if request.OnlineQuizLink != nil {
		subject.OnlineQuizLink = *request.OnlineQuizLink
	}
	if request.OnlineMeetingLink != nil {
		subject.OnlineMeetingLink = *request.OnlineMeetingLink
	}
	if request.F2FMeetingLink != nil {
		subject.F2FMeetingLink = *request.F2FMeetingLink
	}
	if request.DurationID != nil {
		subject.DurationID = request.DurationID
	}

	subject.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("could not start transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.NewUpdate().Model(subject).Where("id = ?", subject.ID).Exec(ctx)
	if err != nil {
		// Race-condition safety net: map DB unique violations to the same sentinels.
		if errors.Is(mapUniqueViolation(err, subject.Code, subject.Name), ErrSubjectCodeExists) {
			return nil, ErrSubjectCodeExists
		}
		if errors.Is(mapUniqueViolation(err, subject.Code, subject.Name), ErrSubjectNameExists) {
			return nil, ErrSubjectNameExists
		}
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
