package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResponseHelpers(t *testing.T) {
	// Test Success helper
	w1 := httptest.NewRecorder()
	Success(w1, http.StatusOK, "Operation successful", map[string]string{"foo": "bar"})
	if w1.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w1.Code)
	}

	var res1 Response
	if err := json.NewDecoder(w1.Body).Decode(&res1); err != nil {
		t.Fatalf("failed to decode success response: %v", err)
	}
	if !res1.Success || res1.Message != "Operation successful" {
		t.Fatalf("unexpected success payload: %+v", res1)
	}

	// Test ErrorResponse helper
	w2 := httptest.NewRecorder()
	ErrorResponse(w2, http.StatusBadRequest, "INVALID_INPUT", "Invalid payload", map[string]string{"field": "email"})
	if w2.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w2.Code)
	}

	var res2 Response
	if err := json.NewDecoder(w2.Body).Decode(&res2); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}
	if res2.Success || res2.Error.Code != "INVALID_INPUT" {
		t.Fatalf("unexpected error payload: %+v", res2)
	}

	// Test JSON with nil payload
	w3 := httptest.NewRecorder()
	JSON(w3, http.StatusNoContent, nil)
	if w3.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", w3.Code)
	}
}
