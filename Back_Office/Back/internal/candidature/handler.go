package candidature

import (
	"astro-backend/domain"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func parseScore(value string) *FlexInt {
	if value == "" {
		return nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return nil
	}
	v := FlexInt(parsed)
	return &v
}

type CandidatureHandler struct {
	Service *CandidatureService
}

func NewCandidatureHandler(service *CandidatureService) *CandidatureHandler {
	return &CandidatureHandler{Service: service}
}

func (h *CandidatureHandler) CreateHandler(c *gin.Context) {
	c.Request.ParseMultipartForm(32 << 20)

	candidature := &domain.Candidature{
		FullName:    c.PostForm("full_name"),
		Email1:      c.PostForm("email1"),
		Gender1:     c.PostForm("gender1"),
		Phone1:      c.PostForm("phone1"),
		Degree1:     c.PostForm("degree1"),
		FullName2:   c.PostForm("full_name2"),
		Email2:      c.PostForm("email2"),
		Gender2:     c.PostForm("gender2"),
		Phone2:      c.PostForm("phone2"),
		Degree2:     c.PostForm("degree2"),
		Duration:    c.PostForm("duration"),
		Methode:     c.PostForm("methode"),
		StartDate:   c.PostForm("start_date"),
		SubjectName: c.PostForm("subject_name"),
		University:  c.PostForm("university"),
		Status:      c.PostForm("status"),
		Step:        c.PostForm("step"),
		Notes:       c.PostForm("notes"),
	}

	if candidature.FullName == "" || candidature.Email1 == "" || candidature.Gender1 == "" || candidature.Phone1 == "" {
		pkg.BadRequest(c, "full_name, email1, gender1, and phone1 are required")
		return
	}

	nameRegex := regexp.MustCompile(`^[A-Za-zÀ-ÿ\s'-]+$`)
	phoneRegex := regexp.MustCompile(`^\d{8}$`)
	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

	if !nameRegex.MatchString(candidature.FullName) {
		pkg.BadRequest(c, "Full name must contain only letters")
		return
	}
	if !phoneRegex.MatchString(candidature.Phone1) {
		pkg.BadRequest(c, "Phone must be exactly 8 digits")
		return
	}
	if !emailRegex.MatchString(candidature.Email1) {
		pkg.BadRequest(c, "Email is not valid")
		return
	}
	if candidature.Email2 != "" && !emailRegex.MatchString(candidature.Email2) {
		pkg.BadRequest(c, "Email is not valid")
		return
	}

	created, err := h.Service.Create(c.Request.Context(), candidature)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "candidature_created_successfully", ToResponse(created))
}

func (h *CandidatureHandler) UpdateHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateCandidatureRequest
	if strings.Contains(c.ContentType(), "application/json") {
		if err := c.ShouldBindJSON(&request); err != nil {
			pkg.BadRequest(c, err.Error())
			return
		}
	} else {
		c.Request.ParseMultipartForm(32 << 20)
		request = UpdateCandidatureRequest{
			FullName:    c.PostForm("full_name"),
			Email1:      c.PostForm("email1"),
			Gender1:     c.PostForm("gender1"),
			Phone1:      c.PostForm("phone1"),
			Degree1:     c.PostForm("degree1"),
			FullName2:   c.PostForm("full_name2"),
			Email2:      c.PostForm("email2"),
			Gender2:     c.PostForm("gender2"),
			Phone2:      c.PostForm("phone2"),
			Degree2:     c.PostForm("degree2"),
			Duration:    c.PostForm("duration"),
			Methode:     c.PostForm("methode"),
			StartDate:   c.PostForm("start_date"),
			SubjectName: c.PostForm("subject_name"),
			University:  c.PostForm("university"),
			University2: c.PostForm("university2"),
			Status:      c.PostForm("status"),
			Step:        c.PostForm("step"),
			Notes:       c.PostForm("notes"),
		}
		request.ScoreCVScreening = parseScore(c.PostForm("score_cv_screening"))
		request.ScoreOnlineQuiz = parseScore(c.PostForm("score_online_quiz"))
		request.ScoreOnlineMeeting = parseScore(c.PostForm("score_online_meeting"))
		request.ScoreF2FMeeting = parseScore(c.PostForm("score_f2f_meeting"))
		request.ScoreFinalDecision = parseScore(c.PostForm("score_final_decision"))
	}

	updated, err := h.Service.Update(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "candidature_updated_successfully", ToResponse(updated))
}

func (h *CandidatureHandler) GetEmailPreviewHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	templateType := c.Query("type")
	if templateType == "" {
		pkg.BadRequest(c, "type query parameter is required")
		return
	}

	interviewDate := c.Query("interview_date")
	interviewTime := c.Query("interview_time")
	rejectionReason := c.Query("rejection_reason")

	preview, err := h.Service.GetEmailPreview(c.Request.Context(), id, templateType, interviewDate, interviewTime, rejectionReason)
	if err != nil {
		log.Error().Err(err).Int("id", id).Str("type", templateType).Msg("GetEmailPreview failed")
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, preview, nil)
}

// GetRejectionReasonsHandler exposes the rejection reasons grouped by pipeline
// step so the HR UI can offer the relevant options when sending a rejection email.
func (h *CandidatureHandler) GetRejectionReasonsHandler(c *gin.Context) {
	pkg.OK(c, GetRejectionReasons(), nil)
}

func (h *CandidatureHandler) SendEmailHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var req SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.BadRequest(c, err.Error())
		return
	}

	if err := h.Service.SendEmail(c.Request.Context(), id, req); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "email_sent_successfully", nil)
}

func (h *CandidatureHandler) GetByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	candidature, err := h.Service.GetByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "candidature_not_found")
		return
	}

	pkg.OK(c, ToResponse(candidature), nil)
}

func (h *CandidatureHandler) ParseCandidatureParams(c *gin.Context) CandidatureParams {
	return CandidatureParams{
		Search:          c.DefaultQuery("search", ""),
		FileType:        c.DefaultQuery("file_type", "pdf"),
		FullName:        c.DefaultQuery("full_name", ""),
		CandidatureType: c.DefaultQuery("candidature_type", ""),
		Gender:          c.DefaultQuery("gender", ""),
		Degree:          c.DefaultQuery("degree", ""),
		SubjectName:     c.DefaultQuery("subject_name", ""),
		Status:          c.DefaultQuery("status", ""),
		Step:            c.DefaultQuery("step", ""),
	}
}

func (h *CandidatureHandler) GetRecentHandler(c *gin.Context) {
	candidatures, err := h.Service.GetRecent(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, ToResponseList(candidatures), nil)
}

func (h *CandidatureHandler) GetAllHandler(c *gin.Context) {
	params := h.ParseCandidatureParams(c)

	candidatures, err := h.Service.GetAll(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(candidatures), nil)
}

func (h *CandidatureHandler) ExportHandler(c *gin.Context) {
	params := h.ParseCandidatureParams(c)

	exportData, err := h.Service.Export(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	switch strings.ToLower(params.FileType) {
	case "excel":
		export.ExportToExcel(c, *exportData)
	default:
		export.ExportToPDF(c, *exportData)
	}
}

func (h *CandidatureHandler) DeleteHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.Delete(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "candidature_deleted_successfully", nil)
}
