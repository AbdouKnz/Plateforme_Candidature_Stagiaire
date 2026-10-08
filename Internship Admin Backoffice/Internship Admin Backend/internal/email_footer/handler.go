package email_footer

import (
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type EmailFooterHandler struct {
	Service *EmailFooterService
}

func NewEmailFooterHandler(service *EmailFooterService) *EmailFooterHandler {
	return &EmailFooterHandler{Service: service}
}

func (h *EmailFooterHandler) GetHandler(c *gin.Context) {
	footer, err := h.Service.Get(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, footer, nil)
}

func (h *EmailFooterHandler) UpdateHandler(c *gin.Context) {
	var req UpdateEmailFooterRequest
	if err := pkg.BindJSON(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	footer, err := h.Service.Update(c.Request.Context(), req)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.SuccessL(c, "email_footer_updated", footer)
}
