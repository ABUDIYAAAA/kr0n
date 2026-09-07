package validator

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
}

func DecodeAndValidate(r *http.Request, target any) (map[string]string, error) {
	if r.Body == nil {
		return nil, fmt.Errorf("request body is empty")
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		if errorsIsEOF(err) {
			return nil, fmt.Errorf("request body is empty")
		}
		return nil, fmt.Errorf("invalid json payload: %w", err)
	}

	if err := validate.Struct(target); err != nil {
		return formatErrorMessage(err), err
	}

	return nil, nil
}

func errorsIsEOF(err error) bool {
	return err == io.EOF
}

func formatErrorMessage(err error) map[string]string {
	fieldErrors := make(map[string]string)
	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrs {
			fieldErrors[toSnakeCase(e.Field())] = fmt.Sprintf("failed validation on rule '%s'", e.Tag())
		}
	}
	return fieldErrors
}

func toSnakeCase(str string) string {
	var result strings.Builder
	for i, r := range str {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}
