package domain

import "github.com/uptrace/bun"

type WaitlistSubscriber struct {
	bun.BaseModel `bun:"table:waitlist_subscribers,alias:wls" json:"-"`

	ID         int    `bun:"id,pk,autoincrement" json:"id"`
	Email      string `bun:"email,notnull,unique" json:"email" binding:"required,email"`
	Status     string `bun:"status,notnull,default:'pending'" json:"status"`
	CreatedAt  string `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	NotifiedAt string `bun:"notified_at,nullzero" json:"notified_at,omitempty"`
}
