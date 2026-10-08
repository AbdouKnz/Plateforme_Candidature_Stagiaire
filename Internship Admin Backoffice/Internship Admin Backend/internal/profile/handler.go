package profile

import (
	"astro-backend/domain"
	"astro-backend/pkg"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	Service *ProfileService
}

func NewProfileHandler(service *ProfileService) *ProfileHandler {
	return &ProfileHandler{Service: service}
}

func (h *ProfileHandler) CreateProfileHandler(c *gin.Context) {
	var request CreateProfileRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	if err := pkg.ValidateStruct(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	profile := &domain.Profile{
		Name: request.Name,
	}

	createdProfile, err := h.Service.CreateProfile(c.Request.Context(), profile)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.CreatedL(c, "profile_created_successfully", ToResponse(createdProfile))
}

func (h *ProfileHandler) UpdateProfileHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	var request UpdateProfileRequest

	if err := pkg.BindJSON(c, &request); err != nil {
		pkg.BadRequest(c, pkg.ErrInvalidInput+" "+err.Error())
		return
	}

	updatedProfile, err := h.Service.UpdateProfile(c.Request.Context(), id, request)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "profile_updated_successfully", ToResponse(updatedProfile))
}

func (h *ProfileHandler) GetProfileByIDHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	profile, err := h.Service.GetProfileByID(c, id)
	if err != nil {
		pkg.NotFoundL(c, "profile_not_found")
		return
	}

	pkg.OK(c, ToResponse(profile), nil)
}

func (h *ProfileHandler) GetAllProfilesHandler(c *gin.Context) {
	statusStr := c.Query("status")
	var status *bool
	if statusStr != "" {
		s := statusStr == "true"
		status = &s
	}

	params := ProfileParams{
		Search: c.DefaultQuery("search", ""),
		Status: status,
	}

	profiles, err := h.Service.GetAllProfiles(c, params)
	if err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.OK(c, ToResponseList(profiles), nil)
}

func (h *ProfileHandler) DeleteProfileHandler(c *gin.Context) {
	id, ok := pkg.ParseID(c, "id")
	if !ok {
		return
	}

	if err := h.Service.DeleteProfile(c.Request.Context(), id); err != nil {
		pkg.InternalError(c, err.Error())
		return
	}

	pkg.SuccessL(c, "profile_deleted_successfully", nil)
}
