package subject

import (
	"astro-backend/middleware"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func SubjectsRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := &SubjectService{db}
	handler := NewSubjectHandler(service)

	subjectGroup := r.Group("/subjects")
	subjectGroup.Use(middleware.AuthMiddleware())
	{
		subjectGroup.GET("/", handler.GetAllSubjectsHandler)

		subjectGroup.Use(middleware.PermissionMiddleware(pkg.SUBJECTS_PERMISSIONS))
		{
			subjectGroup.POST("/", handler.CreateSubjectHandler)
			subjectGroup.GET("/:id", handler.GetSubjectByIDHandler)
			subjectGroup.DELETE("/:id", handler.DeleteSubjectHandler)
			subjectGroup.PUT("/:id", handler.UpdateSubjectHandler)
		}
	}
}
