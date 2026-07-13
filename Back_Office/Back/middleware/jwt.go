package middleware

import (
	"astro-backend/config"
	"astro-backend/domain"
	"errors"
	"fmt"
	"strings"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// getJWTSecret returns the JWT secret from config dynamically to ensure consistency
func getJWTSecret() []byte {
	return []byte(config.Configvar.JWT.SecretKey)
}

func GenerateToken(userID int, firstName, lastName, role string, role_id int, permissions map[string]string) (string, error) {
	claims := domain.Claims{
		UserID:      userID,
		FirstName:   firstName,
		LastName:    lastName,
		Role:        role,
		RoleID:      role_id,
		Permissions: permissions,
		TokenType:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(config.Configvar.JWT.ExpirationTime) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// New function
func GenerateRefreshToken(userID int, firstName, lastName, role string, role_id int, permissions map[string]string) (string, error) {
	claims := domain.Claims{
		UserID:      userID,
		FirstName:   firstName,
		LastName:    lastName,
		Role:        role,
		RoleID:      role_id,
		Permissions: permissions,
		TokenType:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(config.Configvar.JWT.RefreshExpirationTime) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

func ValidateToken(tokenString string) (*domain.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &domain.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*domain.Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// New function
func ValidateRefreshToken(tokenString string) (*domain.Claims, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != "refresh" {
		return nil, errors.New("invalid token type: expected refresh token")
	}

	return claims, nil
}

func extractBearerToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("authorization header missing")
	}

	//	log.Trace().Str("authHeader", authHeader).Msg("Extracting Bearer token from Authorization header")
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", fmt.Errorf("invalid authorization header format")
	}

	return parts[1], nil
}

func validateJwtToken(tokenString string) (*domain.Claims, error) {
	claims := &domain.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

func ExtractAndValidateToken(c *gin.Context) (*domain.Claims, error) {

	tokenString, err := extractBearerToken(c)
	if err != nil {
		return nil, fmt.Errorf("token extraction failed: %w", err)
	}

	claims, err := validateJwtToken(tokenString)
	if err != nil {
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	return claims, nil
}
