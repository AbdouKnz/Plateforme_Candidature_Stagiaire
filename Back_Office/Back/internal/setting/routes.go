package setting

import (
	"astro-backend/internal/audit"
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SettingsRoutes(r *gin.RouterGroup, db *bun.DB) {
	audit := audit.NewAuditService(db)
	service := NewSettingService(db, audit)
	handler := NewSettingHandler(service)

	settingsGroup := r.Group("/settings")
	settingsGroup.Use(middleware.AuthMiddleware())
	{
		settingsGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
		{
			settingsGroup.GET("/", handler.GetSettingsHandler)
			settingsGroup.POST("/", handler.CreateSettingHandler)
			settingsGroup.PUT("/:group/:key", handler.UpdateSettingHandler)

		}
	}
}
