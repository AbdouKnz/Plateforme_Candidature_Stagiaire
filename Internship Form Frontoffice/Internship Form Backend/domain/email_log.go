package domain

import (
	"github.com/uptrace/bun"
)

type EmailLog struct {
	bun.BaseModel `bun:"table:email_logs,alias:el" json:"-"`
	ID            int    `bun:"id,pk,autoincrement" json:"id"`
	CandidatureID int    `bun:"candidature_id,notnull" json:"candidature_id"`
	Recipient     string `bun:"recipient,notnull" json:"recipient"`
	Subject       string `bun:"subject,notnull" json:"subject"`
	Body          string `bun:"body,notnull" json:"body"`
	TemplateType  string `bun:"template_type,notnull" json:"template_type"`
	CandidatName  string `bun:"candidat_name,notnull" json:"candidat_name"`
	SubjectName   string `bun:"subject_name,notnull" json:"subject_name"`
	Status        string `bun:"status,notnull,default:'sent'" json:"status"`
	SentAt        string `bun:"sent_at,notnull" json:"sent_at"`
}
