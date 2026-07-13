package subject

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type SubjectHandler struct {
	Service *SubjectService
}

func NewSubjectHandler(service *SubjectService) *SubjectHandler {
	return &SubjectHandler{Service: service}
}

func (h *SubjectHandler) CreateSubjectHandler(c *gin.Context) {
	var request CreateSubjectRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	subject := &domain.Subject{
		Code:         request.Code,
		Name:         request.Name,
		Description:  request.Description,
		PriorityRank: request.PriorityRank,
	}

	createdSubject, err := h.Service.CreateSubject(c.Request.Context(), subject, request.TechnologyIDs, request.ProfileIDs)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "subject_created_successfully", ToResponse(createdSubject))
}

func (h *SubjectHandler) UpdateSubjectHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateSubjectRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedSubject, err := h.Service.UpdateSubject(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "subject_updated_successfully", ToResponse(updatedSubject))
}

func (h *SubjectHandler) GetSubjectByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	subject, err := h.Service.GetSubjectByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "subject_not_found")
		return
	}

	pkg.OK(c, ToResponse(subject), nil)
}

func (h *SubjectHandler) GetAllSubjectsHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := SubjectParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	subjects, err := h.Service.GetAllSubjects(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(subjects), nil)
}

func (h *SubjectHandler) DeleteSubjectHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteSubject(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "subject_deleted_successfully", nil)
}
