package domain

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	UserID      int               `json:"user_id"`
	FirstName   string            `json:"first_name"`
	LastName    string            `json:"last_name"`
	Role        string            `json:"role"`
	RoleID      int               `json:"role_id"`
	Permissions map[string]string `json:"permissions"`
	TokenType   string            `json:"token_type"`
	jwt.RegisteredClaims
}
