package audit

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func AuditRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &AuditService{db}
	handler := NewAuditHandler(service)

	auditGroup := r.Group("/audits")
	auditGroup.Use(middleware.AuthMiddleware())
	{
		auditGroup.POST("/export", handler.ExportAuditHandler)
		auditGroup.Use(middleware.PermissionMiddleware(pkg.AUDITS_PERMISSIONS))
		{
			auditGroup.GET("/", handler.GetAuditsHandler)
			auditGroup.GET("/:id", handler.GetAuditByIDHandler)
		}
	}
}
