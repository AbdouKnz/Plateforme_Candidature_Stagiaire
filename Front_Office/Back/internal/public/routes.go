package public

import (
	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func PublicRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := NewPublicService(db)
	handler := NewPublicHandler(service)

	r.GET("/front-office/status", handler.GetFrontOfficeStatusHandler)
	r.GET("/degrees", handler.GetActiveDegreesHandler)
	r.GET("/types", handler.GetActiveTypesHandler)
	r.GET("/durations", handler.GetActiveDurationsHandler)
	r.GET("/technologies", handler.GetActiveTechnologiesHandler)
	r.GET("/subjects", handler.GetActiveSubjectsHandler)
	r.POST("/candidatures", handler.CreateCandidatureHandler)
	r.POST("/waitlist", handler.SubscribeWaitlistHandler)
}
