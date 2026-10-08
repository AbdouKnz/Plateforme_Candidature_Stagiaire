package subject

import (
	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

// PublicSubjectRoutes registers the unauthenticated public subject endpoints
// under /api/public. GetSubjectByIDHandler is reused as-is: it calls the
// existing service GetByID (with relations) and returns 404 when not found.
func PublicSubjectRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &SubjectService{db}
	handler := NewSubjectHandler(service)

	r.GET("/subjects/:id", handler.GetSubjectByIDHandler)
}
