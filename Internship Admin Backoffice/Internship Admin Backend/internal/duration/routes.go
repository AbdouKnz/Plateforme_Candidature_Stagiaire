package duration

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func DurationsRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &DurationService{db}
	handler := NewDurationHandler(service)

	durationGroup := r.Group("/durations")
	durationGroup.Use(middleware.AuthMiddleware())
	// Consolidated Settings permission: GET requires "view" or higher,
	// POST/PUT/DELETE require "edit" (enforced via the settings mask).
	durationGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		durationGroup.GET("/", handler.GetAllDurationsHandler)
		durationGroup.POST("/", handler.CreateDurationHandler)
		durationGroup.GET("/:id", handler.GetDurationByIDHandler)
		durationGroup.DELETE("/:id", handler.DeleteDurationHandler)
		durationGroup.PUT("/:id", handler.UpdateDurationHandler)
	}
}
