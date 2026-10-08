package email_log

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func EmailLogRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &EmailLogService{db: db}
	handler := NewEmailLogHandler(service)

	emailLogGroup := r.Group("/email-logs")
	emailLogGroup.Use(middleware.AuthMiddleware())
	{
		emailLogGroup.GET("/", handler.GetAllHandler)

		emailLogGroup.POST("/export", handler.ExportHandler)

		emailLogGroup.Use(middleware.PermissionMiddleware(pkg.EMAIL_LOGS_PERMISSIONS))
		{
			emailLogGroup.GET("/:id", handler.GetByIDHandler)
		}
	}
}
