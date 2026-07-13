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
				priority_rank VARCHAR(50) NOT NULL,
				status BOOLEAN NOT NULL DEFAULT true,
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
				ADD COLUMN IF NOT EXISTS priority_rank VARCHAR(50) NOT NULL DEFAULT 'Medium',
				ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp,
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

	exists, err := db.NewSelect().Model((*domain.Candidature)(nil)).Exists(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Could not check if candidature table exists, trying CREATE TABLE IF NOT EXISTS")
	}

	if !exists {
		log.Info().Msg("Candidature table does not exist, creating it...")
		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS candidature (
				id SERIAL PRIMARY KEY,
				full_name VARCHAR(255) NOT NULL,
				email1 VARCHAR(255) NOT NULL,
				gender1 VARCHAR(50) NOT NULL,
				phone1 VARCHAR(50) NOT NULL,
				degree1 VARCHAR(255) DEFAULT '',
				full_name2 VARCHAR(255) DEFAULT '',
				email2 VARCHAR(255) DEFAULT '',
				gender2 VARCHAR(50) DEFAULT '',
				phone2 VARCHAR(50) DEFAULT '',
				degree2 VARCHAR(255) DEFAULT '',
				duration VARCHAR(100) DEFAULT '',
				methode VARCHAR(50) DEFAULT '',
				start_date VARCHAR(100) DEFAULT '',
			subject_name VARCHAR(255) DEFAULT '',
			university VARCHAR(255) DEFAULT '',
			university2 VARCHAR(255) DEFAULT '',
			date_application VARCHAR(100) DEFAULT '',
				path_cv TEXT DEFAULT '',
				path_lettre_motivation TEXT DEFAULT '',
				path_cv2 TEXT DEFAULT '',
				path_lettre_motivation2 TEXT DEFAULT '',
				status VARCHAR(50) NOT NULL DEFAULT 'pending',
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
				ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS email1 VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS gender1 VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS phone1 VARCHAR(50) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS degree1 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS full_name2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS email2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS gender2 VARCHAR(50) DEFAULT '',
				ADD COLUMN IF NOT EXISTS phone2 VARCHAR(50) DEFAULT '',
				ADD COLUMN IF NOT EXISTS degree2 VARCHAR(255) DEFAULT '',
				ADD COLUMN IF NOT EXISTS duration VARCHAR(100) DEFAULT '',
				ADD COLUMN IF NOT EXISTS methode VARCHAR(50) DEFAULT '',
				ADD COLUMN IF NOT EXISTS start_date VARCHAR(100) DEFAULT '',
			ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS university2 VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS date_application VARCHAR(100) DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_cv TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_lettre_motivation TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_cv2 TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS path_lettre_motivation2 TEXT DEFAULT '',
				ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending',
				ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp
		`)
		if err != nil {
			log.Error().Err(err).Msg("Failed to migrate candidature table columns")
			return err
		}
		log.Info().Msg("Candidature table schema is up to date")
	}

	_, err = db.ExecContext(ctx, `UPDATE candidature SET status = 'pending' WHERE status = 'on_hold'`)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to migrate 'on_hold' rows to 'pending'")
	} else {
		log.Info().Msg("Migrated 'on_hold' rows to 'pending'")
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
				ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '',
				ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'fr',
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
	return nil
}

func SeedDefaultEmailTemplates(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Re-seeding default email templates...")

	defaultTypes := []string{"confirmation", "acceptance", "disapproval", "reopening"}

	_, err := db.NewDelete().Model((*domain.EmailTemplate)(nil)).Where("type IN (?)", bun.In(defaultTypes)).Exec(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to clear existing default email templates")
		return fmt.Errorf("could not clear default email templates: %w", err)
	}

	now := time.Now().Format("2006-01-02 15:04:05")

	defaultTemplates := []domain.EmailTemplate{
		{
			Type:      "confirmation",
			Subject:   "Accusé réception de votre candidature",
			Body:      "Bonjour {{NomCandidat}},\n\nNous vous remercions pour l'intérêt que vous portez à notre entreprise.\n\nNous confirmons la bonne réception de votre candidature pour le sujet de PFE {{TitreSujet}}. Votre dossier est actuellement en cours d'examen par notre équipe.\n\nNous vous contacterons dans les meilleurs délais pour vous informer de la suite du processus de sélection.\n\nNous vous remercions de votre confiance et vous souhaitons une excellente journée.\n\nCordialement,\n\n{{NomEntreprise}}\n{{ServiceRH}}\n{{EmailEntreprise}}",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "acceptance",
			Subject:   "Invitation à un entretien",
			Body:      "Bonjour {{NomCandidat}},\n\nNous avons le plaisir de vous informer que votre candidature pour le sujet de PFE {{TitreSujet}} a été retenue.\n\nAprès étude de votre dossier, votre profil correspond aux compétences et aux critères recherchés pour cette opportunité.\n\nNous vous invitons à prendre contact avec nous afin de finaliser les modalités de votre stage et préparer votre intégration.\n\nAdresse : {{LienGoogleMaps}}\n\nFélicitations et bienvenue parmi nous.\n\nCordialement,\n\n{{NomEntreprise}}\n{{ServiceRH}}\n{{EmailEntreprise}}\n{{TéléphoneEntreprise}}",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "disapproval",
			Subject:   "Refus de votre candidature",
			Body:      "Bonjour {{NomCandidat}},\n\nNous vous remercions pour l'intérêt que vous avez porté à notre entreprise ainsi que pour le temps consacré à votre candidature concernant le sujet de PFE {{TitreSujet}}.\n\nAprès une étude attentive des différentes candidatures reçues, nous regrettons de vous informer que votre candidature n'a pas été retenue pour cette opportunité.\n\nCette décision ne remet pas en cause la qualité de votre parcours. Le nombre important de candidatures nous a conduits à effectuer une sélection selon les besoins spécifiques du projet.\n\nNous vous souhaitons pleine réussite dans la poursuite de vos études et de vos futurs projets professionnels.\n\nCordialement,\n\n{{NomEntreprise}}\n{{ServiceRH}}\n{{EmailEntreprise}}",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			Type:      "reopening",
			Subject:   "Réouverture des candidatures Asteroidea",
			Body:      "Bonjour {{NomCandidat}},\n\nNous avons le plaisir de vous informer que notre plateforme de candidatures est de nouveau ouverte !\n\nVous pouvez dès à présent postuler aux différents sujets de PFE proposés par notre équipe.\n\nPour soumettre votre candidature, cliquez sur le lien ci-dessous :\n{{PlateformeLien}}\n\nNous sommes impatients de recevoir votre candidature et de découvrir votre profil.\n\nCordialement,\n\n{{NomEntreprise}}\n{{ServiceRH}}\n{{EmailEntreprise}}",
			Status:    true,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	for _, tpl := range defaultTemplates {
		_, err := db.NewInsert().Model(&tpl).Column("type", "subject", "body", "status", "created_at", "updated_at").Exec(ctx)
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
				sent_at TIMESTAMP NOT NULL DEFAULT current_timestamp
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
				ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP NOT NULL DEFAULT current_timestamp
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

		defaultPermissions := map[string]string{
			pkg.DASHBORD_PERMISSIONS:       "1111",
			pkg.ROLES_PERMISSIONS:          "1111",
			pkg.SETTINGS_PERMISSIONS:       "1111",
			pkg.USERS_PERMISSIONS:          "1111",
			pkg.AUDITS_PERMISSIONS:         "1111",
			pkg.DEGREES_PERMISSIONS:        "1111",
			pkg.TECHNOLOGIES_PERMISSIONS:   "1111",
			pkg.PROFILES_PERMISSIONS:       "1111",
			pkg.DURATIONS_PERMISSIONS:      "1111",
			pkg.TYPES_PERMISSIONS:          "1111",
			pkg.SUBJECTS_PERMISSIONS:       "1111",
			pkg.CANDIDATURES_PERMISSIONS:   "1111",
			pkg.FRONT_OFFICE_MESSAGES:      "1111",
			pkg.EMAIL_TEMPLATE_PERMISSIONS: "1111",
			pkg.EMAIL_LOGS_PERMISSIONS:     "1111",
			pkg.MAIL_CONFIG_PERMISSIONS:    "1111",
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
		pkg.DEGREES_PERMISSIONS,
		pkg.TECHNOLOGIES_PERMISSIONS,
		pkg.PROFILES_PERMISSIONS,
		pkg.DURATIONS_PERMISSIONS,
		pkg.TYPES_PERMISSIONS,
		pkg.SUBJECTS_PERMISSIONS,
		pkg.CANDIDATURES_PERMISSIONS,
		pkg.FRONT_OFFICE_MESSAGES,
		pkg.EMAIL_TEMPLATE_PERMISSIONS,
		pkg.EMAIL_LOGS_PERMISSIONS,
		pkg.MAIL_CONFIG_PERMISSIONS,
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
	defaultModules := []domain.ModulePermissions{
		{ModuleName: "dashboard", View: 1, Create: 0, Edit: 0, Delete: 0, ModuleIcon: "IconLayoutDashboard", ModuleIconColor: "text-blue-500"},
		{ModuleName: "roles", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconShieldLock", ModuleIconColor: "text-purple-500"},
		{ModuleName: "users", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconUser", ModuleIconColor: "text-green-500"},
		{ModuleName: "audits", View: 1, Create: 0, Edit: 0, Delete: 0, ModuleIcon: "IconFileSearch", ModuleIconColor: "text-red-500"},
		{ModuleName: "settings", View: 1, Create: 0, Edit: 1, Delete: 0, ModuleIcon: "IconSettings", ModuleIconColor: "text-gray-600"},
		{ModuleName: "degrees", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconCapProjecting", ModuleIconColor: "text-yellow-500"},
		{ModuleName: "technologies", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconDeviceLaptop", ModuleIconColor: "text-cyan-500"},
		{ModuleName: "profiles", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconIdBadge", ModuleIconColor: "text-orange-500"},
		{ModuleName: "durations", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconClock", ModuleIconColor: "text-indigo-500"},
		{ModuleName: "types", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconTags", ModuleIconColor: "text-teal-500"},
		{ModuleName: "subjects", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconNotebook", ModuleIconColor: "text-rose-500"},
		{ModuleName: "candidatures", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconFileDescription", ModuleIconColor: "text-blue-500"},
		{ModuleName: "email_templates", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconMail", ModuleIconColor: "text-purple-500"},
		{ModuleName: "front_office_messages", View: 1, Create: 1, Edit: 1, Delete: 1, ModuleIcon: "IconMessage", ModuleIconColor: "text-pink-500"},
		{ModuleName: "email_logs", View: 1, Create: 0, Edit: 0, Delete: 0, ModuleIcon: "IconSend", ModuleIconColor: "text-green-500"},
		{ModuleName: "mail_config", View: 1, Create: 0, Edit: 1, Delete: 0, ModuleIcon: "IconMailForward", ModuleIconColor: "text-sky-500"},
	}

	for _, m := range defaultModules {
		var existing domain.ModulePermissions
		err := db.NewSelect().
			Model(&existing).
			Where("module_name = ?", m.ModuleName).
			Scan(ctx)

		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Could not check for module")
			return fmt.Errorf("could not check for module %s: %w", m.ModuleName, err)
		}

		if errors.Is(err, sql.ErrNoRows) {
			//log.Info().Str("module_name", m.ModuleName).Msg("No module found, creating...")
			_, err = db.NewInsert().Model(&m).Exec(ctx)
			if err != nil {
				log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Error creating module")
				return fmt.Errorf("could not create module %s: %w", m.ModuleName, err)
			}
			//log.Info().Str("module_name", m.ModuleName).Msg("Module created successfully")
		} else {
			if existing.ModuleIcon != m.ModuleIcon {
				_, err = db.NewUpdate().Model(&domain.ModulePermissions{}).Set("module_icon = ?", m.ModuleIcon).Where("module_name = ?", m.ModuleName).Exec(ctx)
				if err != nil {
					log.Error().Err(err).Str("module_name", m.ModuleName).Msg("Error updating module icon")
					return fmt.Errorf("could not update module %s: %w", m.ModuleName, err)
				}
				log.Info().Str("module_name", m.ModuleName).Str("new_icon", m.ModuleIcon).Msg("Updated module icon")
			}
		}
	}

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

