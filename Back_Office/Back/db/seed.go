package db

import (
	"astro-backend/config"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

func MigrateTechnologyTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking technology table schema...")

	exists, err := db.NewSelect().Model((*domain.Technology)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if technology table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Technology table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS technology (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				status BOOLEAN NOT NULL DEFAULT true,
				created_at TIMESTAMP DEFAULT current_timestamp,
				updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create technology table")
			return err
		}
		log.Info().Msg("Technology table created successfully")
	} else {
		log.Info().Msg("Technology table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE technology 
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate technology table columns")
			return err
		}
		log.Info().Msg("Technology table schema is up to date")
	}
	return nil
}

func MigrateDurationTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking duration table schema...")

	exists, err := db.NewSelect().Model((*domain.Duration)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if duration table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Duration table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS duration (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				status BOOLEAN NOT NULL DEFAULT true,
				created_at TIMESTAMP DEFAULT current_timestamp,
				updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create duration table")
			return err
		}
		log.Info().Msg("Duration table created successfully")
	} else {
		log.Info().Msg("Duration table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE duration 
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate duration table columns")
			return err
		}
		log.Info().Msg("Duration table schema is up to date")
	}
	return nil
}

func MigrateSubjectTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking subject table schema...")

	exists, err := db.NewSelect().Model((*domain.Subject)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if subject table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Subject table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS subject (
				id SERIAL PRIMARY KEY,
				code VARCHAR(255) NOT NULL UNIQUE,
				name VARCHAR(255) NOT NULL,
				description TEXT NOT NULL,
				image_path TEXT DEFAULT '',
				status BOOLEAN NOT NULL DEFAULT true,
				online_quiz_link TEXT DEFAULT '',
				online_meeting_link TEXT DEFAULT '',
				f2f_meeting_link TEXT DEFAULT '',
				duration_id INT DEFAULT NULL,
				created_at TIMESTAMP DEFAULT current_timestamp,
				updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create subject table")
			return err
		}
		log.Info().Msg("Subject table created successfully")
	} else {
		log.Info().Msg("Subject table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE subject
				ADD COLUMN IF NOT EXISTS code VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS image_path TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS online_quiz_link TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS online_meeting_link TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS f2f_meeting_link TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS duration_id INT DEFAULT NULL,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp,
				DROP COLUMN IF EXISTS priority_rank,
				DROP COLUMN IF EXISTS technology_id,
				DROP COLUMN IF EXISTS profile_id
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate subject table columns")
			return err
		}
		log.Info().Msg("Subject table schema is up to date")
	}

	// Create join tables
	log.Info().Msg("Checking subject_technologies table...")
	_, err = db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS subject_technologies (
			subject_id INT NOT NULL,
			technology_id INT NOT NULL,
			PRIMARY KEY (subject_id, technology_id)
		)
	`)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create subject_technologies table")
		return err
	}

	log.Info().Msg("Checking subject_profiles table...")
	_, err = db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS subject_profiles (
			subject_id INT NOT NULL,
			profile_id INT NOT NULL,
			PRIMARY KEY (subject_id, profile_id)
		)
	`)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create subject_profiles table")
		return err
	}

	return nil
}

func MigrateCandidatureTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking candidature table schema...")

	// Enum des statuts par étape (créé une seule fois)
	_, _ = db.ExecContext(ctx, `DO $$ BEGIN CREATE TYPE step_status AS ENUM ('pending','accepted','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)

	exists, err := db.NewSelect().Model((*domain.Candidature)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if candidature table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Candidature table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS candidature (
				id SERIAL PRIMARY KEY,
				first_name VARCHAR(255) DEFAULT '',
				last_name VARCHAR(255) DEFAULT '',
				full_name VARCHAR(255) NOT NULL,
				email1 VARCHAR(255) NOT NULL,
				gender1 VARCHAR(50) NOT NULL,
				phone1 VARCHAR(50) NOT NULL,
				degree1 VARCHAR(255) DEFAULT '',
				first_name2 VARCHAR(255) DEFAULT '',
				last_name2 VARCHAR(255) DEFAULT '',
				full_name2 VARCHAR(255) DEFAULT '',
				email2 VARCHAR(255) DEFAULT '',
				gender2 VARCHAR(50) DEFAULT '',
				phone2 VARCHAR(50) DEFAULT '',
				degree2 VARCHAR(255) DEFAULT '',
				duration VARCHAR(100) DEFAULT '',
				methode VARCHAR(50) DEFAULT '',
				start_date VARCHAR(100) DEFAULT '',
			subject_name VARCHAR(255) DEFAULT '',
			subject_code VARCHAR(255) DEFAULT '',
			university VARCHAR(255) DEFAULT '',
			university2 VARCHAR(255) DEFAULT '',
			date_application VARCHAR(100) DEFAULT '',
				path_cv TEXT DEFAULT '',
				path_lettre_motivation TEXT DEFAULT '',
				path_cv2 TEXT DEFAULT '',
				path_lettre_motivation2 TEXT DEFAULT '',
				status VARCHAR(50) NOT NULL DEFAULT 'pending',
				step VARCHAR(50) NOT NULL DEFAULT 'cv_screening',
				current_step INT NOT NULL DEFAULT 1,
				step1_status step_status DEFAULT NULL,
				step2_status step_status DEFAULT NULL,
				step3_status step_status DEFAULT NULL,
				step4_status step_status DEFAULT NULL,
				step5_status step_status DEFAULT NULL,
				score_cv_screening INT NOT NULL DEFAULT 0,
				score_online_quiz INT NOT NULL DEFAULT 0,
				score_online_meeting INT NOT NULL DEFAULT 0,
				score_f2f_meeting INT NOT NULL DEFAULT 0,
				score_final_decision INT NOT NULL DEFAULT 0,
				notes TEXT DEFAULT '',
				rejection_reason TEXT DEFAULT '',
				created_at TIMESTAMP DEFAULT current_timestamp,
				updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create candidature table")
			return err
		}
		log.Info().Msg("Candidature table created successfully")
	} else {
		log.Info().Msg("Candidature table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE candidature 
				ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS email1 VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS gender1 VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS phone1 VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS degree1 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS first_name2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS last_name2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS full_name2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS email2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS gender2 VARCHAR(50) DEFAULT '',
				ADD COLUMN IF NOT EXISTS phone2 VARCHAR(50) DEFAULT '',
				ADD COLUMN IF NOT EXISTS degree2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS duration VARCHAR(100) DEFAULT '',
				ADD COLUMN IF NOT EXISTS methode VARCHAR(50) DEFAULT '',
				ADD COLUMN IF NOT EXISTS start_date VARCHAR(100) DEFAULT '',
			ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS subject_code VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS university2 VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS date_application VARCHAR(100) DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_cv TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_lettre_motivation TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_cv2 TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_lettre_motivation2 TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending',
				ADD COLUMN IF NOT EXISTS step VARCHAR(50) NOT NULL DEFAULT 'cv_screening',
				ADD COLUMN IF NOT EXISTS current_step INT NOT NULL DEFAULT 1,
				ADD COLUMN IF NOT EXISTS step1_status step_status DEFAULT NULL,
				ADD COLUMN IF NOT EXISTS step2_status step_status DEFAULT NULL,
				ADD COLUMN IF NOT EXISTS step3_status step_status DEFAULT NULL,
				ADD COLUMN IF NOT EXISTS step4_status step_status DEFAULT NULL,
				ADD COLUMN IF NOT EXISTS step5_status step_status DEFAULT NULL,
				ADD COLUMN IF NOT EXISTS score_cv_screening INT NOT NULL DEFAULT 0,
				ADD COLUMN IF NOT EXISTS score_online_quiz INT NOT NULL DEFAULT 0,
				ADD COLUMN IF NOT EXISTS score_online_meeting INT NOT NULL DEFAULT 0,
				ADD COLUMN IF NOT EXISTS score_f2f_meeting INT NOT NULL DEFAULT 0,
				ADD COLUMN IF NOT EXISTS score_final_decision INT NOT NULL DEFAULT 0,
				ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate candidature table columns")
			return err
		}
		log.Info().Msg("Candidature table schema is up to date")
	}

	if err := backfillStepStatuses(ctx, db); err != nil {
		log.Error().Err(err).Msg("Failed to backfill per-step statuses")
		return err
	}

	// Le suivi par étape vit désormais sur la ligne candidature elle-même :
	// la table d'historique legacy n'est plus utilisée.
	if _, err := db.ExecContext(ctx, `DROP TABLE IF EXISTS candidature_stage`); err != nil {
		log.Warn().Err(err).Msg("Could not drop legacy candidature_stage table")
	} else {
		log.Info().Msg("Dropped legacy candidature_stage table")
	}

	// Rescale legacy scores stored on a /100 scale down to /20 (divide by 5).
	_, err = db.ExecContext(ctx, `
		UPDATE candidature SET
			score_cv_screening = ROUND(score_cv_screening::numeric / 5),
			score_online_quiz = ROUND(score_online_quiz::numeric / 5),
			score_online_meeting = ROUND(score_online_meeting::numeric / 5),
			score_f2f_meeting = ROUND(score_f2f_meeting::numeric / 5),
			score_final_decision = ROUND(score_final_decision::numeric / 5)
		WHERE score_cv_screening > 20
			OR score_online_quiz > 20
			OR score_online_meeting > 20
			OR score_f2f_meeting > 20
			OR score_final_decision > 20
	`)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to rescale legacy scores to /20")
	} else {
		log.Info().Msg("Rescaled legacy scores to /20")
	}

	_, err = db.ExecContext(ctx, `UPDATE candidature SET status = 'pending' WHERE status = 'on_hold'`)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to migrate 'on_hold' rows to 'pending'")
	} else {
		log.Info().Msg("Migrated 'on_hold' rows to 'pending'")
	}

	_, err = db.ExecContext(ctx, `
		UPDATE candidature
		SET first_name = split_part(full_name, ' ', 1),
		    last_name  = CASE
				WHEN full_name LIKE '% %' THEN split_part(full_name, ' ', 2) || CASE WHEN full_name LIKE '% % %' THEN ' ' || substring(full_name from position(' ' in full_name) + 1) ELSE '' END
				ELSE full_name
			END
		WHERE (first_name = '' OR last_name = '') AND full_name <> ''
	`)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to backfill first_name/last_name from full_name")
	} else {
		log.Info().Msg("Backfilled first_name/last_name from full_name")
	}

	// Repair previously polluted paths: strip everything before the last "uploads/"
	// segment so stored values are always relative (e.g. uploads/cvs/file.pdf).
	_, err = db.ExecContext(ctx, `
		UPDATE candidature
		SET path_cv = regexp_replace(path_cv, '^.*uploads/(.*)$', 'uploads/\1'),
		    path_lettre_motivation = regexp_replace(path_lettre_motivation, '^.*uploads/(.*)$', 'uploads/\1'),
		    path_cv2 = regexp_replace(path_cv2, '^.*uploads/(.*)$', 'uploads/\1'),
		    path_lettre_motivation2 = regexp_replace(path_lettre_motivation2, '^.*uploads/(.*)$', 'uploads/\1')
		WHERE path_cv <> '' OR path_lettre_motivation <> '' OR path_cv2 <> '' OR path_lettre_motivation2 <> ''
	`)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to repair candidature file paths")
	} else {
		log.Info().Msg("Repaired candidature file paths (removed URL prefixes)")
	}

	return nil
}

func MigrateAuditTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking audit table schema...")

	_, err := db.ExecContext(ctx, `
		ALTER TABLE audit
			ADD COLUMN IF NOT EXISTS target_id INT NOT NULL DEFAULT 0
	`)
	if err != nil {
		log.Error().Err(err).Msg("Failed to migrate audit table columns")
		return err
	}

	_, err = db.ExecContext(ctx, `
		CREATE INDEX IF NOT EXISTS idx_audit_module_target_timestamp
		ON audit (module, target_id, time_stamp DESC)
	`)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create audit candidature index")
		return err
	}

	_, err = db.ExecContext(ctx, `
		DELETE FROM audit
		WHERE LOWER(module) = 'candidature'
		  AND LOWER(action) NOT IN ('accept', 'reject')
	`)
	if err != nil {
		log.Error().Err(err).Msg("Failed to remove legacy candidature CRUD audit rows")
		return err
	}
	return nil
}

func MigrateTypeTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking type table schema...")

	exists, err := db.NewSelect().Model((*domain.Type)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if type table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Type table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS type_table (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				status BOOLEAN NOT NULL DEFAULT true,
				created_at TIMESTAMP DEFAULT current_timestamp,
				updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create type table")
			return err
		}
		log.Info().Msg("Type table created successfully")
	} else {
		log.Info().Msg("Type table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE type_table 
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate type table columns")
			return err
		}
		log.Info().Msg("Type table schema is up to date")
	}
	return nil
}

func MigrateProfileTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking profile table schema...")

	exists, err := db.NewSelect().Model((*domain.Profile)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if profile table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Profile table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS profile (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				status BOOLEAN NOT NULL DEFAULT true,
				created_at TIMESTAMP DEFAULT current_timestamp,
				updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create profile table")
			return err
		}
		log.Info().Msg("Profile table created successfully")
	} else {
		log.Info().Msg("Profile table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE profile 
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate profile table columns")
			return err
		}
		log.Info().Msg("Profile table schema is up to date")
	}
	return nil
}

func MigrateEmailTemplateTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking email_templates table schema...")

	exists, err := db.NewSelect().Model((*domain.EmailTemplate)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if email_templates table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("email_templates table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS email_templates (
			id SERIAL PRIMARY KEY,
			type VARCHAR(50) NOT NULL,
			step VARCHAR(50) NOT NULL DEFAULT '',
			subject VARCHAR(255) NOT NULL,
			body TEXT NOT NULL,
			language VARCHAR(10) NOT NULL DEFAULT 'fr',
			status BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMP DEFAULT current_timestamp,
			updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
		)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create email_templates table")
			return err
		}
		log.Info().Msg("email_templates table created successfully")
	} else {
		log.Info().Msg("email_templates table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE email_templates 
				ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS step VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en',
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp,
				ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate email_templates table columns")
			return err
		}
		log.Info().Msg("email_templates table schema is up to date")
	}

	// always drop old columns regardless of table state
	db.ExecContext(ctx, `ALTER TABLE email_templates DROP COLUMN IF EXISTS user_id`)
	db.ExecContext(ctx, `ALTER TABLE email_templates DROP COLUMN IF EXISTS user_name`)
	db.ExecContext(ctx, `ALTER TABLE email_templates DROP COLUMN IF EXISTS confirmation_mail`)
	db.ExecContext(ctx, `ALTER TABLE email_templates DROP COLUMN IF EXISTS invitation_mail`)
	db.ExecContext(ctx, `ALTER TABLE email_templates DROP COLUMN IF EXISTS disapproval_mail`)

	// Online Meeting & Face to Face Meeting templates must carry ONLY the
	// [Link] placeholder (HR sends a meeting link only, no date/time/maps).
	// These rewrites are idempotent: once the date/time/maps lines are gone,
	// subsequent runs leave the body untouched. It only touches the lines that
	// contain the placeholders, so localized surrounding text is preserved.
	if _, err := db.ExecContext(ctx, `
		UPDATE email_templates SET body = regexp_replace(
			regexp_replace(body, '\[[Dd]ate\][^\n]*', 'Meeting link: [Link]', 'g'),
			'\[[Mm]aps\][^\n]*', '', 'g'
		) WHERE type = 'Face to Face Meeting'
	`); err != nil {
		log.Error().Err(err).Msg("Failed to normalize Face to Face Meeting template placeholders")
	} else {
		log.Info().Msg("Normalized Face to Face Meeting template placeholders")
	}

	if _, err := db.ExecContext(ctx, `
		UPDATE email_templates SET body = regexp_replace(
			regexp_replace(
				regexp_replace(body, '\[[Dd]ate\][^\n]*', '', 'g'),
				'\[[Tt]ime\][^\n]*', '', 'g'
			),
			'\[[Mm]aps\][^\n]*', '', 'g'
		) WHERE type = 'Online Meeting'
	`); err != nil {
		log.Error().Err(err).Msg("Failed to normalize Online Meeting template placeholders")
	} else {
		log.Info().Msg("Normalized Online Meeting template placeholders")
	}

	return nil
}

func SeedDefaultEmailTemplates(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Re-seeding default email templates...")

	defaultTypes := []string{"Acknowledgment of receipt of your application", "CV Screening", "Online Quiz", "Online Meeting", "Face to Face Meeting", "Final Decision", "disapproval", "reopening"}

	_, err := db.NewDelete().Model((*domain.EmailTemplate)(nil)).Where("type IN (?)", bun.In(defaultTypes)).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to clear existing default email templates")
		return fmt.Errorf("could not clear default email templates: %w", err)
	}

	now := time.Now().Format("2006-01-02 15:04:05")

	defaultTemplates := []domain.EmailTemplate{
		{
			Type:      "Acknowledgment of receipt of your application",
			Step:      "",
			Subject:   "Acknowledgment of receipt of your application",
			Body:      "Dear applicant,\n\nThank you for your interest in our company.\n\nWe confirm the receipt of your application for a PFE internship. Your file is currently under review by our team.\n\nWe will contact you as soon as possible to inform you about the next steps of the selection process.\n\nThank you for your trust and we wish you an excellent day.\n\nBest regards,\n\nAsteroidea",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:    "CV Screening",
			Step:    "CV Screening",
			Subject: "CV Screening",
			Body:    "Dear applicant,\n\nCongratulations, your application has passed the CV Screening stage.\n\nYou are invited to the next stage.\n\nBest regards,\n\nAsteroidea",

			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "Online Quiz",
			Step:      "Online Quiz",
			Subject:   "Online Quiz",
			Body:      "Dear applicant,\n\nYou are invited to take the online quiz.\n\nQuiz link: [Link]\n\nGood luck!\n\nBest regards,\n\nAsteroidea",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "Online Meeting",
			Step:      "Online Meeting",
			Subject:   "Online Meeting",
			Body:      "Dear applicant,\n\nYou are invited to an online meeting.\n\nMeeting link: [Link]\n\nBest regards,\n\nAsteroidea",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "Face to Face Meeting",
			Step:      "Face to Face Meeting",
			Subject:   "Face to Face Meeting",
			Body:      "Dear applicant,\n\nYou are invited to a face-to-face interview.\n\nMeeting link: [Link]\n\nBest regards,\n\nAsteroidea",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "Final Decision",
			Step:      "Final Decision",
			Subject:   "Final Decision",
			Body:      "Dear applicant,\n\nCongratulations! Your application has been accepted.\n\nStart date: [Date]\n\nWelcome to Asteroidea!\n\nBest regards,",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "disapproval",
			Step:      "",
			Subject:   "Rejection of your application",
			Body:      "Dear applicant,\n\nThank you for the interest you have shown in our company and for the time you devoted to your application.\n\nAfter a careful review of the applications received, we regret to inform you that your application has not been selected for this opportunity.\n\nReason for rejection: [Reason]\n\nThis decision does not call into question the quality of your profile. The large number of applications has led us to make a selection according to the specific needs of the project.\n\nWe wish you every success in your studies and in your future professional projects.\n\nBest regards,\n\nAsteroidea",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "reopening",
			Step:      "",
			Subject:   "Asteroidea applications are open again",
			Body:      "Dear applicant,\n\nWe are pleased to inform you that our application platform is open again!\n\nYou can now apply to the various PFE subjects offered by our team.\n\nTo submit your application, click on the link below:\n[Link]\n\nWe look forward to receiving your application and discovering your profile.\n\nBest regards,\n\nAsteroidea",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	for _, tpl := range defaultTemplates {
		_, err := db.NewInsert().Model(&tpl).Column("type", "step", "subject", "body", "status", "created_at", "updated_at").Exec(ctx)
		if err != nil {
			log.Error().Err(err).Str("type", tpl.Type).Msg("Failed to seed email template")
			return fmt.Errorf("could not seed email template: %w", err)
		}
	}

	log.Info().Int("count", len(defaultTemplates)).Msg("Default email templates seeded successfully")
	return nil
}

func MigrateEmailLogsTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking email_logs table schema...")

	exists, err := db.NewSelect().Model((*domain.EmailLog)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if email_logs table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("email_logs table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS email_logs (
				id SERIAL PRIMARY KEY,
				candidature_id INT NOT NULL,
				recipient VARCHAR(255) NOT NULL,
				subject VARCHAR(255) NOT NULL,
				body TEXT NOT NULL,
				template_type VARCHAR(50) NOT NULL,
				candidat_name VARCHAR(255) NOT NULL,
				subject_name VARCHAR(255) NOT NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'sent',
				sent_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
				error_message TEXT NOT NULL DEFAULT ''
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create email_logs table")
			return err
		}
		log.Info().Msg("email_logs table created successfully")
	} else {
		log.Info().Msg("email_logs table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE email_logs 
				ADD COLUMN IF NOT EXISTS candidature_id INT NOT NULL DEFAULT 0,
				ADD COLUMN IF NOT EXISTS recipient VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS candidat_name VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'sent',
				ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
				ADD COLUMN IF NOT EXISTS error_message TEXT NOT NULL DEFAULT ''
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate email_logs table columns")
			return err
		}
		log.Info().Msg("email_logs table schema is up to date")
	}
	return nil
}

func MigrateWaitlistTable(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking waitlist_subscribers table schema...")

	exists, err := db.NewSelect().Model((*domain.WaitlistSubscriber)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if waitlist_subscribers table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("waitlist_subscribers table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS waitlist_subscribers (
				id SERIAL PRIMARY KEY,
				email VARCHAR(255) NOT NULL UNIQUE,
				status VARCHAR(50) NOT NULL DEFAULT 'pending',
				created_at TIMESTAMP DEFAULT current_timestamp,
				notified_at TIMESTAMP
			)
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create waitlist_subscribers table")
			return err
		}
		log.Info().Msg("waitlist_subscribers table created successfully")
	} else {
		log.Info().Msg("waitlist_subscribers table exists, ensuring schema is up to date...")
		_, err = db.ExecContext(ctx, `
			ALTER TABLE waitlist_subscribers
				ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending',
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp,
				ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate waitlist_subscribers table columns")
			return err
		}
		log.Info().Msg("waitlist_subscribers table schema is up to date")
	}
	return nil
}

