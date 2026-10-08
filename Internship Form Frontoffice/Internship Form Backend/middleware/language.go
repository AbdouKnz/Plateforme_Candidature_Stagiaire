package middleware

import (
	"front-office-backend/pkg"
	"strings"

	"github.com/gin-gonic/gin"
)

func LanguageMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		lang := c.GetHeader(pkg.LangHeader)

		if lang == "" {
			lang = pkg.LangEN
		} else {
			lang = strings.ToLower(lang)
			if lang != pkg.LangEN && lang != pkg.LangFR {
				lang = pkg.LangEN
			}
		}

		c.Set("lang", lang)
		c.Next()
	}
}
