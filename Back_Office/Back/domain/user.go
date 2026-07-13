package domain

import "github.com/uptrace/bun"

type User struct {
	bun.BaseModel `bun:"table:users,alias:u" json:"-"`

	ID        int    `bun:"id,pk,autoincrement" json:"id"`
	FirstName string `bun:"first_name,notnull" json:"first_name" binding:"required,min=3,max=20"`
	LastName  string `bun:"last_name,notnull" json:"last_name" binding:"required,min=3,max=20"`
	Email     string `bun:"email,unique,notnull" json:"email" binding:"required,email"`
	Password  string `bun:"password,notnull" json:"password" binding:"required,min=4"`
	Status    bool   `bun:"status,notnull,default:true" json:"status"`
	Role      *Role  `bun:"rel:belongs-to,join:role_id=id"`
	RoleID    int    `bun:"role_id,notnull" json:"role_id"`
	CreatedAt string `bun:",nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt string `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`
}
