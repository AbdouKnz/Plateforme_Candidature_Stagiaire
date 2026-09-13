package front_office

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func FrontOfficeRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewFrontOfficeService(db)
	handler := NewFrontOfficeHandler(service)

	toggleGroup := r.Group("/front-office")
	// Consolidated Settings permission: PUT requires "edit" (enforced via the settings mask).
	toggleGroup.Use(middleware.AuthMiddleware(), middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		toggleGroup.PUT("/toggle", handler.ToggleFrontOfficeHandler)
	}
}

func PublicFrontOfficeRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewFrontOfficeService(db)
	handler := NewFrontOfficeHandler(service)

	r.GET("/front-office/status", handler.GetFrontOfficeStatusHandler)
}
