package domain

import "github.com/uptrace/bun"

type Degree struct {
	bun.BaseModel `bun:"table:degree,alias:deg" json:"-"`

	ID        int    `bun:"id,pk,autoincrement" json:"id"`
	Name      string `bun:"name,notnull" json:"name"`
	Status    bool   `bun:"status,notnull,default:true" json:"status"`
	CreatedAt string `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt string `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`
}
