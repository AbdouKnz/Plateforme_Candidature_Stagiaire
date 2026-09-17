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
	FullName              string   `json:"full_name,omitempty"`
	Email1                string   `json:"email1,omitempty"`
	Gender1               string   `json:"gender1,omitempty"`
	Phone1                string   `json:"phone1,omitempty"`
	Degree1               string   `json:"degree1"`
	FullName2             string   `json:"full_name2,omitempty"`
	Email2                string   `json:"email2,omitempty"`
	Gender2               string   `json:"gender2,omitempty"`
	Phone2                string   `json:"phone2,omitempty"`
	Degree2               string   `json:"degree2"`
	Duration              string   `json:"duration,omitempty"`
	Methode               string   `json:"methode,omitempty"`
	StartDate             string   `json:"start_date,omitempty"`
	SubjectName           string   `json:"subject_name,omitempty"`
	University            string   `json:"university,omitempty"`
	University2           string   `json:"university2,omitempty"`
	DateApplication       string   `json:"date_application,omitempty"`
	PathCV                string   `json:"path_cv,omitempty"`
	PathLettreMotivation  string   `json:"path_lettre_motivation,omitempty"`
	PathCV2               string   `json:"path_cv2,omitempty"`
	PathLettreMotivation2 string   `json:"path_lettre_motivation2,omitempty"`
	Status                string   `json:"status,omitempty"`
	Step                  string   `json:"step,omitempty"`
	RejectionReason       string   `json:"rejection_reason,omitempty"`
	ScoreCVScreening      *FlexInt `json:"score_cv_screening,omitempty"`
	ScoreOnlineQuiz       *FlexInt `json:"score_online_quiz,omitempty"`
	ScoreOnlineMeeting    *FlexInt `json:"score_online_meeting,omitempty"`
	ScoreF2FMeeting       *FlexInt `json:"score_f2f_meeting,omitempty"`
	ScoreFinalDecision    *FlexInt `json:"score_final_decision,omitempty"`
	Notes                 string   `json:"notes,omitempty"`
}

type CandidatureResponse struct {
	ID                    int     `json:"id"`
	FullName              string  `json:"full_name"`
	Email1                string  `json:"email1"`
	Gender1               string  `json:"gender1"`
	Phone1                string  `json:"phone1"`
	Degree1               string  `json:"degree1"`
	FullName2             string  `json:"full_name2"`
	Email2                string  `json:"email2"`
	Gender2               string  `json:"gender2"`
	Phone2                string  `json:"phone2"`
	Degree2               string  `json:"degree2"`
	Duration              string  `json:"duration"`
	Methode               string  `json:"methode"`
	StartDate             string  `json:"start_date"`
	SubjectName           string  `json:"subject_name"`
	University            string  `json:"university"`
	University2           string  `json:"university2"`
	DateApplication       string  `json:"date_application"`
	PathCV                string  `json:"path_cv"`
	PathLettreMotivation  string  `json:"path_lettre_motivation"`
	PathCV2               string  `json:"path_cv2"`
	PathLettreMotivation2 string  `json:"path_lettre_motivation2"`
	Status                string  `json:"status"`
	Step                  string  `json:"step"`
	CurrentStep           int     `json:"current_step"`
	Step1Status           *string `json:"step1_status"`
	Step2Status           *string `json:"step2_status"`
	Step3Status           *string `json:"step3_status"`
	Step4Status           *string `json:"step4_status"`
	Step5Status           *string `json:"step5_status"`
	ScoreCVScreening      int     `json:"score_cv_screening"`
	ScoreOnlineQuiz       int     `json:"score_online_quiz"`
	ScoreOnlineMeeting    int     `json:"score_online_meeting"`
	ScoreF2FMeeting       int     `json:"score_f2f_meeting"`
	ScoreFinalDecision    int     `json:"score_final_decision"`
	Notes                 string  `json:"notes"`
	RejectionReason       string  `json:"rejection_reason"`
	CreatedAt             string  `json:"created_at"`
	UpdatedAt             string  `json:"updated_at"`
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
	// ScoreSortStep picks which step's score column orders the list
	// (cv_screening | online_quiz | online_meeting | f2f_meeting | final_decision).
	ScoreSortStep string `json:"score_sort_step" form:"score_sort_step"`
	// ScoreSortDirection is "asc" or "desc" (default "asc").
	ScoreSortDirection string `json:"score_sort_direction" form:"score_sort_direction"`
	// ScoreStep picks which step's score column the range filter applies to
	// (cv_screening | online_quiz | online_meeting | f2f_meeting | final_decision).
	// Empty (or "all") means each row's own current-step score.
	ScoreStep string `json:"score_step" form:"score_step"`
	// ScoreMin/ScoreMax bound the step score (0-20 scale). Nil means open end.
	ScoreMin *int `json:"score_min" form:"score_min"`
	ScoreMax *int `json:"score_max" form:"score_max"`
}

