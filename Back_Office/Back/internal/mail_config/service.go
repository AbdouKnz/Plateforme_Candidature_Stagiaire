package mail_config

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"context"
	"crypto/tls"
	"fmt"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	gomail "gopkg.in/gomail.v2"
)

const ConfigGroup = "mail_config"

type MailConfigService struct {
	db *bun.DB
}

func NewMailConfigService(db *bun.DB) *MailConfigService {
	return &MailConfigService{db: db}
}

func (s *MailConfigService) Get(ctx context.Context) (*MailConfigResponse, error) {
	log.Info().Msg("Fetching mail config...")
	keys := []string{"host", "port", "username", "password", "from", "from_name"}
	var settings []*domain.Setting
	err := s.db.NewSelect().Model(&settings).Where(`"group" = ? AND "key" IN (?)`, ConfigGroup, bun.In(keys)).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch mail config: %w", err)
	}
	resp := &MailConfigResponse{}
	for _, s := range settings {
		switch s.Key {
		case "host":
			resp.Host = s.Value
		case "port":
			resp.Port, _ = strconv.Atoi(s.Value)
		case "username":
			resp.Username = s.Value
		case "password":
			resp.Password = s.Value
		case "from":
			resp.From = s.Value
		case "from_name":
			resp.FromName = s.Value
		}
	}
	if resp.Port == 0 {
		resp.Port = 587
	}
	return resp, nil
}

func (s *MailConfigService) Update(ctx context.Context, req UpdateMailConfigRequest) (*MailConfigResponse, error) {
	log.Info().Msg("Updating mail config...")
	req.Host = strings.TrimSpace(req.Host)
	req.Username = strings.TrimSpace(req.Username)
	req.From = strings.TrimSpace(req.From)
	req.FromName = strings.TrimSpace(req.FromName)
	// Snapshot before overwrite for the audit Before/After view.
	// Best-effort: on fetch error proceed with zero-value old.
	old, _ := s.Get(ctx)
	var oldHost string
	var oldPort int
	var oldUsername string
	if old != nil {
		oldHost = old.Host
		oldPort = old.Port
		oldUsername = old.Username
	}
	fields := map[string]string{
		"host":      req.Host,
		"port":      strconv.Itoa(req.Port),
		"username":  req.Username,
		"password":  req.Password,
		"from":      req.From,
		"from_name": req.FromName,
	}
	for key, value := range fields {
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
	audit.LogAction(ctx, s.db, pkg.MAIL_CONFIG_MODULE, pkg.UPDATE_ACTION, domain.ChangeDetail{
		Type: pkg.UPDATE,
		Fields: map[string]domain.FieldChange{
			"host":     {OldValues: oldHost, NewValues: req.Host, Changed: oldHost != req.Host},
			"port":     {OldValues: oldPort, NewValues: req.Port, Changed: oldPort != req.Port},
			"username": {OldValues: oldUsername, NewValues: req.Username, Changed: oldUsername != req.Username},
		},
	})
	return s.Get(ctx)
}

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

// TestConnection tries to connect to the given SMTP server.
// It only verifies connectivity and never saves or logs: the caller persists
// via Update (which writes the single audit row) after approval.
// NOTE: a successful Dial only proves host/port/auth work. It does NOT prove
// the From address will be accepted at send time (many providers reject a
// From that differs from the authenticated account). Send failures caused by
// a rejected From/relay policy surface in SendEmail with the SMTP reason.
func (s *MailConfigService) TestConnection(ctx context.Context, req UpdateMailConfigRequest) error {
	host := strings.TrimSpace(req.Host)
	if host == "" {
		return fmt.Errorf("SMTP connection failed: host is empty")
	}
	if req.Port <= 0 || req.Port > 65535 {
		return fmt.Errorf("SMTP connection failed: port %d is invalid", req.Port)
	}
	if strings.TrimSpace(req.From) == "" {
		return fmt.Errorf("SMTP connection failed: from address is empty")
	}
	dialer := gomail.NewDialer(host, req.Port, strings.TrimSpace(req.Username), req.Password)
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true, ServerName: host}

	conn, err := dialer.Dial()
	if err != nil {
		return fmt.Errorf("SMTP connection failed (%s:%d): %w", host, req.Port, err)
	}
	conn.Close()

	return nil
}

// GetSMTPConfig reads SMTP settings from the database mail_config group.
func GetSMTPConfig(ctx context.Context, db *bun.DB) (*SMTPConfig, error) {
	keys := []string{"host", "port", "username", "password", "from", "from_name"}
	var settings []*domain.Setting
	err := db.NewSelect().Model(&settings).Where(`"group" = ? AND "key" IN (?)`, ConfigGroup, bun.In(keys)).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch smtp config: %w", err)
	}
	cfg := &SMTPConfig{}
	for _, s := range settings {
		switch s.Key {
		case "host":
			cfg.Host = strings.TrimSpace(s.Value)
		case "port":
			cfg.Port, _ = strconv.Atoi(strings.TrimSpace(s.Value))
		case "username":
			cfg.Username = strings.TrimSpace(s.Value)
		case "password":
			cfg.Password = s.Value
		case "from":
			cfg.From = strings.TrimSpace(s.Value)
		case "from_name":
			cfg.FromName = strings.TrimSpace(s.Value)
		}
	}
	if cfg.Port == 0 {
		cfg.Port = 587
	}
	if cfg.Host == "" {
		return nil, fmt.Errorf("SMTP not configured")
	}
	if cfg.From == "" {
		return nil, fmt.Errorf("SMTP configured but from address is empty")
	}
	return cfg, nil
}