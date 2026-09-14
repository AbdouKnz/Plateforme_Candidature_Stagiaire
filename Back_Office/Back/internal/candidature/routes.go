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
		candidatureGroup.GET("/recent", handler.GetRecentHandler)
		candidatureGroup.GET("/pipeline", handler.GetPipelineHandler)
		candidatureGroup.GET("/rejection-reasons", handler.GetRejectionReasonsHandler)

		// Session reset endpoints - strictly restricted to Super Admin only
		candidatureGroup.POST("/reset/prepare", middleware.AdminMiddleware(), handler.ResetPrepareHandler)
		candidatureGroup.POST("/reset/confirm", middleware.AdminMiddleware(), handler.ResetConfirmHandler)

		candidatureGroup.Use(middleware.PermissionMiddleware(pkg.CANDIDATURES_PERMISSIONS))
		{
			candidatureGroup.POST("/", handler.CreateHandler)
			candidatureGroup.POST("/export", handler.ExportHandler)
			candidatureGroup.POST("/bulk-reject", handler.BulkRejectHandler)
			candidatureGroup.POST("/bulk-accept", handler.BulkAcceptHandler)
			candidatureGroup.GET("/:id", handler.GetByIDHandler)
			candidatureGroup.GET("/:id/email-preview", handler.GetEmailPreviewHandler)
			candidatureGroup.PUT("/:id", handler.UpdateHandler)
			candidatureGroup.DELETE("/:id", handler.DeleteHandler)
			candidatureGroup.POST("/:id/send-email", handler.SendEmailHandler)
		}
	}
}
