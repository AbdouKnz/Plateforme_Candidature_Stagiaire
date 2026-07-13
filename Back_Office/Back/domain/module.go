package domain

import "github.com/uptrace/bun"

type ModulePermissions struct {
	bun.BaseModel   `bun:"table:modules,alias:mp" json:"-"`
	ID              uint16 `bun:"id,pk,autoincrement" json:"id"`
	ModuleName      string `bun:"module_name,unique,notnull" json:"module_name" yaml:"module_name"`
	View            int8   `bun:"view,notnull,default:0" json:"view" yaml:"view"`
	Create          int8   `bun:"create,notnull,default:0" json:"create" yaml:"create"`
	Edit            int8   `bun:"edit,notnull,default:0" json:"edit" yaml:"edit"`
	Delete          int8   `bun:"delete,notnull,default:0" json:"delete" yaml:"delete"`
	ModuleIcon      string `bun:"module_icon,notnull" json:"module_icon" yaml:"module_icon"`
	ModuleIconColor string `bun:"module_icon_color,notnull" json:"module_icon_color" yaml:"module_icon_color"`
}

type ModulePermissionsList struct {
	Modules []ModulePermissions `yaml:"modules"`
}
