package setting

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type SettingHandler struct {
	Service *SettingService
}

func NewSettingHandler(service *SettingService) *SettingHandler {
	return &SettingHandler{Service: service}
}

// GetSettingsHandler godoc
//
//	@Summary		Get all settings
//	@Description	Fetch all settings filtered by group or key
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			group	query	string	false	"Filter by group name"
//	@Param			key		query	string	false	"Search by key name"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=[]domain.Setting}
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/settings [get]
func (h *SettingHandler) GetSettingsHandler(c *gin.Context) {

	settings, err := h.Service.GetSettings(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, settings, nil)
}

// CreateSettingHandler godoc
//
//	@Summary		Create a new setting
//	@Description	Create a setting with group_order, group, key, value, description, type, possible_values, and icon
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			setting	body	CreateSettingRequest	true	"Setting data"
//	@Security		Bearer
//	@Success		201	{object}	pkg.Response{data=domain.Setting}
//	@Failure		400	{object}	pkg.Response
//	@Failure		409	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/settings [post]
func (h *SettingHandler) CreateSettingHandler(c *gin.Context) {
	var request CreateSettingRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	setting := &domain.Setting{
		GroupOrder:     request.GroupOrder,
		Group:          request.Group,
		Key:            request.Key,
		Value:          request.Value,
		Description:    request.Description,
		Type:           request.Type,
		PossibleValues: request.PossibleValues,
		Icon:           request.Icon,
	}

	createdSetting, err := h.Service.CreateSetting(c.Request.Context(), setting)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "settings_updated_successfully", createdSetting)
}

// UpdateSettingHandler godoc
//
//	@Summary		Update an existing setting
//	@Description	Update setting fields by group and key
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			group	path	string					true	"Group name"
//	@Param			key		path	string					true	"Setting key"
//	@Param			setting	body	UpdateSettingRequest	true	"Updated setting data"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=domain.Setting}
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/settings/{group}/{key} [put]
func (h *SettingHandler) UpdateSettingHandler(c *gin.Context) {
	group := c.Param("group")
	key := c.Param("key")

	var request UpdateSettingRequest
	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	setting := &domain.Setting{
		Group:          group,
		Key:            key,
		Value:          request.Value,
		Description:    request.Description,
		Type:           request.Type,
		PossibleValues: request.PossibleValues,
		Icon:           request.Icon,
		GroupOrder:     request.GroupOrder,
	}

	updatedSetting, err := h.Service.UpdateSetting(c.Request.Context(), setting)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "settings_updated_successfully", updatedSetting)
}
