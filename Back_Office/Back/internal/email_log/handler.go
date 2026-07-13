package email_log

import (
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"strings"

	"github.com/gin-gonic/gin"
)

type EmailLogHandler struct {
	Service *EmailLogService
}

func NewEmailLogHandler(service *EmailLogService) *EmailLogHandler {
	return &EmailLogHandler{Service: service}
}

func (h *EmailLogHandler) GetAllHandler(c *gin.Context) {
	params := EmailLogParams{
		Search:   c.DefaultQuery("search", ""),
		Page:     pkg.ParseInt(c.DefaultQuery("page", "1")),
		PageSize: pkg.ParseInt(c.DefaultQuery("pageSize", "10")),
	}

	response, err := h.Service.GetAll(c.Request.Context(), params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, response.Data, response.Pagination)
}

func (h *EmailLogHandler) ExportHandler(c *gin.Context) {
	params := EmailLogParams{
		Search:   c.DefaultQuery("search", ""),
		FileType: c.DefaultQuery("file_type", "pdf"),
	}

	exportData, err := h.Service.Export(c.Request.Context(), params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	switch strings.ToLower(params.FileType) {
	case "excel":
		export.ExportToExcel(c, *exportData)
	default:
		export.ExportToPDF(c, *exportData)
	}
}

func (h *EmailLogHandler) GetByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	emailLog, err := h.Service.GetByID(c.Request.Context(), id)
	if err != nil {
		pkg.NotFoundL(c, "email_log_not_found")
		return
	}

	pkg.OK(c, ToResponse(emailLog), nil)
}
