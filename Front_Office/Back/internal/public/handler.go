package public

import (
	"regexp"
	"strings"

	"front-office-backend/domain"
	"front-office-backend/pkg"
	"front-office-backend/pkg/fileupload"

	"github.com/gin-gonic/gin"
)

type PublicHandler struct {
	Service *PublicService
}

func NewPublicHandler(service *PublicService) *PublicHandler {
	return &PublicHandler{Service: service}
}

func (h *PublicHandler) GetFrontOfficeStatusHandler(c *gin.Context) {
	isEnabled, reopeningDate, err := h.Service.GetFrontOfficeStatus(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, FrontOfficeStatusResponse{IsEnabled: isEnabled, ReopeningDate: reopeningDate}, nil)
}

func (h *PublicHandler) GetActiveDegreesHandler(c *gin.Context) {
	degrees, err := h.Service.GetActiveDegrees(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, degreeListToResponse(degrees), nil)
}

func (h *PublicHandler) GetActiveTypesHandler(c *gin.Context) {
	types, err := h.Service.GetActiveTypes(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, typeListToResponse(types), nil)
}

func (h *PublicHandler) GetActiveDurationsHandler(c *gin.Context) {
	durations, err := h.Service.GetActiveDurations(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, durationListToResponse(durations), nil)
}

func (h *PublicHandler) GetActiveTechnologiesHandler(c *gin.Context) {
	technologies, err := h.Service.GetActiveTechnologies(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, technologyListToResponse(technologies), nil)
}

func (h *PublicHandler) GetActiveSubjectsHandler(c *gin.Context) {
	subjects, err := h.Service.GetActiveSubjects(c.Request.Context())
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}
	pkg.OK(c, subjectListToResponse(subjects), nil)
}

func (h *PublicHandler) SubscribeWaitlistHandler(c *gin.Context) {
	var req SubscribeWaitlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.BadRequest(c, "A valid email is required")
		return
	}

	if err := h.Service.SubscribeWaitlist(c.Request.Context(), req.Email); err != nil {
		if strings.Contains(err.Error(), "already subscribed") || strings.Contains(err.Error(), "duplicate") {
			pkg.OK(c, gin.H{"email": req.Email, "already": true}, nil)
			return
		}
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.Created(c, "Subscribed successfully", gin.H{"email": req.Email})
}

func (h *PublicHandler) CreateCandidatureHandler(c *gin.Context) {
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		pkg.BadRequest(c, "Failed to parse form data")
		return
	}

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
		University2: c.PostForm("university2"),
		Duration:    c.PostForm("duration"),
		Methode:     c.PostForm("methode"),
		StartDate:   c.PostForm("start_date"),
		SubjectName: c.PostForm("subject_name"),
		University:  c.PostForm("university"),
	}

	if candidature.FullName == "" || candidature.Email1 == "" || candidature.Gender1 == "" || candidature.Phone1 == "" {
		pkg.BadRequest(c, "full_name, email1, gender1, and phone1 are required")
		return
	}

	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	phoneRegex := regexp.MustCompile(`^\d{8}$`)

	if !phoneRegex.MatchString(candidature.Phone1) {
		pkg.BadRequest(c, "Phone must be exactly 8 digits")
		return
	}
	if !emailRegex.MatchString(candidature.Email1) {
		pkg.BadRequest(c, "Email is not valid")
		return
	}

	if cvPath, err := fileupload.SaveUploadedFile(c, "cv", "uploads/cvs", "cv"); err == nil {
		candidature.PathCV = cvPath
	}
	if lettrePath, err := fileupload.SaveUploadedFile(c, "motivation_letter", "uploads/lettres", "lm"); err == nil {
		candidature.PathLettreMotivation = lettrePath
	}
	if cvPath2, err := fileupload.SaveUploadedFile(c, "cv2", "uploads/cvs", "cv"); err == nil {
		candidature.PathCV2 = cvPath2
	}
	if lettrePath2, err := fileupload.SaveUploadedFile(c, "motivation_letter2", "uploads/lettres", "lm"); err == nil {
		candidature.PathLettreMotivation2 = lettrePath2
	}

	created, err := h.Service.CreateCandidature(c.Request.Context(), candidature)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.Created(c, "Candidature submitted successfully", gin.H{
		"id": created.ID,
	})
}
