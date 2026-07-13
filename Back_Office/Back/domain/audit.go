package domain

import (
	"github.com/uptrace/bun"
)

type AuditLog struct {
	bun.BaseModel `bun:"table:audit,alias:a" json:"-"`
	ID            int          `bun:"id,pk,autoincrement" json:"audit_id"`
	ActorID       int          `bun:"actor_id,notnull" json:"actor_id"`
	ActorName     string       `bun:"actor_name,notnull" json:"actor_name"`
	Module        string       `bun:"module,notnull" json:"module"`
	Action        string       `bun:"action,notnull" json:"action"`
	Change        ChangeDetail `bun:"change,type:jsonb" json:"change"`
	Icon          string       `bun:"icon,nullzero" json:"icon"`
	Timestamp     string       `bun:"time_stamp,notnull" json:"date"`
}

type ChangeDetail struct {
	Type   string                 `json:"type"`
	Fields map[string]FieldChange `json:"fields"`
}

type FieldChange struct {
	OldValues       interface{} `json:"old_values,omitempty"`
	NewValues       interface{} `json:"new_values,omitempty"`
	CreatedValues   interface{} `json:"created_values,omitempty"`
	DeletedValues   interface{} `json:"deleted_values,omitempty"`
	LoggedInValues  interface{} `json:"logged_in_values,omitempty"`
	LoggedOutValues interface{} `json:"logged_out_values,omitempty"`
	Changed         bool        `json:"changed"`
}
