package user

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/internal/role"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/driver/pgdriver"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	db          *bun.DB
	roleService *role.RoleService
}

func NewUserService(db *bun.DB, audit *audit.AuditService, roleService *role.RoleService) *UserService {
	return &UserService{
		db:          db,
		roleService: roleService,
	}
}

func buildBaseUserQuery(query *bun.SelectQuery, params UserParams) *bun.SelectQuery {
	query = query.Relation("Role")

	if params.RoleName != "" {
		query = query.Join("JOIN roles AS r ON r.id = u.role_id")
		query = query.Where("r.name = ?", params.RoleName)
	}

	if params.Status != nil {
		query = query.Where("u.status = ?", *params.Status)
	}

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.WhereGroup(" AND ", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.Where("u.first_name ILIKE ?", searchPattern).
				WhereOr("u.last_name ILIKE ?", searchPattern).
				WhereOr("u.email ILIKE ?", searchPattern)
		})
	}

	return query
}

func buildUserExportQuery(query *bun.SelectQuery, params UserParams) *bun.SelectQuery {
	return buildBaseUserQuery(query, params).OrderExpr("u.created_at DESC")
}

func verifyPasswordHash(hashedPassword, plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
}

func (s *UserService) GetAllUsers(ctx context.Context, params UserParams) ([]UsersResponse, *UserPagination, error) {
	log.Info().
		Interface("status", params.Status).
		Str("role", params.RoleName).
		Str("search", params.Search).
		Msg("Fetching all users...")

	var users []*domain.User

	baseQuery := s.db.NewSelect().Model(&users)
	query := buildBaseUserQuery(baseQuery, params)

	// Count total enabled and disabled users (without status filter)
	var totalEnabled, totalDisabled int
	{
		var allUsers []*domain.User
		countQuery := s.db.NewSelect().Model(&allUsers)
		countQuery = buildBaseUserQuery(countQuery, UserParams{
			RoleName: params.RoleName,
			Search:   params.Search,
		})
		_ = countQuery.Scan(ctx)
		for _, u := range allUsers {
			if u.Status {
				totalEnabled++
			} else {
				totalDisabled++
			}
		}
	}

	err := query.OrderExpr("u.created_at DESC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			pagination := &UserPagination{
				TotalRows:     0,
				TotalEnabled:  totalEnabled,
				TotalDisabled: totalDisabled,
			}
			return []UsersResponse{}, pagination, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching users")
		return nil, nil, fmt.Errorf("database error: %w", err)
	}

	response := make([]UsersResponse, 0, len(users))
	for _, u := range users {
		response = append(response, UsersResponse{
			ID:          u.ID,
			FirstName:   u.FirstName,
			LastName:    u.LastName,
			Email:       u.Email,
			Status:      u.Status,
			RoleName:    u.Role.Name,
			RoleID:      u.Role.ID,
			Permissions: u.Role.Permissions,
			CreatedAt:   u.CreatedAt,
			UpdatedAt:   u.UpdatedAt,
		})
	}

	pagination := &UserPagination{
		TotalRows:     len(response),
		TotalEnabled:  totalEnabled,
		TotalDisabled: totalDisabled,
	}

	log.Info().Int("count", len(response)).Msg("Successfully retrieved users")
	return response, pagination, nil
}

func (s *UserService) GetUserByID(ctx context.Context, userID int) (*domain.User, error) {
	log.Info().Int("userID", userID).Msg("Fetching user with ID:")

	var user domain.User
	err := s.db.NewSelect().
		Model(&user).
		Where("u.id = ?", userID).
		Relation("Role").
		Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("userID", userID).Msg("User not found")
			return nil, fmt.Errorf("user with ID %d does not exist", userID)
		}
		log.Error().Err(err).Int("userID", userID).Msg("Database query failed while fetching user")
		return nil, err
	}

	log.Info().
		Int("userID", user.ID).
		Str("firstName", user.FirstName).
		Str("lastName", user.LastName).
		Str("email", user.Email).
		Str("role", user.Role.Name).
		Interface("status", user.Status).
		Interface("permissions", user.Role.Permissions).
		Msg("Successfully retrieved user")

	return &user, nil
}

