package candidature

import "astro-backend/domain"

type CreateCandidatureRequest struct {
	FullName              string `json:"full_name"`
	Email1                string `json:"email1"`
	Gender1               string `json:"gender1"`
	Phone1                string `json:"phone1"`
	Degree1               string `json:"degree1"`
	FullName2             string `json:"full_name2,omitempty"`
	Email2                string `json:"email2,omitempty"`
	Gender2               string `json:"gender2,omitempty"`
	Phone2                string `json:"phone2,omitempty"`
	Degree2               string `json:"degree2"`
	Duration              string `json:"duration,omitempty"`
	Methode               string `json:"methode,omitempty"`
	StartDate             string `json:"start_date,omitempty"`
	SubjectName           string `json:"subject_name,omitempty"`
	University            string `json:"university,omitempty"`
	DateApplication       string `json:"date_application,omitempty"`
	PathCV                string `json:"path_cv,omitempty"`
	PathLettreMotivation  string `json:"path_lettre_motivation,omitempty"`
	PathCV2               string `json:"path_cv2,omitempty"`
	PathLettreMotivation2 string `json:"path_lettre_motivation2,omitempty"`
	Status                string `json:"status,omitempty"`
}

type UpdateCandidatureRequest struct {
	FullName              string `json:"full_name,omitempty"`
	Email1                string `json:"email1,omitempty"`
	Gender1               string `json:"gender1,omitempty"`
	Phone1                string `json:"phone1,omitempty"`
	Degree1               string `json:"degree1"`
	FullName2             string `json:"full_name2,omitempty"`
	Email2                string `json:"email2,omitempty"`
	Gender2               string `json:"gender2,omitempty"`
	Phone2                string `json:"phone2,omitempty"`
	Degree2               string `json:"degree2"`
	Duration              string `json:"duration,omitempty"`
	Methode               string `json:"methode,omitempty"`
	StartDate             string `json:"start_date,omitempty"`
	SubjectName           string `json:"subject_name,omitempty"`
	University            string `json:"university,omitempty"`
	University2           string `json:"university2,omitempty"`
	DateApplication       string `json:"date_application,omitempty"`
	PathCV                string `json:"path_cv,omitempty"`
	PathLettreMotivation  string `json:"path_lettre_motivation,omitempty"`
	PathCV2               string `json:"path_cv2,omitempty"`
	PathLettreMotivation2 string `json:"path_lettre_motivation2,omitempty"`
	Status                string `json:"status,omitempty"`
}

type CandidatureResponse struct {
	ID                    int    `json:"id"`
	FullName              string `json:"full_name"`
	Email1                string `json:"email1"`
	Gender1               string `json:"gender1"`
	Phone1                string `json:"phone1"`
	Degree1               string `json:"degree1"`
	FullName2             string `json:"full_name2"`
	Email2                string `json:"email2"`
	Gender2               string `json:"gender2"`
	Phone2                string `json:"phone2"`
	Degree2               string `json:"degree2"`
	Duration              string `json:"duration"`
	Methode               string `json:"methode"`
	StartDate             string `json:"start_date"`
	SubjectName           string `json:"subject_name"`
	University            string `json:"university"`
	University2           string `json:"university2"`
	DateApplication       string `json:"date_application"`
	PathCV                string `json:"path_cv"`
	PathLettreMotivation  string `json:"path_lettre_motivation"`
	PathCV2               string `json:"path_cv2"`
	PathLettreMotivation2 string `json:"path_lettre_motivation2"`
	Status                string `json:"status"`
	CreatedAt             string `json:"created_at"`
	UpdatedAt             string `json:"updated_at"`
}

type CandidatureParams struct {
	Search   string `json:"search" form:"search"`
	FileType string `json:"file_type" form:"file_type"`
}

type SendEmailRequest struct {
	Type          string `json:"type" binding:"required"`
	InterviewDate string `json:"interview_date"`
	InterviewTime string `json:"interview_time"`
}

type EmailPreviewResponse struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func ToResponse(c *domain.Candidature) CandidatureResponse {
	return CandidatureResponse{
		ID:                    c.ID,
		FullName:              c.FullName,
		Email1:                c.Email1,
		Gender1:               c.Gender1,
		Phone1:                c.Phone1,
		Degree1:               c.Degree1,
		FullName2:             c.FullName2,
		Email2:                c.Email2,
		Gender2:               c.Gender2,
		Phone2:                c.Phone2,
		Degree2:               c.Degree2,
		Duration:              c.Duration,
		Methode:               c.Methode,
		StartDate:             c.StartDate,
		SubjectName:           c.SubjectName,
		University:            c.University,
		University2:           c.University2,
		DateApplication:       c.DateApplication,
		PathCV:                c.PathCV,
		PathLettreMotivation:  c.PathLettreMotivation,
		PathCV2:               c.PathCV2,
		PathLettreMotivation2: c.PathLettreMotivation2,
		Status:                c.Status,
		CreatedAt:             c.CreatedAt,
		UpdatedAt:             c.UpdatedAt,
	}
}

func ToResponseList(candidatures []*domain.Candidature) []CandidatureResponse {
	result := make([]CandidatureResponse, len(candidatures))
	for i, c := range candidatures {
		result[i] = ToResponse(c)
	}
	return result
}
