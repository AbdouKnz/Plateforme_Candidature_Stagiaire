package front_office

import (
	"astro-backend/internal/waitlist"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

type FrontOfficeHandler struct {
	Service *FrontOfficeService
}

func NewFrontOfficeHandler(service *FrontOfficeService) *FrontOfficeHandler {
	return &FrontOfficeHandler{Service: service}
}

func (h *FrontOfficeHandler) ToggleFrontOfficeHandler(c *gin.Context) {
	var request ToggleFrontOfficeRequest
	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := h.Service.ToggleFrontOffice(c.Request.Context(), request); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	data := map[string]interface{}{"is_enabled": request.IsEnabled}

	if request.IsEnabled {
		waitlistSvc := waitlist.NewWaitlistService(h.Service.GetDB())
		wlCount, wlErr := waitlistSvc.ProcessPending(c.Request.Context())
		if wlErr != nil {
			log.Warn().Err(wlErr).Msg("waitlist processing after reactivation (non-fatal)")
		}
		data["waitlist_notified"] = wlCount
		log.Info().Int("waitlist_notified", wlCount).Msg("notifications after reactivation")
	}

	pkg.SuccessL(c, "front_office_toggled_successfully", data)
}

func (h *FrontOfficeHandler) GetFrontOfficeStatusHandler(c *gin.Context) {
	status, err := h.Service.GetFrontOfficeStatus(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, status, nil)
}
