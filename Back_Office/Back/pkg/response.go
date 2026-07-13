package pkg

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Description API response wrapper
type Response struct {
	Status     int         `json:"status"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data"`
	Pagination interface{} `json:"pagination,omitempty"`
	Filters    interface{} `json:"filters,omitempty"`
	Error      string      `json:"error,omitempty"`
}

func Respond(c *gin.Context, status int, message string, data interface{}, pagination interface{}) {
	c.JSON(status, Response{
		Status:     status,
		Message:    message,
		Data:       data,
		Pagination: pagination,
	})
}

func HttpError(c *gin.Context, status int, err string) {
	c.JSON(status, Response{
		Status: status,
		Error:  err,
	})
}

// Common responses
func Created(c *gin.Context, message string, data interface{}) {
	Respond(c, http.StatusCreated, message, data, nil)
}

func Success(c *gin.Context, message string, data interface{}) {
	Respond(c, http.StatusOK, message, data, nil)
}

func OK(c *gin.Context, data interface{}, pagination interface{}) {
	Respond(c, http.StatusOK, "Success", data, pagination)
}

func BadRequest(c *gin.Context, err string) {
	HttpError(c, http.StatusBadRequest, err)
}

func NotFound(c *gin.Context, err string) {
	HttpError(c, http.StatusNotFound, err)
}

func InternalError(c *gin.Context, err string) {
	HttpError(c, http.StatusInternalServerError, err)
}

func Unauthorized(c *gin.Context, err string) {
	HttpError(c, http.StatusUnauthorized, err)
}

func RawJSON(c *gin.Context, status int, data []byte) {
	c.Data(status, "application/json", data)
}

// Localized response helpers
func CreatedL(c *gin.Context, key string, data interface{}) {
	Created(c, T(c, key), data)
}

func SuccessL(c *gin.Context, key string, data interface{}) {
	Success(c, T(c, key), data)
}

func NotFoundL(c *gin.Context, key string) {
	NotFound(c, T(c, key))
}

// Audit response
func AuditResponse(c *gin.Context, data interface{}, pagination interface{}, filters interface{}) {
	c.JSON(http.StatusOK, Response{
		Status:     http.StatusOK,
		Message:    "Success",
		Data:       data,
		Pagination: pagination,
		Filters:    filters,
	})
}
