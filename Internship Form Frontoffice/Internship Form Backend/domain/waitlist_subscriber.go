package domain

import "github.com/uptrace/bun"

type WaitlistSubscriber struct {
	bun.BaseModel `bun:"table:waitlist_subscribers,alias:wls"`

	ID         int    `bun:"id,pk,autoincrement" json:"id"`
	Email      string `bun:"email,unique,notnull" json:"email"`
	Status     string `bun:"status,default:'pending'" json:"status"`
	CreatedAt  string `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	NotifiedAt string `bun:"notified_at,nullzero" json:"notified_at,omitempty"`
}
