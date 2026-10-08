package pkg

import (
	"github.com/gin-gonic/gin"
)

const (
	LangHeader = "Accept-Language"
	LangEN     = "en"
	LangFR     = "fr"
)

var Messages = map[string]map[string]string{
	LangEN: {
		// Candidatures
		"candidature_created_successfully": "Candidature submitted successfully",
		"candidature_not_found":            "Candidature not found",

		// Degrees
		"active_degrees_fetched_successfully": "Active degrees fetched successfully",

		// Types
		"active_types_fetched_successfully": "Active types fetched successfully",

		// Durations
		"active_durations_fetched_successfully": "Active durations fetched successfully",

		// Technologies
		"active_technologies_fetched_successfully": "Active technologies fetched successfully",

		// Subjects
		"active_subjects_fetched_successfully": "Active subjects fetched successfully",

		// Front Office
		"front_office_status_fetched_successfully": "Front office status fetched successfully",

		// General
		"internal_error": "An internal error occurred. Please try again later",
	},

	LangFR: {
		// Candidatures
		"candidature_created_successfully": "Candidature soumise avec succès",
		"candidature_not_found":            "Candidature introuvable",

		// Degrees
		"active_degrees_fetched_successfully": "Diplômes actifs récupérés avec succès",

		// Types
		"active_types_fetched_successfully": "Types actifs récupérés avec succès",

		// Durations
		"active_durations_fetched_successfully": "Durées actives récupérées avec succès",

		// Technologies
		"active_technologies_fetched_successfully": "Technologies actives récupérées avec succès",

		// Subjects
		"active_subjects_fetched_successfully": "Sujets actifs récupérés avec succès",

		// Front Office
		"front_office_status_fetched_successfully": "Statut du front office récupéré avec succès",

		// General
		"internal_error": "Une erreur interne s'est produite. Veuillez réessayer plus tard",
	},
}

func GetMessage(lang, key string) string {
	if messages, exists := Messages[lang]; exists {
		if message, exists := messages[key]; exists {
			return message
		}
	}
	if fallbackMsg, exists := Messages[LangEN][key]; exists {
		return fallbackMsg
	}
	return key
}

func T(c *gin.Context, key string) string {
	lang := c.GetString("lang")
	return GetMessage(lang, key)
}
