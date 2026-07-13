package subject

import "astro-backend/domain"

type CreateSubjectRequest struct {
	Code          string `json:"code"`
	Name          string `json:"name"`
	TechnologyIDs []int  `json:"technology_ids"`
	ProfileIDs    []int  `json:"profile_ids"`
	Description   string `json:"description"`
	PriorityRank  string `json:"priority_rank"`
}

type SubjectResponse struct {
	ID              int      `json:"id"`
	Code            string   `json:"code"`
	Name            string   `json:"name"`
	TechnologyIDs   []int    `json:"technology_ids"`
	TechnologyNames []string `json:"technology_names"`
	ProfileIDs      []int    `json:"profile_ids"`
	ProfileNames    []string `json:"profile_names"`
	Description     string   `json:"description"`
	PriorityRank    string   `json:"priority_rank"`
	Status          bool     `json:"status"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
}

type UpdateSubjectRequest struct {
	Code          string `json:"code,omitempty"`
	Name          string `json:"name,omitempty"`
	TechnologyIDs []int  `json:"technology_ids,omitempty"`
	ProfileIDs    []int  `json:"profile_ids,omitempty"`
	Description   string `json:"description,omitempty"`
	PriorityRank  string `json:"priority_rank,omitempty"`
	Status        *bool  `json:"status,omitempty"`
}

type SubjectParams struct {
	Search string `json:"search" form:"search"`
	Status *bool  `json:"status" form:"status"`
}

func ToResponse(s *domain.Subject) SubjectResponse {
	techIDs := make([]int, 0)
	techNames := make([]string, 0)
	for _, t := range s.Technologies {
		techIDs = append(techIDs, t.ID)
		techNames = append(techNames, t.Name)
	}

	profIDs := make([]int, 0)
	profNames := make([]string, 0)
	for _, p := range s.Profiles {
		profIDs = append(profIDs, p.ID)
		profNames = append(profNames, p.Name)
	}

	return SubjectResponse{
		ID:              s.ID,
		Code:            s.Code,
		Name:            s.Name,
		TechnologyIDs:   techIDs,
		TechnologyNames: techNames,
		ProfileIDs:      profIDs,
		ProfileNames:    profNames,
		Description:     s.Description,
		PriorityRank:    s.PriorityRank,
		Status:          s.Status,
		CreatedAt:       s.CreatedAt,
		UpdatedAt:       s.UpdatedAt,
	}
}

func ToResponseList(subjects []*domain.Subject) []SubjectResponse {
	result := make([]SubjectResponse, len(subjects))
	for i, s := range subjects {
		result[i] = ToResponse(s)
	}
	return result
}
