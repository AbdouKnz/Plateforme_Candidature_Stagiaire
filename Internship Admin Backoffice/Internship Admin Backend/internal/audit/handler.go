package audit

import (
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"strings"

	"github.com/gin-gonic/gin"
)

type AuditHandler struct {
	Service *AuditService
}

func NewAuditHandler(service *AuditService) *AuditHandler {
	return &AuditHandler{Service: service}
}

func (h *AuditHandler) parseAuditParams(c *gin.Context) AuditParams {
	var params AuditParams

	_ = c.ShouldBindQuery(&params)

	if params.Action == "all" {
		params.Action = ""
	}
	if params.Module == "all" {
		params.Module = ""
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 10
	} else if params.PageSize > 100 {
		params.PageSize = 100
	}

	if params.FileType == "" {
		params.FileType = "pdf"
	}

	return params
}

// GetAuditsHandler godoc
//
//	@Summary		Get all audit logs
//	@Description	Fetch all audit logs with optional filters: action, module, date range, and search, with pagination
//	@Tags			Audit
//	@Accept			json
//	@Produce		json
//	@Param			action		query	string	false	"Filter by action"
//	@Param			module		query	string	false	"Filter by module"
//	@Param			start		query	string	false	"Start date (YYYY-MM-DD)"
//	@Param			end			query	string	false	"End date (YYYY-MM-DD)"
//	@Param			search		query	string	false	"Search term"
//	@Param			page		query	int		false	"Page number (default 1)"
//	@Param			pageSize	query	int		false	"Number of items per page (default 10, max 100)"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=PaginatedAuditResponse}
//	@Failure		400	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/audits [get]
func (h *AuditHandler) GetAuditsHandler(c *gin.Context) {
	params := h.parseAuditParams(c)

	response, err := h.Service.GetAllAudits(c.Request.Context(), params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.AuditResponse(c, response.Data, response.Pagination, response.Filters)
}

// GetAuditByIDHandler godoc
//
//	@Summary		Get audit log by ID
//	@Description	Fetch a single audit log by its ID
//	@Tags			Audit
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Audit log ID"
//	@Security		Bearer
//	@Success		200	{object}	pkg.Response{data=domain.AuditLog}
//	@Failure		400	{object}	pkg.Response
//	@Failure		404	{object}	pkg.Response
//	@Failure		500	{object}	pkg.Response
//	@Router			/api/audits/{id} [get]
func (h *AuditHandler) GetAuditByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	// Updated to use c.Request.Context() for consistency
	audit, err := h.Service.GetAuditByID(c.Request.Context(), id)
	if err != nil {
		pkg.NotFoundL(c, "audit_not_found")
		return
	}

	pkg.OK(c, audit, nil)
}

// ExportAuditHandler godoc
//
//	@Summary		Export audit logs
//	@Description	Export audit logs filtered by action, module, date range, or search term to PDF or Excel
//	@Tags			Audit
//	@Accept			json
//	@Produce		application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
//	@Param			file_type	query	string	false	"File type (pdf/excel)"	default(pdf)
//	@Param			action		query	string	false	"Filter by action"
//	@Param			module		query	string	false	"Filter by module"
//	@Param			start		query	string	false	"Start date (YYYY-MM-DD)"
//	@Param			end			query	string	false	"End date (YYYY-MM-DD)"
//	@Param			search		query	string	false	"Search term"
//	@Security		Bearer
//	@Router			/api/audits/export [post]
func (h *AuditHandler) ExportAuditHandler(c *gin.Context) {
	params := h.parseAuditParams(c)

	exportData, err := h.Service.ExportAudit(c.Request.Context(), params)
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
