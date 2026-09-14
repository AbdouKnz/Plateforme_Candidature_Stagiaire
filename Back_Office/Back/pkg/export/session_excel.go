package export

import (
	"astro-backend/domain"
	"bytes"
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
)

// PipelineStageStats holds counters for each pipeline stage
type PipelineStageStats struct {
	StageName string
	Pending   int
	Accepted  int
	Rejected  int
}

// SessionExportData wraps all raw data needed to generate the complete session backup workbook
type SessionExportData struct {
	Subjects     []*domain.Subject
	Candidatures []*domain.Candidature
	Pipeline     []PipelineStageStats
}

// GenerateSessionResetWorkbook produces an Excel workbook containing 3 sheets:
// 1. Subjects
// 2. Applications
// 3. Statistics & KPIs
// The entire generation happens in memory and returns a byte slice.
func GenerateSessionResetWorkbook(data SessionExportData) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	// Setup sheet names
	sheet1 := "Subjects"
	sheet2 := "Applications"
	sheet3 := "Statistics & KPIs"

	f.SetSheetName("Sheet1", sheet1)
	f.NewSheet(sheet2)
	f.NewSheet(sheet3)

	// Styles
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "#FFFFFF", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#1D7CC7"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "#D3D3D3", Style: 1},
			{Type: "right", Color: "#D3D3D3", Style: 1},
			{Type: "top", Color: "#D3D3D3", Style: 1},
			{Type: "bottom", Color: "#D3D3D3", Style: 1},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create header style: %w", err)
	}

	subHeaderStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#1D7CC7", Size: 11},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#EBF3FA"}, Pattern: 1},
		Border: []excelize.Border{
			{Type: "bottom", Color: "#1D7CC7", Style: 2},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create subheader style: %w", err)
	}

	cellBorder, _ := f.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "#E5E7EB", Style: 1},
			{Type: "right", Color: "#E5E7EB", Style: 1},
			{Type: "top", Color: "#E5E7EB", Style: 1},
			{Type: "bottom", Color: "#E5E7EB", Style: 1},
		},
	})

	// ─────────────────────────────────────────────────────────────
	// SHEET 1: SUBJECTS
	// ─────────────────────────────────────────────────────────────
	subjectHeaders := []string{"Code", "Name", "Description", "Period", "Status", "Profiles", "Technologies", "Quiz Link", "Online Meeting Link", "F2F Meeting Link"}
	for colIdx, h := range subjectHeaders {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		f.SetCellValue(sheet1, cell, h)
	}
	f.SetRowStyle(sheet1, 1, 1, headerStyle)
	f.SetRowHeight(sheet1, 1, 26)

	for rowIdx, subj := range data.Subjects {
		r := rowIdx + 2
		period := ""
		if subj.Duration != nil {
			period = subj.Duration.Name
		}
		statusStr := "Active"
		if !subj.Status {
			statusStr = "Inactive"
		}

		var profiles []string
		for _, p := range subj.Profiles {
			if p != nil && p.Name != "" {
				profiles = append(profiles, p.Name)
			}
		}

		var techs []string
		for _, t := range subj.Technologies {
			if t != nil && t.Name != "" {
				techs = append(techs, t.Name)
			}
		}

		rowValues := []interface{}{
			subj.Code,
			subj.Name,
			subj.Description,
			period,
			statusStr,
			strings.Join(profiles, ", "),
			strings.Join(techs, ", "),
			subj.OnlineQuizLink,
			subj.OnlineMeetingLink,
			subj.F2FMeetingLink,
		}

		for colIdx, val := range rowValues {
			cell, _ := excelize.CoordinatesToCellName(colIdx+1, r)
			f.SetCellValue(sheet1, cell, val)
			f.SetCellStyle(sheet1, cell, cell, cellBorder)
		}
	}
	f.SetColWidth(sheet1, "A", "A", 14)
	f.SetColWidth(sheet1, "B", "B", 35)
	f.SetColWidth(sheet1, "C", "C", 40)
	f.SetColWidth(sheet1, "D", "E", 14)
	f.SetColWidth(sheet1, "F", "G", 30)
	f.SetColWidth(sheet1, "H", "J", 30)

	// ─────────────────────────────────────────────────────────────
	// SHEET 2: APPLICATIONS
	// ─────────────────────────────────────────────────────────────
	appHeaders := []string{
		"ID", "Pipeline Step", "Status", "Application Type",
		"Candidate 1 Full Name", "Candidate 1 Email", "Candidate 1 Phone", "Candidate 1 Gender", "Candidate 1 Degree", "Candidate 1 University",
		"Candidate 1 CV Path", "Candidate 1 Motivation Letter Path",
		"Candidate 2 Full Name", "Candidate 2 Email", "Candidate 2 Phone", "Candidate 2 Gender", "Candidate 2 Degree", "Candidate 2 University",
		"Candidate 2 CV Path", "Candidate 2 Motivation Letter Path",
		"Subject / Project", "Duration", "Method", "Start Date",
		"CV Score", "Quiz Score", "Online Meeting Score", "F2F Meeting Score", "Final Score",
		"Rejection Reason", "Notes", "Application Date",
	}

	for colIdx, h := range appHeaders {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		f.SetCellValue(sheet2, cell, h)
	}
	f.SetRowStyle(sheet2, 1, 1, headerStyle)
	f.SetRowHeight(sheet2, 1, 26)

	stepLabels := map[string]string{
		"cv_screening":   "CV Screening",
		"online_quiz":    "Online Quiz",
		"online_meeting": "Online Meeting",
		"f2f_meeting":    "F2F Meeting",
		"final_decision": "Final Decision",
	}

	for rowIdx, c := range data.Candidatures {
		r := rowIdx + 2

		appType := "Solo"
		if strings.TrimSpace(c.FullName2) != "" {
			appType = "Binôme"
		}

		stepLabel := c.Step
		if l, ok := stepLabels[strings.ToLower(strings.TrimSpace(c.Step))]; ok {
			stepLabel = l
		}

		// Calculate current effective step status
		statusVal := c.Status
		if c.CurrentStep >= 1 && c.CurrentStep <= 5 {
			var st *string
			switch c.CurrentStep {
			case 1:
				st = c.Step1Status
			case 2:
				st = c.Step2Status
			case 3:
				st = c.Step3Status
			case 4:
				st = c.Step4Status
			case 5:
				st = c.Step5Status
			}
			if st != nil && *st != "" {
				statusVal = *st
			}
		}

		rowValues := []interface{}{
			c.ID,
			stepLabel,
			statusVal,
			appType,
			c.FullName,
			c.Email1,
			c.Phone1,
			c.Gender1,
			c.Degree1,
			c.University,
			c.PathCV,
			c.PathLettreMotivation,
			c.FullName2,
			c.Email2,
			c.Phone2,
			c.Gender2,
			c.Degree2,
			c.University2,
			c.PathCV2,
			c.PathLettreMotivation2,
			c.SubjectName,
			c.Duration,
			c.Methode,
			c.StartDate,
			c.ScoreCVScreening,
			c.ScoreOnlineQuiz,
			c.ScoreOnlineMeeting,
			c.ScoreF2FMeeting,
			c.ScoreFinalDecision,
			c.RejectionReason,
			c.Notes,
			c.DateApplication,
		}

		for colIdx, val := range rowValues {
			cell, _ := excelize.CoordinatesToCellName(colIdx+1, r)
			f.SetCellValue(sheet2, cell, val)
			f.SetCellStyle(sheet2, cell, cell, cellBorder)
		}
	}

	f.SetColWidth(sheet2, "A", "A", 8)
	f.SetColWidth(sheet2, "B", "D", 18)
	f.SetColWidth(sheet2, "E", "F", 28)
	f.SetColWidth(sheet2, "G", "H", 15)
	f.SetColWidth(sheet2, "I", "J", 22)
	f.SetColWidth(sheet2, "K", "L", 35)
	f.SetColWidth(sheet2, "M", "N", 28)
	f.SetColWidth(sheet2, "O", "P", 15)
	f.SetColWidth(sheet2, "Q", "R", 22)
	f.SetColWidth(sheet2, "S", "T", 35)
	f.SetColWidth(sheet2, "U", "U", 32)
	f.SetColWidth(sheet2, "V", "X", 16)
	f.SetColWidth(sheet2, "Y", "AC", 12)
	f.SetColWidth(sheet2, "AD", "AE", 25)
	f.SetColWidth(sheet2, "AF", "AF", 16)

	// ─────────────────────────────────────────────────────────────
	// SHEET 3: STATISTICS / KPIS
	// ─────────────────────────────────────────────────────────────
	curRow := 1

	// Title Section: Pipeline Step Statistics
	f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "1. Pipeline Step Statistics")
	f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("D%d", curRow), subHeaderStyle)
	f.MergeCell(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("D%d", curRow))
	curRow++

	pipelineHeaders := []string{"Pipeline Step", "Pending", "Accepted", "Rejected"}
	for colIdx, h := range pipelineHeaders {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, curRow)
		f.SetCellValue(sheet3, cell, h)
	}
	f.SetRowStyle(sheet3, curRow, curRow, headerStyle)
	curRow++

	for _, p := range data.Pipeline {
		f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), p.StageName)
		f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), p.Pending)
		f.SetCellValue(sheet3, fmt.Sprintf("C%d", curRow), p.Accepted)
		f.SetCellValue(sheet3, fmt.Sprintf("D%d", curRow), p.Rejected)
		for c := 1; c <= 4; c++ {
			cell, _ := excelize.CoordinatesToCellName(c, curRow)
			f.SetCellStyle(sheet3, cell, cell, cellBorder)
		}
		curRow++
	}

	curRow += 2

	// Global Metrics Aggregations
	totalApps := len(data.Candidatures)
	pairCount := 0
	soloCount := 0
	degreeCounts := make(map[string]int)
	genderCounts := make(map[string]int)

	type SubjStats struct {
		Code         string
		Name         string
		Total        int
		Pair         int
		Solo         int
		DegreeCounts map[string]int
		GenderCounts map[string]int
	}
	subjStatsMap := make(map[string]*SubjStats)

	for _, s := range data.Subjects {
		subjStatsMap[s.Name] = &SubjStats{
			Code:         s.Code,
			Name:         s.Name,
			DegreeCounts: make(map[string]int),
			GenderCounts: make(map[string]int),
		}
	}

	for _, c := range data.Candidatures {
		isSolo := strings.TrimSpace(c.FullName2) == ""
		if isSolo {
			soloCount++
		} else {
			pairCount++
		}

		deg1 := strings.TrimSpace(c.Degree1)
		if deg1 == "" {
			deg1 = "Unknown"
		}
		degreeCounts[deg1]++
		if !isSolo && strings.TrimSpace(c.Degree2) != "" {
			degreeCounts[strings.TrimSpace(c.Degree2)]++
		}

		g1 := strings.TrimSpace(c.Gender1)
		if g1 == "" {
			g1 = "Unknown"
		}
		genderCounts[g1]++
		if !isSolo && strings.TrimSpace(c.Gender2) != "" {
			genderCounts[strings.TrimSpace(c.Gender2)]++
		}

		// Breakdowns per subject
		subNames := strings.Split(c.SubjectName, ",")
		for _, rawName := range subNames {
			trimmedName := strings.TrimSpace(rawName)
			if stat, exists := subjStatsMap[trimmedName]; exists {
				stat.Total++
				if isSolo {
					stat.Solo++
				} else {
					stat.Pair++
				}
				stat.DegreeCounts[deg1]++
				stat.GenderCounts[g1]++
			}
		}
	}

	// Section 2: Global Overview
	f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "2. Overall Recruitment Session Summary")
	f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("B%d", curRow), subHeaderStyle)
	f.MergeCell(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("B%d", curRow))
	curRow++

	f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "Metric")
	f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), "Count")
	f.SetRowStyle(sheet3, curRow, curRow, headerStyle)
	curRow++

	summaryMetrics := []struct {
		Name  string
		Value int
	}{
		{"Total Candidates / Applications", totalApps},
		{"Solo Applications", soloCount},
		{"Pair (Binôme) Applications", pairCount},
		{"Total Subjects Offered", len(data.Subjects)},
	}

	for _, m := range summaryMetrics {
		f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), m.Name)
		f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), m.Value)
		f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), cellBorder)
		f.SetCellStyle(sheet3, fmt.Sprintf("B%d", curRow), fmt.Sprintf("B%d", curRow), cellBorder)
		curRow++
	}

	curRow += 2

	// Section 3: Degree & Gender Breakdowns
	f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "3. Demographics (Degree Level & Gender)")
	f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("B%d", curRow), subHeaderStyle)
	f.MergeCell(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("B%d", curRow))
	curRow++

	f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "Category")
	f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), "Count")
	f.SetRowStyle(sheet3, curRow, curRow, headerStyle)
	curRow++

	for deg, count := range degreeCounts {
		f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "Degree: "+deg)
		f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), count)
		f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), cellBorder)
		f.SetCellStyle(sheet3, fmt.Sprintf("B%d", curRow), fmt.Sprintf("B%d", curRow), cellBorder)
		curRow++
	}

	for g, count := range genderCounts {
		f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "Gender: "+g)
		f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), count)
		f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), cellBorder)
		f.SetCellStyle(sheet3, fmt.Sprintf("B%d", curRow), fmt.Sprintf("B%d", curRow), cellBorder)
		curRow++
	}

	curRow += 2

	// Section 4: Per-Subject KPIs
	f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), "4. Subject Breakdown & Candidate Allocation")
	f.SetCellStyle(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("E%d", curRow), subHeaderStyle)
	f.MergeCell(sheet3, fmt.Sprintf("A%d", curRow), fmt.Sprintf("E%d", curRow))
	curRow++

	subjKPIHeaders := []string{"Code", "Subject Name", "Total Applications", "Pair", "Solo"}
	for colIdx, h := range subjKPIHeaders {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, curRow)
		f.SetCellValue(sheet3, cell, h)
	}
	f.SetRowStyle(sheet3, curRow, curRow, headerStyle)
	curRow++

	for _, s := range data.Subjects {
		stat := subjStatsMap[s.Name]
		f.SetCellValue(sheet3, fmt.Sprintf("A%d", curRow), s.Code)
		f.SetCellValue(sheet3, fmt.Sprintf("B%d", curRow), s.Name)
		if stat != nil {
			f.SetCellValue(sheet3, fmt.Sprintf("C%d", curRow), stat.Total)
			f.SetCellValue(sheet3, fmt.Sprintf("D%d", curRow), stat.Pair)
			f.SetCellValue(sheet3, fmt.Sprintf("E%d", curRow), stat.Solo)
		} else {
			f.SetCellValue(sheet3, fmt.Sprintf("C%d", curRow), 0)
			f.SetCellValue(sheet3, fmt.Sprintf("D%d", curRow), 0)
			f.SetCellValue(sheet3, fmt.Sprintf("E%d", curRow), 0)
		}
		for c := 1; c <= 5; c++ {
			cell, _ := excelize.CoordinatesToCellName(c, curRow)
			f.SetCellStyle(sheet3, cell, cell, cellBorder)
		}
		curRow++
	}

	f.SetColWidth(sheet3, "A", "A", 28)
	f.SetColWidth(sheet3, "B", "B", 38)
	f.SetColWidth(sheet3, "C", "E", 18)

	// Export to buffer
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("failed to encode excel workbook: %w", err)
	}

	return buf.Bytes(), nil
}
