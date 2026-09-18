package front_office

import (
	"astro-backend/domain"
	"astro-backend/internal/waitlist"
	"context"
	"fmt"
	"time"

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

	// Bare dates (no time chosen) inherit the server wall-clock time so the
	// stored value is always a full datetime. Full datetimes and empties pass
	// through untouched.
	reopeningDate := request.ReopeningDate
	if _, err := time.Parse("2006-01-02", reopeningDate); err == nil {
		reopeningDate = reopeningDate + " " + time.Now().Format("15:04")
	}

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
			Value:      reopeningDate,
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

	// Countdown expiry: reopen automatically on read (polled every ~15s, so
	// the flip lands within seconds of the due time). Flip-then-notify keeps
	// concurrent readers idempotent; waitlist failures never fail the read.
	if !status.IsEnabled {
		if due, ok := reopeningDueAt(status.ReopeningDate); ok && !time.Now().Before(due) {
			log.Info().Str("reopening_date", status.ReopeningDate).Msg("Reopening time reached, auto-enabling front office...")
			if err := s.persistAutoReopen(ctx); err != nil {
				log.Error().Err(err).Msg("Failed to persist front office auto-reopen")
			} else {
				status.IsEnabled = true
				status.ReopeningDate = ""
				wlSvc := waitlist.NewWaitlistService(s.db)
				if notified, wlErr := wlSvc.ProcessPending(ctx); wlErr != nil {
					log.Warn().Err(wlErr).Msg("waitlist processing after auto-reopen (non-fatal)")
				} else {
					log.Info().Int("waitlist_notified", notified).Msg("waitlist notifications after auto-reopen")
				}
			}
		}
	}

	return status, nil
}

// reopeningDueAt parses stored reopening values ("2006-01-02 15:04", optional
// seconds, or legacy date-only = start of that day) in server-local wall
// clock. ok=false for empty/unparseable values (manual-only mode).
func reopeningDueAt(value string) (time.Time, bool) {
	for _, layout := range []string{"2006-01-02 15:04:05", "2006-01-02 15:04"} {
		if t, err := time.ParseInLocation(layout, value, time.Local); err == nil {
			return t, true
		}
	}
	if t, err := time.ParseInLocation("2006-01-02", value, time.Local); err == nil {
		return t, true
	}
	return time.Time{}, false
}

// persistAutoReopen flips enabled on and clears the consumed reopening date.
func (s *FrontOfficeService) persistAutoReopen(ctx context.Context) error {
	for key, value := range map[string]string{"enabled": "true", "reopening_date": ""} {
		if _, err := s.db.NewInsert().
			Model(&domain.Setting{Group: "front_office", Key: key, Value: value, Type: "string"}).
			On("CONFLICT (\"group\", \"key\") DO UPDATE SET value = EXCLUDED.value").
			Exec(ctx); err != nil {
			return fmt.Errorf("could not persist auto-reopen %s: %w", key, err)
		}
	}
	return nil
}
