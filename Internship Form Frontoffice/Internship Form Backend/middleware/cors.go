package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func CORSMiddleware() gin.HandlerFunc {
	log.Info().Msg("CORS middleware initialized")

	config := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Accept-Language"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: false,
	}

	return cors.New(config)
}

func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Msg("REQUEST")
		c.Next()
	}
}