func AddDefaultData(db *bun.DB) error {

	// init modules
	if err := InitializeModules(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to initialize modules")
	}

	// init roles
	if err := CreateDefaultAdminRole(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to initialize default roles")

	}

	// migrate legacy per-submodule settings permissions onto the consolidated module
	if err := MigrateSettingsPermissions(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate settings permissions")
	}

	// init user
	if err := CreateDefaultAdmin(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to initialize default users")
	}

	// init technology table migration
	if err := MigrateTechnologyTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate technology table")
	}

	// init profile table migration
	if err := MigrateProfileTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate profile table")
	}

	// init duration table migration
	if err := MigrateDurationTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate duration table")
	}

	// init type table migration
	if err := MigrateTypeTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate type table")
	}

	// init subject table migration
	if err := MigrateSubjectTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate subject table")
	}

	// init candidature table migration
	if err := MigrateCandidatureTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate candidature table")
	}

	if err := MigrateAuditTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate audit table")
	}

	// init email_templates table migration
	if err := MigrateEmailTemplateTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate email_templates table")
	}

	// Email templates are managed via the backoffice UI (Settings > Email Templates)
	// No default seed to avoid overwriting user-managed templates
	// Initial templates can be created through the backoffice interface

	// init email_logs table migration
	if err := MigrateEmailLogsTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate email_logs table")
	}

	// init waitlist_subscribers table migration
	if err := MigrateWaitlistTable(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to migrate waitlist_subscribers table")
	}

	// init settings
	/* if err := CreateDefaultSettings(context.Background(), db); err != nil {
		log.Error().Err(err).Msg("Failed to initialize default settings")
	} */

	// ============================================
	// TODO : Add fucntion here to add default data
	// ============================================

	return nil

}

