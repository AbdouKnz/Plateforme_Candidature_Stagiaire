package role

type CreateRoleRequest struct {
	Name        string            `json:"role_name"`
	Permissions map[string]string `json:"role_permissions"`
}

type RolesResponse struct {
	ID          int                 `json:"role_id"`
	Name        string              `json:"role_name"`
	Permissions map[string][]string `json:"role_permissions"`
	UserCount   int                 `json:"user_count"`
	CreatedAt   string              `json:"created_at"`
	UpdatedAt   string              `json:"updated_at"`
}

type UpdateRoleRequest struct {
	Name        string            `json:"role_name,omitempty"`
	Permissions map[string]string `json:"role_permissions,omitempty"`
}

type RoleParams struct {
	Search   string `json:"search" form:"search"`
	FileType string `json:"file_type"`
}

type ReassignRoleRequest struct {
	CurrentRoleID int `json:"current_role_id"`
	NewRoleID     int `json:"new_role_id"`
}
type ErrRoleAlreadyExists struct {
	Name string
}
