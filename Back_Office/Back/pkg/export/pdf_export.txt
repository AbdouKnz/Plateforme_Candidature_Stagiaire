package export

import (
	"astro-backend/config"
	"bytes"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"github.com/rs/zerolog/log"
)

func fontFileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

// cleanCell makes DB text PDF-safe: newlines/tabs become spaces (gofpdf cells
// render them as missing-glyph boxes) and control chars are dropped.
func cleanCell(s string) string {
	s = strings.ReplaceAll(s, "\r\n", " ")
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	s = strings.Map(func(r rune) rune {
		if r < 32 || r == 127 {
			return -1
		}
		return r
	}, s)
	return strings.Join(strings.Fields(s), " ")
}

// wrappedRowHeight returns the height in mm a word-wrapped row will occupy.
func wrappedRowHeight(pdf *gofpdf.Fpdf, ff, style string, size float64, cells []string, widths []float64, lineH float64) float64 {
	pdf.SetFont(ff, style, size)
	maxLines := 1
	for i, txt := range cells {
		if i >= len(widths) {
			break
		}
		if lines := pdf.SplitLines([]byte(cleanCell(txt)), widths[i]-2); len(lines) > maxLines {
			maxLines = len(lines)
		}
	}
	return float64(maxLines) * lineH
}

// drawWrappedRow draws one table row with word-wrapped cells sharing the same
// top Y; every cell gets a full-height border so rows form one continuous
// grid with no gaps between rows, and text never bleeds sideways.
func drawWrappedRow(pdf *gofpdf.Fpdf, ff, style string, size float64, cells []string, widths []float64, lineH float64, fill bool) {
	pdf.SetFont(ff, style, size)
	left, _, _, _ := pdf.GetMargins()
	y0 := pdf.GetY()
	h := wrappedRowHeight(pdf, ff, style, size, cells, widths, lineH)
	x := left
	for i, txt := range cells {
		if i >= len(widths) {
			break
		}
		if fill {
			pdf.SetFillColor(200, 200, 200)
		}
		pdf.SetXY(x, y0)
		pdf.MultiCell(widths[i], lineH, cleanCell(txt), "0", "C", fill)
		pdf.Rect(x, y0, widths[i], h, "D")
		x += widths[i]
	}
	pdf.SetXY(left, y0+h)
}

func drawTableHeader(pdf *gofpdf.Fpdf, ff string, headers []string, widths []float64, lineH float64) {
	pdf.SetFillColor(200, 200, 200)
	drawWrappedRow(pdf, ff, "B", 9, headers, widths, lineH, true)
}

func ExportToPDF(c *gin.Context, options ExportOptions) {
	// Resolve font path from config (FONT_PATH env). The env value may point
	// to a deploy-only absolute path, so verify the file exists and fall back
	// to the font bundled with the repo.
	if options.FontPath == "" {
		options.FontPath = config.Configvar.Export.FontPath
	}
	if options.FontPath == "" || !fontFileExists(options.FontPath) {
		if fontFileExists("./pkg/export/font/DejaVuSans.ttf") {
			options.FontPath = "./pkg/export/font/DejaVuSans.ttf"
		} else {
			options.FontPath = ""
		}
	}

	// Font family used below: embedded DejaVu when its TTF is available,
	// otherwise gofpdf's built-in Arial so the export never hard-fails.
	ff := "DejaVu"
	if options.FontPath == "" {
		ff = "Arial"
		log.Warn().Msg("DejaVuSans.ttf not found, PDF export falling back to built-in Arial font")
	}

	// Height of one wrapped text line in mm.
	lineH := 5.0

	// Initialize gofpdf
	pdf := gofpdf.New(options.TableOrientation, "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	pdf.SetCellMargin(1)
	if options.FontPath != "" {
		pdf.AddUTF8Font(ff, "R", options.FontPath)
		pdf.AddUTF8Font(ff, "B", options.FontPath)
	}

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
		pdf.SetFont(ff, "R", 9) // footer
		pdf.CellFormat(0, 10, fmt.Sprintf("Page %d", pdf.PageNo()), "", 0, "C", false, 0, "")
	})

	// Add a page
	pdf.AddPage()

	_, pageHeight := pdf.GetPageSize()
	leftMargin, topMargin, _, _ := pdf.GetMargins()

	// Title and Timestamp
	pdf.SetFont(ff, "B", 16)
	titleWidth := pdf.GetStringWidth(options.Title) + 6
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	pdf.SetXY(leftMargin, topMargin)
	pdf.CellFormat(titleWidth, 20, options.Title, "", 0, "L", false, 0, "")
	pdf.Ln(10)
	pdf.SetFont(ff, "B", 10)
	pdf.CellFormat(titleWidth, 10, fmt.Sprintf("Generated at: %s", currentTime), "", 0, "L", false, 0, "")

	// Remove image here, so no pdf.Image call

	// Table Header
	pdf.Ln(15) // adjusted space after header to compensate no image
	drawTableHeader(pdf, ff, options.Headers, options.Widths, lineH)

	// Table Rows
	if len(options.Data) > 0 {
		for _, row := range options.Data {
			h := wrappedRowHeight(pdf, ff, "R", 8, row, options.Widths, lineH)
			if pdf.GetY()+h > pageHeight-30 {
				pdf.AddPage()
				drawTableHeader(pdf, ff, options.Headers, options.Widths, lineH)
			}

			drawWrappedRow(pdf, ff, "R", 8, row, options.Widths, lineH, false)
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
	pdf.SetCellMargin(1)
	if options.FontPath != "" {
		pdf.AddUTF8Font(ff, "R", options.FontPath)
		pdf.AddUTF8Font(ff, "B", options.FontPath)
	}
	pdf.SetFooterFunc(func() {
		pdf.SetY(-15)
		pdf.SetFont(ff, "R", 9)
		pdf.CellFormat(0, 10, fmt.Sprintf("Page %d / %d", pdf.PageNo(), totalPages), "", 0, "C", false, 0, "")
	})

	// Repeat content without image
	pdf.AddPage()
	pdf.SetFont(ff, "B", 16)
	pdf.SetXY(leftMargin, topMargin)
	pdf.CellFormat(titleWidth, 20, options.Title, "", 0, "L", false, 0, "")
	pdf.Ln(10)
	pdf.SetFont(ff, "B", 10)
	pdf.CellFormat(titleWidth, 10, fmt.Sprintf("Generated at: %s", currentTime), "", 0, "L", false, 0, "")

	pdf.Ln(15) // adjusted space after header to compensate no image
	drawTableHeader(pdf, ff, options.Headers, options.Widths, lineH)

	if len(options.Data) > 0 {
		for _, row := range options.Data {
			h := wrappedRowHeight(pdf, ff, "R", 9, row, options.Widths, lineH)
			if pdf.GetY()+h > pageHeight-30 {
				pdf.AddPage()
				drawTableHeader(pdf, ff, options.Headers, options.Widths, lineH)
			}
			drawWrappedRow(pdf, ff, "R", 9, row, options.Widths, lineH, false)
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
