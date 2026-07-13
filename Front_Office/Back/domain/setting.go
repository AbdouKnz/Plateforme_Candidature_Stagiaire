package domain

import "github.com/uptrace/bun"

type Setting struct {
	bun.BaseModel `bun:"table:settings,alias:stg" json:"-"`
	Group         string `bun:"group,pk,notnull" json:"group"`
	Key           string `bun:"key,pk,notnull" json:"key"`
	Value         string `bun:"value,notnull" json:"value"`
}