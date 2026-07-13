package email_log

import "astro-backend/domain"

type EmailLogResponse struct {
	ID            int    `json:"id"`
	CandidatureID int    `json:"candidature_id"`
	Recipient     string `json:"recipient"`
	Subject       string `json:"subject"`
	Body          string `json:"body"`
	TemplateType  string `json:"template_type"`
	CandidatName  string `json:"candidat_name"`
	SubjectName   string `json:"subject_name"`
	Status        string `json:"status"`
	SentAt        string `json:"sent_at"`
}

type EmailLogParams struct {
	Search   string `form:"search"`
	Page     int    `form:"page"`
	PageSize int    `form:"pageSize"`
	FileType string `form:"file_type"`
}

type PaginationMetadata struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalRows  int `json:"totalRows"`
	TotalPages int `json:"totalPages"`
}

type PaginatedEmailLogResponse struct {
	Data       []EmailLogResponse `json:"data"`
	Pagination PaginationMetadata `json:"pagination"`
}

func ToResponse(el *domain.EmailLog) EmailLogResponse {
	return EmailLogResponse{
		ID:            el.ID,
		CandidatureID: el.CandidatureID,
		Recipient:     el.Recipient,
		Subject:       el.Subject,
		Body:          el.Body,
		TemplateType:  el.TemplateType,
		CandidatName:  el.CandidatName,
		SubjectName:   el.SubjectName,
		Status:        el.Status,
		SentAt:        el.SentAt,
	}
}

func ToResponseList(emailLogs []*domain.EmailLog) []EmailLogResponse {
	result := make([]EmailLogResponse, len(emailLogs))
	for i, el := range emailLogs {
		result[i] = ToResponse(el)
	}
	return result
}
