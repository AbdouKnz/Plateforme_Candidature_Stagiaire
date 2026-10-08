package email_template

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type EmailTemplateHandler struct {
	Service *EmailTemplateService
}

func NewEmailTemplateHandler(service *EmailTemplateService) *EmailTemplateHandler {
	return &EmailTemplateHandler{Service: service}
}

func (h *EmailTemplateHandler) CreateHandler(c *gin.Context) {
	var req CreateEmailTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.BadRequest(c, "Invalid request body")
		return
	}

	if req.Type == "" || req.Subject == "" || req.Body == "" {
		pkg.BadRequest(c, "type, subject, and body are required")
		return
	}

	status := true
	if req.Status != nil {
		status = *req.Status
	}

	emailTemplate := &domain.EmailTemplate{
		Type:     req.Type,
		Subject:  req.Subject,
		Body:     req.Body,
		Status:   status,
	}

	created, err := h.Service.Create(c.Request.Context(), emailTemplate)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "email_template_created_successfully", ToResponse(created))
}

func (h *EmailTemplateHandler) UpdateHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var req UpdateEmailTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.BadRequest(c, "Invalid request body")
		return
	}

	updated, err := h.Service.Update(c.Request.Context(), id, req)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "email_template_updated_successfully", ToResponse(updated))
}

func (h *EmailTemplateHandler) GetByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	emailTemplate, err := h.Service.GetByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "email_template_not_found")
		return
	}

	pkg.OK(c, ToResponse(emailTemplate), nil)
}

func (h *EmailTemplateHandler) GetAllHandler(c *gin.Context) {
	params := EmailTemplateParams{
		Search: c.DefaultQuery("search", ""),
	}

	emailTemplates, err := h.Service.GetAll(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(emailTemplates), nil)
}

func (h *EmailTemplateHandler) DeleteHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.Delete(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "email_template_deleted_successfully", nil)
}

