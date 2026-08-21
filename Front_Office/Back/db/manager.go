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

	log.Info().Msg("Database connected and tables synced")
	return db, nil
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
