package candidature

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func CandidatureRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &CandidatureService{db: db}
	handler := NewCandidatureHandler(service)

	candidatureGroup := r.Group("/candidatures")
	candidatureGroup.Use(middleware.AuthMiddleware())
	{
		candidatureGroup.GET("/", handler.GetAllHandler)

		candidatureGroup.Use(middleware.PermissionMiddleware(pkg.CANDIDATURES_PERMISSIONS))
		{
			candidatureGroup.POST("/", handler.CreateHandler)
			candidatureGroup.POST("/export", handler.ExportHandler)
			candidatureGroup.GET("/:id", handler.GetByIDHandler)
			candidatureGroup.GET("/:id/email-preview", handler.GetEmailPreviewHandler)
			candidatureGroup.PUT("/:id", handler.UpdateHandler)
			candidatureGroup.DELETE("/:id", handler.DeleteHandler)
			candidatureGroup.POST("/:id/send-email", handler.SendEmailHandler)
		}
	}
}
