package mail_config

import (
	"astro-backend/domain"
	"astro-backend/internal/audit"
	"astro-backend/pkg"
	"context"
	"crypto/tls"
	"fmt"
	"strconv"

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
			"host": {NewValues: req.Host, Changed: true},
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
// If successful, it saves the config to DB and returns nil.
func (s *MailConfigService) TestConnection(ctx context.Context, req UpdateMailConfigRequest) error {
	dialer := gomail.NewDialer(req.Host, req.Port, req.Username, req.Password)
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	conn, err := dialer.Dial()
	if err != nil {
		return fmt.Errorf("SMTP connection failed: %w", err)
	}
	conn.Close()

	_, err = s.Update(ctx, req)
	if err != nil {
		return fmt.Errorf("config save failed after test: %w", err)
	}
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
			cfg.Host = s.Value
		case "port":
			cfg.Port, _ = strconv.Atoi(s.Value)
		case "username":
			cfg.Username = s.Value
		case "password":
			cfg.Password = s.Value
		case "from":
			cfg.From = s.Value
		case "from_name":
			cfg.FromName = s.Value
		}
	}
	if cfg.Port == 0 {
		cfg.Port = 587
	}
	if cfg.Host == "" {
		return nil, fmt.Errorf("SMTP not configured")
	}
	return cfg, nil
}