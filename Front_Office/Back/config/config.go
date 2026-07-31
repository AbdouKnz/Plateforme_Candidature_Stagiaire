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

	// ───────────── LOGGING ─────────────
	Log struct {
		LogToFile   bool   `env:"LOG_TO_FILE,false"`
		MaxFileSize int    `env:"MAX_FILE_SIZE,5"`
		LogLevel    string `env:"LOG_LEVEL,info"`
		MaxLogFiles int    `env:"MAX_LOG_FILES,10"`
		LogFileName string `env:"LOG_FILENAME,cpo_log"`
		Formatted   bool   `env:"FORMATTED,false"`
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

	Configvar.Log.LogToFile = getEnv("LOG_TO_FILE", "false") == "true"
	Configvar.Log.MaxFileSize = getEnvInt("MAX_FILE_SIZE", 5)
	Configvar.Log.LogLevel = getEnv("LOG_LEVEL", "trace")
	Configvar.Log.MaxLogFiles = getEnvInt("MAX_LOG_FILES", 10)
	Configvar.Log.LogFileName = getEnv("LOG_FILENAME", "cpo_log")
	Configvar.Log.Formatted = getEnv("FORMATTED", "false") == "true"

	log.Info().Msg("Configuration loaded successfully")
}
