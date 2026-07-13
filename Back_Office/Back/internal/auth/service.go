package auth

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/middleware"
	"astro-backend/pkg"
	"context"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db    *bun.DB
	audit *audit.AuditService
}

func NewAuthService(db *bun.DB, audit *audit.AuditService) *AuthService {
	return &AuthService{db: db, audit: audit}
}

func (s *AuthService) Login(ctx context.Context, email string, password string) (*domain.User, string, string, error) {

	log.Info().Str("email", email).Msg("Attempting login for user with email")

	var user domain.User

	err := s.db.NewSelect().
		Model(&user).
		Relation("Role").
		Where("email = ?", email).
		Scan(ctx)

	if err != nil {
		log.Error().Err(err).Str("email", email).Msg("Error: User not found")
		return nil, "", "", fmt.Errorf("invalid email or password")
	}

	log.Info().
		Str("first_name", user.FirstName).
		Str("last_name", user.LastName).
		Str("role", user.Role.Name).
		Interface("permission", user.Role.Permissions).
		Msg("User fetched successfully")

	if !user.Status {
		log.Warn().Str("email", email).Msg("Login blocked: user account is inactive")
		return nil, "", "", fmt.Errorf("your access is blocked")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		log.Warn().Msg("Invalid password")
		return nil, "", "", fmt.Errorf("e-mail ou mot de passe invalide")
	}

	log.Info().Msg("Password matched")

	accessToken, err := middleware.GenerateToken(user.ID, user.FirstName, user.LastName, user.Role.Name, user.Role.ID, user.Role.Permissions)
	if err != nil {
		log.Error().Err(err).Msg("Error: Could not generate access token")
		return nil, "", "", fmt.Errorf("could not generate token: %v", err)
	}

	refreshToken, err := middleware.GenerateRefreshToken(user.ID, user.FirstName, user.LastName, user.Role.Name, user.Role.ID, user.Role.Permissions)
	if err != nil {
		log.Error().Err(err).Msg("Error: Could not generate refresh token")
		return nil, "", "", fmt.Errorf("could not generate refresh token: %v", err)
	}

	ctx = middleware.SetActorToContext(ctx, &domain.Claims{
		UserID:    user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		RoleID:    user.Role.ID,
	})

	loginDetails := domain.ChangeDetail{
		Type: pkg.LOGIN,
		Fields: map[string]domain.FieldChange{
			"email": {
				LoggedInValues: user.Email,
				Changed:        true,
			},
			"firstName": {
				LoggedInValues: user.FirstName,
				Changed:        true,
			},
			"lastName": {
				LoggedInValues: user.LastName,
				Changed:        true,
			},
			"role": {
				LoggedInValues: user.Role.Name,
				Changed:        true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.AUTH_MODULE, pkg.LOGIN_ACTION, loginDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for Login")
	}

	return &user, accessToken, refreshToken, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	log.Info().Msg("Attempting to refresh token")

	claims, err := middleware.ValidateRefreshToken(refreshToken)
	if err != nil {
		log.Error().Err(err).Msg("Invalid refresh token")
		return "", "", fmt.Errorf("invalid refresh token: %v", err)
	}

	var user domain.User
	err = s.db.NewSelect().
		Model(&user).
		Relation("Role").
		Where("u.id = ?", claims.UserID).
		Scan(ctx)

	if err != nil {
		log.Error().Err(err).Int("user_id", claims.UserID).Msg("Error: User not found")
		return "", "", fmt.Errorf("user not found: %v", err)
	}

	if !user.Status {
		log.Warn().Int("user_id", user.ID).Msg("Refresh blocked: user account is inactive")
		return "", "", fmt.Errorf("your access is blocked")
	}

	newAccessToken, err := middleware.GenerateToken(user.ID, user.FirstName, user.LastName, user.Role.Name, user.Role.ID, user.Role.Permissions)
	if err != nil {
		log.Error().Err(err).Msg("Error: Could not generate new access token")
		return "", "", fmt.Errorf("could not generate token: %v", err)
	}

	newRefreshToken, err := middleware.GenerateRefreshToken(user.ID, user.FirstName, user.LastName, user.Role.Name, user.Role.ID, user.Role.Permissions)
	if err != nil {
		log.Error().Err(err).Msg("Error: Could not generate new refresh token")
		return "", "", fmt.Errorf("could not generate refresh token: %v", err)
	}

	log.Info().Int("user_id", user.ID).Msg("Tokens refreshed successfully")
	return newAccessToken, newRefreshToken, nil
}

func (s *AuthService) Logout(ctx context.Context, userID int) (*domain.User, error) {

	log.Info().Int("user_id", userID).Msg("Attempting logout for user: ")

	var user domain.User

	log.Info().Int("user_id", userID).Msg("Fetching user from DB with credentials: ")

	err := s.db.NewSelect().
		Model(&user).
		Relation("Role").
		Where("u.id = ?", userID).
		Scan(ctx)

	if err != nil {

		log.Error().Err(err).Int("user_id", userID).Msg("Error: User not found")
		return nil, fmt.Errorf("user not found: %v", err)
	}

	log.Info().Str("firstName", user.FirstName).Str("lastName", user.LastName).Str("role", user.Role.Name).Msg("User fetched successfully")

	logoutDetails := domain.ChangeDetail{
		Type: pkg.LOGOUT,
		Fields: map[string]domain.FieldChange{
			"firstName": {
				LoggedOutValues: user.FirstName,
				Changed:         true,
			},
			"lastName": {
				LoggedOutValues: user.LastName,
				Changed:         true,
			},
			"role": {
				LoggedOutValues: user.Role.Name,
				Changed:         true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.AUTH_MODULE, pkg.LOGOUT_ACTION, logoutDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for Logout")
	}
	log.Info().Msg("User logged out successfully")
	return &user, nil
}
