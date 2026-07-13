package pkg

import (
	"time"
)

// Get Local time (date, time, timet, datetime, datetimeMonthly)
func GetFormatedLocalTime(format string) string {
	currentTime := time.Now()

	// Handle different format types
	switch format {
	case "date":
		// Returns only date: 2006-01-02
		return currentTime.Format("2006-01-02")
	case "datetimeMonthly":
		// Returns only date: 2006-01-02 15:04
		return currentTime.Format("2006-01-02+15:04")
	case "time":
		// Returns only time: 15:04:05
		return currentTime.Format("15:04:05")
	case "datetime", "":
		// Returns date and time: 2006-01-02 15:04:05 (default)
		return currentTime.Format("2006-01-02 15:04:05")
	case "timet":
		// Returns date and time: 2006-01-02T15:04:05 (RFC3339)
		return currentTime.Format(time.RFC3339)

	default:
		// Default to datetime if unknown format
		return currentTime.Format("2006-01-02 15:04:05")
	}
}
