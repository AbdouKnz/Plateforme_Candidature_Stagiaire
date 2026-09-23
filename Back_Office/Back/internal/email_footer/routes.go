package email_footer

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func EmailFooterRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewEmailFooterService(db)
	handler := NewEmailFooterHandler(service)

	emailFooterGroup := r.Group("/email-footer")
	emailFooterGroup.Use(middleware.AuthMiddleware())
	// Consolidated Settings permission: GET requires "view" or higher,
	// PUT requires "edit" (enforced via the settings mask).
	emailFooterGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		emailFooterGroup.GET("/", handler.GetHandler)
		emailFooterGroup.PUT("/", handler.UpdateHandler)
	}
}
