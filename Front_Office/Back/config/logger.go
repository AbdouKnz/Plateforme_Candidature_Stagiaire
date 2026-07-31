package config

import (
	"git.asteroidea.co/go-packages/astrogo/pkg/astrolog"
)

func InitLogger() {

	// load logger config
	cfg := astrolog.CofigLogger{
		LogLevel:    Configvar.Log.LogLevel,
		LogToFile:   Configvar.Log.LogToFile,
		LogFileName: Configvar.Log.LogFileName,
		Formatted:   Configvar.Log.Formatted, // true = JSON everywhere // false = pretty
		MaxFileSize: Configvar.Log.MaxFileSize,
		MaxLogFiles: Configvar.Log.MaxLogFiles,
	}

	// init logger
	astrolog.InitLogger(cfg)
}