type SendEmailRequest struct {
	Type            string `json:"type" binding:"required"`
	Step            string `json:"step"`
	InterviewDate   string `json:"interview_date"`
	InterviewTime   string `json:"interview_time"`
	RejectionReason string `json:"rejection_reason"`
	QuizLink        string `json:"quiz_link"`
	// QuizLink2 is the online-quiz link for the SECOND member of a pair
	// application. When set (and the candidature has an email2), member 2
	// receives their own email with [Link] replaced by this value while
	// member 1 keeps QuizLink. Falls back to QuizLink when empty.
	QuizLink2       string `json:"quiz_link2"`
	MeetingLink     string `json:"meeting_link"`
	StartDate       string `json:"start_date"`
	F2FMeetingLink  string `json:"f2f_meeting_link"`
	// Body is an optional override. When non-empty it is used as-is instead
	// of the template-generated body, so the HR can edit the email content.
	Body string `json:"body"`
	// Body2 is member 2's own override for pair sends. When non-empty, member
	// 2 (email2) receives this body instead of Body, so each applicant's
	// email is fully independent (own text + own [Link]).
	Body2 string `json:"body2"`
	// Recipients overrides the row's addresses (internal use only, e.g. bulk
	// rejection dedupe across rows). When non-empty, SendEmail mails exactly
	// these addresses instead of building them from the candidature.
	Recipients []string `json:"-"`
}

// BulkRejectRequest lets HR reject several candidatures at once with a single
// rejection reason. Every row is transitioned (status + audit), but mail is
// deduped: one rejection email per address, listing all rejected subjects.
type BulkRejectRequest struct {
	Ids             []int  `json:"ids" binding:"required"`
	RejectionReason string `json:"rejection_reason" binding:"required"`
}

// BulkAcceptRequest invites several candidatures to their next pipeline
// step at once. The frontend shows ONE preview card (first candidature +
// shared fields like links/date) and sends the same payload to every id.
// Type/Step are the EXACT same values the single-send modal computes
// (step-dependent template: online_quiz / online_meeting / f2f_meeting /
// final_decision / acceptance+step), so bulk and single send identical mails.
type BulkAcceptRequest struct {
	Ids            []int  `json:"ids" binding:"required"`
	Type           string `json:"type" binding:"required"`
	Step           string `json:"step,omitempty"`
	QuizLink       string `json:"quiz_link,omitempty"`
	// QuizLink2 is the online-quiz link for the second member of pair
	// applications (see SendEmailRequest.QuizLink2).
	QuizLink2      string `json:"quiz_link2,omitempty"`
	MeetingLink    string `json:"meeting_link,omitempty"`
	F2FMeetingLink string `json:"f2f_meeting_link,omitempty"`
	InterviewDate  string `json:"interview_date,omitempty"`
	InterviewTime  string `json:"interview_time,omitempty"`
	StartDate      string `json:"start_date,omitempty"`
	Body           string `json:"body,omitempty"`
}

type EmailPreviewResponse struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
	// Pair-only extras: when the candidature is a pair and a second quiz
	// link applies, To2/Body2 carry member 2's version (same subject,
	// [Link] replaced by their own link). Empty for solo applications.
	To2   string `json:"to2,omitempty"`
	Body2 string `json:"body2,omitempty"`
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
		RejectionReason:       c.RejectionReason,
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

type ResetSessionRequest struct {
	Password string `json:"password" binding:"required"`
}
