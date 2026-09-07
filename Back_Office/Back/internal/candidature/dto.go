package candidature

import (
	"astro-backend/domain"
	"strconv"
	"strings"
)

// FlexInt accepts a JSON number or a numeric string (e.g. from multipart form values).
type FlexInt int

func (f *FlexInt) UnmarshalJSON(data []byte) error {
	trimmed := strings.Trim(string(data), `"`)
	if trimmed == "null" || trimmed == "" {
		*f = 0
		return nil
	}
	v, err := strconv.Atoi(trimmed)
	if err != nil {
		return err
	}
	*f = FlexInt(v)
	return nil
}

type CreateCandidatureRequest struct {
	FullName              string `json:"full_name"`
	Email1                string `json:"email1"`
	Gender1               string `json:"gender1"`
	Phone1                string `json:"phone1"`
	Degree1               string `json:"degree1"`
	FullName2             string `json:"full_name2,omitempty"`
	Email2                string `json:"email2,omitempty"`
	Gender2               string `json:"gender2,omitempty"`
	Phone2                string `json:"phone2,omitempty"`
	Degree2               string `json:"degree2"`
	Duration              string `json:"duration,omitempty"`
	Methode               string `json:"methode,omitempty"`
	StartDate             string `json:"start_date,omitempty"`
	SubjectName           string `json:"subject_name,omitempty"`
	University            string `json:"university,omitempty"`
	DateApplication       string `json:"date_application,omitempty"`
	PathCV                string `json:"path_cv,omitempty"`
	PathLettreMotivation  string `json:"path_lettre_motivation,omitempty"`
	PathCV2               string `json:"path_cv2,omitempty"`
	PathLettreMotivation2 string `json:"path_lettre_motivation2,omitempty"`
	Status                string `json:"status,omitempty"`
	Step                  string `json:"step,omitempty"`
	Notes                 string `json:"notes,omitempty"`
}

type UpdateCandidatureRequest struct {
	FullName              string `json:"full_name,omitempty"`
	Email1                string `json:"email1,omitempty"`
	Gender1               string `json:"gender1,omitempty"`
	Phone1                string `json:"phone1,omitempty"`
	Degree1               string `json:"degree1"`
	FullName2             string `json:"full_name2,omitempty"`
	Email2                string `json:"email2,omitempty"`
	Gender2               string `json:"gender2,omitempty"`
	Phone2                string `json:"phone2,omitempty"`
	Degree2               string `json:"degree2"`
	Duration              string `json:"duration,omitempty"`
	Methode               string `json:"methode,omitempty"`
	StartDate             string `json:"start_date,omitempty"`
	SubjectName           string `json:"subject_name,omitempty"`
	University            string `json:"university,omitempty"`
	University2           string `json:"university2,omitempty"`
	DateApplication       string `json:"date_application,omitempty"`
	PathCV                string `json:"path_cv,omitempty"`
	PathLettreMotivation  string `json:"path_lettre_motivation,omitempty"`
	PathCV2               string `json:"path_cv2,omitempty"`
	PathLettreMotivation2 string `json:"path_lettre_motivation2,omitempty"`
	Status                string `json:"status,omitempty"`
	Step                  string `json:"step,omitempty"`
	ScoreCVScreening      *FlexInt `json:"score_cv_screening,omitempty"`
	ScoreOnlineQuiz       *FlexInt `json:"score_online_quiz,omitempty"`
	ScoreOnlineMeeting    *FlexInt `json:"score_online_meeting,omitempty"`
	ScoreF2FMeeting       *FlexInt `json:"score_f2f_meeting,omitempty"`
	ScoreFinalDecision    *FlexInt `json:"score_final_decision,omitempty"`
	Notes                 string `json:"notes,omitempty"`
}

type CandidatureResponse struct {
	ID                    int    `json:"id"`
	FullName              string `json:"full_name"`
	Email1                string `json:"email1"`
	Gender1               string `json:"gender1"`
	Phone1                string `json:"phone1"`
	Degree1               string `json:"degree1"`
	FullName2             string `json:"full_name2"`
	Email2                string `json:"email2"`
	Gender2               string `json:"gender2"`
	Phone2                string `json:"phone2"`
	Degree2               string `json:"degree2"`
	Duration              string `json:"duration"`
	Methode               string `json:"methode"`
	StartDate             string `json:"start_date"`
	SubjectName           string `json:"subject_name"`
	University            string `json:"university"`
	University2           string `json:"university2"`
	DateApplication       string `json:"date_application"`
	PathCV                string `json:"path_cv"`
	PathLettreMotivation  string `json:"path_lettre_motivation"`
	PathCV2               string `json:"path_cv2"`
	PathLettreMotivation2 string `json:"path_lettre_motivation2"`
	Status                string  `json:"status"`
	Step                  string  `json:"step"`
	CurrentStep           int     `json:"current_step"`
	Step1Status           *string `json:"step1_status"`
	Step2Status           *string `json:"step2_status"`
	Step3Status           *string `json:"step3_status"`
	Step4Status           *string `json:"step4_status"`
	Step5Status           *string `json:"step5_status"`
	ScoreCVScreening      int    `json:"score_cv_screening"`
	ScoreOnlineQuiz       int    `json:"score_online_quiz"`
	ScoreOnlineMeeting    int    `json:"score_online_meeting"`
	ScoreF2FMeeting       int    `json:"score_f2f_meeting"`
	ScoreFinalDecision    int    `json:"score_final_decision"`
	Notes                 string `json:"notes"`
	CreatedAt             string `json:"created_at"`
	UpdatedAt             string `json:"updated_at"`
}

