package db

import (
	"astro-backend/config"
	"astro-backend/domain"

	"git.asteroidea.co/go-packages/astrogo/pkg/astrodb"
	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

var dbModels = []interface{}{
	(*domain.AuditLog)(nil),
	(*domain.ModulePermissions)(nil),
	(*domain.Role)(nil),
	(*domain.User)(nil),
	(*domain.Setting)(nil),
	(*domain.Degree)(nil),
	(*domain.Technology)(nil),
	(*domain.Profile)(nil),
	(*domain.Duration)(nil),
	(*domain.Type)(nil),
	(*domain.SubjectTechnology)(nil),
	(*domain.SubjectProfile)(nil),
	(*domain.Subject)(nil),
	(*domain.Candidature)(nil),
	(*domain.EmailTemplate)(nil),
	(*domain.EmailLog)(nil),

}

func DatabaseManager() (*bun.DB, error) {

	mgr, err := astrodb.New(astrodb.Config{
		Driver:     astrodb.DriverPostgres,
		Host:       config.Configvar.Database.Host,
		Port:       config.Configvar.Database.Port,
		User:       config.Configvar.Database.User,
		Password:   config.Configvar.Database.Password,
		Name:       config.Configvar.Database.Name,
		SSLMode:    config.Configvar.Database.SSLMode,
		AutoCreate: true,
		Models:     dbModels,
		//Pool:       astrodb.PoolConfig{MaxOpenConns: 10, MaxIdleConns: 10},
		// Pool is optional; zero values use sensible defaults:
	})
	if err != nil {
		panic(err)
	}

	/* ------------------- Add Default Data ------------------*/
	log.Info().Msg("--------- Adding Default Data --------")
	err = AddDefaultData(mgr.DB)
	if err != nil {
		return nil, err
	}

	/* ------------------- Add Audit Triggers ------------------
	migrator := astroaudit.NewMigrator(mgr.DB)
	if err := migrator.RunMigrations(context.Background(), dbModels, config.Configvar.Database.Name, config.Configvar.General.TZ); err != nil {
		return nil, err
	}
	*/
	log.Info().Str("Database", config.Configvar.Database.Name).Str("Url", config.Configvar.Database.Host+":"+config.Configvar.Database.Port).Msg(" ==== Connected to  ====")

	return mgr.DB, nil
}
