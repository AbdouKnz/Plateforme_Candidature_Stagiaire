package mail_config

import (
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type MailConfigHandler struct {
	Service *MailConfigService
}

func NewMailConfigHandler(service *MailConfigService) *MailConfigHandler {
	return &MailConfigHandler{Service: service}
}

func (h *MailConfigHandler) GetHandler(c *gin.Context) {
	config, err := h.Service.Get(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, config, nil)
}

func (h *MailConfigHandler) UpdateHandler(c *gin.Context) {
	var req UpdateMailConfigRequest
	if err := pkg.BindJSON(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	config, err := h.Service.Update(c.Request.Context(), req)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.SuccessL(c, "mail_config_updated", config)
}

func (h *MailConfigHandler) TestHandler(c *gin.Context) {
	var req UpdateMailConfigRequest
	if err := pkg.BindJSON(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := h.Service.TestConnection(c.Request.Context(), req); err != nil {
		pkg.BadRequest(c, err.Error())
		return
	}
	pkg.SuccessL(c, "mail_config_test_ok", nil)
}