func (s *UserService) CreateUser(ctx context.Context, user *domain.User, roleID int) (*domain.User, error) {
	log.Info().
		Str("firstName", user.FirstName).
		Str("lastName", user.LastName).
		Str("email", user.Email).
		Int("roleID", roleID).
		Msg("Creating a new user ...")

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	role, err := s.roleService.GetRoleByID(ctx, roleID)
	if err != nil {
		return nil, err
	}

	hashedPassword, err := pkg.HashPassword(user.Password)
	if err != nil {
		return nil, err
	}

	user.Password = hashedPassword
	user.RoleID = roleID
	user.Role = role
	user.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	if _, err = tx.NewInsert().Model(user).Returning("*").Exec(ctx); err != nil {
		if pgErr, ok := err.(pgdriver.Error); ok && pgErr.Field('C') == "23505" {
			return nil, &ErrEmailAlreadyExists{Email: user.Email}
		}
		log.Error().
			Err(err).
			Str("firstName", user.FirstName).
			Str("lastName", user.LastName).
			Msg("Could not create user")
		return nil, err
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"firstName": {CreatedValues: user.FirstName, Changed: true},
			"lastName":  {CreatedValues: user.LastName, Changed: true},
			"Email":     {CreatedValues: user.Email, Changed: true},
			"role":      {CreatedValues: role.Name, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.USER_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateUser")
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	log.Info().
		Str("firstName", user.FirstName).
		Str("lastName", user.LastName).
		Str("email", user.Email).
		Str("roleName", role.Name).
		Int("userID", user.ID).
		Msg("User created successfully")

	return user, nil
}

func (s *UserService) UpdateUserPassword(ctx context.Context, userID int, oldPassword, newPassword string) (*domain.User, error) {
	log.Info().Int("userID", userID).Msg("Updating user password ...")

	user, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if err := verifyPasswordHash(user.Password, oldPassword); err != nil {
		return nil, errors.New("old password does not match")
	}

	hashedPassword, err := pkg.HashPassword(newPassword)
	if err != nil {
		return nil, err
	}

	user.Password = hashedPassword
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	if _, err = s.db.NewUpdate().Model(user).Where("id = ?", userID).Exec(ctx); err != nil {
		return nil, err
	}

	_, err = audit.LogAction(ctx, s.db, pkg.USER_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"password": {OldValues: "****", NewValues: "****", Changed: true},
		},
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateUserPassword")
	}

	log.Info().
		Int("userID", user.ID).
		Msg("Successfully updated user password")

	return user, nil
}

func (s *UserService) UpdateUser(ctx context.Context, id int, updatedUser *UpdateUserRequest) (*domain.User, error) {
	log.Info().Str("firstName", updatedUser.FirstName).Str("lastName", updatedUser.LastName).Msg("Updating the user:")

	user, err := s.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	oldFirstName := user.FirstName
	oldLastName := user.LastName
	oldEmail := user.Email
	oldStatus := user.Status
	oldRoleName := ""
	if user.Role != nil {
		oldRoleName = user.Role.Name
	}

	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	if updatedUser.FirstName != "" {
		user.FirstName = updatedUser.FirstName
	}
	if updatedUser.LastName != "" {
		user.LastName = updatedUser.LastName
	}
	if updatedUser.Email != "" {
		user.Email = updatedUser.Email
	}
	if updatedUser.Status != nil {
		user.Status = *updatedUser.Status
	}

	if updatedUser.Password != "" {
		hp, err := pkg.HashPassword(updatedUser.Password)
		if err != nil {
			log.Error().Err(err).Int("userID", user.ID).Msg("Error hashing password for update")
			return nil, err
		}
		user.Password = hp
	}

	if updatedUser.RoleID != 0 && updatedUser.RoleID != user.RoleID {
		role, err := s.roleService.GetRoleByID(ctx, updatedUser.RoleID)
		if err != nil {
			return nil, err
		}
		user.RoleID = updatedUser.RoleID
		user.Role = role
	}

	if _, err = s.db.NewUpdate().Model(user).Where("id = ?", user.ID).Exec(ctx); err != nil {
		if pgErr, ok := err.(pgdriver.Error); ok && pgErr.Field('C') == "23505" {
			return nil, &ErrEmailAlreadyExists{Email: updatedUser.Email}
		}
		log.Error().Err(err).Str("firstName", user.FirstName).Str("lastName", user.LastName).Msg("Error updating the user:")
		return nil, err
	}

	oldStatusLabel := "disabled"
	if oldStatus {
		oldStatusLabel = "enabled"
	}

	newStatusLabel := "disabled"
	if user.Status {
		newStatusLabel = "enabled"
	}

	_, err = audit.LogAction(ctx, s.db, pkg.USER_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"firstName": {OldValues: oldFirstName, NewValues: user.FirstName, Changed: oldFirstName != user.FirstName},
			"lastName":  {OldValues: oldLastName, NewValues: user.LastName, Changed: oldLastName != user.LastName},
			"Email":     {OldValues: oldEmail, NewValues: user.Email, Changed: oldEmail != user.Email},
			"Status": {
				OldValues: oldStatusLabel,
				NewValues: newStatusLabel,
				Changed:   oldStatus != user.Status,
			},
			"Role": {
				OldValues: oldRoleName,
				NewValues: user.Role.Name,
				Changed:   oldRoleName != user.Role.Name,
			},
		},
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateUser")
	}

	log.Info().Str("firstName", user.FirstName).Str("lastName", user.LastName).Msg("Successfully updated the user:")

	return user, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id int) error {
	log.Info().Int("userID", id).Msg("Deleting user ...")

	user, err := s.GetUserByID(ctx, id)
	if err != nil {
		return err
	}

	if _, err := s.db.NewDelete().Model(user).Where("id = ?", id).Exec(ctx); err != nil {
		return err
	}

	_, err = audit.LogAction(ctx, s.db, pkg.USER_MODULE, pkg.DELETE_ACTION, domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"firstName": {DeletedValues: user.FirstName, Changed: true},
			"lastName":  {DeletedValues: user.LastName, Changed: true},
			"Email":     {DeletedValues: user.Email, Changed: true},
			"Role":      {DeletedValues: user.Role.Name, Changed: true},
			"Status":    {DeletedValues: user.Status, Changed: true},
		},
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteUser")
	}

	log.Info().Msg("Successfully deleted the user")

	return nil
}

