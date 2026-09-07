package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"auth.kron.com/internal/api/config"
)

func TestNewRouter_Health(t *testing.T) {
	cfg := &config.Config{
		JWTAccessSecret:       "access_secret_12345678901234567890",
		JWTRefreshSecret:      "refresh_secret_12345678901234567890",
		CookieAccessSignature: "cookie_sig_12345678901234567890",
		CookieNameDeviceID:    "kron_device_id",
	}

	r := NewRouter(cfg, nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 for health endpoint, got %d", rr.Code)
	}
}
