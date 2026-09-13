package db

import (
	"context"
	"database/sql"
	"fmt"

	"front-office-backend/domain"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

var dbModels = []interface{}{
	(*domain.Degree)(nil),
	(*domain.Technology)(nil),
	(*domain.Duration)(nil),
	(*domain.Type)(nil),
	(*domain.SubjectTechnology)(nil),
	(*domain.Subject)(nil),
	(*domain.Candidature)(nil),
	(*domain.EmailTemplate)(nil),
	(*domain.WaitlistSubscriber)(nil),
}

func DatabaseManager(dsn string) (*bun.DB, error) {
	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
	db := bun.NewDB(sqldb, pgdialect.New())

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	for _, model := range dbModels {
		if _, err := db.NewCreateTable().Model(model).IfNotExists().Exec(context.Background()); err != nil {
			log.Warn().Err(err).Msg("Table may already exist (this is fine)")
		}
	}

	if err := ensureCandidatureNameColumns(context.Background(), db); err != nil {
		log.Warn().Err(err).Msg("Could not ensure candidature name columns (this is fine if migration runs from back office)")
	}

	if err := ensureCandidatureEmailSubjectUnique(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Could not ensure candidature email+subject uniqueness")
		return nil, fmt.Errorf("candidature uniqueness migration failed: %w", err)
	}

	log.Info().Msg("Database connected and tables synced")
	return db, nil
}

// ensureCandidatureEmailSubjectUnique guarantees one application per
// (email, subject code): it backfills missing subject codes from the subjects
// table, removes pre-existing duplicates (keeping the earliest row per group)
// and enforces a composite unique index on
// (LOWER(TRIM(email1)), UPPER(TRIM(subject_code))) so near-simultaneous
// submits (double-click, two tabs) cannot both commit. Email is matched
// case-insensitively; the subject CODE (not the editable name) is the stable
// subject identity. Rows without a code are excluded from the index so
// code-less (e.g. admin-created) rows can never falsely collide.
func ensureCandidatureEmailSubjectUnique(ctx context.Context, db *bun.DB) error {
	if _, err := db.ExecContext(ctx, `
		ALTER TABLE candidature
			ADD COLUMN IF NOT EXISTS subject_code VARCHAR(255) DEFAULT ''
	`); err != nil {
		return err
	}

	if _, err := db.ExecContext(ctx, `
		UPDATE candidature c SET subject_code = s.code
		FROM subject s
		WHERE (c.subject_code IS NULL OR c.subject_code = '')
		  AND s.name = TRIM(c.subject_name)
	`); err != nil {
		return err
	}

	res, err := db.ExecContext(ctx, `
		DELETE FROM candidature a USING candidature b
		WHERE a.id > b.id
		  AND LOWER(TRIM(a.email1)) = LOWER(TRIM(b.email1))
		  AND UPPER(TRIM(a.subject_code)) = UPPER(TRIM(b.subject_code))
		  AND TRIM(a.subject_code) <> ''
	`)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n > 0 {
		log.Info().Int64("removed", n).Msg("Removed duplicate candidatures (kept earliest per email+subject code)")
	}

	if _, err := db.ExecContext(ctx, `DROP INDEX IF EXISTS uq_candidature_email_subject`); err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, `
		CREATE UNIQUE INDEX IF NOT EXISTS uq_candidature_email_subject_code
		ON candidature (LOWER(TRIM(email1)), UPPER(TRIM(subject_code)))
		WHERE TRIM(subject_code) <> ''
	`)
	return err
}

func ensureCandidatureNameColumns(ctx context.Context, db *bun.DB) error {
	_, err := db.ExecContext(ctx, `
		ALTER TABLE candidature
			ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS first_name2 VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS last_name2 VARCHAR(255) DEFAULT ''
	`)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, `
		UPDATE candidature
		SET first_name = split_part(full_name, ' ', 1),
		    last_name  = CASE
				WHEN full_name LIKE '% %' THEN split_part(full_name, ' ', 2) || CASE WHEN full_name LIKE '% % %' THEN ' ' || substring(full_name from position(' ' in full_name) + 1) ELSE '' END
				ELSE full_name
			END
		WHERE (first_name = '' OR last_name = '') AND full_name <> ''
	`)
	if err != nil {
		return err
	}

	return nil
}
