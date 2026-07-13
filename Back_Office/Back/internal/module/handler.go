package module

import (
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type ModuleHandler struct {
	Service ModuleService
}

func NewModuleHandler(service ModuleService) *ModuleHandler {
	return &ModuleHandler{Service: service}
}

// GetAllModulesHandler godoc
//
//	@Summary		Get all modules
//	@Description	Fetch all modules with their enabled permissions
//	@Tags			Modules
//	@Accept			json
//	@Produce		json
//	@Security		Bearer
//	@Success		200	{array}		ModulePermissionsResponse
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/modules [get]
func (h *ModuleHandler) GetAllModulesHandler(c *gin.Context) {
	modules, err := h.Service.GetAllModules(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, modules, nil)
}
