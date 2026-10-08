package module

import (
	models "astro-backend/domain"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type ModuleService struct {
	db *bun.DB
}

func NewModuleService(db *bun.DB) *ModuleService {
	return &ModuleService{
		db: db,
	}
}

func (s *ModuleService) GetAllModules(ctx context.Context) ([]*ModulePermissionsResponse, error) {
	log.Info().Msg("Fetching all modules...")

	var modules []*models.ModulePermissions
	err := s.db.NewSelect().Model(&modules).Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Msg("No modules found")
			return []*ModulePermissionsResponse{}, nil //
		}
		log.Error().Err(err).Msg("Database query failed while fetching modules")
		return nil, fmt.Errorf("database error: %w", err)
	}

	response := make([]*ModulePermissionsResponse, 0, len(modules))
	for _, m := range modules {
		response = append(response, mapToModuleResponse(m))
	}

	log.Info().Int("count", len(response)).Msg("Successfully retrieved modules")
	return response, nil
}

func mapToModuleResponse(m *models.ModulePermissions) *ModulePermissionsResponse {
	enabled := []string{}
	if m.View == 1 {
		enabled = append(enabled, "view")
	}
	if m.Create == 1 {
		enabled = append(enabled, "create")
	}
	if m.Edit == 1 {
		enabled = append(enabled, "edit")
	}
	if m.Delete == 1 {
		enabled = append(enabled, "delete")
	}

	return &ModulePermissionsResponse{
		ID:                 m.ID,
		ModuleName:         m.ModuleName,
		Read:               m.View,
		Add:                m.Create,
		Edit:               m.Edit,
		Delete:             m.Delete,
		ModuleIcon:         m.ModuleIcon,
		ModuleIconColor:    m.ModuleIconColor,
		EnabledPermissions: enabled,
	}
}
