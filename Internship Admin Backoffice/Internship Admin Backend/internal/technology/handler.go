package technology

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type TechnologyHandler struct {
	Service *TechnologyService
}

func NewTechnologyHandler(service *TechnologyService) *TechnologyHandler {
	return &TechnologyHandler{Service: service}
}

func (h *TechnologyHandler) CreateTechnologyHandler(c *gin.Context) {
	var request CreateTechnologyRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	technology := &domain.Technology{
		Name: request.Name,
	}

	createdTechnology, err := h.Service.CreateTechnology(c.Request.Context(), technology)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "technology_created_successfully", ToResponse(createdTechnology))
}

func (h *TechnologyHandler) UpdateTechnologyHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateTechnologyRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedTechnology, err := h.Service.UpdateTechnology(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "technology_updated_successfully", ToResponse(updatedTechnology))
}

func (h *TechnologyHandler) GetTechnologyByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	technology, err := h.Service.GetTechnologyByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "technology_not_found")
		return
	}

	pkg.OK(c, ToResponse(technology), nil)
}

func (h *TechnologyHandler) GetAllTechnologiesHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := TechnologyParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	technologies, err := h.Service.GetAllTechnologies(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(technologies), nil)
}

func (h *TechnologyHandler) DeleteTechnologyHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteTechnology(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "technology_deleted_successfully", nil)
}
