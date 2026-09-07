package crypto

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSignAndVerifyValue(t *testing.T) {
	secret := "super-secret-signature-key-1234"
	rawValue := "user_session_token_xyz"

	signed := SignValue(rawValue, secret)
	if signed == rawValue {
		t.Fatalf("signed value should differ from raw value")
	}

	// Verify valid signature
	verified, err := VerifySignedValue(signed, secret)
	if err != nil {
		t.Fatalf("expected valid signature verification, got %v", err)
	}

	if verified != rawValue {
		t.Fatalf("expected verified value '%s', got '%s'", rawValue, verified)
	}

	// Verify tampered value
	tampered := signed + "tampered"
	_, err = VerifySignedValue(tampered, secret)
	if err != ErrInvalidCookie {
		t.Fatalf("expected ErrInvalidCookie for tampered value, got %v", err)
	}

	// Verify wrong secret
	_, err = VerifySignedValue(signed, "wrong-secret-key")
	if err != ErrInvalidCookie {
		t.Fatalf("expected ErrInvalidCookie for wrong secret, got %v", err)
	}
}

func TestSetAndGetSignedCookie(t *testing.T) {
	secret := "cookie-signing-secret"
	cookieName := "kr0n_access_token"
	cookieVal := "jwt-access-token-content"

	rec := httptest.NewRecorder()
	SetSignedCookie(rec, CookieOptions{
		Name:   cookieName,
		Value:  cookieVal,
		Secret: secret,
	})

	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) == 0 {
		t.Fatalf("expected HTTP response cookie to be set")
	}

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(cookies[0])

	val, err := GetSignedCookie(req, cookieName, secret)
	if err != nil {
		t.Fatalf("expected to read signed cookie successfully, got %v", err)
	}

	if val != cookieVal {
		t.Fatalf("expected cookie value '%s', got '%s'", cookieVal, val)
	}
}
