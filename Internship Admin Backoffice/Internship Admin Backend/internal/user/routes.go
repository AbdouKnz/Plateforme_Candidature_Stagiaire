package user

import (
	"astro-backend/internal/audit"
	"astro-backend/internal/role"
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func UsersRoutes(r *gin.RouterGroup, database *bun.DB) {
	audit := audit.NewAuditService(database)
	roleService := role.NewRoleService(database, audit)

	service := NewUserService(database, audit, roleService)
	handler := NewUserHandler(service)

	userGroup := r.Group("/users")
	userGroup.Use(middleware.AuthMiddleware())
	{
		userGroup.POST("/export", handler.ExportUserHandler)
		userGroup.PUT("/:id/password", handler.UpdateUserPasswordHandler)
		userGroup.Use(middleware.PermissionMiddleware(pkg.USERS_PERMISSIONS))
		{
			userGroup.POST("/", handler.CreateUserHandler)
			userGroup.GET("/", handler.GetAllUsersHandler)
			userGroup.GET("/:id", handler.GetUserByIDHandler)
			userGroup.PUT("/:id", handler.UpdateUserHandler)
			userGroup.DELETE("/:id", handler.DeleteUserHandler)
		}
	}
}
