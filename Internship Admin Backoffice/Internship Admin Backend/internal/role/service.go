package role

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/driver/pgdriver"
)

type RoleService struct {
	db *bun.DB
}

func NewRoleService(db *bun.DB, auditService *audit.AuditService) *RoleService {
	return &RoleService{
		db: db,
	}
}

func (s *RoleService) GetAllRoles(ctx context.Context, params RoleParams) ([]RolesResponse, error) {
	log.Info().Msg("Fetching all roles...")
	var roles []*domain.Role

	query := s.db.NewSelect().
		Model(&roles).
		ColumnExpr("r.*").
		ColumnExpr("COUNT(u.id) AS user_count").
		Join("LEFT JOIN users AS u ON u.role_id = r.id").
		Group("r.id")

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("r.name ILIKE ?", searchPattern)
	}

	err := query.Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []RolesResponse{}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching roles")
		return nil, fmt.Errorf("database error: %w", err)
	}

	response := make([]RolesResponse, len(roles))
	for i, r := range roles {
		readable := make(map[string][]string)
		for module, mask := range r.Permissions {
			readable[module] = MapPermissions(mask)
		}

		response[i] = RolesResponse{
			ID:          r.ID,
			Name:        r.Name,
			Permissions: readable,
			UserCount:   r.UserCount,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		}
	}

	log.Info().Int("count", len(response)).Msg("Successfully retrieved roles")
	return response, nil
}

func (s *RoleService) GetRoleByID(ctx context.Context, id int) (*domain.Role, error) {
	log.Info().Int("role_id", id).Msg("Fetching role by ID with user count...")

	role := &domain.Role{}
	err := s.db.NewSelect().
		Model(role).
		ColumnExpr("r.*").
		ColumnExpr("COUNT(u.id) AS user_count").
		Join("LEFT JOIN users AS u ON u.role_id = r.id").
		Where("r.id = ?", id).
		Group("r.id").
		Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("role_id", id).Msg("Role not found")
			return nil, fmt.Errorf("role with ID %d does not exist", id)
		}

		log.Error().Err(err).Int("role_id", id).Msg("Database error while fetching role")
		return nil, fmt.Errorf("could not fetch role: %w", err)
	}

	log.Info().Int("role_id", id).Int("user_count", role.UserCount).Msg("Successfully retrieved role")
	return role, nil
}

func (s *RoleService) CreateRole(ctx context.Context, role *domain.Role) (*domain.Role, error) {
	log.Info().Str("role", role.Name).Msg("Creating a new role ...")
	role.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	role.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err := s.db.NewInsert().Model(role).Exec(ctx)
	if err != nil {
		if pgErr, ok := err.(pgdriver.Error); ok {
			if pgErr.Field('C') == "23505" {
				return nil, &ErrRoleAlreadyExists{Name: role.Name}
			}
		}
		log.Error().Err(err).Str("role", role.Name).Msg("Could not create role")
		return nil, fmt.Errorf("could not create role: %w", err)
	}

	readablePermissions := make(map[string][]string)
	for module, mask := range role.Permissions {
		if labels := MapPermissions(mask); len(labels) > 0 {
			readablePermissions[module] = labels
		}
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.CREATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				CreatedValues: role.Name,
				Changed:       true,
			},
			"permissions": {
				CreatedValues: readablePermissions,
				Changed:       true,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.ROLE_MODULE, pkg.CREATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for CreateRole")
	}

	log.Info().Str("role", role.Name).Interface("permissions", role.Permissions).Msg("Role created successfully")
	return role, nil
}

func (s *RoleService) UpdateRole(ctx context.Context, updatedRole *domain.Role) (*domain.Role, error) {
	log.Info().Str("role", updatedRole.Name).Msg("Updating the role:")

	role, err := s.GetRoleByID(ctx, updatedRole.ID)
	if err != nil {
		return nil, err
	}

	oldName := role.Name
	oldPermissions := role.Permissions

	if updatedRole.Name != "" {
		role.Name = updatedRole.Name
	}
	if len(updatedRole.Permissions) > 0 {
		role.Permissions = updatedRole.Permissions
	}

	role.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	_, err = s.db.NewUpdate().Model(role).Where("id = ?", role.ID).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not update role with ID %d: %w", role.ID, err)
	}

	oldReadablePermissions := make(map[string][]string)
	for module, mask := range oldPermissions {
		if labels := MapPermissions(mask); len(labels) > 0 {
			oldReadablePermissions[module] = labels
		}
	}

	newReadablePermissions := make(map[string][]string)
	for module, mask := range role.Permissions {
		if labels := MapPermissions(mask); len(labels) > 0 {
			newReadablePermissions[module] = labels
		}
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"Name": {
				OldValues: oldName,
				NewValues: role.Name,
				Changed:   oldName != role.Name,
			},
			"Permissions": {
				OldValues: oldReadablePermissions,
				NewValues: newReadablePermissions,
				Changed:   len(updatedRole.Permissions) > 0,
			},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.ROLE_MODULE, pkg.UPDATE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for UpdateRole")
	}

	log.Info().Str("role", role.Name).Msg("Successfully updated the role")
	return role, nil
}