func CreateDefaultAdminRole(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking for default admin role...")

	existingRoleCount, err := db.NewSelect().Model(&domain.Role{}).Where("name = ?", "Super Admin").Count(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to count admin role")
		return fmt.Errorf("could not count admin role: %w", err)
	}

	if existingRoleCount == 0 {
		log.Info().Msg("No super admin role found, creating a default one ...")

		// Settings submodules (degrees, technologies, profiles, durations, types,
		// email templates, mail config, front office) are consolidated under the
		// single "settings" module (view = read-only, edit = full access).
		defaultPermissions := map[string]string{
			pkg.DASHBORD_PERMISSIONS:     "1111",
			pkg.ROLES_PERMISSIONS:        "1111",
			pkg.SETTINGS_PERMISSIONS:     pkg.SETTINGS_EDIT_PERMISSIONS,
			pkg.USERS_PERMISSIONS:        "1111",
			pkg.AUDITS_PERMISSIONS:       "1111",
			pkg.SUBJECTS_PERMISSIONS:     "1111",
			pkg.CANDIDATURES_PERMISSIONS: "1111",
			pkg.EMAIL_LOGS_PERMISSIONS:   "1111",
		}

		role := &domain.Role{
			ID:          1,
			Name:        "Super Admin",
			Permissions: defaultPermissions,
		}
		role.CreatedAt = pkg.GetFormatedLocalTime("datetime")
		role.UpdatedAt = pkg.GetFormatedLocalTime("datetime")

		_, err = db.NewInsert().Model(role).Exec(ctx)
		if err != nil {
			log.Error().Err(err).Str("role", role.Name).Msg("Error creating default super_admin role")
			return fmt.Errorf("could not create default super_admin role: %w", err)
		}

		log.Info().Str("role", role.Name).Interface("permissions", role.Permissions).Msg("Default super_admin role created successfully")
	}

	// Ensure all existing roles have all default permissions
	var roles []*domain.Role
	err = db.NewSelect().Model(&roles).Scan(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch roles for permission migration")
		return fmt.Errorf("could not fetch roles: %w", err)
	}

	allPermissions := []string{
		pkg.DASHBORD_PERMISSIONS,
		pkg.ROLES_PERMISSIONS,
		pkg.SETTINGS_PERMISSIONS,
		pkg.USERS_PERMISSIONS,
		pkg.AUDITS_PERMISSIONS,
		pkg.SUBJECTS_PERMISSIONS,
		pkg.CANDIDATURES_PERMISSIONS,
		pkg.EMAIL_LOGS_PERMISSIONS,
	}

	for _, role := range roles {
		updated := false
		for _, perm := range allPermissions {
			if _, exists := role.Permissions[perm]; !exists {
				role.Permissions[perm] = "1111"
				updated = true
			}
		}
		if updated {
			_, err = db.NewUpdate().Model(role).Set("permissions = ?", role.Permissions).Set("updated_at = ?", pkg.GetFormatedLocalTime("datetime")).Where("id = ?", role.ID).Exec(ctx)
			if err != nil {
				log.Error().Err(err).Int("role_id", role.ID).Msg("Failed to update role permissions")
				return fmt.Errorf("could not update role %d: %w", role.ID, err)
			}
			log.Info().Int("role_id", role.ID).Str("role_name", role.Name).Msg("Updated all permissions for role")
		}
	}

	return nil
}

