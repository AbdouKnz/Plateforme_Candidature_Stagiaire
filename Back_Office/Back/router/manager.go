package router

import (
	"astro-backend/config"
	"astro-backend/middleware"
	"astro-backend/pkg"
	"fmt"

	_ "astro-backend/docs"

	"github.com/rs/zerolog/log"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func RouterManager(db *bun.DB) {

	// init gin router
	r := gin.New()

	// set gin mode
	if config.Configvar.Server.GinMode == "debug" {
		fmt.Printf("Running in debug mode\n")
		gin.SetMode(gin.DebugMode)
	} else {
		fmt.Printf("Running in release mode\n")
		gin.SetMode(gin.ReleaseMode)
	}

	// middlewares
	r.Use(
		middleware.CORSMiddleware(),
		middleware.LoggingMiddleware(),
		middleware.RequestIDGeneratorMiddleware(),
		middleware.LanguageMiddleware(),
	)

	// Swagger
	swaggerURL := fmt.Sprintf("http://localhost:%d/api/docs/index.html", config.Configvar.Server.Port)

	if config.Configvar.Server.SwaggerEnabled {
		log.Info().Str("swagger_url", swaggerURL).Msg("Swagger documentation is enabled")
		r.GET("/api/docs", func(c *gin.Context) { c.Redirect(302, "/api/docs/index.html") })
		r.GET("/api/docs/*.any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// Static files for uploads
	r.Static("/uploads", "./uploads")

	// Routes
	r.GET("/api", func(c *gin.Context) { pkg.OK(c, nil, nil) })            // OK Route
	r.NoRoute(func(c *gin.Context) { pkg.NotFound(c, "Route not found") }) // No Route

	// Routes Init
	InitBackofficeRouter(r, db) // init astro routes

	var host = fmt.Sprintf("0.0.0.0:%d", config.Configvar.Server.Port)
	log.Info().Msgf("-------------------------------- # Server running on %s # ------------------------------", host)

	// Start server
	if err := r.Run(host); err != nil {
		log.Err(err).Msgf("Failed to run server: %v", err)
	}

}