func (s *RoleService) ReassignRole(ctx context.Context, request ReassignRoleRequest) error {
	log.Info().Int("OldRoleID", request.CurrentRoleID).Int("NewRoleID", request.NewRoleID).Msg("Reassigning users...")

	if request.NewRoleID == request.CurrentRoleID {
		return fmt.Errorf("cannot reassign users to the same role")
	}

	exists, err := s.db.NewSelect().Model((*domain.Role)(nil)).Where("id = ?", request.NewRoleID).Exists(ctx)
	if err != nil {
		return fmt.Errorf("error verifying role: %w", err)
	}
	if !exists {
		return fmt.Errorf("new role ID %d does not exist", request.NewRoleID)
	}

	_, err = s.db.NewUpdate().
		Model((*domain.User)(nil)).
		Set("role_id = ?", request.NewRoleID).
		Where("role_id = ?", request.CurrentRoleID).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to reassign users: %w", err)
	}

	log.Info().Int("OldRoleID", request.CurrentRoleID).Int("NewRoleID", request.NewRoleID).Msg("Users reassigned successfully")
	return nil
}

func (s *RoleService) DeleteRole(ctx context.Context, id int, request ReassignRoleRequest) error {
	log.Info().Int("RoleID", id).Msg("Attempting to delete role ...")

	newId := request.NewRoleID

	role, err := s.GetRoleByID(ctx, id)
	if err != nil {
		return err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to begin transaction for DeleteRole")
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if role.UserCount > 0 {
		if newId <= 0 {
			log.Warn().Int("RoleID", id).Int("UserCount", role.UserCount).Msg("Reassignment failed: No new_role_id provided")
			return fmt.Errorf("cannot delete role '%s': %d users attached. Please provide a new_role_id", role.Name, role.UserCount)
		}
		if newId == id {
			log.Warn().Int("RoleID", id).Msg("Reassignment failed: Attempted to reassign to the same role")
			return fmt.Errorf("cannot reassign users to the role currently being deleted")
		}

		exists, err := tx.NewSelect().Model((*domain.Role)(nil)).Where("id = ?", newId).Exists(ctx)
		if err != nil {
			log.Error().Err(err).Int("TargetRoleID", newId).Msg("Database error verifying target role existence")
			return fmt.Errorf("error verifying role: %w", err)
		}
		if !exists {
			log.Warn().Int("TargetRoleID", newId).Msg("Reassignment failed: Target role does not exist")
			return fmt.Errorf("new role ID %d does not exist", newId)
		}

		log.Info().Int("OldRoleID", id).Int("NewRoleID", newId).Msg("Reassigning users before deletion...")
		_, err = tx.NewUpdate().
			Model((*domain.User)(nil)).
			Set("role_id = ?", newId).
			Where("role_id = ?", id).
			Exec(ctx)
		if err != nil {
			log.Error().Err(err).Int("OldRoleID", id).Int("NewRoleID", newId).Msg("Database error during user reassignment")
			return fmt.Errorf("failed to reassign users: %w", err)
		}
	}

	res, err := tx.NewDelete().Model(role).Where("id = ?", id).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Int("RoleID", id).Msg("Database error during role deletion")
		return fmt.Errorf("could not delete role with ID %d: %w", id, err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		log.Warn().Int("RoleID", id).Msg("Delete failed: Role not found at execution time")
		return fmt.Errorf("role with ID %d not found", id)
	}

	if err := tx.Commit(); err != nil {
		log.Error().Err(err).Int("RoleID", id).Msg("Failed to commit transaction for DeleteRole")
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	readablePermissions := make(map[string][]string)
	for module, mask := range role.Permissions {
		if labels := MapPermissions(mask); len(labels) > 0 {
			readablePermissions[module] = labels
		}
	}

	changeDetails := domain.ChangeDetail{
		Type: pkg.DELETE,
		Fields: map[string]domain.FieldChange{
			"Name":        {DeletedValues: role.Name, Changed: true},
			"Permissions": {DeletedValues: readablePermissions, Changed: true},
		},
	}

	_, err = audit.LogAction(ctx, s.db, pkg.ROLE_MODULE, pkg.DELETE_ACTION, changeDetails)
	if err != nil {
		log.Error().Err(err).Msg("Failed to log audit action for DeleteRole")
	}

	log.Info().Str("role", role.Name).Msg("Successfully deleted the role")
	return nil
}

func (e *ErrRoleAlreadyExists) Error() string {
	return "Role already exists"
}

var PermissionLabels = []string{
	"View",
	"Create",
	"Edit",
	"Delete",
}

func MapPermissions(mask string) []string {
	var labels []string
	for i, char := range mask {
		if i < len(PermissionLabels) && char == '1' {
			labels = append(labels, PermissionLabels[i])
		}
	}
	return labels
}
