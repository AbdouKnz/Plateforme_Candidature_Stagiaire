package audit

import (
	"astro-backend/domain"
	"astro-backend/middleware"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type AuditService struct {
	db *bun.DB
}

func NewAuditService(db *bun.DB) *AuditService {
	return &AuditService{db: db}
}

func buildBaseAuditQuery(query *bun.SelectQuery, params AuditParams) *bun.SelectQuery {
	if params.Action != "" {
		query = query.Where("action = ?", params.Action)
	}

	if params.Module != "" {
		query = query.Where("module = ?", params.Module)
	}

	if params.Start == "" && params.End == "" {
		today := time.Now().UTC().Truncate(24 * time.Hour)
		tomorrow := today.Add(24 * time.Hour)
		startStr := today.Format("2006-01-02 15:04:05")
		endStr := tomorrow.Format("2006-01-02 15:04:05")
		query = query.Where("time_stamp >= ? AND time_stamp < ?", startStr, endStr)
	} else if params.Start != "" && params.End != "" {
		query = query.Where("time_stamp BETWEEN ? AND ?", params.Start, params.End)
	} else if params.Start != "" {
		query = query.Where("time_stamp >= ?", params.Start)
	} else if params.End != "" {
		query = query.Where("time_stamp <= ?", params.End)
	}

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.WhereGroup(" AND ", func(inner *bun.SelectQuery) *bun.SelectQuery {
			return inner.
				Where("actor_name ILIKE ?", searchPattern).
				WhereOr("module ILIKE ?", searchPattern).
				WhereOr("action ILIKE ?", searchPattern).
				WhereOr("CAST(actor_id AS TEXT) LIKE ?", searchPattern)
		})
	}

	return query
}

func (s *AuditService) GetAllAudits(ctx context.Context, params AuditParams) (*PaginatedAuditResponse, error) {
	log.Info().
		Str("action", params.Action).
		Str("module", params.Module).
		Str("start", params.Start).
		Str("end", params.End).
		Str("search", params.Search).
		Int("page", params.Page).
		Int("pageSize", params.PageSize).
		Msg("Fetching paginated audit logs...")

	baseQuery := s.db.NewSelect().Model((*domain.AuditLog)(nil))
	query := buildBaseAuditQuery(baseQuery, params)

	totalRows, err := query.Count(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to count audit logs")
		return nil, fmt.Errorf("database count error: %w", err)
	}

	var auditLogs []*domain.AuditLog
	offset := (params.Page - 1) * params.PageSize
	err = query.
		OrderExpr("time_stamp DESC").
		Limit(params.PageSize).
		Offset(offset).
		Scan(ctx, &auditLogs)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Msg("No audit logs found matching criteria")
			return &PaginatedAuditResponse{
				Data: []AuditLogResponse{},
				Pagination: PaginationMetadata{
					Page:       params.Page,
					PageSize:   params.PageSize,
					TotalRows:  0,
					TotalPages: 0,
				},
			}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching audit logs")
		return nil, fmt.Errorf("database scan error: %w", err)
	}

	response := make([]AuditLogResponse, 0, len(auditLogs))
	for _, l := range auditLogs {
		response = append(response, AuditLogResponse{
			ID:        l.ID,
			ActorID:   l.ActorID,
			ActorName: l.ActorName,
			Module:    l.Module,
			Action:    l.Action,
			Change:    l.Change,
			Icon:      l.Icon,
			Timestamp: l.Timestamp,
		})
	}

	totalPages := (totalRows + params.PageSize - 1) / params.PageSize

	log.Info().
		Int("audit_logs_count", len(auditLogs)).
		Int("total_rows", int(totalRows)).
		Int("page", params.Page).
		Int("total_pages", int(totalPages)).
		Msg("Successfully fetched paginated audit logs")

	return &PaginatedAuditResponse{
		Data: response,
		Pagination: PaginationMetadata{
			Page:       params.Page,
			PageSize:   params.PageSize,
			TotalRows:  totalRows,
			TotalPages: totalPages,
		},
		Filters: FilterOptions,
	}, nil
}

func (s *AuditService) GetAuditByID(ctx context.Context, auditID int) (*domain.AuditLog, error) {
	log.Info().Int("auditID", auditID).Msg("Fetching audit log with ID:")

	var audit domain.AuditLog
	err := s.db.NewSelect().
		Model(&audit).
		Where("id = ?", auditID).
		Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("auditID", auditID).Msg("audit log not found")
			return nil, fmt.Errorf("audit log with ID %d does not exist", auditID)
		}
		log.Error().Err(err).Int("auditID", auditID).Msg("Database query failed while fetching audit log")
		return nil, err
	}

	log.Info().Msg("Successfully retrieved audit log")
	return &audit, nil
}

