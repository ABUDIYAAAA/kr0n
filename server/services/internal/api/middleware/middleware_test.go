package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"services.kron.com/internal/api/config"
	"services.kron.com/pkg/crypto"
	"services.kron.com/pkg/jwt"
)

func TestRequireAuth(t *testing.T) {
	cfg := &config.Config{
		CookieNameAccess:      "kron_access",
		CookieAccessSignature: "sig_secret_12345",
		JWTAccessSecret:       "jwt_access_secret_1234567890123",
	}

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, _ := r.Context().Value(ContextKeyUserID).(string)
		if userID == "" {
			t.Fatalf("expected userID in context")
		}
		w.WriteHeader(http.StatusOK)
	})

	mw := RequireAuth(cfg)(nextHandler)

	// 1. Missing Cookie
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rr := httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing cookie, got %d", rr.Code)
	}

	// 2. Valid Cookie
	validToken, _, err := jwt.GenerateAccessToken("usr_1", "sess_1", "dev_1", "a@b.com", "ab", cfg.JWTAccessSecret, 0)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	signedVal := crypto.SignValue(validToken, cfg.CookieAccessSignature)
	cookie := &http.Cookie{Name: cfg.CookieNameAccess, Value: signedVal}

	req = httptest.NewRequest(http.MethodGet, "/test", nil)
	req.AddCookie(cookie)
	rr = httptest.NewRecorder()
	mw.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid signed cookie, got %d", rr.Code)
	}
}
