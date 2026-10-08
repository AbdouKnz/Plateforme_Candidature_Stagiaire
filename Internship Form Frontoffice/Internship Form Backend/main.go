package main

import (
	"fmt"

	"front-office-backend/config"
	"front-office-backend/db"
	"front-office-backend/router"

	"github.com/rs/zerolog/log"
)

func init() {
	config.LoadConfig()
	config.InitLogger()
}

func main() {
	log.Info().Msg("Starting Front Office Backend...")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		config.Configvar.Database.User,
		config.Configvar.Database.Password,
		config.Configvar.Database.Host,
		config.Configvar.Database.Port,
		config.Configvar.Database.Name,
		config.Configvar.Database.SSLMode,
	)

	db, err := db.DatabaseManager(dsn)
	if err != nil {
		log.Error().Msg("Failed to connect to database: " + err.Error())
		return
	}
	defer db.Close()

	router.RouterManager(db)
}
