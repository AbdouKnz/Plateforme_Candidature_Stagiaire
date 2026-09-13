package mail_config

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func MailConfigRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewMailConfigService(db)
	handler := NewMailConfigHandler(service)

	mailConfigGroup := r.Group("/mail-config")
	mailConfigGroup.Use(middleware.AuthMiddleware())
	// Consolidated Settings permission: GET requires "view" or higher,
	// PUT/POST require "edit" (enforced via the settings mask).
	mailConfigGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		mailConfigGroup.GET("/", handler.GetHandler)
		mailConfigGroup.PUT("/", handler.UpdateHandler)
		mailConfigGroup.POST("/test", handler.TestHandler)
	}
}