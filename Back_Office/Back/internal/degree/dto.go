package degree

import "astro-backend/domain"

type CreateDegreeRequest struct {
	Name string `json:"name"`
}

type DegreeResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Status    bool   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpdateDegreeRequest struct {
	Name   string `json:"name,omitempty"`
	Status *bool  `json:"status,omitempty"`
}

type DegreeParams struct {
	Search string `json:"search" form:"search"`
	Status *bool  `json:"status" form:"status"`
}

func ToResponse(degree *domain.Degree) DegreeResponse {
	return DegreeResponse{
		ID:        degree.ID,
		Name:      degree.Name,
		Status:    degree.Status,
		CreatedAt: degree.CreatedAt,
		UpdatedAt: degree.UpdatedAt,
	}
}

func ToResponseList(degrees []*domain.Degree) []DegreeResponse {
	result := make([]DegreeResponse, len(degrees))
	for i, d := range degrees {
		result[i] = ToResponse(d)
	}
	return result
}
