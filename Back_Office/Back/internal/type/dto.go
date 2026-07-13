package typ

import "astro-backend/domain"

type CreateTypeRequest struct {
	Name string `json:"name"`
}

type TypeResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Status    bool   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpdateTypeRequest struct {
	Name   string `json:"name,omitempty"`
	Status *bool  `json:"status,omitempty"`
}

type TypeParams struct {
	Search string `json:"search" form:"search"`
	Status *bool  `json:"status" form:"status"`
}

func ToResponse(t *domain.Type) TypeResponse {
	return TypeResponse{
		ID:        t.ID,
		Name:      t.Name,
		Status:    t.Status,
		CreatedAt: t.CreatedAt,
		UpdatedAt: t.UpdatedAt,
	}
}

func ToResponseList(types []*domain.Type) []TypeResponse {
	result := make([]TypeResponse, len(types))
	for i, t := range types {
		result[i] = ToResponse(t)
	}
	return result
}
