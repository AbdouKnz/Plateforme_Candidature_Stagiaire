package profile

import "astro-backend/domain"

type CreateProfileRequest struct {
	Name string `json:"name"`
}

type ProfileResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Status    bool   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpdateProfileRequest struct {
	Name   string `json:"name,omitempty"`
	Status *bool  `json:"status,omitempty"`
}

type ProfileParams struct {
	Search string `json:"search" form:"search"`
	Status *bool  `json:"status" form:"status"`
}

func ToResponse(prof *domain.Profile) ProfileResponse {
	return ProfileResponse{
		ID:        prof.ID,
		Name:      prof.Name,
		Status:    prof.Status,
		CreatedAt: prof.CreatedAt,
		UpdatedAt: prof.UpdatedAt,
	}
}

func ToResponseList(profiles []*domain.Profile) []ProfileResponse {
	result := make([]ProfileResponse, len(profiles))
	for i, p := range profiles {
		result[i] = ToResponse(p)
	}
	return result
}
