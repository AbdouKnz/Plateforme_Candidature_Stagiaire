package duration

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type DurationHandler struct {
	Service *DurationService
}

func NewDurationHandler(service *DurationService) *DurationHandler {
	return &DurationHandler{Service: service}
}

func (h *DurationHandler) CreateDurationHandler(c *gin.Context) {
	var request CreateDurationRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	duration := &domain.Duration{
		Name: request.Name,
	}

	createdDuration, err := h.Service.CreateDuration(c.Request.Context(), duration)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "duration_created_successfully", ToResponse(createdDuration))
}

func (h *DurationHandler) UpdateDurationHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateDurationRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedDuration, err := h.Service.UpdateDuration(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, pkg.T(c, err.Error()))
		return
	}

	pkg.SuccessL(c, "duration_updated_successfully", ToResponse(updatedDuration))
}

func (h *DurationHandler) GetDurationByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	duration, err := h.Service.GetDurationByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "duration_not_found")
		return
	}

	pkg.OK(c, ToResponse(duration), nil)
}

func (h *DurationHandler) GetAllDurationsHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := DurationParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	durations, err := h.Service.GetAllDurations(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(durations), nil)
}

func (h *DurationHandler) DeleteDurationHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteDuration(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "duration_deleted_successfully", nil)
}
