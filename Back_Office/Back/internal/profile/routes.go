package profile

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func ProfilesRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &ProfileService{db}
	handler := NewProfileHandler(service)

	profileGroup := r.Group("/profiles")
	profileGroup.Use(middleware.AuthMiddleware())
	{
		profileGroup.GET("/", handler.GetAllProfilesHandler)

		profileGroup.Use(middleware.PermissionMiddleware(pkg.PROFILES_PERMISSIONS))
		{
			profileGroup.POST("/", handler.CreateProfileHandler)
			profileGroup.GET("/:id", handler.GetProfileByIDHandler)
			profileGroup.DELETE("/:id", handler.DeleteProfileHandler)
			profileGroup.PUT("/:id", handler.UpdateProfileHandler)
		}
	}
}
