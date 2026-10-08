package router

import (
	"front-office-backend/internal/public"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func InitRouter(r *gin.Engine, database *bun.DB) {
	api := r.Group("/api")

	api.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": 200, "message": "Front Office API"})
	})

	publicGroup := api.Group("/public")
	public.PublicRoutes(publicGroup, database)
}
