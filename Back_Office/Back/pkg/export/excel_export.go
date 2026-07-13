package export

import (
	"fmt"

	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/tealeg/xlsx"
)

func ExportToExcel(c *gin.Context, options ExportOptions) {
	xlFile := xlsx.NewFile()
	//log.Debug().Interface("Data", data).Send()

	sheet, err := xlFile.AddSheet(fmt.Sprintf("%s Data", options.FileName))
	if err != nil {
		log.Debug().Msgf("Failed to create Excel sheet: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"Status": 500,
			"Error":  "Failed to create Excel sheet",
		})
		return
	}

	// Create header row
	headerRow := sheet.AddRow()
	for _, header := range options.Headers {
		headerRow.AddCell().Value = header
	}

	// Add data rows
	for _, row := range options.Data {
		dataRow := sheet.AddRow()
		for _, field := range row {
			dataRow.AddCell().Value = field
		}
	}

	// Set response headers and output Excel
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	log.Debug().Msgf("Date Time %v", currentTime)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s_%s.xlsx", options.FileName, currentTime))
	err = xlFile.Write(c.Writer)
	if err != nil {
		log.Debug().Msgf("Failed to write Excel file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"Status": 500,
			"Error":  "Failed to generate Excel file",
		})
		return
	}
}
