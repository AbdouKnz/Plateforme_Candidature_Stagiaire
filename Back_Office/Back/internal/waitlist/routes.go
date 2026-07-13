package waitlist

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func PublicWaitlistRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewWaitlistService(db)
	handler := NewWaitlistHandler(service)

	r.POST("/waitlist", handler.SubscribeHandler)
}

func AdminWaitlistRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewWaitlistService(db)
	handler := NewWaitlistHandler(service)

	group := r.Group("/waitlist")
	group.Use(middleware.AuthMiddleware())
	{
		group.GET("/", handler.ListHandler)
		group.GET("/stats", handler.StatsHandler)

		group.Use(middleware.PermissionMiddleware(pkg.WAITLIST_PERMISSIONS))
		{
			group.POST("/process", handler.ProcessHandler)
		}
	}
}
