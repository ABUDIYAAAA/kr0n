package validator

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func DecodeAndValidate(r *http.Request, v interface{}) ([]FieldError, error) {
	if r.Body == nil {
		return nil, errors.New("request body is empty")
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(v); err != nil {
		if errors.Is(err, io.EOF) {
			return nil, errors.New("request body is empty")
		}
		return nil, fmt.Errorf("invalid json payload: %w", err)
	}

	if err := validate.Struct(v); err != nil {
		var validationErrs validator.ValidationErrors
		if errors.As(err, &validationErrs) {
			fieldErrors := make([]FieldError, 0, len(validationErrs))
			for _, fe := range validationErrs {
				fieldErrors = append(fieldErrors, FieldError{
					Field:   fe.Field(),
					Message: fmt.Sprintf("failed validation on rule '%s'", fe.Tag()),
				})
			}
			return fieldErrors, err
		}
		return nil, err
	}

	return nil, nil
}
