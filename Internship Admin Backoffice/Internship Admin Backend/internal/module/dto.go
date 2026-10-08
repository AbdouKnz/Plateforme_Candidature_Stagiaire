package module

type ModulePermissionsResponse struct {
	ID                 uint16   `json:"id"`
	ModuleName         string   `json:"module_name"`
	Read               int8     `json:"read"`
	Add                int8     `json:"add"`
	Edit               int8     `json:"edit"`
	Delete             int8     `json:"delete"`
	ModuleIcon         string   `json:"module_icon"`
	ModuleIconColor    string   `json:"module_icon_color"`
	EnabledPermissions []string `json:"enabled_permissions"`
}
