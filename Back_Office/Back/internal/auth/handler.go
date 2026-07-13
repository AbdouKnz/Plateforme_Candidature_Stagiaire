package auth

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// AuthHandler handles authentication-related endpoints
type AuthHandler struct {
	Service *AuthService
}

func NewAuthHandler(service *AuthService) *AuthHandler {
	return &AuthHandler{Service: service}
}

// LoginHandler godoc
//
//	@Summary		User login
//	@Description	Authenticate user and return JWT token along with user details
//	@Tags			 Auth
//	@Accept			json
//	@Produce		json
//	@Param			credentials	body		auth.LoginRequest	true	"User credentials"
//	@Success		200			{object}	pkg.Response{data=map[string]interface{}}
//	@Failure		400			{object}	pkg.Response
//	@Failure		401			{object}	pkg.Response
//	@Failure		500			{object}	pkg.Response
//	@Router			/api/auth/login [post]
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var credentials LoginRequest

	if err := pkg.BindJSON(c, &credentials); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &credentials); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	user, accessToken, refreshToken, err := h.Service.Login(c.Request.Context(), credentials.Email, credentials.Password)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	response := LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		UserID:       user.ID,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		Email:        user.Email,
		RoleName:     user.Role.Name,
		RoleID:       user.Role.ID,
		Permissions:  user.Role.Permissions,
	}

	pkg.OK(c, response, nil)
}

// RefreshTokenHandler godoc
//
//	@Summary		Refresh access token
//	@Description	Generate a new access token and refresh token using a valid refresh token
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Security		Bearer
//	@Param			request	body		auth.RefreshTokenRequest	true	"Refresh token"
//	@Success		200		{object}	pkg.Response{data=map[string]string}
//	@Failure		400		{object}	pkg.Response
//	@Failure		401		{object}	pkg.Response
//	@Failure		500		{object}	pkg.Response
//	@Router			/api/auth/refresh-token [post]
func (h *AuthHandler) RefreshTokenHandler(c *gin.Context) {
	var req RefreshTokenRequest

	if err := pkg.BindJSON(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	newAccessToken, newRefreshToken, err := h.Service.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	response := gin.H{
		"access_token":  newAccessToken,
		"refresh_token": newRefreshToken,
	}

	pkg.OK(c, response, nil)
}

// LogoutHandler godoc
//
//	@Summary		User logout
//	@Description	Log out the user and return user details with cleared session info
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Security		Bearer
//	@Router			/api/auth/logout [post]
func (h *AuthHandler) LogoutHandler(c *gin.Context) {

	claims, err := middleware.ExtractAndValidateToken(c)
	if err != nil {
		log.Err(err).Msg("Token validation failed during logout")
		pkg.Unauthorized(c, "Invalid or missing token: "+err.Error())
		return
	}

	user, err := h.Service.Logout(c.Request.Context(), claims.UserID)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	response := gin.H{
		"user_id":     claims.UserID,
		"first_name":  claims.FirstName,
		"last_name":   claims.LastName,
		"role_name":   user.Role.Name,
		"permissions": user.Role.Permissions,
	}

	pkg.OK(c, response, nil)
}
