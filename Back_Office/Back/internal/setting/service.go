package setting

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type SettingService struct {
	db    *bun.DB
	audit *audit.AuditService
}

func NewSettingService(db *bun.DB, audit *audit.AuditService) *SettingService {
	return &SettingService{
		db:    db,
		audit: audit,
	}
}

func (s *SettingService) GetSettings(ctx context.Context) ([]*domain.Setting, error) {
	log.Info().Str("method", "GetSettings").Msg("Fetching settings...")

	var settings []*domain.Setting

	query := s.db.NewSelect().Model(&settings)

	err := query.Scan(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Database query failed while fetching settings")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().
		Str("method", "GetSettings").
		Int("setting_count", len(settings)).
		Msg("Successfully fetched settings")

	return settings, nil
}

func (s *SettingService) GetSettingsByGroup(ctx context.Context, group string) ([]*domain.Setting, error) {
	log.Info().Str("method", "GetSettingsByGroup").Str("group", group).Msg("Fetching settings...")

	var settings []*domain.Setting

	query := s.db.NewSelect().Model(&settings).Where("group = ?", group)

	err := query.Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Msg("No settings found for the specified group")
			return nil, fmt.Errorf("no settings found for group: %s", group)
		}
		log.Error().Err(err).Msg("Database query failed while fetching settings")
		return nil, fmt.Errorf("database error: %w", err)
	}

	if len(settings) == 0 {
		log.Warn().Msg("No settings found for the specified group")
		return nil, fmt.Errorf("no settings found for group: %s", group)
	}

	log.Info().
		Str("method", "GetSettingsByGroup").
		Str("group", group).
		Int("setting_count", len(settings)).
		Msg("Successfully fetched settings")

	return settings, nil
}

func (s *SettingService) GetSettingsByKey(ctx context.Context, key string) ([]*domain.Setting, error) {
	log.Info().Str("method", "GetSettingsByKey").Str("key", key).Msg("Fetching settings...")

	var settings []*domain.Setting

	query := s.db.NewSelect().Model(&settings).Where("key = ?", key)

	err := query.Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().Msg("No settings found for the specified key")
			return nil, fmt.Errorf("no settings found for key: %s", key)
		}
		log.Error().Err(err).Msg("Database query failed while fetching settings")
		return nil, fmt.Errorf("database error: %w", err)
	}

	if len(settings) == 0 {
		log.Warn().Msg("No settings found for the specified key")
		return nil, fmt.Errorf("no settings found for key: %s", key)
	}

	log.Info().
		Str("method", "GetSettingsByKey").
		Str("key", key).
		Int("setting_count", len(settings)).
		Msg("Successfully fetched settings")

	return settings, nil
}

func (s *SettingService) CreateSetting(ctx context.Context, setting *domain.Setting) (*domain.Setting, error) {
	log.Info().
		Str("method", "CreateSetting").
		Str("group", setting.Group).
		Int("group_order", setting.GroupOrder).
		Str("key", setting.Key).
		Msg("Creating new setting...")

	if setting.Type == "" {
		setting.Type = "text"
	}

	if setting.Value == "" {
		setting.Value = ""
	}

	_, err := s.db.NewInsert().
		Model(setting).
		Returning("*").
		Exec(ctx)
	if err != nil {

		log.Error().Err(err).Msg("Database error while creating setting")
		return nil, fmt.Errorf("database error: %w", err)
	}

	log.Info().
		Int("group_order", setting.GroupOrder).
		Str("group", setting.Group).
		Str("key", setting.Key).
		Msg("Setting created successfully")

	return setting, nil
}

func (s *SettingService) UpdateSetting(ctx context.Context, setting *domain.Setting) (*domain.Setting, error) {
	log.Info().
		Str("method", "UpdateSetting").
		Str("group", setting.Group).
		Str("key", setting.Key).
		Msg("Updating setting...")

	var old domain.Setting
	err := s.db.NewSelect().
		Model(&old).
		Where(`"group" = ? AND "key" = ?`, setting.Group, setting.Key).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch existing setting: %w", err)
	}

	_, err = s.db.NewUpdate().
		Model(setting).
		Column("value", "description", "type", "possible_values", "icon", "group_order").
		Where(`"group" = ? AND "key" = ?`, setting.Group, setting.Key).
		Returning("*").
		Exec(ctx)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Warn().
				Str("group", setting.Group).
				Str("key", setting.Key).
				Msg("Setting not found for update")
			return nil, fmt.Errorf("setting not found")
		}
		log.Error().Err(err).Msg("Database error while updating setting")
		return nil, fmt.Errorf("database error: %w", err)
	}

	_, _ = audit.LogAction(ctx, s.db, pkg.SETTING_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"value": {
				OldValues: old.Value,
				NewValues: setting.Value,
				Changed:   old.Value != setting.Value,
			},
			"type": {
				OldValues: old.Type,
				NewValues: setting.Type,
				Changed:   old.Type != setting.Type,
			},
			"description": {
				OldValues: old.Description,
				NewValues: setting.Description,
				Changed:   old.Description != setting.Description,
			},
		},
	})

	log.Info().
		Str("group", setting.Group).
		Str("key", setting.Key).
		Msg("Setting updated successfully")

	return setting, nil
}
