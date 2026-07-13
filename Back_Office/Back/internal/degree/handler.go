package degree

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type DegreeHandler struct {
	Service *DegreeService
}

func NewDegreeHandler(service *DegreeService) *DegreeHandler {
	return &DegreeHandler{Service: service}
}

func (h *DegreeHandler) CreateDegreeHandler(c *gin.Context) {
	var request CreateDegreeRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	degree := &domain.Degree{
		Name: request.Name,
	}

	createdDegree, err := h.Service.CreateDegree(c.Request.Context(), degree)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "degree_created_successfully", ToResponse(createdDegree))
}

func (h *DegreeHandler) UpdateDegreeHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateDegreeRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedDegree, err := h.Service.UpdateDegree(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, pkg.T(c, err.Error()))
		return
	}

	pkg.SuccessL(c, "degree_updated_successfully", ToResponse(updatedDegree))
}

func (h *DegreeHandler) GetDegreeByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	degree, err := h.Service.GetDegreeByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "degree_not_found")
		return
	}

	pkg.OK(c, ToResponse(degree), nil)
}

func (h *DegreeHandler) GetAllDegreesHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := DegreeParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	degrees, err := h.Service.GetAllDegrees(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(degrees), nil)
}

func (h *DegreeHandler) DeleteDegreeHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteDegree(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "degree_deleted_successfully", nil)
}
