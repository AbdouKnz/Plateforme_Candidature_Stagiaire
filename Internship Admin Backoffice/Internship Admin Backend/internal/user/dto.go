package user

type CreateUserRequest struct {
	FirstName string `json:"first_name" validate:"required,min=3"`
	LastName  string `json:"last_name" validate:"required,min=3"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=4"`
	RoleID    int    `json:"role_id" validate:"required"`
}

type UpdateUserRequest struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Email     string `json:"email,omitempty"`
	Password  string `json:"password,omitempty"`
	Status    *bool  `json:"status,omitempty"`
	RoleID    int    `json:"role_id,omitempty"`
}

type UpdateUserPasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required,min=4"`
	NewPassword string `json:"new_password" binding:"required,min=4"`
}

type UpdateUserRoleRequest struct {
	RoleID int `json:"role_id"`
}

type UsersResponse struct {
	ID          int               `json:"user_id"`
	FirstName   string            `json:"first_name"`
	LastName    string            `json:"last_name"`
	Password    string            `json:"password"`
	Email       string            `json:"email"`
	Status      bool              `json:"status"`
	RoleName    string            `json:"role_name"`
	RoleID      int               `json:"role_id"`
	Permissions map[string]string `json:"permissions"`
	CreatedAt   string            `json:"created_at"`
	UpdatedAt   string            `json:"updated_at"`
}

type UserParams struct {
	Status   *bool  `json:"status"`
	Search   string `json:"search"`
	RoleName string
	FileType string `json:"file_type"`
	Page     int    `json:"page"      validate:"min=1"`
	PageSize int    `json:"page_size" validate:"min=1,max=100"`
}
type UserPagination struct {
	TotalRows      int `json:"totalRows"`
	TotalEnabled   int `json:"totalEnabled"`
	TotalDisabled  int `json:"totalDisabled"`
}

type ErrEmailAlreadyExists struct {
	Email string
}
