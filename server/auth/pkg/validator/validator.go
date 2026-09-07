package validator

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

// Validate is the global validator instance.
var Validate = validator.New()

// FieldError contains simplified field-level validation errors.
type FieldError struct {
	Field   string `json:"field"`
	Tag     string `json:"tag"`
	Message string `json:"message"`
}

// DecodeAndValidate reads JSON from the HTTP request body and validates the target struct.
func DecodeAndValidate(r *http.Request, target any) ([]FieldError, error) {
	if r.Body == nil {
		return nil, errors.New("request body cannot be empty")
	}
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		if errors.Is(err, io.EOF) {
			return nil, errors.New("request body cannot be empty")
		}
		return nil, fmt.Errorf("invalid request JSON: %w", err)
	}

	if err := Validate.Struct(target); err != nil {
		var valErrs validator.ValidationErrors
		if errors.As(err, &valErrs) {
			var fieldErrors []FieldError
			for _, fe := range valErrs {
				fieldErrors = append(fieldErrors, FieldError{
					Field:   toSnakeCase(fe.Field()),
					Tag:     fe.Tag(),
					Message: formatErrorMessage(fe),
				})
			}
			return fieldErrors, errors.New("validation failed")
		}
		return nil, err
	}

	return nil, nil
}

// ValidateStruct validates an arbitrary struct instance.
func ValidateStruct(target any) []FieldError {
	if err := Validate.Struct(target); err != nil {
		var valErrs validator.ValidationErrors
		if errors.As(err, &valErrs) {
			var fieldErrors []FieldError
			for _, fe := range valErrs {
				fieldErrors = append(fieldErrors, FieldError{
					Field:   toSnakeCase(fe.Field()),
					Tag:     fe.Tag(),
					Message: formatErrorMessage(fe),
				})
			}
			return fieldErrors
		}
	}
	return nil
}

// formatErrorMessage provides friendly feedback for common validation rules.
func formatErrorMessage(fe validator.FieldError) string {
	field := toSnakeCase(fe.Field())
	switch fe.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters long", field, fe.Param())
	case "max":
		return fmt.Sprintf("%s cannot exceed %s characters", field, fe.Param())
	case "alphanum":
		return fmt.Sprintf("%s must only contain alphanumeric characters", field)
	case "uuid":
		return fmt.Sprintf("%s must be a valid UUID", field)
	default:
		return fmt.Sprintf("%s failed validation for rule '%s'", field, fe.Tag())
	}
}

// toSnakeCase converts camelCase or PascalCase strings to snake_case.
func toSnakeCase(str string) string {
	var builder strings.Builder
	for i, r := range str {
		if i > 0 && r >= 'A' && r <= 'Z' {
			builder.WriteRune('_')
		}
		builder.WriteRune(r)
	}
	return strings.ToLower(builder.String())
}
