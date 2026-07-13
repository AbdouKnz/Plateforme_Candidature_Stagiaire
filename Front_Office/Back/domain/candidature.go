package domain

import "github.com/uptrace/bun"

type Candidature struct {
	bun.BaseModel `bun:"table:candidature,alias:cnd" json:"-"`

	ID                    int    `bun:"id,pk,autoincrement" json:"id"`
	FullName              string `bun:"full_name,notnull" json:"full_name"`
	Email1                string `bun:"email1,notnull" json:"email1"`
	Gender1               string `bun:"gender1,notnull" json:"gender1"`
	Phone1                string `bun:"phone1,notnull" json:"phone1"`
	Degree1               string `bun:"degree1,notnull" json:"degree1"`
	FullName2             string `bun:"full_name2" json:"full_name2"`
	Email2                string `bun:"email2" json:"email2"`
	Gender2               string `bun:"gender2" json:"gender2"`
	Phone2                string `bun:"phone2" json:"phone2"`
	Degree2               string `bun:"degree2" json:"degree2"`
	Duration              string `bun:"duration" json:"duration"`
	Methode               string `bun:"methode" json:"methode"`
	StartDate             string `bun:"start_date" json:"start_date"`
	SubjectName           string `bun:"subject_name" json:"subject_name"`
	University            string `bun:"university" json:"university"`
	University2           string `bun:"university2" json:"university2"`
	DateApplication       string `bun:"date_application" json:"date_application"`
	PathCV                string `bun:"path_cv" json:"path_cv"`
	PathLettreMotivation  string `bun:"path_lettre_motivation" json:"path_lettre_motivation"`
	PathCV2               string `bun:"path_cv2" json:"path_cv2"`
	PathLettreMotivation2 string `bun:"path_lettre_motivation2" json:"path_lettre_motivation2"`
	Status                string `bun:"status,notnull,default:'pending'" json:"status"`
	CreatedAt             string `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt             string `bun:"updated_at,notnull,default:current_timestamp" json:"updated_at"`
}
