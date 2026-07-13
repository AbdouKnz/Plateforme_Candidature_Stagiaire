package typ

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func TypesRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &TypeService{db}
	handler := NewTypeHandler(service)

	typeGroup := r.Group("/types")
	typeGroup.Use(middleware.AuthMiddleware())
	{
		typeGroup.GET("/", handler.GetAllTypesHandler)

		typeGroup.Use(middleware.PermissionMiddleware(pkg.TYPES_PERMISSIONS))
		{
			typeGroup.POST("/", handler.CreateTypeHandler)
			typeGroup.GET("/:id", handler.GetTypeByIDHandler)
			typeGroup.DELETE("/:id", handler.DeleteTypeHandler)
			typeGroup.PUT("/:id", handler.UpdateTypeHandler)
		}
	}
}
