package pkg

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/rs/zerolog/log"
)

func ParseID(c *gin.Context, paramName string) (int, bool) {
	id, err := strconv.Atoi(c.Param(paramName))
	if err != nil {
		log.Error().Err(err).Msgf("Invalid ID format")
		BadRequest(c, ErrInvalidID+" "+err.Error())
		return 0, false
	}
	return id, true
}

func ParseInt(value string) int {
	result, _ := strconv.Atoi(value)
	return result
}

func BindJSON(c *gin.Context, request interface{}) error {
	if err := c.ShouldBindJSON(request); err != nil {
		log.Error().Err(err).Msg("Failed to bind JSON input")
		return err
	}
	return nil
}

func ValidateStruct(c *gin.Context, request interface{}) error {
	validate := validator.New()
	if err := validate.Struct(request); err != nil {
		log.Error().Err(err).Msg("Validation failed")
		return err
	}
	return nil
}
