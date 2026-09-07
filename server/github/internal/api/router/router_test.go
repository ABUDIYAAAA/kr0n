package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.kron.com/internal/api/config"
)

func TestNewRouter_Health(t *testing.T) {
	cfg := &config.Config{
		FrontendURL: "http://localhost:3000",
	}

	r := NewRouter(cfg, nil)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 for health endpoint, got %d", rr.Code)
	}
}
