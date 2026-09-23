package email_footer

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"context"
	"fmt"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

const ConfigGroup = "email_footer"

type EmailFooterService struct {
	db *bun.DB
}

func NewEmailFooterService(db *bun.DB) *EmailFooterService {
	return &EmailFooterService{db: db}
}

func (s *EmailFooterService) Get(ctx context.Context) (*EmailFooterResponse, error) {
	log.Info().Msg("Fetching email footer...")
	keys := []string{"phone", "email", "linkedin", "website", "address_url"}
	var settings []*domain.Setting
	err := s.db.NewSelect().Model(&settings).Where(`"group" = ? AND "key" IN (?)`, ConfigGroup, bun.In(keys)).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch email footer: %w", err)
	}
	resp := &EmailFooterResponse{}
	for _, s := range settings {
		switch s.Key {
		case "phone":
			resp.Phone = s.Value
		case "email":
			resp.Email = s.Value
		case "linkedin":
			resp.Linkedin = s.Value
		case "website":
			resp.Website = s.Value
		case "address_url":
			resp.AddressURL = s.Value
		}
	}
	return resp, nil
}

func (s *EmailFooterService) Update(ctx context.Context, req UpdateEmailFooterRequest) (*EmailFooterResponse, error) {
	log.Info().Msg("Updating email footer...")
	req.Phone = strings.TrimSpace(req.Phone)
	req.Email = strings.TrimSpace(req.Email)
	req.Linkedin = strings.TrimSpace(req.Linkedin)
	req.Website = strings.TrimSpace(req.Website)
	req.AddressURL = strings.TrimSpace(req.AddressURL)
	// Snapshot before overwrite for the audit Before/After view.
	// Best-effort: on fetch error proceed with zero-value old.
	old, _ := s.Get(ctx)
	fields := map[string]string{
		"phone":       req.Phone,
		"email":       req.Email,
		"linkedin":    req.Linkedin,
		"website":     req.Website,
		"address_url": req.AddressURL,
	}
	fieldChanges := map[string]domain.FieldChange{}
	for key, value := range fields {
		var oldValue string
		if old != nil {
			switch key {
			case "phone":
				oldValue = old.Phone
			case "email":
				oldValue = old.Email
			case "linkedin":
				oldValue = old.Linkedin
			case "website":
				oldValue = old.Website
			case "address_url":
				oldValue = old.AddressURL
			}
		}
		fieldChanges[key] = domain.FieldChange{OldValues: oldValue, NewValues: value, Changed: oldValue != value}
		var existing domain.Setting
		err := s.db.NewSelect().Model(&existing).Where(`"group" = ? AND "key" = ?`, ConfigGroup, key).Scan(ctx)
		if err != nil {
			_, err = s.db.NewInsert().Model(&domain.Setting{Group: ConfigGroup, Key: key, Value: value}).Exec(ctx)
		} else {
			_, err = s.db.NewUpdate().Model(&domain.Setting{Value: value}).Column("value").Where(`"group" = ? AND "key" = ?`, ConfigGroup, key).Exec(ctx)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to set %s: %w", key, err)
		}
	}
	audit.LogAction(ctx, s.db, pkg.EMAIL_FOOTER_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
		Type:   pkg.UPDATE,
		Fields: fieldChanges,
	})
	return s.Get(ctx)
}

// GetEmailFooter reads the email footer settings for the mail send path.
// It never fails the caller: on error it returns an empty footer so the
// mailer falls back to the built-in defaults.
func GetEmailFooter(ctx context.Context, db *bun.DB) *EmailFooterResponse {
	keys := []string{"phone", "email", "linkedin", "website", "address_url"}
	var settings []*domain.Setting
	if err := db.NewSelect().Model(&settings).Where(`"group" = ? AND "key" IN (?)`, ConfigGroup, bun.In(keys)).Scan(ctx); err != nil {
		log.Warn().Err(err).Msg("Failed to fetch email footer, using defaults")
		return &EmailFooterResponse{}
	}
	footer := &EmailFooterResponse{}
	for _, s := range settings {
		switch s.Key {
		case "phone":
			footer.Phone = strings.TrimSpace(s.Value)
		case "email":
			footer.Email = strings.TrimSpace(s.Value)
		case "linkedin":
			footer.Linkedin = strings.TrimSpace(s.Value)
		case "website":
			footer.Website = strings.TrimSpace(s.Value)
		case "address_url":
			footer.AddressURL = strings.TrimSpace(s.Value)
		}
	}
	return footer
}
