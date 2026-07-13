package waitlist

import (
	"astro-backend/domain"
	"astro-backend/internal/mail_config"
	mailPkg "astro-backend/pkg/mail"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

type WaitlistService struct {
	db *bun.DB
}

func NewWaitlistService(db *bun.DB) *WaitlistService {
	return &WaitlistService{db: db}
}

func (s *WaitlistService) Subscribe(ctx context.Context, email string) (*domain.WaitlistSubscriber, bool, error) {
	log.Info().Str("email", email).Msg("Subscribing to waitlist...")

	existing := &domain.WaitlistSubscriber{}
	err := s.db.NewSelect().Model(existing).Where("email = ?", email).Scan(ctx)
	if err == nil {
		log.Info().Str("email", email).Msg("Email already subscribed (idempotent)")
		return existing, true, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, false, fmt.Errorf("could not check existing subscriber: %w", err)
	}

	sub := &domain.WaitlistSubscriber{
		Email:  email,
		Status: "pending",
	}
	_, err = s.db.NewInsert().Model(sub).Exec(ctx)
	if err != nil {
		return nil, false, fmt.Errorf("could not create subscriber: %w", err)
	}

	log.Info().Int("id", sub.ID).Str("email", email).Msg("Subscribed to waitlist")
	return sub, false, nil
}

func (s *WaitlistService) GetAll(ctx context.Context) ([]*domain.WaitlistSubscriber, error) {
	log.Info().Msg("Fetching waitlist subscribers...")

	var subs []*domain.WaitlistSubscriber
	err := s.db.NewSelect().Model(&subs).Order("wls.created_at DESC").Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("could not fetch waitlist: %w", err)
	}
	return subs, nil
}

func (s *WaitlistService) GetStats(ctx context.Context) (*WaitlistStatsResponse, error) {
	var total, pending, notified, failed int

	err := s.db.NewSelect().Model((*domain.WaitlistSubscriber)(nil)).ColumnExpr("COUNT(*)").Scan(ctx, &total)
	if err != nil {
		return nil, fmt.Errorf("could not count total: %w", err)
	}
	err = s.db.NewSelect().Model((*domain.WaitlistSubscriber)(nil)).Where("status = ?", "pending").ColumnExpr("COUNT(*)").Scan(ctx, &pending)
	if err != nil {
		return nil, fmt.Errorf("could not count pending: %w", err)
	}
	err = s.db.NewSelect().Model((*domain.WaitlistSubscriber)(nil)).Where("status = ?", "notified").ColumnExpr("COUNT(*)").Scan(ctx, &notified)
	if err != nil {
		return nil, fmt.Errorf("could not count notified: %w", err)
	}
	err = s.db.NewSelect().Model((*domain.WaitlistSubscriber)(nil)).Where("status = ?", "failed").ColumnExpr("COUNT(*)").Scan(ctx, &failed)
	if err != nil {
		return nil, fmt.Errorf("could not count failed: %w", err)
	}

	return &WaitlistStatsResponse{Total: total, Pending: pending, Notified: notified, Failed: failed}, nil
}

const maxRetries = 2
const batchSize = 50

