package pkg

const (
	REQUEST_HEADER string = "X-Req-ID"
)

const (
	ErrInvalidInput = "Invalid input"
	ErrInvalidID    = "Invalid ID"
	ErrInvalidRange = "MinRange should not exceed MaxRange"
)
const (
	ErrorTag      = "Error"
	NotFoundTag   = "notFound"
	ValidationTag = "Validation"
	NoMatchTag    = "Match"
)

const (
	ENABLED  = "enabled"
	DISABLED = "disabled"
)

// Audit-Change-Type
const (
	CREATE = "create"
	UPDATE = "update"
	DELETE = "delete"
	EXPORT = "export"
	LOGIN  = "login"
	LOGOUT = "logout"
)

// Audit-Action-Type
const (
	CREATE_ACTION = "Create"
	UPDATE_ACTION = "Update"
	DELETE_ACTION = "Delete"
	EXPORT_ACTION = "Export"
	LOGIN_ACTION  = "Logged in"
	LOGOUT_ACTION = "Logged out"
)

// Audit-Module
const (
	USER_MODULE           = "User"
	ROLE_MODULE           = "Role"
	AUTH_MODULE           = "Auth"
	SETTING_MODULE        = "Setting"
	DEGREE_MODULE         = "Degree"
	TECHNOLOGY_MODULE     = "Technology"
	PROFILE_MODULE        = "Profile"
	DURATION_MODULE       = "Duration"
	TYPE_MODULE           = "Type"
	SUBJECT_MODULE        = "Subject"
	CANDIDATURE_MODULE    = "Candidature"
	EMAIL_TEMPLATE_MODULE = "EmailTemplate"
	EMAIL_LOG_MODULE      = "EmailLog"
)

// Permissions
const (
	DASHBORD_PERMISSIONS       = "dashboard"
	USERS_PERMISSIONS          = "users"
	ROLES_PERMISSIONS          = "roles"
	SETTINGS_PERMISSIONS       = "settings"
	AUDITS_PERMISSIONS         = "audits"
	DEGREES_PERMISSIONS        = "degrees"
	TECHNOLOGIES_PERMISSIONS   = "technologies"
	PROFILES_PERMISSIONS       = "profiles"
	DURATIONS_PERMISSIONS      = "durations"
	TYPES_PERMISSIONS          = "types"
	SUBJECTS_PERMISSIONS       = "subjects"
	CANDIDATURES_PERMISSIONS   = "candidatures"
	EMAIL_TEMPLATE_PERMISSIONS = "email_templates"
	EMAIL_LOGS_PERMISSIONS     = "email_logs"
	FRONT_OFFICE_MESSAGES      = "front_office_messages"
)

// AllModules contains all available audit modules
var AllModules = []string{
	USER_MODULE,
	ROLE_MODULE,
	AUTH_MODULE,
	DEGREE_MODULE,
	TECHNOLOGY_MODULE,
	PROFILE_MODULE,
	DURATION_MODULE,
	TYPE_MODULE,
	SUBJECT_MODULE,
	CANDIDATURE_MODULE,
	EMAIL_TEMPLATE_MODULE,
	EMAIL_LOG_MODULE,
}

// AllActions contains all available audit actions
var AllActions = []string{
	CREATE_ACTION,
	UPDATE_ACTION,
	DELETE_ACTION,
	LOGIN_ACTION,
	LOGOUT_ACTION,
}
