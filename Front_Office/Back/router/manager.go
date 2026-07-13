package router

import (
	"fmt"

	"front-office-backend/config"
	"front-office-backend/middleware"
	"front-office-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

func RouterManager(db *bun.DB) {
	r := gin.New()

	if config.Configvar.Server.GinMode == "debug" {
		fmt.Printf("Running in debug mode\n")
		gin.SetMode(gin.DebugMode)
	} else {
		fmt.Printf("Running in release mode\n")
		gin.SetMode(gin.ReleaseMode)
	}

	r.Use(
		middleware.CORSMiddleware(),
		middleware.LoggingMiddleware(),
	)

	r.NoRoute(func(c *gin.Context) { pkg.HttpError(c, 404, "Route not found") })

	r.Static("/uploads", "./uploads")

	InitRouter(r, db)

	host := fmt.Sprintf("0.0.0.0:%d", config.Configvar.Server.Port)
	log.Info().Msgf("Front Office server running on %s", host)

	if err := r.Run(host); err != nil {
		log.Err(err).Msgf("Failed to run server: %v", err)
	}
}