func (s *WaitlistService) ProcessPending(ctx context.Context) (int, error) {
	log.Info().Msg("Processing pending waitlist subscribers...")

	template := &domain.EmailTemplate{}
	err := s.db.NewSelect().Model(template).
		Where("type = ?", "reopening").
		Where("status = ?", true).
		Limit(1).Scan(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("no active reopening template found, skipping waitlist processing")
		return 0, nil
	}

	smtpCfg, err := mail_config.GetSMTPConfig(ctx, s.db)
	if err != nil {
		log.Warn().Err(err).Msg("SMTP config not found, waitlist processing deferred")
		return 0, nil
	}

	var frontOfficeURL string
	err = s.db.NewSelect().Model((*domain.Setting)(nil)).
		Column("value").
		Where(`"group" = ?`, "front_office").
		Where(`"key" = ?`, "url").
		Scan(ctx, &frontOfficeURL)
	if err != nil {
		frontOfficeURL = "https://candidatures.asteroidea.co/"
	}

	mailer := mailPkg.NewMailer(smtpCfg.Host, smtpCfg.Port, smtpCfg.Username, smtpCfg.Password, smtpCfg.From, smtpCfg.FromName)
	notified := 0

	for {
		var subs []*domain.WaitlistSubscriber

		err = s.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
			// claim rows within the transaction — locks held until commit/rollback
			return tx.NewRaw(`
				UPDATE waitlist_subscribers
				SET status = 'sending'
				WHERE id IN (
					SELECT id FROM waitlist_subscribers
					WHERE status = 'pending'
					ORDER BY id ASC
					LIMIT ?
					FOR UPDATE SKIP LOCKED
				)
				RETURNING id, email
			`, batchSize).Scan(ctx, &subs)
		})
		if err != nil {
			log.Error().Err(err).Msg("error claiming pending waitlist batch")
			break
		}
		if len(subs) == 0 {
			break
		}

		for _, sub := range subs {
			body := template.Body
			body = strings.ReplaceAll(body, "{{NomCandidat}}", sub.Email)
			body = strings.ReplaceAll(body, "{{PlateformeLien}}", frontOfficeURL)
			body = strings.ReplaceAll(body, "{{NomEntreprise}}", "Asteroidea")
			body = strings.ReplaceAll(body, "{{EmailEntreprise}}", smtpCfg.From)

			email := mailPkg.Email{
				To:      []string{sub.Email},
				Subject: template.Subject,
				Body:    body,
			}

			var sendErr error
			for attempt := 0; attempt <= maxRetries; attempt++ {
				if attempt > 0 {
					time.Sleep(time.Duration(attempt) * 2 * time.Second)
				}
				sendErr = mailer.Send(email)
				if sendErr == nil {
					break
				}
				log.Warn().Err(sendErr).Str("email", sub.Email).Int("attempt", attempt+1).Msg("retrying email send")
			}

			now := time.Now().Format("2006-01-02 15:04:05")
			emailStatus := "sent"
			subscriberStatus := "notified"
			if sendErr != nil {
				log.Error().Err(sendErr).Str("email", sub.Email).Msg("failed to send waitlist notification after retries")
				emailStatus = "failed"
				subscriberStatus = "failed"
			}

			_, updateErr := s.db.NewUpdate().Model((*domain.WaitlistSubscriber)(nil)).
				Set("status = ?", subscriberStatus).
				Set("notified_at = ?", now).
				Where("id = ?", sub.ID).
				Exec(ctx)
			if updateErr != nil {
				log.Error().Err(updateErr).Int("id", sub.ID).Msg("failed to mark waitlist subscriber as "+subscriberStatus)
			}

			emailLog := &domain.EmailLog{
				CandidatureID: 0,
				Recipient:     sub.Email,
				Subject:       template.Subject,
				Body:          body,
				TemplateType:  "reopening",
				CandidatName:  sub.Email,
				SubjectName:   "Waitlist",
				Status:        emailStatus,
				SentAt:        now,
			}
			if _, logErr := s.db.NewInsert().Model(emailLog).Exec(ctx); logErr != nil {
				log.Error().Err(logErr).Str("email", sub.Email).Msg("failed to log waitlist email")
			}

			if sendErr == nil {
				notified++
				log.Info().Str("email", sub.Email).Msg("waitlist notification sent")
			}
		}
	}

	log.Info().Int("notified", notified).Msg("waitlist processing complete, clearing table")

	if _, err := s.db.ExecContext(ctx, "DELETE FROM waitlist_subscribers"); err != nil {
		log.Error().Err(err).Msg("failed to clear waitlist_subscribers table")
	} else {
		log.Info().Msg("waitlist_subscribers table cleared")
	}

	return notified, nil
}
