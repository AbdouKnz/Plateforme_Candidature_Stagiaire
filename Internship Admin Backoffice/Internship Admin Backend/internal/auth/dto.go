package auth

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"superadmin@asteroidea.co"`
	Password string `json:"password" binding:"required,min=3" example:"admin123"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type LoginResponse struct {
	Token        string            `json:"token"`
	RefreshToken string            `json:"refresh_token"`
	UserID       int               `json:"user_id"`
	FirstName    string            `json:"first_name"`
	LastName     string            `json:"last_name"`
	Email        string            `json:"email"`
	RoleName     string            `json:"role_name"`
	RoleID       int               `json:"role_id"`
	Permissions  map[string]string `json:"permissions"`
}
