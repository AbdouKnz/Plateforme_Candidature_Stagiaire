package pkg

import "github.com/gin-gonic/gin"

const (
	LangHeader = "Accept-Language"
	LangEN     = "en"
	LangAR     = "ar"
	LangFR     = "fr"
)

var Messages = map[string]map[string]string{
	LangEN: {
		"admin_access_required":  "Admin access required",
		"authorization_required": "Authorization required",
		"permission_denied":      "Permission denied - You don't have access to this resource",
		"user_not_eligible":      "User is not eligible for registration ! Active pass already exists for this visitor today",

		// Roles
		"invalid_request":                  "Invalid request data",
		"invalid_role_id":                  "Invalid role ID provided",
		"role_name_required":               "Role name is required",
		"role_already_exists":              "A role with this name already exists",
		"role_created_successfully":        "Role created successfully",
		"role_updated_successfully":        "Role updated successfully",
		"role_deleted_successfully":        "Role deleted successfully",
		"role_not_found":                   "Role not found",
		"roles_fetched_successfully":       "Roles fetched successfully",
		"failed_to_fetch_roles":            "Failed to fetch roles",
		"no_roles_found":                   "No roles found",
		"cannot_update_super_admin":        "Cannot update super-admin role",
		"cannot_delete_super_admin":        "Cannot delete super-admin role",
		"cannot_change_super_admin_status": "Cannot change status of super-admin",
		"role_usage_checked":               "Role usage checked successfully",
		"new_role_id_required":             "New role ID is required",
		"invalid_new_role_id":              "Invalid new role ID",
		"new_role_not_found":               "New role not found",
		"same_role_reassignment":           "Cannot reassign to the same role",
		"users_reassigned_successfully":    "Users reassigned successfully",
		"role_still_in_use":                "Role is still in use by users",

		// General
		"internal_error":       "An internal error occurred. Please try again later",
		"invalid_credentials":  "Invalid email or password",
		"login_successful":     "Login successful",
		"logout_successful":    "Logout successful",
		"invalid_token_claims": "Invalid token claims",

		// Auth & Authorization
		"method_not_allowed": "Method not allowed",
		"forbidden":          "Access forbidden",
		"unauthorized":       "Unauthorized access",

		// Users
		"user_created_successfully":        "User created successfully",
		"user_already_exists":              "User already exists",
		"invalid_user_id":                  "Invalid user ID",
		"users_fetched_successfully":       "Users fetched successfully",
		"failed_to_fetch_users":            "Failed to fetch users",
		"user_updated_successfully":        "User updated successfully",
		"user_not_found":                   "User not found",
		"user_deleted_successfully":        "User deleted successfully",
		"user_status_updated_successfully": "User status updated successfully",
		"user_fetched_successfully":        "User fetched successfully",

		// Audit
		"audit_logs_fetched_successfully": "Audit logs fetched successfully",
		"failed_to_fetch_audit_logs":      "Failed to fetch audit logs",
		"invalid_audit_id":                "Invalid audit ID",
		"audit_not_found":                 "Audit not found",
		"audit_fetched_successfully":      "Audit fetched successfully",

		// Modules
		"modules_fetched_successfully": "Modules fetched successfully",

		// Technologies
		"technology_created_successfully": "Technology created successfully",
		"technology_updated_successfully": "Technology updated successfully",
		"technology_deleted_successfully": "Technology deleted successfully",
		"technology_not_found":            "Technology not found",

		// Profiles
		"profile_created_successfully": "Profile created successfully",
		"profile_updated_successfully": "Profile updated successfully",
		"profile_deleted_successfully": "Profile deleted successfully",
		"profile_not_found":            "Profile not found",

		// Durations
		"duration_created_successfully": "Duration created successfully",
		"duration_updated_successfully": "Duration updated successfully",
		"duration_deleted_successfully": "Duration deleted successfully",
		"duration_not_found":            "Duration not found",
		"at_least_one_duration_active":  "At least one duration must remain active",

		// Types
		"type_created_successfully": "Type created successfully",
		"type_updated_successfully": "Type updated successfully",
		"type_deleted_successfully": "Type deleted successfully",
		"type_not_found":            "Type not found",
		"at_least_one_type_active":  "At least one type must remain active",

		// Degrees
		"degree_created_successfully": "Degree created successfully",
		"degree_updated_successfully": "Degree updated successfully",
		"degree_deleted_successfully": "Degree deleted successfully",
		"degree_not_found":            "Degree not found",
		"at_least_one_degree_active":  "At least one degree must remain active",

		// Subjects
		"subject_created_successfully": "Subject created successfully",
		"subject_updated_successfully": "Subject updated successfully",
		"subject_deleted_successfully": "Subject deleted successfully",
		"subject_not_found":            "Subject not found",

		// Candidatures
		"candidature_created_successfully": "Candidature created successfully",
		"candidature_updated_successfully": "Candidature updated successfully",
		"email_sent_successfully":          "Email sent successfully",
		"candidature_deleted_successfully": "Candidature deleted successfully",
		"candidature_not_found":            "Candidature not found",

		// Settings
		"settings_fetched_successfully": "Settings fetched successfully",
		"settings_updated_successfully": "Settings updated successfully",
		"password_updated_successfully": "Password updated successfully",

		// Front Office
		"front_office_toggled_successfully": "Front office status updated successfully",

		// Email Logs
		"email_logs_fetched_successfully": "Email logs fetched successfully",
		"email_log_not_found":             "Email log not found",
		"email_log_fetched_successfully":  "Email log fetched successfully",
	},

	LangFR: {
		"admin_access_required":  "Accès administrateur requis",
		"authorization_required": "Autorisation requise",
		"permission_denied":      "Permission refusée - Vous n'avez pas accès à cette ressource",
		"user_not_eligible":      "L'utilisateur n'est pas éligible à l'inscription ! Un pass actif existe déjà pour ce visiteur aujourd'hui",

		// Roles
		"invalid_request":                  "Données de requête invalides",
		"invalid_role_id":                  "ID de rôle invalide",
		"role_name_required":               "Le nom du rôle est requis",
		"role_already_exists":              "Un rôle avec ce nom existe déjà",
		"role_created_successfully":        "Rôle créé avec succès",
		"role_updated_successfully":        "Rôle mis à jour avec succès",
		"role_deleted_successfully":        "Rôle supprimé avec succès",
		"role_not_found":                   "Rôle introuvable",
		"roles_fetched_successfully":       "Rôles récupérés avec succès",
		"failed_to_fetch_roles":            "Échec de la récupération des rôles",
		"no_roles_found":                   "Aucun rôle trouvé",
		"cannot_update_super_admin":        "Impossible de modifier le rôle super-administrateur",
		"cannot_delete_super_admin":        "Impossible de supprimer le rôle super-administrateur",
		"cannot_change_super_admin_status": "Impossible de changer le statut du super-administrateur",
		"role_usage_checked":               "Utilisation du rôle vérifiée avec succès",
		"new_role_id_required":             "L'ID du nouveau rôle est requis",
		"invalid_new_role_id":              "ID de nouveau rôle invalide",
		"new_role_not_found":               "Nouveau rôle introuvable",
		"same_role_reassignment":           "Impossible de réaffecter au même rôle",
		"users_reassigned_successfully":    "Utilisateurs réaffectés avec succès",
		"role_still_in_use":                "Le rôle est toujours utilisé par des utilisateurs",

		// General
		"internal_error":       "Une erreur interne s'est produite. Veuillez réessayer plus tard",
		"invalid_credentials":  "Email ou mot de passe invalide",
		"login_successful":     "Connexion réussie",
		"logout_successful":    "Déconnexion réussie",
		"invalid_token_claims": "Revendications de jeton invalides",

		// Auth & Authorization
		"method_not_allowed": "Méthode non autorisée",
		"forbidden":          "Accès interdit",
		"unauthorized":       "Accès non autorisé",

		// Users
		"user_created_successfully":        "Utilisateur créé avec succès",
		"user_already_exists":              "L'utilisateur existe déjà",
		"invalid_user_id":                  "ID d'utilisateur invalide",
		"users_fetched_successfully":       "Utilisateurs récupérés avec succès",
		"failed_to_fetch_users":            "Échec de la récupération des utilisateurs",
		"user_updated_successfully":        "Utilisateur mis à jour avec succès",
		"user_not_found":                   "Utilisateur introuvable",
		"user_deleted_successfully":        "Utilisateur supprimé avec succès",
		"user_status_updated_successfully": "Statut de l'utilisateur mis à jour avec succès",
		"user_fetched_successfully":        "Utilisateur récupéré avec succès",

		// Audit
		"audit_logs_fetched_successfully": "Journaux d'audit récupérés avec succès",
		"failed_to_fetch_audit_logs":      "Échec de la récupération des journaux d'audit",
		"invalid_audit_id":                "ID d'audit invalide",
		"audit_not_found":                 "Audit introuvable",
		"audit_fetched_successfully":      "Audit récupéré avec succès",

		// Modules
		"modules_fetched_successfully": "Modules récupérés avec succès",

		// Technologies
		"technology_created_successfully": "Technologie créée avec succès",
		"technology_updated_successfully": "Technologie mise à jour avec succès",
		"technology_deleted_successfully": "Technologie supprimée avec succès",
		"technology_not_found":            "Technologie introuvable",

		// Profiles
		"profile_created_successfully": "Profil créé avec succès",
		"profile_updated_successfully": "Profil mis à jour avec succès",
		"profile_deleted_successfully": "Profil supprimé avec succès",
		"profile_not_found":            "Profil introuvable",

		// Durations
		"duration_created_successfully": "Durée créée avec succès",
		"duration_updated_successfully": "Durée mise à jour avec succès",
		"duration_deleted_successfully": "Durée supprimée avec succès",
		"duration_not_found":            "Durée introuvable",
		"at_least_one_duration_active":  "Au moins une durée doit rester active",

		// Types
		"type_created_successfully": "Type créé avec succès",
		"type_updated_successfully": "Type mis à jour avec succès",
		"type_deleted_successfully": "Type supprimé avec succès",
		"type_not_found":            "Type introuvable",
		"at_least_one_type_active":  "Au moins un type doit rester actif",

		// Degrees
		"degree_created_successfully": "Diplôme créé avec succès",
		"degree_updated_successfully": "Diplôme mis à jour avec succès",
		"degree_deleted_successfully": "Diplôme supprimé avec succès",
		"degree_not_found":            "Diplôme introuvable",
		"at_least_one_degree_active":  "Au moins un diplôme doit rester actif",

		// Subjects
		"subject_created_successfully": "Sujet créé avec succès",
		"subject_updated_successfully": "Sujet mis à jour avec succès",
		"subject_deleted_successfully": "Sujet supprimé avec succès",
		"subject_not_found":            "Sujet introuvable",

		// Candidatures
		"candidature_created_successfully": "Candidature créée avec succès",
		"candidature_updated_successfully": "Candidature mise à jour avec succès",
		"email_sent_successfully":          "Email envoyé avec succès",
		"candidature_deleted_successfully": "Candidature supprimée avec succès",
		"candidature_not_found":            "Candidature introuvable",

		// Settings
		"settings_fetched_successfully": "Paramètres récupérés avec succès",
		"settings_updated_successfully": "Paramètres mis à jour avec succès",
		"password_updated_successfully": "Mot de passe mis à jour avec succès",

		// Front Office
		"front_office_toggled_successfully": "Statut du front office mis à jour avec succès",

		// Email Logs
		"email_logs_fetched_successfully": "Journaux d'emails récupérés avec succès",
		"email_log_not_found":             "Journal d'email introuvable",
		"email_log_fetched_successfully":  "Journal d'email récupéré avec succès",
	},

	LangAR: {
		"admin_access_required":  "صلاحية المدير مطلوبة",
		"authorization_required": "التفويض مطلوب",
		"permission_denied":      "تم رفض الإذن - ليس لديك حق الوصول إلى هذا المورد",
		"user_not_eligible":      "المستخدم غير مؤهل للتسجيل ! يوجد تصريح نشط لهذا الزائر اليوم",

		// Roles
		"invalid_request":                  "بيانات الطلب غير صالحة",
		"invalid_role_id":                  "معرف الدور غير صالح",
		"role_name_required":               "اسم الدور مطلوب",
		"role_already_exists":              "يوجد دور بهذا الاسم بالفعل",
		"role_created_successfully":        "تم إنشاء الدور بنجاح",
		"role_updated_successfully":        "تم تحديث الدور بنجاح",
		"role_deleted_successfully":        "تم حذف الدور بنجاح",
		"role_not_found":                   "الدور غير موجود",
		"roles_fetched_successfully":       "تم جلب الأدوار بنجاح",
		"failed_to_fetch_roles":            "فشل في جلب الأدوار",
		"no_roles_found":                   "لم يتم العثور على أدوار",
		"cannot_update_super_admin":        "لا يمكن تحديث دور المشرف العام",
		"cannot_delete_super_admin":        "لا يمكن حذف دور المشرف العام",
		"cannot_change_super_admin_status": "لا يمكن تغيير حالة المشرف العام",
		"role_usage_checked":               "تم التحقق من استخدام الدور بنجاح",
		"new_role_id_required":             "معرف الدور الجديد مطلوب",
		"invalid_new_role_id":              "معرف الدور الجديد غير صالح",
		"new_role_not_found":               "الدور الجديد غير موجود",
		"same_role_reassignment":           "لا يمكن إعادة التعيين إلى نفس الدور",
		"users_reassigned_successfully":    "تم إعادة تعيين المستخدمين بنجاح",
		"role_still_in_use":                "الدور لا يزال قيد الاستخدام من قبل المستخدمين",

		// General
		"internal_error":       "حدث خطأ داخلي. يرجى المحاولة مرة أخرى لاحقاً",
		"invalid_credentials":  "البريد الإلكتروني أو كلمة المرور غير صالحة",
		"login_successful":     "تم تسجيل الدخول بنجاح",
		"logout_successful":    "تم تسجيل الخروج بنجاح",
		"invalid_token_claims": "مطالبات الرمز غير صالحة",

		// Auth & Authorization
		"method_not_allowed": "الطريقة غير مسموح بها",
		"forbidden":          "الوصول محظور",
		"unauthorized":       "وصول غير مصرح به",

		// Users
		"user_created_successfully":        "تم إنشاء المستخدم بنجاح",
		"user_already_exists":              "المستخدم موجود بالفعل",
		"invalid_user_id":                  "معرف المستخدم غير صالح",
		"users_fetched_successfully":       "تم جلب المستخدمين بنجاح",
		"failed_to_fetch_users":            "فشل في جلب المستخدمين",
		"user_updated_successfully":        "تم تحديث المستخدم بنجاح",
		"user_not_found":                   "المستخدم غير موجود",
		"user_deleted_successfully":        "تم حذف المستخدم بنجاح",
		"user_status_updated_successfully": "تم تحديث حالة المستخدم بنجاح",
		"user_fetched_successfully":        "تم جلب المستخدم بنجاح",

		// Audit
		"audit_logs_fetched_successfully": "تم جلب سجلات التدقيق بنجاح",
		"failed_to_fetch_audit_logs":      "فشل في جلب سجلات التدقيق",
		"invalid_audit_id":                "معرف التدقيق غير صالح",
		"audit_not_found":                 "التدقيق غير موجود",
		"audit_fetched_successfully":      "تم جلب التدقيق بنجاح",

		// Modules
		"modules_fetched_successfully": "تم جلب الوحدات بنجاح",

		// Technologies
		"technology_created_successfully": "تم إنشاء التقنية بنجاح",
		"technology_updated_successfully": "تم تحديث التقنية بنجاح",
		"technology_deleted_successfully": "تم حذف التقنية بنجاح",
		"technology_not_found":            "التقنية غير موجودة",

		// Profiles
		"profile_created_successfully": "تم إنشاء الملف الشخصي بنجاح",
		"profile_updated_successfully": "تم تحديث الملف الشخصي بنجاح",
		"profile_deleted_successfully": "تم حذف الملف الشخصي بنجاح",
		"profile_not_found":            "الملف الشخصي غير موجود",

		// Durations
		"duration_created_successfully": "تم إنشاء المدة بنجاح",
		"duration_updated_successfully": "تم تحديث المدة بنجاح",
		"duration_deleted_successfully": "تم حذف المدة بنجاح",
		"duration_not_found":            "المدة غير موجودة",

		// Types
		"type_created_successfully": "تم إنشاء النوع بنجاح",
		"type_updated_successfully": "تم تحديث النوع بنجاح",
		"type_deleted_successfully": "تم حذف النوع بنجاح",
		"type_not_found":            "النوع غير موجود",

		// Degrees
		"degree_created_successfully": "تم إنشاء الدرجة بنجاح",
		"degree_updated_successfully": "تم تحديث الدرجة بنجاح",
		"degree_deleted_successfully": "تم حذف الدرجة بنجاح",
		"degree_not_found":            "الدرجة غير موجودة",

		// Subjects
		"subject_created_successfully": "تم إنشاء المادة بنجاح",
		"subject_updated_successfully": "تم تحديث المادة بنجاح",
		"subject_deleted_successfully": "تم حذف المادة بنجاح",
		"subject_not_found":            "المادة غير موجودة",

		// Candidatures
		"candidature_created_successfully": "تم إنشاء الترشيح بنجاح",
		"candidature_updated_successfully": "تم تحديث الترشيح بنجاح",
		"email_sent_successfully":          "تم إرسال البريد الإلكتروني بنجاح",
		"candidature_deleted_successfully": "تم حذف الترشيح بنجاح",
		"candidature_not_found":            "الترشيح غير موجود",

		// Settings
		"settings_fetched_successfully": "تم جلب الإعدادات بنجاح",
		"settings_updated_successfully": "تم تحديث الإعدادات بنجاح",
		"password_updated_successfully": "تم تحديث كلمة المرور بنجاح",

		// Front Office
		"front_office_toggled_successfully": "تم تحديث حالة المكتب الأمامي بنجاح",

		// Email Logs
		"email_logs_fetched_successfully": "تم جلب سجلات البريد الإلكتروني بنجاح",
		"email_log_not_found":             "سجل البريد الإلكتروني غير موجود",
		"email_log_fetched_successfully":  "تم جلب سجل البريد الإلكتروني بنجاح",
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
