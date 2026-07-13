package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

var Configvar ConfigMode

type ConfigMode struct {
	Server struct {
		Port    int    `env:"SERVER_PORT,8301"`
		GinMode string `env:"GIN_MODE,release"`
		TZ      string `env:"TZ,UTC"`
	}
	Database struct {
		Host     string `env:"DB_HOST,localhost"`
		Port     string `env:"DB_PORT,5432"`
		User     string `env:"DB_USER,postgres"`
		Password string `env:"DB_PASSWORD,postgres"`
		Name     string `env:"DB_NAME,postgres"`
		SSLMode  string `env:"DB_SSL_MODE,disable"`
	}
	SMTP struct {
		Host     string `env:"SMTP_HOST,localhost"`
		Port     int    `env:"SMTP_PORT,587"`
		Username string `env:"SMTP_USERNAME"`
		Password string `env:"SMTP_PASSWORD"`
		From     string `env:"SMTP_FROM"`
		FromName string `env:"SMTP_FROM_NAME,no-reply"`
		ImageDir string `env:"SMTP_IMAGE_DIR"`
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func LoadConfig() {
	_ = godotenv.Load()

	Configvar.Server.Port = getEnvInt("SERVER_PORT", 8301)
	Configvar.Server.GinMode = getEnv("GIN_MODE", "release")
	Configvar.Server.TZ = getEnv("TZ", "UTC")

	Configvar.Database.Host = getEnv("DB_HOST", "localhost")
	Configvar.Database.Port = getEnv("DB_PORT", "5432")
	Configvar.Database.User = getEnv("DB_USER", "postgres")
	Configvar.Database.Password = getEnv("DB_PASSWORD", "postgres")
	Configvar.Database.Name = getEnv("DB_NAME", "postgres")
	Configvar.Database.SSLMode = getEnv("DB_SSL_MODE", "disable")

	Configvar.SMTP.Host = getEnv("SMTP_HOST", "localhost")
	Configvar.SMTP.Port = getEnvInt("SMTP_PORT", 587)
	Configvar.SMTP.Username = getEnv("SMTP_USERNAME", "")
	Configvar.SMTP.Password = getEnv("SMTP_PASSWORD", "")
	Configvar.SMTP.From = getEnv("SMTP_FROM", "")
	Configvar.SMTP.FromName = getEnv("SMTP_FROM_NAME", "no-reply")
	Configvar.SMTP.ImageDir = getEnv("SMTP_IMAGE_DIR", "")

	log.Info().Msg("Configuration loaded successfully")
}
