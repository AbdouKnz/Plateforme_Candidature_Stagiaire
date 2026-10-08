package user

import (
	"astro-backend/domain"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"fmt"

	"strings"

	"github.com/gin-gonic/gin"
)

// UserHandler handles user-related endpoints
type UserHandler struct {
	Service *UserService
}

func NewUserHandler(service *UserService) *UserHandler {
	return &UserHandler{Service: service}
}

// CreateUserHandler godoc
//
//	@Summary		Create user
//	@Description	Create a new user with assigned role
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			user	body	user.CreateUserRequest	true	"User data"
//	@Security		Bearer
//	@Success		201	{object}	pkg.Response{data=domain.User}
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users [post]
func (h *UserHandler) CreateUserHandler(c *gin.Context) {
	var request CreateUserRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	user := &domain.User{
		FirstName: request.FirstName,
		LastName:  request.LastName,
		Email:     request.Email,
		Password:  request.Password,
	}

	createdUser, err := h.Service.CreateUser(c.Request.Context(), user, request.RoleID)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "user_created_successfully", createdUser)
}

// GetAllUsersHandler godoc
//
//	@Summary		Get all users
//	@Description	Get all users filtered by status, role, and search term
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			status		query	string	false	"Filter by status (active/inactive)"
//	@Param			role_name	query	string	false	"Filter by role name"
//	@Param			search		query	string	false	"Search by name or email"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=[]user.UsersResponse}
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users [get]
func (h *UserHandler) GetAllUsersHandler(c *gin.Context) {
	roleName := c.DefaultQuery("role_name", "")
	if roleName == "all" {
		roleName = ""
	}

	params := UserParams{
		RoleName: roleName,
		Search:   c.DefaultQuery("search", ""),
	}

	status := c.DefaultQuery("status", "")
	if status != "" {
		switch status {
		case "true", "1":
			val := true
			params.Status = &val
		case "false", "0":
			val := false
			params.Status = &val
		default:
			pkg.BadRequest(c, fmt.Sprintf("invalid status filter: %s", status))
			return
		}
	}

	users, pagination, err := h.Service.GetAllUsers(c.Request.Context(), params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, users, pagination)
}

// GetUserByIDHandler godoc
//
//	@Summary		Get user by ID
//	@Description	Get a single user by ID
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"User ID"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=user.UsersResponse}
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users/{id} [get]
func (h *UserHandler) GetUserByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	user, err := h.Service.GetUserByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "user_not_found")
		return
	}

	response := UsersResponse{
		ID:          user.ID,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		Email:       user.Email,
		Password:    user.Password,
		Status:      user.Status,
		RoleName:    user.Role.Name,
		RoleID:      user.RoleID,
		Permissions: user.Role.Permissions,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
	pkg.OK(c, response, nil)
}

// UpdateUserHandler godoc
//
//	@Summary		Update user
//	@Description	Update an existing user
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			id		path	int						true	"User ID"
//	@Param			user	body	user.UpdateUserRequest	true	"User data"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=domain.User}
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users/{id} [put]
func (h *UserHandler) UpdateUserHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var updatedUser UpdateUserRequest

	if err := pkg.BindJSON(c, &updatedUser); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &updatedUser); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	user, err := h.Service.UpdateUser(c.Request.Context(), id, &updatedUser)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "user_updated_successfully", user)
}

// UpdateUserPasswordHandler godoc
//
//	@Summary		Update user password
//	@Description	Update user password using old and new password
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			id			path	int								true	"User ID"
//	@Param			password	body	user.UpdateUserPasswordRequest	true	"Password update"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=domain.User}
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users/{id}/password [put]
func (h *UserHandler) UpdateUserPasswordHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateUserPasswordRequest
	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedUser, err := h.Service.UpdateUserPassword(c.Request.Context(), id, request.OldPassword, request.NewPassword)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "password_updated_successfully", updatedUser)
}

// DeleteUserHandler godoc
//
//	@Summary		Delete user
//	@Description	Delete a user by ID
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"User ID"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users/{id} [delete]
func (h *UserHandler) DeleteUserHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteUser(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "user_deleted_successfully", nil)
}

// ExportUserHandler godoc
//
//	@Summary		Export users
//	@Description	Export users list to PDF or Excel format with optional filters
//	@Tags			Users
//	@Accept			json
//	@Produce		application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
//	@Param			file_type	query	string	false	"File type (pdf/excel)"	default(pdf)
//	@Param			status		query	boolean	false	"Filter by active status (true/false)"
//	@Param			search		query	string	false	"Search by keyword"
//	@Security		Bearer
//	@Success		200	{file}		binary
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/users/export [post]
func (h *UserHandler) ExportUserHandler(c *gin.Context) {
	roleName := c.DefaultQuery("role_name", "")
	if roleName == "all" {
		roleName = ""
	}
	params := UserParams{
		Status:   nil,
		RoleName: roleName,
		Search:   c.DefaultQuery("search", ""),
		FileType: c.DefaultQuery("file_type", "pdf"),
	}

	status := c.DefaultQuery("status", "")
	if status != "" {
		switch status {
		case "true", "1":
			val := true
			params.Status = &val
		case "false", "0":
			val := false
			params.Status = &val
		default:
			pkg.BadRequest(c, fmt.Sprintf("invalid status filter: %s", status))
			return
		}
	}

	exportData, err := h.Service.ExportUsers(c.Request.Context(), params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	switch strings.ToLower(params.FileType) {
	case "excel":
		export.ExportToExcel(c, *exportData)
	case "pdf":
		export.ExportToPDF(c, *exportData)
	default:
		export.ExportToPDF(c, *exportData)
	}
}
