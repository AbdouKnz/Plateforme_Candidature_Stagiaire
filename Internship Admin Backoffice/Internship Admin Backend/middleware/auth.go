package middleware

import (
	"astro-backend/domain"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Warn().Msg("Authorization header is missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			log.Warn().Msg("Invalid authorization header format")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid authorization header"})
			return
		}

		claims, err := ValidateToken(tokenParts[1])
		if err != nil {
			log.Warn().Err(err).Msg("Token validation failed")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		ctx := SetActorToContext(c.Request.Context(), claims)
		c.Request = c.Request.WithContext(ctx)
		c.Set("claims", claims)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "Super Admin" {
			log.Warn().Msg("Access denied for non-admin user")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			return
		}

		c.Next()
	}
}

func PermissionMiddleware(permissionTypes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("claims")
		if !exists {
			log.Warn().Msg("No claims found in context")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not authorized"})
			return
		}

		method := c.Request.Method
		var permissionIndex int
		switch method {
		case "GET":
			permissionIndex = 0
		case "POST":
			permissionIndex = 1
		case "PUT":
			permissionIndex = 2
		case "DELETE":
			permissionIndex = 3
		case "SPECIAL":
			permissionIndex = 4
		default:
			c.AbortWithStatusJSON(http.StatusMethodNotAllowed, gin.H{"error": "method not allowed"})
			return
		}

		claimsStruct, ok := claims.(*domain.Claims)
		if !ok {
			log.Warn().Msg("Failed to cast claims")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}
		for _, permType := range permissionTypes {
			permissions, exists := claimsStruct.Permissions[permType]
			if exists && string(permissions[permissionIndex]) != "0" {
				c.Next()
				return
			}
		}

		log.Warn().Strs("required", permissionTypes).Msg("User lacks required permissions")
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
	}
}
