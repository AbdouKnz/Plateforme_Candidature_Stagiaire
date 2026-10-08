package domain

import "github.com/uptrace/bun"

type FrontOfficeStatus struct {
	bun.BaseModel `bun:"table:settings,alias:st" json:"-"`

	Group string `bun:"group,pk,notnull" json:"group"`
	Key   string `bun:"key,pk,notnull" json:"key"`
	Value string `bun:"value,notnull" json:"value"`
	Type  string `bun:"type,notnull,default:'text'" json:"type"`
}
