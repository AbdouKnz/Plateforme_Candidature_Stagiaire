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
	toggleGroup.Use(middleware.AuthMiddleware(), middleware.PermissionMiddleware(pkg.FRONT_OFFICE_MESSAGES))
	{
		toggleGroup.PUT("/toggle", handler.ToggleFrontOfficeHandler)
	}
}

func PublicFrontOfficeRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewFrontOfficeService(db)
	handler := NewFrontOfficeHandler(service)

	r.GET("/front-office/status", handler.GetFrontOfficeStatusHandler)
}
