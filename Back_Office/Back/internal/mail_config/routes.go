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
	{
		mailConfigGroup.GET("/", handler.GetHandler)

		mailConfigGroup.Use(middleware.PermissionMiddleware(pkg.MAIL_CONFIG_PERMISSIONS))
		{
			mailConfigGroup.PUT("/", handler.UpdateHandler)
			mailConfigGroup.POST("/test", handler.TestHandler)
		}
	}
}