type CandidatureParams struct {
	Search          string `json:"search" form:"search"`
	FileType        string `json:"file_type" form:"file_type"`
	FullName        string `json:"full_name" form:"full_name"`
	CandidatureType string `json:"candidature_type" form:"candidature_type"`
	Gender          string `json:"gender" form:"gender"`
	Degree          string `json:"degree" form:"degree"`
	SubjectName     string `json:"subject_name" form:"subject_name"`
	Status          string `json:"status" form:"status"`
	Step            string `json:"step" form:"step"`
}

type SendEmailRequest struct {
	Type            string `json:"type" binding:"required"`
	Step            string `json:"step"`
	InterviewDate   string `json:"interview_date"`
	InterviewTime   string `json:"interview_time"`
	RejectionReason string `json:"rejection_reason"`
	QuizLink        string `json:"quiz_link"`
	MeetingLink     string `json:"meeting_link"`
	StartDate       string `json:"start_date"`
}

type EmailPreviewResponse struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

// resolveResponseStatus retourne le statut de l'étape ACTUELLE de la ligne.
// Le frontend reçoit un seul champ `status` déjà correct.
func resolveResponseStatus(c *domain.Candidature) string {
	n := c.CurrentStep
	if n < 1 || n > 5 {
		n = 1
	}
	var v *string
	switch n {
	case 1:
		v = c.Step1Status
	case 2:
		v = c.Step2Status
	case 3:
		v = c.Step3Status
	case 4:
		v = c.Step4Status
	default:
		v = c.Step5Status
	}
	if v != nil && *v != "" {
		return *v
	}
	if c.Status != "" {
		return c.Status
	}
	return "pending"
}

func ToResponse(c *domain.Candidature) CandidatureResponse {
	return CandidatureResponse{
		ID:                    c.ID,
		FullName:              c.FullName,
		Email1:                c.Email1,
		Gender1:               c.Gender1,
		Phone1:                c.Phone1,
		Degree1:               c.Degree1,
		FullName2:             c.FullName2,
		Email2:                c.Email2,
		Gender2:               c.Gender2,
		Phone2:                c.Phone2,
		Degree2:               c.Degree2,
		Duration:              c.Duration,
		Methode:               c.Methode,
		StartDate:             c.StartDate,
		SubjectName:           c.SubjectName,
		University:            c.University,
		University2:           c.University2,
		DateApplication:       c.DateApplication,
		PathCV:                c.PathCV,
		PathLettreMotivation:  c.PathLettreMotivation,
		PathCV2:               c.PathCV2,
		PathLettreMotivation2: c.PathLettreMotivation2,
		Status:                resolveResponseStatus(c),
		Step:                  c.Step,
		CurrentStep:           c.CurrentStep,
		Step1Status:           c.Step1Status,
		Step2Status:           c.Step2Status,
		Step3Status:           c.Step3Status,
		Step4Status:           c.Step4Status,
		Step5Status:           c.Step5Status,
		ScoreCVScreening:      c.ScoreCVScreening,
		ScoreOnlineQuiz:       c.ScoreOnlineQuiz,
		ScoreOnlineMeeting:    c.ScoreOnlineMeeting,
		ScoreF2FMeeting:       c.ScoreF2FMeeting,
		ScoreFinalDecision:    c.ScoreFinalDecision,
		Notes:                 c.Notes,
		CreatedAt:             c.CreatedAt,
		UpdatedAt:             c.UpdatedAt,
	}
}

func ToResponseList(candidatures []*domain.Candidature) []CandidatureResponse {
	result := make([]CandidatureResponse, len(candidatures))
	for i, c := range candidatures {
		result[i] = ToResponse(c)
	}
	return result
}

// ── Internship Pipeline ──
type PipelineCounts struct {
	Pending  int `json:"pending"`
	Accepted int `json:"accepted"`
	Rejected int `json:"rejected"`
}

type PipelineStage struct {
	ID     string         `json:"id"`
	Index  string         `json:"index"`
	Name   string         `json:"name"`
	Short  string         `json:"short"`
	Final  bool           `json:"final,omitempty"`
	Counts PipelineCounts `json:"counts"`
}
