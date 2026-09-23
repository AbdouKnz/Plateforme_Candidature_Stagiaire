package front_office

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/internal/waitlist"
	"astro-backend/pkg"
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

	// Snapshot before overwrite for the split Before/After audit view.
	// Best-effort: on fetch error the toggle still succeeds, just unaudited.
	oldToggle, snapErr := s.snapshotToggleKeys(ctx)
	if snapErr != nil {
		log.Warn().Err(snapErr).Msg("Front office toggle snapshot failed, skipping audit")
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

	// Split audit: one row per concern that actually changed, so the Status,
	// Title and Footer modules each document their own history.
	if oldToggle != nil {
		newEnabled := fmt.Sprintf("%t", request.IsEnabled)
		statusFields := map[string]domain.FieldChange{}
		if oldToggle["enabled"] != newEnabled {
			statusFields["is_enabled"] = domain.FieldChange{OldValues: oldToggle["enabled"], NewValues: newEnabled, Changed: true}
		}
		if oldToggle["reopening_date"] != reopeningDate {
			statusFields["reopening_date"] = domain.FieldChange{OldValues: oldToggle["reopening_date"], NewValues: reopeningDate, Changed: true}
		}
		if len(statusFields) > 0 {
			audit.LogAction(ctx, s.db, pkg.FRONT_OFFICE_STATUS_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
				Type:   pkg.UPDATE,
				Fields: statusFields,
			})
		}
		infoFields := map[string]domain.FieldChange{}
		if oldToggle["year"] != request.Year {
			infoFields["year"] = domain.FieldChange{OldValues: oldToggle["year"], NewValues: request.Year, Changed: true}
		}
		if oldToggle["internship_title"] != request.InternshipTitle {
			infoFields["internship_title"] = domain.FieldChange{OldValues: oldToggle["internship_title"], NewValues: request.InternshipTitle, Changed: true}
		}
		if len(infoFields) > 0 {
			audit.LogAction(ctx, s.db, pkg.INTERNSHIP_TITLE_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
				Type:   pkg.UPDATE,
				Fields: infoFields,
			})
		}
	}

	return nil
}

// snapshotToggleKeys reads the current toggle-controlled settings for the
// Before/After audit view. Plain select (no auto-reopen side effect).
func (s *FrontOfficeService) snapshotToggleKeys(ctx context.Context) (map[string]string, error) {
	return s.snapshotKeys(ctx, []string{"enabled", "reopening_date", "year", "internship_title"})
}

func (s *FrontOfficeService) GetFrontOfficeStatus(ctx context.Context) (*FrontOfficeStatusResponse, error) {
	var settings []*domain.Setting
	err := s.db.NewSelect().Model(&settings).
		Where(`"group" = ?`, "front_office").
		Where(`"key" IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, "enabled", "reopening_date", "year", "internship_title", "footer_phone", "footer_email", "footer_linkedin", "footer_website", "footer_privacy_url", "footer_terms_url").
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
		case "footer_phone":
			status.FooterPhone = setting.Value
		case "footer_email":
			status.FooterEmail = setting.Value
		case "footer_linkedin":
			status.FooterLinkedin = setting.Value
		case "footer_website":
			status.FooterWebsite = setting.Value
		case "footer_privacy_url":
			status.FooterPrivacyURL = setting.Value
		case "footer_terms_url":
			status.FooterTermsURL = setting.Value
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

// UpdateFooter upserts the front office footer settings (contact links and
// legal URLs). Empty values are stored as-is; readers fall back to defaults.
func (s *FrontOfficeService) UpdateFooter(ctx context.Context, request UpdateFrontOfficeFooterRequest) error {
	log.Info().Msg("Updating front office footer...")
	fields := map[string]string{
		"footer_phone":       request.FooterPhone,
		"footer_email":       request.FooterEmail,
		"footer_linkedin":    request.FooterLinkedin,
		"footer_website":     request.FooterWebsite,
		"footer_privacy_url": request.FooterPrivacyURL,
		"footer_terms_url":   request.FooterTermsURL,
	}
	// Snapshot before overwrite for the audit Before/After view.
	// Best-effort: on fetch error the update still succeeds, just unaudited.
	oldFooter := map[string]string{}
	if settings, snapErr := s.snapshotKeys(ctx, []string{"footer_phone", "footer_email", "footer_linkedin", "footer_website", "footer_privacy_url", "footer_terms_url"}); snapErr == nil {
		oldFooter = settings
	} else {
		log.Warn().Err(snapErr).Msg("Front office footer snapshot failed, skipping audit")
	}
	fieldChanges := map[string]domain.FieldChange{}
	order := 5
	for key, value := range fields {
		order++
		_, err := s.db.NewInsert().
			Model(&domain.Setting{
				Group:      "front_office",
				Key:        key,
				Value:      value,
				Type:       "string",
				GroupOrder: order,
			}).
			On("CONFLICT (\"group\", \"key\") DO UPDATE SET value = EXCLUDED.value").
			Exec(ctx)
		if err != nil {
			return fmt.Errorf("could not update front office footer setting %s: %w", key, err)
		}
		if oldFooter[key] != value {
			fieldChanges[key] = domain.FieldChange{OldValues: oldFooter[key], NewValues: value, Changed: true}
		}
	}
	if len(fieldChanges) > 0 {
		audit.LogAction(ctx, s.db, pkg.FRONT_OFFICE_FOOTER_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
			Type:   pkg.UPDATE,
			Fields: fieldChanges,
		})
	}
	return nil
}

// snapshotKeys reads current values for the given front_office keys.
func (s *FrontOfficeService) snapshotKeys(ctx context.Context, keys []string) (map[string]string, error) {
	var settings []*domain.Setting
	err := s.db.NewSelect().Model(&settings).
		Where(`"group" = ?`, "front_office").
		Where(`"key" IN (?)`, bun.In(keys)).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	out := map[string]string{}
	for _, setting := range settings {
		out[setting.Key] = setting.Value
	}
	return out, nil
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
