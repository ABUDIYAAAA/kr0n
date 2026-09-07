package validator

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

type TestStruct struct {
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,min=3"`
}

func TestDecodeAndValidateValidJSON(t *testing.T) {
	jsonBody := `{"email":"test@example.com","username":"john"}`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(jsonBody))

	var target TestStruct
	fieldErrs, err := DecodeAndValidate(req, &target)
	if err != nil {
		t.Fatalf("expected valid JSON decoding without error, got %v", err)
	}

	if len(fieldErrs) > 0 {
		t.Fatalf("expected no field validation errors, got %+v", fieldErrs)
	}

	if target.Email != "test@example.com" || target.Username != "john" {
		t.Fatalf("target struct mismatch: %+v", target)
	}
}

func TestDecodeAndValidateInvalidEmail(t *testing.T) {
	jsonBody := `{"email":"invalid-email-address","username":"jo"}`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(jsonBody))

	var target TestStruct
	fieldErrs, err := DecodeAndValidate(req, &target)
	if err == nil {
		t.Fatalf("expected validation error for invalid email and short username")
	}

	if len(fieldErrs) != 2 {
		t.Fatalf("expected 2 field errors (email and username), got %d", len(fieldErrs))
	}
}

func TestDecodeAndValidateEmptyBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(""))

	var target TestStruct
	_, err := DecodeAndValidate(req, &target)
	if err == nil {
		t.Fatalf("expected error for empty request body")
	}
}

func TestToSnakeCase(t *testing.T) {
	cases := map[string]string{
		"Username":     "username",
		"EmailAddress": "email_address",
		"DeviceID":     "device_i_d",
	}

	for input, expected := range cases {
		result := toSnakeCase(input)
		if result != expected {
			t.Errorf("expected toSnakeCase('%s') = '%s', got '%s'", input, expected, result)
		}
	}
}
