package email_template

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func EmailTemplateRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &EmailTemplateService{db: db}
	handler := NewEmailTemplateHandler(service)

	emailTemplateGroup := r.Group("/email-templates")
	emailTemplateGroup.Use(middleware.AuthMiddleware())
	// Consolidated Settings permission: GET requires "view" or higher,
	// POST/PUT/DELETE require "edit" (enforced via the settings mask).
	emailTemplateGroup.Use(middleware.PermissionMiddleware(pkg.SETTINGS_PERMISSIONS))
	{
		emailTemplateGroup.GET("/", handler.GetAllHandler)
		emailTemplateGroup.POST("/", handler.CreateHandler)
		emailTemplateGroup.GET("/:id", handler.GetByIDHandler)
		emailTemplateGroup.PUT("/:id", handler.UpdateHandler)
		emailTemplateGroup.DELETE("/:id", handler.DeleteHandler)
	}
}