func buildAuditExportQuery(query *bun.SelectQuery, params AuditParams) *bun.SelectQuery {
	return buildBaseAuditQuery(query, params).OrderExpr("time_stamp DESC")
}

func mapAuditToExportData(auditLogs []*domain.AuditLog) [][]string {
	var data [][]string
	for _, logEntry := range auditLogs {
		row := []string{
			fmt.Sprintf("%d", logEntry.ID),
			fmt.Sprintf("%d", logEntry.ActorID),
			pkg.DefaultIfEmpty(logEntry.ActorName, "N/A"),
			pkg.DefaultIfEmpty(logEntry.Module, "N/A"),
			pkg.DefaultIfEmpty(logEntry.Action, "N/A"),
			logEntry.Timestamp,
		}
		data = append(data, row)
	}
	return data
}

func (s *AuditService) ExportAudit(ctx context.Context, params AuditParams) (*export.ExportOptions, error) {
	log.Info().Str("Type", params.FileType).Msg("Exporting Audit Logs")

	baseQuery := s.db.NewSelect().Model((*domain.AuditLog)(nil))
	query := buildAuditExportQuery(baseQuery, params)

	var auditLogs []*domain.AuditLog
	err := query.Scan(ctx, &auditLogs)

	headers := []string{"ID", "Actor ID", "Actor Name", "Module", "Action", "Timestamp"}
	if params.FileType == "excel" {
		headers = []string{"id", "actor_id", "actor_name", "module", "action", "timestamp"}
	}

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Error().Err(err).Msg("Failed to fetch audit logs for export")
		return nil, fmt.Errorf("failed to fetch logs: %w", err)
	}

	if len(auditLogs) == 0 {
		log.Warn().Msg("No audit logs found matching criteria")
		return &export.ExportOptions{
			TableOrientation: "L",
			Data:             [][]string{},
			Widths:           []float64{30, 30, 60, 45, 50, 60},
			FileName:         "Audit",
			Title:            "No audit data",
			Headers:          headers,
		}, nil
	}

	return &export.ExportOptions{
		TableOrientation: "L",
		Data:             mapAuditToExportData(auditLogs),
		Widths:           []float64{30, 30, 60, 45, 50, 60},
		FileName:         "Audit",
		Title:            "Audit Report",
		Headers:          headers,
	}, nil
}
func LogAction(ctx context.Context, db bun.IDB, module, action string, change domain.ChangeDetail) (*domain.AuditLog, error) {
	actor, err := middleware.GetActorFromContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get actor: %w", err)
	}

	log.Info().
		Int("actorID", actor.UserID).
		Str("actorName", actor.FirstName+" "+actor.LastName).
		Str("module", module).
		Str("action", action).
		Msg("Creating AuditLog ...")

	icon := getAuditIcon(module)
	if icon == "" {
		log.Warn().
			Str("module", module).
			Msg("No icon found for module, proceeding with empty icon")
	}

	auditLog := &domain.AuditLog{
		ActorID:   actor.UserID,
		ActorName: actor.FirstName + " " + actor.LastName,
		Module:    module,
		Action:    action,
		Change:    change,
		Icon:      icon,
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}

	if _, err = db.NewInsert().Model(auditLog).Exec(ctx); err != nil {
		log.Error().
			Err(err).
			Int("actorID", actor.UserID).
			Str("actorName", actor.FirstName+" "+actor.LastName).
			Str("module", module).
			Str("action", action).
			Msg("Could not log audit action")
	}

	log.Info().
		Int("actorID", actor.UserID).
		Str("actorName", actor.FirstName+" "+actor.LastName).
		Str("module", module).
		Str("action", action).
		Msg("Audit log created successfully")

	return auditLog, nil
}

var auditIconMap = map[string]string{
	pkg.USER_MODULE:        "IconUser",
	pkg.ROLE_MODULE:        "IconShield",
	pkg.AUTH_MODULE:        "IconKey",
	pkg.SETTING_MODULE:     "IconSettings",
	pkg.SUBJECT_MODULE:     "IconNotebook",
	pkg.CANDIDATURE_MODULE: "IconFileDescription",
	pkg.EMAIL_LOG_MODULE:   "IconSend",
}

func getAuditIcon(module string) string {
	if icon, ok := auditIconMap[module]; ok {
		return icon
	}
	return ""
}
