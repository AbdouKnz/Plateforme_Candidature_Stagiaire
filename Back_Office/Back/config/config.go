package config

import (
	"os"

	"git.asteroidea.co/go-packages/astrogo/pkg/astroenv"
	"github.com/rs/zerolog/log"
)

var Configvar ConfigMode

type ConfigMode struct {

	// ───────────── SERVER ─────────────
	Server struct {
		Port               int    `env:"SERVER_PORT,8070"`
		SwaggerEnabled     bool   `env:"SWAGGER_ENABLED,false"`
		GinMode            string `env:"GIN_MODE,release"`
		FullRequestLogging bool   `env:"FULL_REQUEST_LOGGING,false"`
		ApiPrefix          string `env:"API_PREFIX,/backend"`
		TZ                 string `env:"TZ,UTC"`
	}

	// ───────────── DATABASE ─────────────
	Database struct {
		Host     string `env:"DB_HOST,localhost"`
		Port     string `env:"DB_PORT,5432"`
		User     string `env:"DB_USER,postgres"`
		Password string `env:"DB_PASSWORD,postgres"`
		Name     string `env:"DB_NAME,postgres"`
		SSLMode  string `env:"DB_SSL_MODE,disable"`
	}

	// ───────────── JWT ─────────────
	JWT struct {
		SecretKey             string `env:"JWT_SECRET_KEY,123456"`
		ExpirationTime        int    `env:"JWT_EXPIRATION_TIME,3600"`
		RefreshExpirationTime int    `env:"JWT_REFRESH_EXPIRATION_TIME,7200"`
	}

	// ───────────── ADMIN ─────────────
	Admin struct {
		DefaultAdminEmail    string `env:"DEFAULT_ADMIN_EMAIL"`
		DefaultAdminPassword string `env:"DEFAULT_ADMIN_PASSWORD"`
	}

	// ───────────── LOGGING ─────────────
	Log struct {
		LogToFile   bool   `env:"LOG_TO_FILE,false"`
		MaxFileSize int    `env:"MAX_FILE_SIZE,5"`
		LogLevel    string `env:"LOG_LEVEL,info"`
		MaxLogFiles int    `env:"MAX_LOG_FILES,10"`
		LogFileName string `env:"LOG_FILENAME,cpo_log"`
		Formatted   bool   `env:"FORMATTED,false"`
	}

	// ───────────── SMTP ─────────────
	SMTP struct {
		Host     string `env:"SMTP_HOST,localhost"`
		Port     int    `env:"SMTP_PORT,587"`
		Username string `env:"SMTP_USERNAME,"`
		Password string `env:"SMTP_PASSWORD,"`
		From     string `env:"SMTP_FROM,"`
		FromName string `env:"SMTP_FROM_NAME,no-reply"`
		ImageDir string `env:"SMTP_IMAGE_DIR,"`
	}

	// ───────────── FRONT OFFICE BACKEND ─────────────
	FrontOffice struct {
		BackendURL string `env:"FRONT_OFFICE_BACKEND_URL,http://127.0.0.1:8301"`
	}
}

func LoadConfig() {
	// Load Config from .env
	err := astroenv.LoadEnvVarible(&Configvar)
	if err != nil {
		log.Error().Msgf("Error loading config: %v", err)
		os.Exit(1)
	}
}
