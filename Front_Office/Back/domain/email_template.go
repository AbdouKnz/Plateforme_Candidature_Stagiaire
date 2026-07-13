package domain

import "github.com/uptrace/bun"

type EmailTemplate struct {
	bun.BaseModel `bun:"table:email_templates,alias:et" json:"-"`

	ID        int    `bun:"id,pk,autoincrement" json:"id"`
	Type      string `bun:"type,notnull" json:"type"`
	Subject   string `bun:"subject,notnull" json:"subject"`
	Body      string `bun:"body,notnull" json:"body"`
	Status    bool   `bun:"status,notnull,default:true" json:"status"`
	CreatedAt string `bun:"created_at,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt string `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`
}
