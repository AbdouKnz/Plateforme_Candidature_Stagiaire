package router

import (
	"astro-backend/internal/audit"
	"astro-backend/internal/auth"
	"astro-backend/internal/candidature"
	"astro-backend/internal/degree"
	"astro-backend/internal/duration"
	"astro-backend/internal/email_log"
	"astro-backend/internal/email_template"
	"astro-backend/internal/front_office"
	"astro-backend/internal/mail_config"
	"astro-backend/internal/module"
	"astro-backend/internal/profile"
	"astro-backend/internal/role"
	"astro-backend/internal/setting"
	"astro-backend/internal/subject"
	"astro-backend/internal/technology"
	typ "astro-backend/internal/type"
	"astro-backend/internal/user"
	"astro-backend/internal/waitlist"
	"astro-backend/middleware"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func InitBackofficeRouter(r *gin.Engine, database *bun.DB) {
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())

	auth.AuthRoutes(protected, r, database)

	audit.AuditRoutes(protected, database)
	module.ModulesRoutes(protected, database)
	role.RolesRoutes(protected, database)
	user.UsersRoutes(protected, database)
	setting.SettingsRoutes(protected, database)
	degree.DegreesRoutes(protected, database)
	technology.TechnologiesRoutes(protected, database)
	profile.ProfilesRoutes(protected, database)
	duration.DurationsRoutes(protected, database)
	typ.TypesRoutes(protected, database)
	subject.SubjectsRoutes(protected, database)
	candidature.CandidatureRoutes(protected, database)
	email_template.EmailTemplateRoutes(protected, database)
	email_log.EmailLogRoutes(protected, database)
	front_office.FrontOfficeRoutes(protected, database)
	mail_config.MailConfigRoutes(protected, database)
	waitlist.AdminWaitlistRoutes(protected, database)

	// Public routes (no auth required)
	public := r.Group("/api/public")
	front_office.PublicFrontOfficeRoutes(public, database)
	waitlist.PublicWaitlistRoutes(public, database)
}
