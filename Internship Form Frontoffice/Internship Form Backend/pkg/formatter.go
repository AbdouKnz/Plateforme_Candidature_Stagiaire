package pkg

import (
	"time"
)

func GetFormatedLocalTime(format string) string {
	currentTime := time.Now()

	switch format {
	case "date":
		return currentTime.Format("2006-01-02")
	case "datetimeMonthly":
		return currentTime.Format("2006-01-02+15:04")
	case "time":
		return currentTime.Format("15:04:05")
	case "datetime", "":
		return currentTime.Format("2006-01-02 15:04:05")
	case "timet":
		return currentTime.Format(time.RFC3339)
	default:
		return currentTime.Format("2006-01-02 15:04:05")
	}
}