// MigrateSettingsPermissions maps legacy per-submodule Settings permissions
// onto the consolidated "settings" module:
//   - any write permission (create/update/delete) on ANY settings submodule
//     (or on settings itself) → "edit" (full access) on "settings"
//   - only read/view and no write anywhere → "view" (read-only) on "settings"
//   - none → no "settings" entry
//
// Legacy per-submodule keys are removed from each role afterwards.
func MigrateSettingsPermissions(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Migrating legacy settings submodule permissions...")

	var roles []*domain.Role
	if err := db.NewSelect().Model(&roles).Scan(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to fetch roles for settings migration")
		return fmt.Errorf("could not fetch roles: %w", err)
	}

	hasWriteBit := func(mask string) bool {
		for _, i := range []int{1, 2, 3} {
			if len(mask) > i && mask[i] == '1' {
				return true
			}
		}
		return false
	}
	hasViewBit := func(mask string) bool {
		return len(mask) > 0 && mask[0] == '1'
	}

	for _, role := range roles {
		if role.Permissions == nil {
			role.Permissions = map[string]string{}
		}
		hasWrite := false
		hasView := false
		changed := false

		keys := append(append([]string{}, pkg.SettingsConsolidatedModules...), pkg.SETTINGS_PERMISSIONS)
		for _, key := range keys {
			mask, exists := role.Permissions[key]
			if !exists {
				continue
			}
			if hasWriteBit(mask) {
				hasWrite = true
			}
			if hasViewBit(mask) {
				hasView = true
			}
		}

		for _, key := range pkg.SettingsConsolidatedModules {
			if _, exists := role.Permissions[key]; exists {
				delete(role.Permissions, key)
				changed = true
			}
		}

		var want string
		var wantSet bool
		if hasWrite {
			want, wantSet = pkg.SETTINGS_EDIT_PERMISSIONS, true
		} else if hasView {
			want, wantSet = pkg.SETTINGS_VIEW_PERMISSIONS, true
		}
		current, exists := role.Permissions[pkg.SETTINGS_PERMISSIONS]
		if wantSet {
			if !exists || current != want {
				role.Permissions[pkg.SETTINGS_PERMISSIONS] = want
				changed = true
			}
		} else if exists {
			delete(role.Permissions, pkg.SETTINGS_PERMISSIONS)
			changed = true
		}

		if !changed {
			continue
		}
		if _, err := db.NewUpdate().Model(role).Set("permissions = ?", role.Permissions).Set("updated_at = ?", pkg.GetFormatedLocalTime("datetime")).Where("id = ?", role.ID).Exec(ctx); err != nil {
			log.Error().Err(err).Int("role_id", role.ID).Msg("Failed to migrate settings permissions for role")
			return fmt.Errorf("could not migrate role %d: %w", role.ID, err)
		}
		log.Info().Int("role_id", role.ID).Str("role_name", role.Name).Msg("Migrated settings permissions for role")
	}

	return nil
}

