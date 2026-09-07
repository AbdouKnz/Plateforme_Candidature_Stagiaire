package subject

import (
	"astro-backend/config"
	"astro-backend/domain"
	"astro-backend/pkg"
	"astro-backend/pkg/export"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func saveSubjectImage(c *gin.Context) (string, error) {
	file, err := c.FormFile("image")
	if err != nil {
		return "", err
	}
	if file.Size > 10<<20 {
		return "", fmt.Errorf("image too large (max 10MB)")
	}
	root := config.Configvar.Server.UploadsPath
	if root == "" {
		root = "./uploads"
	}
	dir := filepath.Join(root, "subjects")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("subject_%s%d%s", time.Now().UTC().Format("20060102T150405.000000000"), time.Now().UnixNano(), ext)
	savePath := filepath.Join(dir, filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", fmt.Errorf("failed to save image: %w", err)
	}
	rel := filepath.Join("uploads", "subjects", filename)
	return strings.ReplaceAll(rel, "\\", "/"), nil
}

type SubjectHandler struct {
	Service *SubjectService
}

func NewSubjectHandler(service *SubjectService) *SubjectHandler {
	return &SubjectHandler{Service: service}
}

func (h *SubjectHandler) CreateSubjectHandler(c *gin.Context) {
	var request CreateSubjectRequest

	if strings.Contains(c.ContentType(), "multipart/form-data") {
		c.Request.ParseMultipartForm(32 << 20)
		request.Code = c.PostForm("code")
		request.Name = c.PostForm("name")
		request.Description = c.PostForm("description")
		request.ImagePath = c.PostForm("image_path")
		request.OnlineQuizLink = c.PostForm("online_quiz_link")
		request.OnlineMeetingLink = c.PostForm("online_meeting_link")
		request.F2FMeetingLink = c.PostForm("f2f_meeting_link")
		// technology_ids / profile_ids may come as comma-separated or repeated fields
		request.TechnologyIDs = parseIDs(c.PostForm("technology_ids"))
		request.ProfileIDs = parseIDs(c.PostForm("profile_ids"))
		if dur := c.PostForm("duration_id"); dur != "" && dur != "null" {
			var id int
			if _, err := fmt.Sscanf(dur, "%d", &id); err == nil {
				request.DurationID = &id
			}
		}
		if _, err := c.FormFile("image"); err == nil {
			if rel, err := saveSubjectImage(c); err == nil {
				request.ImagePath = rel
			} else {
				pkg.BadRequest(c, err.Error())
				return
			}
		}
	} else {
		if err := pkg.BindJSON(c, &request); err != nil {
			pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
			return
		}
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	subject := &domain.Subject{
		Code:              request.Code,
		Name:              request.Name,
		Description:       request.Description,
		ImagePath:         request.ImagePath,
		OnlineQuizLink:    request.OnlineQuizLink,
		OnlineMeetingLink: request.OnlineMeetingLink,
		F2FMeetingLink:    request.F2FMeetingLink,
		DurationID:        request.DurationID,
	}

	createdSubject, err := h.Service.CreateSubject(c.Request.Context(), subject, request.TechnologyIDs, request.ProfileIDs)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "subject_created_successfully", ToResponse(createdSubject))
}

func parseIDs(raw string) []int {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool { return r == ',' || r == ';' || r == ' ' })
	var out []int
	for _, p := range parts {
		var v int
		if _, err := fmt.Sscanf(strings.TrimSpace(p), "%d", &v); err == nil {
			out = append(out, v)
		}
	}
	return out
}

func (h *SubjectHandler) UpdateSubjectHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateSubjectRequest

	if strings.Contains(c.ContentType(), "multipart/form-data") {
		c.Request.ParseMultipartForm(32 << 20)
		if v := c.PostForm("code"); v != "" {
			request.Code = v
		}
		if v := c.PostForm("name"); v != "" {
			request.Name = v
		}
		if v := c.PostForm("description"); v != "" {
			request.Description = v
		}
		if v := c.PostForm("image_path"); v != "" {
			request.ImagePath = &v
		}
		if _, err := c.FormFile("image"); err == nil {
			if rel, err := saveSubjectImage(c); err == nil {
				request.ImagePath = &rel
			} else {
				pkg.BadRequest(c, err.Error())
				return
			}
		}
		if v := c.PostForm("technology_ids"); v != "" {
			ids := parseIDs(v)
			request.TechnologyIDs = ids
		}
		if v := c.PostForm("profile_ids"); v != "" {
			ids := parseIDs(v)
			request.ProfileIDs = ids
		}
		if v := c.PostForm("status"); v != "" {
			b := v == "true" || v == "1"
			request.Status = &b
		}
		if v := c.PostForm("online_quiz_link"); v != "" {
			request.OnlineQuizLink = &v
		}
		if v := c.PostForm("online_meeting_link"); v != "" {
			request.OnlineMeetingLink = &v
		}
		if v := c.PostForm("f2f_meeting_link"); v != "" {
			request.F2FMeetingLink = &v
		}
		if v := c.PostForm("duration_id"); v != "" && v != "null" && v != "undefined" {
			var did int
			if _, err := fmt.Sscanf(v, "%d", &did); err == nil {
				request.DurationID = &did
			}
		}
	} else {
		if err := pkg.BindJSON(c, &request); err != nil {
			pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
			return
		}
	}

	updatedSubject, err := h.Service.UpdateSubject(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "subject_updated_successfully", ToResponse(updatedSubject))
}

func (h *SubjectHandler) GetSubjectByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	subject, err := h.Service.GetSubjectByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "subject_not_found")
		return
	}

	pkg.OK(c, ToResponse(subject), nil)
}

func (h *SubjectHandler) GetAllSubjectsHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := SubjectParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	subjects, err := h.Service.GetAllSubjects(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(subjects), nil)
}

func (h *SubjectHandler) ExportSubjectsHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := SubjectParams{
		Search:   c.DefaultQuery("search", ""),
		Status:   status,
		FileType: c.DefaultQuery("file_type", "pdf"),
	}

	exportData, err := h.Service.ExportSubjects(c.Request.Context(), params)
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

func (h *SubjectHandler) DeleteSubjectHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteSubject(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "subject_deleted_successfully", nil)
}
