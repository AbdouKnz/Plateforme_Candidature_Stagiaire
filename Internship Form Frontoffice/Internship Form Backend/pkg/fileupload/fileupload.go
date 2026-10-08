package fileupload

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"front-office-backend/config"

	"github.com/gin-gonic/gin"
)

const MaxFileSize = 10 << 20

func uploadRoot() string {
	root := config.Configvar.Server.UploadsPath
	if root == "" {
		root = "uploads"
	}
	return root
}

func SaveUploadedFile(c *gin.Context, formField string, subDir string, prefix string, selectedAtField string) (string, error) {
	file, err := c.FormFile(formField)
	if err != nil {
		return "", err
	}

	if file.Size > MaxFileSize {
		return "", fmt.Errorf("file too large (max 10MB)")
	}

	physicalDir := filepath.Join(uploadRoot(), subDir)
	if err := os.MkdirAll(physicalDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	ext := filepath.Ext(file.Filename)
	selectedAt := time.Now()
	if rawSelectedAt := c.PostForm(selectedAtField); rawSelectedAt != "" {
		if parsed, err := time.Parse(time.RFC3339Nano, rawSelectedAt); err == nil {
			selectedAt = parsed
		}
	}

	// Keep the browser's selection time and add a server-side nonce so two files can never overwrite each other.
	filename := fmt.Sprintf("%s_%s_%d%s", prefix, selectedAt.UTC().Format("20060102T150405.000000000"), time.Now().UnixNano(), ext)
	savePath := filepath.Join(physicalDir, filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	relPath := filepath.Join("uploads", subDir, filename)
	relPath = strings.ReplaceAll(relPath, "\\", "/")
	return relPath, nil
}
