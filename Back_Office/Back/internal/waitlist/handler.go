package waitlist

import (
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type WaitlistHandler struct {
	Service *WaitlistService
}

func NewWaitlistHandler(service *WaitlistService) *WaitlistHandler {
	return &WaitlistHandler{Service: service}
}

// SubscribeHandler godoc
//
//	@Summary	Subscribe to waitlist
//	@Description	Public endpoint to join the reopening waitlist
//	@Tags	Waitlist
//	@Accept	json
//	@Produce	json
//	@Param	body	body	SubscribeRequest	true	"Email address"
//	@Success	201	{object}	pkg.Response{data=WaitlistSubscriberResponse}
//	@Failure	400	{object}	pkg.Response
//	@Router	/api/public/waitlist [post]
func (h *WaitlistHandler) SubscribeHandler(c *gin.Context) {
	var req SubscribeRequest
	if err := pkg.BindJSON(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}
	if err := pkg.ValidateStruct(c, &req); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	sub, already, err := h.Service.Subscribe(c.Request.Context(), req.Email)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	resp := ToResponse(sub)
	resp.Already = already
	if already {
		pkg.OK(c, resp, nil)
		return
	}
	pkg.CreatedL(c, "waitlist_subscribed", resp)
}

// ListHandler godoc
//
//	@Summary	List waitlist subscribers
//	@Description	Admin: list all waitlist subscribers
//	@Tags	Waitlist
//	@Produce	json
//	@Security	Bearer
//	@Success	200	{object}	pkg.Response{data=[]WaitlistSubscriberResponse}
//	@Failure	500	{object}	pkg.Response
//	@Router	/api/waitlist [get]
func (h *WaitlistHandler) ListHandler(c *gin.Context) {
	list, err := h.Service.GetAll(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, ToResponseList(list), nil)
}

// StatsHandler godoc
//
//	@Summary	Waitlist stats
//	@Description	Admin: get waitlist statistics
//	@Tags	Waitlist
//	@Produce	json
//	@Security	Bearer
//	@Success	200	{object}	pkg.Response{data=WaitlistStatsResponse}
//	@Failure	500	{object}	pkg.Response
//	@Router	/api/waitlist/stats [get]
func (h *WaitlistHandler) StatsHandler(c *gin.Context) {
	stats, err := h.Service.GetStats(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, stats, nil)
}

// ProcessHandler godoc
//
//	@Summary	Process pending waitlist
//	@Description	Admin: manually trigger processing of pending waitlist subscribers
//	@Tags	Waitlist
//	@Produce	json
//	@Security	Bearer
//	@Success	200	{object}	pkg.Response{data=map[string]int}
//	@Failure	500	{object}	pkg.Response
//	@Router	/api/waitlist/process [post]
func (h *WaitlistHandler) ProcessHandler(c *gin.Context) {
	count, err := h.Service.ProcessPending(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.SuccessL(c, "waitlist_processed", map[string]int{"notified": count})
}
