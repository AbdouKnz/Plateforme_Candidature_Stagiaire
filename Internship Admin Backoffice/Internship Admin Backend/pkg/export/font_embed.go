package export

import (
	_ "embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/jung-kurt/gofpdf"
	"github.com/rs/zerolog/log"
)

//go:embed font/DejaVuSans.ttf
var dejaVuSansTTF []byte

// fontFileCandidates lists on-disk locations for DejaVuSans.ttf, in priority
// order. Used only as a fallback: the embedded font below is the primary
// source, so PDF export never depends on container files or the process
// working directory.
func fontFileCandidates(explicit string) []string {
	var out []string
	if explicit != "" {
		out = append(out, explicit)
	}
	if p := os.Getenv("FONT_PATH"); p != "" {
		out = append(out, p)
	}
	if exe, err := os.Executable(); err == nil {
		out = append(out, filepath.Join(filepath.Dir(exe), "pkg", "export", "font", "DejaVuSans.ttf"))
	}
	out = append(out,
		"/app/pkg/export/font/DejaVuSans.ttf",
		"./pkg/export/font/DejaVuSans.ttf",
	)
	return out
}

func firstExisting(paths []string) string {
	for _, p := range paths {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}

// addPDFFonts registers DejaVu regular + bold on pdf. It prefers the font
// embedded in the binary (immune to missing container files, volume mounts
// shadowing /app/pkg, and cwd changes) and falls back to an on-disk file.
// It returns a description of the source used, or an error when neither is
// available.
func addPDFFonts(pdf *gofpdf.Fpdf, explicitPath string) (string, error) {
	if len(dejaVuSansTTF) > 0 {
		pdf.AddUTF8FontFromBytes("DejaVu", "R", dejaVuSansTTF)
		pdf.AddUTF8FontFromBytes("DejaVu", "B", dejaVuSansTTF)
		log.Debug().Msg("PDF fonts registered from embedded font")
		return "embedded:font/DejaVuSans.ttf", nil
	}
	candidates := fontFileCandidates(explicitPath)
	path := firstExisting(candidates)
	if path == "" {
		wd, _ := os.Getwd()
		return "", fmt.Errorf("no PDF font available (cwd=%s, tried=%v)", wd, candidates)
	}
	pdf.AddUTF8Font("DejaVu", "R", path)
	pdf.AddUTF8Font("DejaVu", "B", path)
	log.Debug().Str("font_source", path).Msg("PDF fonts registered from file")
	return path, nil
}
