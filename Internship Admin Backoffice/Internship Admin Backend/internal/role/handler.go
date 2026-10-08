package role

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type RoleHandler struct {
	Service *RoleService
}

func NewRoleHandler(service *RoleService) *RoleHandler {
	return &RoleHandler{Service: service}
}

// CreateRoleHandler godoc
//
//	@Summary		Create a new role
//	@Description	Create a new role with the provided information
//	@Tags			Roles
//	@Accept			json
//	@Produce		json
//	@Param			role	body	role.CreateRoleRequest	true	"Role data"
//	@Security		Bearer
//	@Success		201	{object}	pkg.Response{data=domain.Role}
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/roles [post]
func (h *RoleHandler) CreateRoleHandler(c *gin.Context) {
	var request CreateRoleRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	role := &domain.Role{
		Name:        request.Name,
		Permissions: request.Permissions,
	}

	createdRole, err := h.Service.CreateRole(c.Request.Context(), role)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "role_created_successfully", createdRole)

}

// UpdateRoleHandler godoc
//
//	@Summary		Update role
//	@Description	Update an existing role
//	@Tags			Roles
//	@Accept			json
//	@Produce		json
//	@Param			id		path	int						true	"Role ID"
//	@Param			role	body	role.UpdateRoleRequest	true	"Role data"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=domain.Role}
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/roles/{id} [put]
func (h *RoleHandler) UpdateRoleHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateRoleRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedRole, err := h.Service.UpdateRole(c.Request.Context(), &domain.Role{
		ID:          id,
		Name:        request.Name,
		Permissions: request.Permissions,
	})
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "role_updated_successfully", updatedRole)
}

// GetRoleByIDHandler godoc
//
//	@Summary		Get role by ID
//	@Description	Get a single role by their ID
//	@Tags			Roles
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Role ID"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=domain.Role}
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/roles/{id} [get]
func (h *RoleHandler) GetRoleByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	role, err := h.Service.GetRoleByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "role_not_found")
		return
	}

	pkg.OK(c, role, nil)
}

// GetAllRolesHandler godoc
//
//	@Summary		Get all roles
//	@Description	Get all roles with optional search filtering
//	@Tags			Roles
//	@Accept			json
//	@Produce		json
//	@Security		Bearer
//	@Param			search	query		string	false	"Search roles by name (case-insensitive)"
//	@Success		200		{object}	pkg.Response{data=[]domain.Role}
//	@Failure		400		{object}	pkg.Response
//	@Failure		500		{object}	pkg.Response
//	@Router			/api/roles [get]
func (h *RoleHandler) GetAllRolesHandler(c *gin.Context) {

	params := RoleParams{
		Search: c.DefaultQuery("search", ""),
	}

	roles, err := h.Service.GetAllRoles(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, roles, nil)
}

func (h *RoleHandler) ReassignRoleHandler(c *gin.Context) {
	var request ReassignRoleRequest
	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := h.Service.ReassignRole(c.Request.Context(), request); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.SuccessL(c, "role_updated_successfully", nil)
}

// DeleteRoleHandler godoc
//
//	@Summary		Delete role
//	@Description	Delete a role by ID. If the role has users (UserCount > 0), a new_role_id must be provided in the JSON body to reassign them.
//	@Tags			Roles
//	@Accept			json
//	@Produce		json
//	@Param			id		path	int					true	"New Role ID"
//	@Param			request	body	ReassignRoleRequest	true	"Reassignment Details (Required if assigned users exist)"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/roles/{id} [delete]
func (h *RoleHandler) DeleteRoleHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request ReassignRoleRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		request = ReassignRoleRequest{CurrentRoleID: id, NewRoleID: 0}
	}

	if err := h.Service.DeleteRole(c.Request.Context(), id, request); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "role_deleted_successfully", nil)
}
