package email_log

import (
	"astro-backend/domain"
	"astro-backend/pkg/export"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type EmailLogService struct {
	db *bun.DB
}

func (s *EmailLogService) GetAll(ctx context.Context, params EmailLogParams) (*PaginatedEmailLogResponse, error) {
	log.Info().Msg("Fetching all email logs...")

	query := s.db.NewSelect().Model((*domain.EmailLog)(nil))

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.WhereGroup(" AND ", func(inner *bun.SelectQuery) *bun.SelectQuery {
			return inner.
				Where("el.recipient ILIKE ?", searchPattern).
				WhereOr("el.subject ILIKE ?", searchPattern).
				WhereOr("el.candidat_name ILIKE ?", searchPattern).
				WhereOr("el.subject_name ILIKE ?", searchPattern).
				WhereOr("el.template_type ILIKE ?", searchPattern)
		})
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 10
	} else if params.PageSize > 100 {
		params.PageSize = 100
	}

	totalRows, err := query.Count(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to count email logs")
		return nil, fmt.Errorf("database count error: %w", err)
	}

	var emailLogs []*domain.EmailLog
	offset := (params.Page - 1) * params.PageSize
	err = query.
		OrderExpr("el.sent_at DESC").
		Limit(params.PageSize).
		Offset(offset).
		Scan(ctx, &emailLogs)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &PaginatedEmailLogResponse{
				Data: []EmailLogResponse{},
				Pagination: PaginationMetadata{
					Page:       params.Page,
					PageSize:   params.PageSize,
					TotalRows:  0,
					TotalPages: 0,
				},
			}, nil
		}
		log.Error().Err(err).Msg("Database query failed while fetching email logs")
		return nil, fmt.Errorf("database scan error: %w", err)
	}

	totalPages := (totalRows + params.PageSize - 1) / params.PageSize

	log.Info().
		Int("email_logs_count", len(emailLogs)).
		Int("total_rows", int(totalRows)).
		Int("page", params.Page).
		Int("total_pages", int(totalPages)).
		Msg("Successfully fetched email logs")

	return &PaginatedEmailLogResponse{
		Data: ToResponseList(emailLogs),
		Pagination: PaginationMetadata{
			Page:       params.Page,
			PageSize:   params.PageSize,
			TotalRows:  totalRows,
			TotalPages: totalPages,
		},
	}, nil
}

func (s *EmailLogService) GetByID(ctx context.Context, id int) (*domain.EmailLog, error) {
	log.Info().Int("id", id).Msg("Fetching email log by ID...")

	emailLog := &domain.EmailLog{}
	err := s.db.NewSelect().Model(emailLog).
		Where("el.id = ?", id).Scan(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Int("id", id).Msg("Email log not found")
			return nil, fmt.Errorf("email log with ID %d does not exist", id)
		}
		log.Error().Err(err).Int("id", id).Msg("Database error while fetching email log")
		return nil, fmt.Errorf("could not fetch email log: %w", err)
	}

	log.Info().Int("id", id).Msg("Successfully retrieved email log")
	return emailLog, nil
}

func (s *EmailLogService) Export(ctx context.Context, params EmailLogParams) (*export.ExportOptions, error) {
	log.Info().Msg("Exporting email logs...")

	var emailLogs []*domain.EmailLog
	query := s.db.NewSelect().Model(&emailLogs)

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.WhereGroup(" AND ", func(inner *bun.SelectQuery) *bun.SelectQuery {
			return inner.
				Where("el.recipient ILIKE ?", searchPattern).
				WhereOr("el.subject ILIKE ?", searchPattern).
				WhereOr("el.candidat_name ILIKE ?", searchPattern).
				WhereOr("el.subject_name ILIKE ?", searchPattern).
				WhereOr("el.template_type ILIKE ?", searchPattern)
		})
	}

	err := query.OrderExpr("el.sent_at DESC").Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &export.ExportOptions{
				TableOrientation: "L",
				Data:             [][]string{},
				Widths:           []float64{50, 60, 40, 40},
				FileName:         "Email_Logs",
				Title:            "No email logs data",
				Headers:          []string{"Sent At", "Recipient", "Type", "Status"},
			}, nil
		}
		return nil, fmt.Errorf("failed to fetch email logs: %w", err)
	}

	typeLabel := map[string]string{
		"confirmation": "Accusé de réception",
		"acceptance":   "Invitation",
		"disapproval":  "Refus",
		"reopening":    "Réouverture",
	}

	var data [][]string
	for _, el := range emailLogs {
		label, ok := typeLabel[el.TemplateType]
		if !ok {
			label = el.TemplateType
		}
		row := []string{
			el.SentAt,
			el.Recipient,
			label,
			el.Status,
		}
		data = append(data, row)
	}

	return &export.ExportOptions{
		TableOrientation: "L",
		Data:             data,
		Widths:           []float64{50, 40, 40, 40},
		FileName:         "Email_Logs",
		Title:            "Email Logs Report",
		Headers:          []string{"Sent At", "Recipient", "Type", "Status"},
	}, nil
}
