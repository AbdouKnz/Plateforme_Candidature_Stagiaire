package pkg

import (
	"fmt"
)

// defaultIfEmpty returns defaultValue if value is empty
func DefaultIfEmpty(value, defaultValue string) string {
	if value == "" {
		return defaultValue
	}
	return value
}

// defaultIfEmptyInt handles both int and int64
func DefaultIfEmptyInt(value interface{}, defaultValue string) string {
	switch v := value.(type) {
	case int:
		if v == 0 {
			return defaultValue
		}
		return fmt.Sprintf("%d", v)
	case int64:
		if v == 0 {
			return defaultValue
		}
		return fmt.Sprintf("%d", v)
	default:
		return defaultValue
	}
}

// defaultIfEmptyBool returns trueValue if value is true, otherwise falseValue
func DefaultIfEmptyBool(value bool, trueValue, falseValue string) string {
	if value {
		return trueValue
	}
	return falseValue
}
