package pkg

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Error   string      `json:"error,omitempty"`
}

func Respond(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Response{
		Status:  status,
		Message: message,
		Data:    data,
	})
}

func HttpError(c *gin.Context, status int, err string) {
	c.JSON(status, Response{
		Status: status,
		Error:  err,
	})
}

func Created(c *gin.Context, message string, data interface{}) {
	Respond(c, http.StatusCreated, message, data)
}

func OK(c *gin.Context, data interface{}, _ interface{}) {
	Respond(c, http.StatusOK, "Success", data)
}

func BadRequest(c *gin.Context, err string) {
	HttpError(c, http.StatusBadRequest, err)
}

func InternalError(c *gin.Context, err string) {
	HttpError(c, http.StatusInternalServerError, err)
}
