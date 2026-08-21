package domain

import "github.com/uptrace/bun"

type Subject struct {
	bun.BaseModel `bun:"table:subject,alias:sub" json:"-"`

	ID               int     `bun:"id,pk,autoincrement" json:"id"`
	Code             string  `bun:"code,notnull" json:"code" binding:"required"`
	Name             string  `bun:"name,notnull" json:"name" binding:"required,min=3,max=100"`
	Description      string  `bun:"description,notnull" json:"description" binding:"required"`
	Status           bool    `bun:"status,notnull,default:true" json:"status"`
	OnlineQuizLink   string  `bun:"online_quiz_link,default:''" json:"online_quiz_link"`
	OnlineMeetingLink string `bun:"online_meeting_link,default:''" json:"online_meeting_link"`
	F2FMeetingLink   string  `bun:"f2f_meeting_link,default:''" json:"f2f_meeting_link"`
	DurationID       *int    `bun:"duration_id,default:NULL" json:"duration_id"`
	CreatedAt        string  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt        string  `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`

	Duration     *Duration     `bun:"rel:belongs-to,join:duration_id=id" json:"duration,omitempty"`
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
