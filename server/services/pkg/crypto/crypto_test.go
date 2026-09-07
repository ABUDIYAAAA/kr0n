package crypto

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCookieSigning(t *testing.T) {
	secret := "secret-key-1234567890"
	value := "hello-world"

	signed := SignValue(value, secret)
	if signed == value {
		t.Fatalf("expected signed value to be different from original")
	}

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	cookie := &http.Cookie{Name: "test_cookie", Value: signed}
	req.AddCookie(cookie)

	extracted, err := GetSignedCookie(req, "test_cookie", secret)
	if err != nil {
		t.Fatalf("expected clean cookie extraction, got %v", err)
	}
	if extracted != value {
		t.Fatalf("expected extracted value '%s', got '%s'", value, extracted)
	}
}
