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

	log.Info().Msg("Database connected and tables synced")
	return db, nil
}
