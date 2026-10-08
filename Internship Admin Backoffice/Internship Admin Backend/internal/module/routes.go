package module

import (
	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

func ModulesRoutes(r *gin.RouterGroup, db *bun.DB) {
	service := ModuleService{db}
	handler := NewModuleHandler(service)

	moduleGroup := r.Group("/modules")
	{
		moduleGroup.GET("/", handler.GetAllModulesHandler)
	}
}
