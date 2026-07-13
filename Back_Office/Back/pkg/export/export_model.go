package export

type ExportOptions struct {
	TableOrientation string
	Data             [][]string
	Headers          []string
	Widths           []float64
	FileName         string
	Title            string
	FontPath         string
}
