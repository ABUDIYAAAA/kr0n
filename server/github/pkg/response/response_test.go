package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResponseHelpers(t *testing.T) {
	w1 := httptest.NewRecorder()
	Success(w1, http.StatusOK, "OK", map[string]string{"foo": "bar"})
	if w1.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w1.Code)
	}

	var res Response
	_ = json.NewDecoder(w1.Body).Decode(&res)
	if !res.Success {
		t.Fatalf("expected success true")
	}

	w2 := httptest.NewRecorder()
	ErrorResponse(w2, http.StatusBadRequest, "INVALID", "Error msg", nil)
	if w2.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w2.Code)
	}
}