func (s *UserService) ExportUsers(ctx context.Context, params UserParams) (*export.ExportOptions, error) {
	log.Info().Str("type", params.FileType).Msg("Exporting users data")

	baseQuery := s.db.NewSelect().Model((*domain.User)(nil))
	query := buildUserExportQuery(baseQuery, params)

	var users []*domain.User
	err := query.Scan(ctx, &users)

	// Set headers
	headers := []string{
		"ID",
		"First Name",
		"Last Name",
		"Email",
		"Role",
		"Status",
		"Updated At",
	}
	if params.FileType == "excel" {
		headers = []string{
			"id",
			"first_name",
			"last_name",
			"email",
			"role",
			"status",
			"updated_at",
		}
	}

	// Handle DB error
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Error().Err(err).Msg("Failed to fetch users for export")
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}

	// Handle Empty Case
	if len(users) == 0 {
		log.Warn().Msg("No users match the criteria, returning empty export")
		return &export.ExportOptions{
			TableOrientation: "L",
			Data:             [][]string{},
			Widths:           []float64{20, 35, 35, 80, 40, 30, 40},
			FileName:         "User_List",
			Title:            "No data available",
			Headers:          headers,
		}, nil
	}

	return &export.ExportOptions{
		TableOrientation: "L",
		Data:             mapUsersToExportData(users),
		Widths:           []float64{20, 35, 35, 80, 40, 30, 40},
		FileName:         "User_List",
		Title:            "User Report",
		Headers:          headers,
	}, nil
}

func mapUsersToExportData(users []*domain.User) [][]string {
	var data [][]string
	for _, user := range users {
		roleName := "N/A"
		if user.Role != nil {
			roleName = user.Role.Name
		}

		statusStr := "Disabled"
		if user.Status {
			statusStr = "Enabled"
		}

		row := []string{
			pkg.DefaultIfEmptyInt(user.ID, "N/A"),
			pkg.DefaultIfEmpty(user.FirstName, "N/A"),
			pkg.DefaultIfEmpty(user.LastName, "N/A"),
			pkg.DefaultIfEmpty(user.Email, "N/A"),
			roleName,
			statusStr,
			user.UpdatedAt,
		}
		data = append(data, row)
	}
	return data
}

func (e *ErrEmailAlreadyExists) Error() string { return "User email already exists" }
