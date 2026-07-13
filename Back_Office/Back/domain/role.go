package domain

import "github.com/uptrace/bun"

type Role struct {
	bun.BaseModel `bun:"table:roles,alias:r" json:"-"`
	ID            int               `bun:"id,pk,autoincrement" json:"role_id"`
	Name          string            `bun:"name,unique,notnull" json:"role_name"`
	Permissions   map[string]string `bun:"permissions,type:jsonb" json:"role_permissions"`
	UserCount     int               `bun:"user_count,scanonly" json:"user_count"`
	CreatedAt     string            `bun:",nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt     string            `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`
}
