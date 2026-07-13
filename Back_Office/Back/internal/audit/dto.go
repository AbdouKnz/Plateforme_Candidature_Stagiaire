package audit

import (
	"astro-backend/domain"
	"astro-backend/pkg"
)

type LogActionRequest struct {
	ActorID   int                 `json:"actor_id" validate:"required"`
	ActorName string              `json:"actor_name" validate:"required"`
	Module    string              `json:"module" validate:"required"`
	Action    string              `json:"action" validate:"required"`
	Change    domain.ChangeDetail `json:"change" validate:"required"`
}

type AuditLogResponse struct {
	ID        int                 `json:"audit_id"`
	ActorID   int                 `json:"actor_id"`
	ActorName string              `json:"actor_name"`
	Module    string              `json:"module"`
	Action    string              `json:"action"`
	Change    domain.ChangeDetail `json:"change"`
	Icon      string              `json:"icon"`
	Timestamp string              `json:"date"`
}

type AuditParams struct {
	Action   string `form:"action"`
	Module   string `form:"module"`
	Start    string `form:"start"`
	End      string `form:"end"`
	Search   string `form:"search"`
	FileType string `form:"file_type"`
	Page     int    `form:"page"`
	PageSize int    `form:"pageSize"`
}

type AuditFilterOptions struct {
	Modules []string `json:"modules"`
	Actions []string `json:"actions"`
}

var FilterOptions = AuditFilterOptions{
	Modules: pkg.AllModules,
	Actions: pkg.AllActions,
}

type PaginationMetadata struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalRows  int `json:"totalRows"`
	TotalPages int `json:"totalPages"`
}

type PaginatedAuditResponse struct {
	Data       []AuditLogResponse `json:"data"`
	Pagination PaginationMetadata `json:"pagination"`
	Filters    AuditFilterOptions `json:"filters"`
}
