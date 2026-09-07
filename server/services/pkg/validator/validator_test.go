package validator

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

type sampleStruct struct {
	Name string `json:"name" validate:"required"`
}

func TestDecodeAndValidate(t *testing.T) {
	// 1. Valid payload
	body := bytes.NewBufferString(`{"name":"test-service"}`)
	req := httptest.NewRequest(http.MethodPost, "/", body)

	var s sampleStruct
	fieldErrors, err := DecodeAndValidate(req, &s)
	if err != nil || len(fieldErrors) > 0 {
		t.Fatalf("expected valid decode, got err %v, fieldErrors %v", err, fieldErrors)
	}

	if s.Name != "test-service" {
		t.Fatalf("expected Name test-service, got %s", s.Name)
	}

	// 2. Empty Body
	reqEmpty := httptest.NewRequest(http.MethodPost, "/", nil)
	_, err = DecodeAndValidate(reqEmpty, &s)
	if err == nil {
		t.Fatalf("expected error for empty body")
	}

	// 3. Validation rule failure
	bodyInvalid := bytes.NewBufferString(`{"name":""}`)
	reqInvalid := httptest.NewRequest(http.MethodPost, "/", bodyInvalid)
	var s2 sampleStruct
	fieldErrs, err := DecodeAndValidate(reqInvalid, &s2)
	if err == nil && len(fieldErrs) == 0 {
		t.Fatalf("expected validation errors for empty name")
	}
}
