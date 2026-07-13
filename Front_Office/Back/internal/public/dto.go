package public

import "front-office-backend/domain"

type SubscribeWaitlistRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type FrontOfficeStatusResponse struct {
	IsEnabled     bool   `json:"is_enabled"`
	ReopeningDate string `json:"reopening_date,omitempty"`
}

type DegreeResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type TypeResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type DurationResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type TechnologyResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type SubjectTechnologyResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type SubjectResponse struct {
	ID           int                       `json:"id"`
	Code         string                    `json:"code"`
	Name         string                    `json:"name"`
	Description  string                    `json:"description"`
	PriorityRank string                    `json:"priority_rank"`
	Technologies []SubjectTechnologyResponse `json:"technologies"`
}

func degreeToResponse(d *domain.Degree) DegreeResponse {
	return DegreeResponse{ID: d.ID, Name: d.Name}
}

func degreeListToResponse(degrees []*domain.Degree) []DegreeResponse {
	res := make([]DegreeResponse, len(degrees))
	for i, d := range degrees {
		res[i] = degreeToResponse(d)
	}
	return res
}

func typeToResponse(t *domain.Type) TypeResponse {
	return TypeResponse{ID: t.ID, Name: t.Name}
}

func typeListToResponse(types []*domain.Type) []TypeResponse {
	res := make([]TypeResponse, len(types))
	for i, t := range types {
		res[i] = typeToResponse(t)
	}
	return res
}

func durationToResponse(d *domain.Duration) DurationResponse {
	return DurationResponse{ID: d.ID, Name: d.Name}
}

func durationListToResponse(durations []*domain.Duration) []DurationResponse {
	res := make([]DurationResponse, len(durations))
	for i, d := range durations {
		res[i] = durationToResponse(d)
	}
	return res
}

func technologyToResponse(t *domain.Technology) TechnologyResponse {
	return TechnologyResponse{ID: t.ID, Name: t.Name}
}

func technologyListToResponse(technologies []*domain.Technology) []TechnologyResponse {
	res := make([]TechnologyResponse, len(technologies))
	for i, t := range technologies {
		res[i] = technologyToResponse(t)
	}
	return res
}

func subjectToResponse(s *domain.Subject) SubjectResponse {
	techs := make([]SubjectTechnologyResponse, 0)
	for _, t := range s.Technologies {
		techs = append(techs, SubjectTechnologyResponse{ID: t.ID, Name: t.Name})
	}
	return SubjectResponse{
		ID:           s.ID,
		Code:         s.Code,
		Name:         s.Name,
		Description:  s.Description,
		PriorityRank: s.PriorityRank,
		Technologies: techs,
	}
}

func subjectListToResponse(subjects []*domain.Subject) []SubjectResponse {
	res := make([]SubjectResponse, len(subjects))
	for i, s := range subjects {
		res[i] = subjectToResponse(s)
	}
	return res
}
