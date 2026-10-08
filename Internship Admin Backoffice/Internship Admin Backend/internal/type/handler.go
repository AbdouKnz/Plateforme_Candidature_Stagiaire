package typ

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type TypeHandler struct {
	Service *TypeService
}

func NewTypeHandler(service *TypeService) *TypeHandler {
	return &TypeHandler{Service: service}
}

func (h *TypeHandler) CreateTypeHandler(c *gin.Context) {
	var request CreateTypeRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	typ := &domain.Type{
		Name: request.Name,
	}

	createdType, err := h.Service.CreateType(c.Request.Context(), typ)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "type_created_successfully", ToResponse(createdType))
}

func (h *TypeHandler) UpdateTypeHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateTypeRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedType, err := h.Service.UpdateType(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, pkg.T(c, err.Error()))
		return
	}

	pkg.SuccessL(c, "type_updated_successfully", ToResponse(updatedType))
}

func (h *TypeHandler) GetTypeByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	typ, err := h.Service.GetTypeByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "type_not_found")
		return
	}

	pkg.OK(c, ToResponse(typ), nil)
}

func (h *TypeHandler) GetAllTypesHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := TypeParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	types, err := h.Service.GetAllTypes(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(types), nil)
}

func (h *TypeHandler) DeleteTypeHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteType(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "type_deleted_successfully", nil)
}
