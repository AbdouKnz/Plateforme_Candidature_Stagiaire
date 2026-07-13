package domain

import "github.com/uptrace/bun"

type Setting struct {
	bun.BaseModel  `bun:"table:settings,alias:stg" json:"-"`
	GroupOrder     int      `bun:"group_order" json:"group_order"`
	Group          string   `bun:"group,pk,notnull" json:"group"`
	Key            string   `bun:"key,pk,notnull" json:"key"`
	Value          string   `bun:"value,notnull" json:"value"`
	Type           string   `bun:"type,notnull,default:'text'" json:"type"`
	PossibleValues []string `bun:"possible_values,array" json:"possible_values"`
	Description    string   `bun:"description" json:"description"`
	Icon           string   `bun:"icon" json:"icon"`
}
