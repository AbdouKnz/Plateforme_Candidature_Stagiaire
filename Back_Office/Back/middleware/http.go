package middleware

import (
	"astro-backend/config"
	"astro-backend/pkg"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/ulule/limiter/v3"
	ginMiddleware "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if config.Configvar.Server.FullRequestLogging {
			log.Info().
				Str("method", c.Request.Method).
				Str("path", c.Request.URL.Path).
				Interface("headers", c.Request.Header).
				Msg("════  FULL REQUEST DETAILS ════")
		} else {
			log.Info().
				Str("method", c.Request.Method).
				Str("path", c.Request.URL.Path).
				Msg("════ REQUEST DETAILS  ════  ")
		}
		c.Next()
	}
}

func RateLimitMiddleware() gin.HandlerFunc {
	// Define a rate limit of 100 requests per minute
	rate := limiter.Rate{
		Period: 1 * time.Minute,
		Limit:  100,
	}

	// Use an in-memory store for rate limiting
	store := memory.NewStore()

	// Create a new rate limiter
	limiterInstance := limiter.New(store, rate)

	// Return the Gin middleware
	return ginMiddleware.NewMiddleware(limiterInstance)
}

// GenerateUniqueHex creates a random 16-character hexadecimal string
func GenerateUniqueHex() string {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		log.Error().Err(err).Msg("Failed to generate random bytes")
		return ""
	}
	return hex.EncodeToString(bytes)
}

// RequestIDGeneratorMiddleware generates a unique request ID and extracts user info from JWT
func RequestIDGeneratorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID already exists
		requestID := c.Request.Header.Get(pkg.REQUEST_HEADER)
		if requestID == "" {
			requestID = GenerateUniqueHex()
			c.Request.Header.Set(pkg.REQUEST_HEADER, requestID)
		}

		// Set request ID in response header and context
		c.Header(pkg.REQUEST_HEADER, requestID)
		c.Set(pkg.REQUEST_HEADER, requestID)
		c.Next()
	}
}
