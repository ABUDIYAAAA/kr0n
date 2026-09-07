package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSuccessResponse(t *testing.T) {
	rr := httptest.NewRecorder()

	Success(rr, http.StatusOK, "Operation successful", map[string]string{"foo": "bar"})

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var res Response
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if !res.Success || res.Message != "Operation successful" {
		t.Fatalf("unexpected response structure: %+v", res)
	}
}

func TestErrorResponse(t *testing.T) {
	rr := httptest.NewRecorder()

	ErrorResponse(rr, http.StatusBadRequest, "INVALID_INPUT", "Bad payload", nil)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}

	var res Response
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if res.Success || res.Error.Code != "INVALID_INPUT" {
		t.Fatalf("unexpected error response structure: %+v", res)
	}
}
