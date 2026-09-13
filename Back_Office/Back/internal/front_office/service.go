package front_office

import (
	"astro-backend/domain"
	"context"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type FrontOfficeService struct {
	db *bun.DB
}

func (s *FrontOfficeService) GetDB() *bun.DB {
	return s.db
}

func NewFrontOfficeService(db *bun.DB) *FrontOfficeService {
	return &FrontOfficeService{
		db: db,
	}
}

func (s *FrontOfficeService) ToggleFrontOffice(ctx context.Context, request ToggleFrontOfficeRequest) error {
	log.Info().Bool("is_enabled", request.IsEnabled).Msg("Toggling front office...")

	_, err := s.db.NewInsert().
		Model(&domain.Setting{
			Group:      "front_office",
			Key:        "enabled",
			Value:      fmt.Sprintf("%t", request.IsEnabled),
			Type:       "boolean",
			GroupOrder: 1,
		}).
		On("CONFLICT (\"group\", \"key\") DO UPDATE SET value = EXCLUDED.value").
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not update front office enabled setting: %w", err)
	}

	_, err = s.db.NewInsert().
		Model(&domain.Setting{
			Group:      "front_office",
			Key:        "reopening_date",
			Value:      request.ReopeningDate,
			Type:       "string",
			GroupOrder: 2,
		}).
		On("CONFLICT (\"group\", \"key\") DO UPDATE SET value = EXCLUDED.value").
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not update reopening date setting: %w", err)
	}

	_, err = s.db.NewInsert().
		Model(&domain.Setting{
			Group:      "front_office",
			Key:        "year",
			Value:      request.Year,
			Type:       "string",
			GroupOrder: 3,
		}).
		On("CONFLICT (\"group\", \"key\") DO UPDATE SET value = EXCLUDED.value").
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not update year setting: %w", err)
	}

	_, err = s.db.NewInsert().
		Model(&domain.Setting{
			Group:      "front_office",
			Key:        "internship_title",
			Value:      request.InternshipTitle,
			Type:       "string",
			GroupOrder: 4,
		}).
		On("CONFLICT (\"group\", \"key\") DO UPDATE SET value = EXCLUDED.value").
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not update internship title setting: %w", err)
	}

	return nil
}

func (s *FrontOfficeService) GetFrontOfficeStatus(ctx context.Context) (*FrontOfficeStatusResponse, error) {
	var settings []*domain.Setting
	err := s.db.NewSelect().Model(&settings).
		Where(`"group" = ?`, "front_office").
		Where(`"key" IN (?, ?, ?, ?)`, "enabled", "reopening_date", "year", "internship_title").
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not fetch front office status: %w", err)
	}

	status := &FrontOfficeStatusResponse{IsEnabled: true}
	for _, setting := range settings {
		switch setting.Key {
		case "enabled":
			status.IsEnabled = setting.Value == "true"
		case "reopening_date":
			status.ReopeningDate = setting.Value
		case "year":
			status.Year = setting.Value
		case "internship_title":
			status.InternshipTitle = setting.Value
		}
	}

	return status, nil
}
