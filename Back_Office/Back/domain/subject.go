package domain

import "github.com/uptrace/bun"

type Subject struct {
	bun.BaseModel `bun:"table:subject,alias:sub" json:"-"`

	ID           int     `bun:"id,pk,autoincrement" json:"id"`
	Code         string  `bun:"code,notnull" json:"code" binding:"required"`
	Name         string  `bun:"name,notnull" json:"name" binding:"required,min=3,max=100"`
	Description  string  `bun:"description,notnull" json:"description" binding:"required"`
	PriorityRank string  `bun:"priority_rank,notnull" json:"priority_rank" binding:"required"`
	Status       bool    `bun:"status,notnull,default:true" json:"status"`
	CreatedAt    string  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt    string  `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`

	Technologies []*Technology `bun:"-" json:"technologies,omitempty"`
	Profiles     []*Profile    `bun:"-" json:"profiles,omitempty"`
}

type SubjectTechnology struct {
	bun.BaseModel `bun:"table:subject_technologies" json:"-"`

	SubjectID    int `bun:"subject_id,pk"`
	TechnologyID int `bun:"technology_id,pk"`
}

type SubjectProfile struct {
	bun.BaseModel `bun:"table:subject_profiles" json:"-"`

	SubjectID int `bun:"subject_id,pk"`
	ProfileID int `bun:"profile_id,pk"`
}
