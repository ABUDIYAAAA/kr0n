package jwt

import (
	"testing"
	"time"
)

func TestAccessToken(t *testing.T) {
	secret := "access-secret-32-bytes-key-12345"

	tokenStr, claims, err := GenerateAccessToken("usr_1", "sess_1", "dev_1", "user@test.com", "testuser", secret, 15*time.Minute)
	if err != nil {
		t.Fatalf("failed to generate access token: %v", err)
	}

	if claims.UserID != "usr_1" {
		t.Fatalf("expected UserID usr_1, got %s", claims.UserID)
	}

	parsed, err := ParseAndValidateToken(tokenStr, secret)
	if err != nil {
		t.Fatalf("failed to parse access token: %v", err)
	}

	if parsed.UserID != "usr_1" || parsed.SessionID != "sess_1" {
		t.Fatalf("mismatched claims in parsed token")
	}
}
