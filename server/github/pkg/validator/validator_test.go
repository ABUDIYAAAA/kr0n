package validator

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

type DummyStruct struct {
	RepoName string `json:"repo_name" validate:"required,min=3"`
}

func TestDecodeAndValidate(t *testing.T) {
	var target DummyStruct

	// 1. Valid JSON
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(`{"repo_name":"kr0n-server"}`))
	errs, err := DecodeAndValidate(req, &target)
	if err != nil || errs != nil {
		t.Fatalf("expected valid decode and validate, got err=%v errs=%v", err, errs)
	}

	// 2. Validation Failure
	var target2 DummyStruct
	req2 := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(`{"repo_name":"ab"}`))
	errs2, err2 := DecodeAndValidate(req2, &target2)
	if err2 == nil || errs2 == nil {
		t.Fatalf("expected validation failure for short repo_name")
	}
}