func CreateDefaultAdmin(ctx context.Context, db *bun.DB) error {

	log.Info().Msg("Checking for default admin ...")
	role := &domain.Role{}
	err := db.NewSelect().Model(role).Where("id = ?", 1).Scan(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to count admin role")
		return fmt.Errorf("could not count admin role: %w", err)
	}

	existedAdmin, err := db.NewSelect().Model(&domain.User{}).Where("email = ?", config.Configvar.Admin.DefaultAdminEmail).Count(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Could not count admin users")
		return fmt.Errorf("could not count admin users: %w", err)
	}

	if existedAdmin == 0 {
		log.Info().Msg("No admin found, creating default admin...")

		defaultAdmin := &domain.User{
			ID:        1,
			FirstName: "Astro",
			LastName:  "Admin",
			Email:     config.Configvar.Admin.DefaultAdminEmail,
			Password:  config.Configvar.Admin.DefaultAdminPassword,
			RoleID:    1,
			Role:      role,
		}

		hashedPassword, err := pkg.HashPassword(defaultAdmin.Password)
		if err != nil {
			return err
		}
		defaultAdmin.Password = hashedPassword
		defaultAdmin.CreatedAt = pkg.GetFormatedLocalTime("datetime")
		defaultAdmin.UpdatedAt = pkg.GetFormatedLocalTime("datetime")

		_, err = db.NewInsert().Model(defaultAdmin).Exec(ctx)
		if err != nil {
			log.Error().Err(err).Msg("Error creating admin user")
			return fmt.Errorf("could not create admin user: %w", err)
		}

		log.Info().Str("first_name", defaultAdmin.FirstName).Str("last_name", defaultAdmin.LastName).Str("email", defaultAdmin.Email).Msg("Admin user created successfully")
	}

	return nil
}

