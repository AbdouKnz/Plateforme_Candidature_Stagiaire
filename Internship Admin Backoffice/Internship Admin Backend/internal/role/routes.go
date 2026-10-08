package role

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func RolesRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &RoleService{db}
	handler := NewRoleHandler(service)

	roleGroup := r.Group("/roles")
	roleGroup.Use(middleware.AuthMiddleware())
	{
		roleGroup.GET("/", handler.GetAllRolesHandler)

		roleGroup.Use(middleware.PermissionMiddleware(pkg.ROLES_PERMISSIONS))
		{
			roleGroup.POST("/", handler.CreateRoleHandler)
			roleGroup.GET("/:id", handler.GetRoleByIDHandler)
			roleGroup.DELETE("/:id", handler.DeleteRoleHandler)
			roleGroup.PUT("/reassign_role", handler.ReassignRoleHandler)
			roleGroup.PUT("/:id", handler.UpdateRoleHandler)

		}
	}
}
