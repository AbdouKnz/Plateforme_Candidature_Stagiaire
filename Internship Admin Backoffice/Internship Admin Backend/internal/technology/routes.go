package technology

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func TechnologiesRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &TechnologyService{db}
	handler := NewTechnologyHandler(service)

	technologyGroup := r.Group("/technologies")
	technologyGroup.Use(middleware.AuthMiddleware())
	// Consolidated Settings permission: GET requires "view" or higher,
	// POST/PUT/DELETE require "edit" (enforced via the settings mask).
	technologyGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		technologyGroup.GET("/", handler.GetAllTechnologiesHandler)
		technologyGroup.POST("/", handler.CreateTechnologyHandler)
		technologyGroup.GET("/:id", handler.GetTechnologyByIDHandler)
		technologyGroup.DELETE("/:id", handler.DeleteTechnologyHandler)
		technologyGroup.PUT("/:id", handler.UpdateTechnologyHandler)
	}
}
