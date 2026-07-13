package export

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"github.com/rs/zerolog/log"
)

func ExportToPDF(c *gin.Context, options ExportOptions) {
	// Set font path
	options.FontPath = "./pkg/export/font/DejaVuSans.ttf"

	// Initialize gofpdf
	pdf := gofpdf.New(options.TableOrientation, "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddUTF8Font("DejaVu", "R", options.FontPath)
	pdf.AddUTF8Font("DejaVu", "B", options.FontPath)

	if len(options.Widths) != len(options.Headers) {
		c.JSON(http.StatusBadRequest, gin.H{
			"Status": 400,
			"Error":  "Widths array length must match headers length",
		})
		return
	}

	// Footer for page count
	pdf.SetFooterFunc(func() {
		pdf.SetY(-15)
		pdf.SetFont("DejaVu", "R", 9) // footer
		pdf.CellFormat(0, 10, fmt.Sprintf("Page %d", pdf.PageNo()), "", 0, "C", false, 0, "")
	})

	// Add a page
	pdf.AddPage()

	_, pageHeight := pdf.GetPageSize()
	leftMargin, topMargin, _, _ := pdf.GetMargins()

	// Title and Timestamp
	pdf.SetFont("DejaVu", "B", 16)
	titleWidth := pdf.GetStringWidth(options.Title) + 6
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	pdf.SetXY(leftMargin, topMargin)
	pdf.CellFormat(titleWidth, 20, options.Title, "", 0, "L", false, 0, "")
	pdf.Ln(10)
	pdf.SetFont("DejaVu", "B", 10)
	pdf.CellFormat(titleWidth, 10, fmt.Sprintf("Generated at: %s", currentTime), "", 0, "L", false, 0, "")

	// Remove image here, so no pdf.Image call

	// Table Header
	pdf.Ln(15) // adjusted space after header to compensate no image
	pdf.SetFillColor(200, 200, 200)
	pdf.SetFont("DejaVu", "B", 9) // headers
	for i, header := range options.Headers {
		pdf.CellFormat(options.Widths[i], 10, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Table Rows
	pdf.SetFont("DejaVu", "R", 8)
	if len(options.Data) > 0 {
		for _, row := range options.Data {
			if pdf.GetY() > pageHeight-30 {
				pdf.AddPage()
				pdf.SetFillColor(200, 200, 200)
				pdf.SetFont("DejaVu", "B", 9)
				for i, header := range options.Headers {
					pdf.CellFormat(options.Widths[i], 10, header, "1", 0, "C", true, 0, "")
				}
				pdf.Ln(-1)
			}

			pdf.SetFont("DejaVu", "R", 8)
			for i, field := range row {
				pdf.CellFormat(options.Widths[i], 10, field, "1", 0, "C", false, 0, "")
			}
			pdf.Ln(-1)
		}
	} else {
		totalWidth := 0.0
		for _, w := range options.Widths {
			totalWidth += w
		}
		pdf.CellFormat(totalWidth, 10, "No data available", "1", 1, "C", false, 0, "")
	}

	// Buffer to get page count
	var pdfBuffer bytes.Buffer
	err := pdf.Output(&pdfBuffer)
	if err != nil {
		log.Debug().Msgf("Failed to generate PDF: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
		return
	}
	totalPages := pdf.PageCount()

	// Second pass for accurate footer
	pdf = gofpdf.New(options.TableOrientation, "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddUTF8Font("DejaVu", "R", options.FontPath)
	pdf.AddUTF8Font("DejaVu", "B", options.FontPath)
	pdf.SetFooterFunc(func() {
		pdf.SetY(-15)
		pdf.SetFont("DejaVu", "R", 9)
		pdf.CellFormat(0, 10, fmt.Sprintf("Page %d / %d", pdf.PageNo(), totalPages), "", 0, "C", false, 0, "")
	})

	// Repeat content without image
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 16)
	pdf.SetXY(leftMargin, topMargin)
	pdf.CellFormat(titleWidth, 20, options.Title, "", 0, "L", false, 0, "")
	pdf.Ln(10)
	pdf.SetFont("DejaVu", "B", 10)
	pdf.CellFormat(titleWidth, 10, fmt.Sprintf("Generated at: %s", currentTime), "", 0, "L", false, 0, "")

	pdf.Ln(15) // adjusted space after header to compensate no image
	pdf.SetFillColor(200, 200, 200)
	pdf.SetFont("DejaVu", "B", 9)
	for i, header := range options.Headers {
		pdf.CellFormat(options.Widths[i], 10, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	pdf.SetFont("DejaVu", "R", 9)
	if len(options.Data) > 0 {
		for _, row := range options.Data {
			if pdf.GetY() > pageHeight-30 {
				pdf.AddPage()
				pdf.SetFillColor(200, 200, 200)
				pdf.SetFont("DejaVu", "B", 9)
				for i, header := range options.Headers {
					pdf.CellFormat(options.Widths[i], 10, header, "1", 0, "C", true, 0, "")
				}
				pdf.Ln(-1)
			}
			pdf.SetFont("DejaVu", "R", 9)
			for i, field := range row {
				pdf.CellFormat(options.Widths[i], 10, field, "1", 0, "C", false, 0, "")
			}
			pdf.Ln(-1)
		}
	} else {
		totalWidth := 0.0
		for _, w := range options.Widths {
			totalWidth += w
		}
		pdf.CellFormat(totalWidth, 10, "Aucune donnée disponible", "1", 1, "C", false, 0, "")
	}

	// Output final PDF
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s_%s.pdf", options.FileName, currentTime))
	err = pdf.Output(c.Writer)
	if err != nil {
		log.Debug().Msgf("Failed to generate PDF: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
	}
}
