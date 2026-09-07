package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.kron.com/internal/api/config"
	"github.kron.com/pkg/crypto"
	pkgjwt "github.kron.com/pkg/jwt"
)

func TestRequireAuthMiddleware(t *testing.T) {
	cfg := &config.Config{
		JWTAccessSecret:       "secret_key_12345",
		CookieNameAccess:      "kron_access",
		CookieAccessSignature: "cookie_sig_secret",
	}

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, _ := r.Context().Value("user_id").(string)
		if userID == "" {
			t.Fatalf("expected userID in context")
		}
		w.WriteHeader(http.StatusOK)
	})

	mw := RequireAuth(cfg)(nextHandler)

	// 1. Missing Token Cookie
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing cookie, got %d", rr.Code)
	}

	// 2. Valid Signed Access Cookie
	claims := pkgjwt.Claims{
		UserID: "usr_999",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &claims)
	tokenStr, err := token.SignedString([]byte(cfg.JWTAccessSecret))
	if err != nil {
		t.Fatalf("failed to sign test token: %v", err)
	}

	signedVal := crypto.SignValue(tokenStr, cfg.CookieAccessSignature)
	cookie := &http.Cookie{Name: cfg.CookieNameAccess, Value: signedVal}

	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(cookie)
	rr = httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid signed cookie, got %d", rr.Code)
	}
}
