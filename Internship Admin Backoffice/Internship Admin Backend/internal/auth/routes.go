package auth

import (
	"astro-backend/internal/audit"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func AuthRoutes(protected *gin.RouterGroup, engine *gin.Engine, db *bun.DB) {

	audit := audit.NewAuditService(db)
	service := NewAuthService(db, audit)
	handler := NewAuthHandler(service)

	engine.POST("/api/auth/login", handler.LoginHandler)

	authGroup := protected.Group("/auth")
	{
		authGroup.POST("/refresh-token", handler.RefreshTokenHandler)
		authGroup.POST("/logout", handler.LogoutHandler)

	}
}
