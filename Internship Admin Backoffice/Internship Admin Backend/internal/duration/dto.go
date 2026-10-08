package duration

import "astro-backend/domain"

type CreateDurationRequest struct {
	Name string `json:"name"`
}

type DurationResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Status    bool   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpdateDurationRequest struct {
	Name   string `json:"name,omitempty"`
	Status *bool  `json:"status,omitempty"`
}

type DurationParams struct {
	Search string `json:"search" form:"search"`
	Status *bool  `json:"status" form:"status"`
}

func ToResponse(duration *domain.Duration) DurationResponse {
	return DurationResponse{
		ID:        duration.ID,
		Name:      duration.Name,
		Status:    duration.Status,
		CreatedAt: duration.CreatedAt,
		UpdatedAt: duration.UpdatedAt,
	}
}

func ToResponseList(durations []*domain.Duration) []DurationResponse {
	result := make([]DurationResponse, len(durations))
	for i, d := range durations {
		result[i] = ToResponse(d)
	}
	return result
}