func InitializeModules(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Checking for default modules...")
	// Settings submodules (degrees, technologies, profiles, durations, types,
	// email templates, front office messages, mail config) are consolidated
	// under the single "settings" module (view = read-only, edit = full access).
	defaultModules := []domain.ModulePermissions{
		{ModuleName: "dashboard", View: 1, Create: 0, Edit: 0, Delete: 0, ModuleIcon: "IconLayoutDashboard", ModuleIconColor: "text-blue-500"},
		{ModuleName: "roles", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconShieldLock", ModuleIconColor: "text-purple-500"},
		{ModuleName: "users", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconUser", ModuleIconColor: "text-green-500"},
		{ModuleName: "audits", View: 1, Create: 0, Edit: 0, Delete: 0, ModuleIcon: "IconFileSearch", ModuleIconColor: "text-red-500"},
		{ModuleName: "settings", View: 1, Create: 0, Edit: 1, Delete: 0, ModuleIcon: "IconSettings", ModuleIconColor: "text-gray-600"},
		{ModuleName: "subjects", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconNotebook", ModuleIconColor: "text-rose-500"},
		{ModuleName: "candidatures", View: 1, Create: 0, Edit: 1, Delete: 0, ModuleIcon: "IconFileDescription", ModuleIconColor: "text-blue-500"},
		{ModuleName: "email_logs", View: 1, Create: 0, Edit: 0, Delete: 0, ModuleIcon: "IconSend", ModuleIconColor: "text-green-500"},
	}

	// Run everything in a transaction so a crash can never leave the
	// modules table partially empty (delete ran, inserts didn't).
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to begin modules transaction")
		return fmt.Errorf("could not begin modules transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	// 1. Ensure the default modules exist FIRST (idempotent upsert).
	// This also repairs an already-emptied table on the next backend restart.
	for _, m := range defaultModules {
		mm := m
		if _, err := tx.NewInsert().Model(&mm).On("CONFLICT (module_name) DO NOTHING").Exec(ctx); err != nil {
			log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Error ensuring default module")
			return fmt.Errorf("could not ensure module %s: %w", m.ModuleName, err)
		}
	}

	// 2. Remove legacy per-submodule Settings entries consolidated into "settings".
	if _, err := tx.NewDelete().Model((*domain.ModulePermissions)(nil)).Where("module_name IN (?)", bun.In(pkg.SettingsConsolidatedModules)).Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to remove legacy settings submodule entries")
		return fmt.Errorf("could not remove legacy settings modules: %w", err)
	}

	// 3. Enforce the two-level settings module (view = read-only, edit = full access).
	// NOTE: "create" is a reserved keyword in Postgres, so identifiers must
	// be double-quoted in raw Set() fragments, otherwise Postgres reports
	// `syntax error at or near "create"` and the whole tx rolls back,
	// leaving the modules table empty.
	if _, err := tx.NewUpdate().Model((*domain.ModulePermissions)(nil)).Set("\"view\" = ?", 1).Set("\"create\" = ?", 0).Set("\"edit\" = ?", 1).Set("\"delete\" = ?", 0).Where("module_name = ?", pkg.SETTINGS_PERMISSIONS).Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to enforce settings module levels")
		return fmt.Errorf("could not enforce settings module levels: %w", err)
	}

	// 3b. Enforce the two-level candidatures module (view = read-only,
	// edit = full access: scores, notes, decisions, send mails). Identifiers
	// are double-quoted because "create" is reserved in Postgres.
	if _, err := tx.NewUpdate().Model((*domain.ModulePermissions)(nil)).Set("\"view\" = ?", 1).Set("\"create\" = ?", 0).Set("\"edit\" = ?", 1).Set("\"delete\" = ?", 0).Where("module_name = ?", pkg.CANDIDATURES_PERMISSIONS).Exec(ctx); err != nil {
		log.Error().Err(err).Msg("Failed to enforce candidatures module levels")
		return fmt.Errorf("could not enforce candidatures module levels: %w", err)
	}

	// 4. Sync icons for the default modules.
	for _, m := range defaultModules {
		var existing domain.ModulePermissions
		err := tx.NewSelect().
			Model(&existing).
			Where("module_name = ?", m.ModuleName).
			Scan(ctx)

		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Could not check for module")
			return fmt.Errorf("could not check for module %s: %w", m.ModuleName, err)
		}

		if errors.Is(err, sql.ErrNoRows) {
			mm := m
			if _, err = tx.NewInsert().Model(&mm).On("CONFLICT (module_name) DO NOTHING").Exec(ctx); err != nil {
				log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Error creating module")
				return fmt.Errorf("could not create module %s: %w", m.ModuleName, err)
			}
		} else if existing.ModuleIcon != m.ModuleIcon {
			if _, err = tx.NewUpdate().Model(&domain.ModulePermissions{}).Set("module_icon = ?", m.ModuleIcon).Where("module_name = ?", m.ModuleName).Exec(ctx); err != nil {
				log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Error updating module icon")
				return fmt.Errorf("could not update module %s: %w", m.ModuleName, err)
			}
			log.Info().Str("module_name", m.ModuleName).Str("new_icon", m.ModuleIcon).Msg("Updated module icon")
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error().Err(err).Msg("Failed to commit modules transaction")
		return fmt.Errorf("could not commit modules transaction: %w", err)
	}
	committed = true

	return nil
}

/* func CreateDefaultSettings(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Initializing default settings...")

	// helper to create a setting
	newSetting := func(groupOrder int, group, key, value, desc, typ, icon string) domain.Setting {
		return domain.Setting{
			GroupOrder:     groupOrder,
			Group:          group,
			Key:            key,
			Value:          value,
			Description:    desc,
			Type:           typ,
			PossibleValues: nil,
			Icon:           icon,
		}
	}

	settings := []domain.Setting{
		// General Settings
		newSetting(1, config.GENERAL_SETTINGS, "Délai max réception plaque", "30", "Temps d'attente maximal pour recevoir la plaque d'immatriculation de la caméra (en secondes) : délai appliqué après une requête pour vérifier la queue → si aucune plaque (LPN) n’est trouvée immédiatement, le système attend ce temps, puis revérifié une seule fois avant de continuer ou d’échouer.", "number", "IconCamera"),
		newSetting(1, config.GENERAL_SETTINGS, "Délai max attente entrée", "30", "Intervalle d'expiration d'immatriculation (en secondes) : durée maximale de validité d’une plaque (LPN) dans la queue → lorsque le system reçoit une requête et plaque (LPN)  déjà trouvée, le système vérifie son ancienneté (date d’ajout) et refuse son traitement si elle dépasse ce délai afin d’éviter le traitement de données trop anciennes.", "number", "IconCamera"),

		// ZR Settings
		newSetting(2, config.ZR_SETTINGS, "IP_ZR", "127.0.0.1", "Adresse IP du ZR", "text", "IconParkingCircleFilled"),
		newSetting(2, config.ZR_SETTINGS, "PORT_ZR", "8443", "Numéro de port du ZR", "number", "IconParkingCircleFilled"),
		newSetting(2, config.ZR_SETTINGS, "Utilisateur_ZR", "1", "Nom d'utilisateur du ZR", "text", "IconParkingCircleFilled"),
		newSetting(2, config.ZR_SETTINGS, "Mot_de_passe_ZR", "1234", "Mot de passe du ZR", "text", "IconParkingCircleFilled"),
		newSetting(2, config.ZR_SETTINGS, "ID_ZR", "7777", "ID du ZR", "text", "IconParkingCircleFilled"),
		newSetting(2, config.ZR_SETTINGS, "Délai d'attente", "30", "Délai d'attente en secondes", "number", "IconParkingCircleFilled"),
		newSetting(2, config.ZR_SETTINGS, "ID_DISPOSITIF_CAISSIER", "799", "ID du dispositif de caisse du ZR", "number", "IconParkingCircleFilled"),

		// Parking Settings
		newSetting(3, config.PARKING_SETTINGS, "ZR_ID_HEX", "0x123", "ZR ID en hexadécimal", "text", "IconServer2"),
		newSetting(3, config.PARKING_SETTINGS, "BARCODE_SUFFIX", "0A", "Suffixe du code à barres", "text", "IconServer2"),
		newSetting(3, config.PARKING_SETTINGS, "SCANNER_PROCESS_ID", "1000", "ID du processus du scanneur", "number", "IconServer2"),
		newSetting(3, config.PARKING_SETTINGS, "Délai d'attente", "30", "Délai d'attente en secondes", "number", "IconServer2"),
		newSetting(3, config.PARKING_SETTINGS, "ONSITE_PROCESS_URL", "http://127.0.0.1:8080", "URL du processus dans le ZR", "text", "IconServer2"),
		newSetting(3, config.PARKING_SETTINGS, "CLASS_TARIFF", "1", "Classe de tarification pour la transaction du sortie", "text", "IconServer2"),
	}

	for _, s := range settings {
		_, err := db.NewInsert().
			Model(&s).
			Exec(ctx)

		if err != nil {
			// Ignore duplicate key errors
			if isDuplicateError(err) {
				continue
			}

			log.Error().
				Err(err).
				Str("key", s.Key).
				Msg("Failed to insert setting")

			return fmt.Errorf("insert setting %s: %w", s.Key, err)
		}

		log.Info().Str("key", s.Key).Msg("Inserted")
	}

	return nil
} */

// isolate duplicate check (cleaner + reusable)
func isDuplicateError(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "duplicate key") ||
		strings.Contains(msg, "23505")
}

// backfillStepStatuses initialise current_step + step1..step5_status pour les
// lignes jamais initialisées, à partir de l'historique (candidature_stage)
// s'il existe, sinon à partir de step/status courants. Idempotent.
func backfillStepStatuses(ctx context.Context, db *bun.DB) error {
	type row struct {
		ID     int    `bun:"id"`
		Step   string `bun:"step"`
		Status string `bun:"status"`
	}
	var rows []row
	if err := db.NewRaw(`SELECT id, step, status FROM candidature WHERE step1_status IS NULL`).Scan(ctx, &rows); err != nil {
		return fmt.Errorf("select rows to backfill: %w", err)
	}
	if len(rows) == 0 {
		return nil
	}

	// Historique existant (table legacy) : map[candidatureID]map[stage]status
	hist := map[int]map[string]string{}
	var hrows []struct {
		CandidatureID int    `bun:"candidature_id"`
		Stage         string `bun:"stage"`
		Status        string `bun:"status"`
	}
	if err := db.NewRaw(`SELECT candidature_id, stage, status FROM candidature_stage`).Scan(ctx, &hrows); err == nil {
		for _, h := range hrows {
			if hist[h.CandidatureID] == nil {
				hist[h.CandidatureID] = map[string]string{}
			}
			hist[h.CandidatureID][h.Stage] = h.Status
		}
	}

	stageIdx := func(step string) int {
		switch strings.TrimSpace(strings.ToLower(step)) {
		case "quiz", "online_quiz":
			return 2
		case "online", "online_meeting":
			return 3
		case "f2f", "f2f_meeting":
			return 4
		case "final", "final_decision":
			return 5
		default:
			return 1
		}
	}
	normStatus := func(s string) string {
		switch strings.TrimSpace(strings.ToLower(s)) {
		case "accepted", "invited", "approved":
			return "accepted"
		case "rejected", "refused", "declined", "failed":
			return "rejected"
		default:
			return "pending"
		}
	}
	stages := []string{"cv", "quiz", "online", "f2f", "final"}

	for _, r := range rows {
		cur := stageIdx(r.Step)
		curStatus := normStatus(r.Status)
		vals := make([]interface{}, 0, 7)
		sets := make([]string, 0, 7)
		for i, st := range stages {
			idx := i + 1
			var v interface{}
			if hv, ok := hist[r.ID][st]; ok {
				v = hv
			} else if idx < cur {
				v = "accepted"
			} else if idx == cur {
				v = curStatus
			} else {
				v = nil
			}
			sets = append(sets, fmt.Sprintf("step%d_status = ?", idx))
			vals = append(vals, v)
		}
		// Le statut global résolu = statut de l'étape courante
		var resolved string
		if hv, ok := hist[r.ID][stages[cur-1]]; ok {
			resolved = hv
		} else {
			resolved = curStatus
		}
		sets = append(sets, "current_step = ?", "status = ?")
		vals = append(vals, cur, resolved)
		vals = append(vals, r.ID)
		q := fmt.Sprintf("UPDATE candidature SET %s WHERE id = ?", strings.Join(sets, ", "))
		if _, err := db.NewRaw(q, vals...).Exec(ctx); err != nil {
			return fmt.Errorf("backfill candidature %d: %w", r.ID, err)
		}
	}
	log.Info().Int("count", len(rows)).Msg("Backfilled per-step statuses")
	return nil
}
