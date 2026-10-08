package technology

import "astro-backend/domain"

type CreateTechnologyRequest struct {
	Name string `json:"name"`
}

type TechnologyResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Status    bool   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpdateTechnologyRequest struct {
	Name   string `json:"name,omitempty"`
	Status *bool  `json:"status,omitempty"`
}

type TechnologyParams struct {
	Search string `json:"search" form:"search"`
	Status *bool  `json:"status" form:"status"`
}

func ToResponse(tech *domain.Technology) TechnologyResponse {
	return TechnologyResponse{
		ID:        tech.ID,
		Name:      tech.Name,
		Status:    tech.Status,
		CreatedAt: tech.CreatedAt,
		UpdatedAt: tech.UpdatedAt,
	}
}

func ToResponseList(technologies []*domain.Technology) []TechnologyResponse {
	result := make([]TechnologyResponse, len(technologies))
	for i, t := range technologies {
		result[i] = ToResponse(t)
	}
	return result
}
