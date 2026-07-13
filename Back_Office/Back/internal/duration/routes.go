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
	{
		durationGroup.GET("/", handler.GetAllDurationsHandler)

		durationGroup.Use(middleware.PermissionMiddleware(pkg.DURATIONS_PERMISSIONS))
		{
			durationGroup.POST("/", handler.CreateDurationHandler)
			durationGroup.GET("/:id", handler.GetDurationByIDHandler)
			durationGroup.DELETE("/:id", handler.DeleteDurationHandler)
			durationGroup.PUT("/:id", handler.UpdateDurationHandler)
		}
	}
}
