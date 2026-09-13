package degree

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func DegreesRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &DegreeService{db}
	handler := NewDegreeHandler(service)

	degreeGroup := r.Group("/degrees")
	degreeGroup.Use(middleware.AuthMiddleware())
	// Consolidated Settings permission: GET requires "view" or higher,
	// POST/PUT/DELETE require "edit" (enforced via the settings mask).
	degreeGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		degreeGroup.GET("/", handler.GetAllDegreesHandler)
		degreeGroup.POST("/", handler.CreateDegreeHandler)
		degreeGroup.GET("/:id", handler.GetDegreeByIDHandler)
		degreeGroup.DELETE("/:id", handler.DeleteDegreeHandler)
		degreeGroup.PUT("/:id", handler.UpdateDegreeHandler)
	}
}
