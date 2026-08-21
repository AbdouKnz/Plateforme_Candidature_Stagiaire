package subject

import "astro-backend/domain"

type CreateSubjectRequest struct {
	Code              string `json:"code"`
	Name              string `json:"name"`
	TechnologyIDs     []int  `json:"technology_ids"`
	ProfileIDs        []int  `json:"profile_ids"`
	Description       string `json:"description"`
	OnlineQuizLink    string `json:"online_quiz_link"`
	OnlineMeetingLink string `json:"online_meeting_link"`
	F2FMeetingLink    string `json:"f2f_meeting_link"`
	DurationID        *int   `json:"duration_id"`
}

type SubjectResponse struct {
	ID                int              `json:"id"`
	Code              string           `json:"code"`
	Name              string           `json:"name"`
	TechnologyIDs     []int            `json:"technology_ids"`
	TechnologyNames   []string         `json:"technology_names"`
	ProfileIDs        []int            `json:"profile_ids"`
	ProfileNames      []string         `json:"profile_names"`
	Description       string           `json:"description"`
	Status            bool             `json:"status"`
	OnlineQuizLink    string           `json:"online_quiz_link"`
	OnlineMeetingLink string           `json:"online_meeting_link"`
	F2FMeetingLink    string           `json:"f2f_meeting_link"`
	DurationID        *int             `json:"duration_id"`
	Duration          *DurationResponse `json:"duration,omitempty"`
	CreatedAt         string           `json:"created_at"`
	UpdatedAt         string           `json:"updated_at"`
}

type DurationResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type UpdateSubjectRequest struct {
	Code              string  `json:"code,omitempty"`
	Name              string  `json:"name,omitempty"`
	TechnologyIDs     []int   `json:"technology_ids,omitempty"`
	ProfileIDs        []int   `json:"profile_ids,omitempty"`
	Description       string  `json:"description,omitempty"`
	Status            *bool   `json:"status,omitempty"`
	OnlineQuizLink    *string `json:"online_quiz_link,omitempty"`
	OnlineMeetingLink *string `json:"online_meeting_link,omitempty"`
	F2FMeetingLink    *string `json:"f2f_meeting_link,omitempty"`
	DurationID        *int    `json:"duration_id,omitempty"`
}

type SubjectParams struct {
	Search   string `json:"search" form:"search"`
	Status   *bool  `json:"status" form:"status"`
	FileType string `json:"file_type" form:"file_type"`
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

	var durResp *DurationResponse
	if s.Duration != nil {
		durResp = &DurationResponse{ID: s.Duration.ID, Name: s.Duration.Name}
	}

	return SubjectResponse{
		ID:                s.ID,
		Code:              s.Code,
		Name:              s.Name,
		TechnologyIDs:     techIDs,
		TechnologyNames:   techNames,
		ProfileIDs:        profIDs,
		ProfileNames:      profNames,
		Description:       s.Description,
		Status:            s.Status,
		OnlineQuizLink:    s.OnlineQuizLink,
		OnlineMeetingLink: s.OnlineMeetingLink,
		F2FMeetingLink:    s.F2FMeetingLink,
		DurationID:        s.DurationID,
		Duration:          durResp,
		CreatedAt:         s.CreatedAt,
		UpdatedAt:         s.UpdatedAt,
	}
}

func ToResponseList(subjects []*domain.Subject) []SubjectResponse {
	result := make([]SubjectResponse, len(subjects))
	for i, s := range subjects {
		result[i] = ToResponse(s)
	}
	return result
}
