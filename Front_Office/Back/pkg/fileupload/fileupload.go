package fileupload

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	os.MkdirAll("uploads/cvs", 0755)
	os.MkdirAll("uploads/lettres", 0755)
}

const MaxFileSize = 10 << 20

func SaveUploadedFile(c *gin.Context, formField string, uploadDir string) (string, error) {
	file, err := c.FormFile(formField)
	if err != nil {
		return "", err
	}

	if file.Size > MaxFileSize {
		return "", fmt.Errorf("file too large (max 10MB)")
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s%s", time.Now().Format("02-01-2006-15-04-05"), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	savePath = strings.ReplaceAll(savePath, "\\", "/")
	return savePath, nil
}
