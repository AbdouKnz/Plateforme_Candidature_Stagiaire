package export

import (
	"os"
	"testing"

	"github.com/jung-kurt/gofpdf"
)

// The font must come from the binary, never from container files or cwd:
// run from an empty dir where no font file can be resolved.
func TestAddPDFFontsPrefersEmbedded(t *testing.T) {
	t.Chdir(t.TempDir())

	if _, err := os.Stat("pkg/export/font/DejaVuSans.ttf"); !os.IsNotExist(err) {
		t.Skip("unexpected font file in temp dir")
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	used, err := addPDFFonts(pdf, "")
	if err != nil {
		t.Fatalf("addPDFFonts returned error: %v", err)
	}
	if used != "embedded:font/DejaVuSans.ttf" {
		t.Fatalf("expected embedded font, got %q", used)
	}
	pdf.SetFont("DejaVu", "R", 9)
}
