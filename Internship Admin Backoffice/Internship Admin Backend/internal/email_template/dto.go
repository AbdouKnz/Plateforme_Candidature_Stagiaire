package email_template

import "astro-backend/domain"

type CreateEmailTemplateRequest struct {
	Type     string `json:"type" binding:"required"`
	Subject  string `json:"subject" binding:"required"`
	Body     string `json:"body" binding:"required"`

	Status   *bool  `json:"status,omitempty"`
}

type UpdateEmailTemplateRequest struct {
	Type     string `json:"type,omitempty"`
	Subject  string `json:"subject,omitempty"`
	Body     string `json:"body,omitempty"`

	Status   *bool  `json:"status,omitempty"`
}

type EmailTemplateResponse struct {
	ID        int    `json:"id"`
	Type      string `json:"type"`
	Subject   string `json:"subject"`
	Body      string `json:"body"`

	Status    bool   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type EmailTemplateParams struct {
	Search string `json:"search" form:"search"`
}

func ToResponse(et *domain.EmailTemplate) EmailTemplateResponse {
	return EmailTemplateResponse{
		ID:        et.ID,
		Type:      et.Type,
		Subject:   et.Subject,
		Body:      et.Body,

		Status:    et.Status,
		CreatedAt: et.CreatedAt,
		UpdatedAt: et.UpdatedAt,
	}
}

func ToResponseList(emailTemplates []*domain.EmailTemplate) []EmailTemplateResponse {
	result := make([]EmailTemplateResponse, len(emailTemplates))
	for i, et := range emailTemplates {
		result[i] = ToResponse(et)
	}
	return result
}
