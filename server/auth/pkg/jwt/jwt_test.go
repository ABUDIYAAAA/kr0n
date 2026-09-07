package jwt

import (
	"testing"
	"time"
)

func TestGenerateAndValidateAccessToken(t *testing.T) {
	secret := "jwt-access-secret-32-character-key"
	userID := "usr_123456"
	sessionID := "sess_654321"
	deviceID := "dev_789"
	email := "alice@kron.com"
	username := "alice"
	ttl := 15 * time.Minute

	tokenStr, claims, err := GenerateAccessToken(userID, sessionID, deviceID, email, username, secret, ttl)
	if err != nil {
		t.Fatalf("unexpected error generating access token: %v", err)
	}

	if tokenStr == "" {
		t.Fatalf("access token string should not be empty")
	}

	if claims.UserID != userID || claims.SessionID != sessionID || claims.TokenType != "access" {
		t.Fatalf("claims mismatch in generated token: %+v", claims)
	}

	// Validate valid token
	parsedClaims, err := ParseAndValidateToken(tokenStr, secret)
	if err != nil {
		t.Fatalf("expected to parse valid token, got %v", err)
	}

	if parsedClaims.UserID != userID || parsedClaims.Email != email || parsedClaims.Username != username {
		t.Fatalf("parsed claims mismatch: %+v", parsedClaims)
	}

	// Validate with wrong secret
	_, err = ParseAndValidateToken(tokenStr, "wrong-secret-key")
	if err != ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken for wrong secret, got %v", err)
	}
}

func TestGenerateAndValidateRefreshToken(t *testing.T) {
	secret := "jwt-refresh-secret-key"
	userID := "usr_123456"
	sessionID := "sess_654321"
	deviceID := "dev_789"
	ttl := 24 * time.Hour

	tokenStr, claims, err := GenerateRefreshToken(userID, sessionID, deviceID, secret, ttl)
	if err != nil {
		t.Fatalf("unexpected error generating refresh token: %v", err)
	}

	if claims.TokenType != "refresh" {
		t.Fatalf("expected token type 'refresh', got '%s'", claims.TokenType)
	}

	parsedClaims, err := ParseAndValidateToken(tokenStr, secret)
	if err != nil {
		t.Fatalf("expected valid refresh token validation, got %v", err)
	}

	if parsedClaims.SessionID != sessionID {
		t.Fatalf("expected session ID '%s', got '%s'", sessionID, parsedClaims.SessionID)
	}
}

func TestExpiredTokenValidation(t *testing.T) {
	secret := "jwt-secret-key"
	// Generate token with negative TTL (already expired)
	tokenStr, _, err := GenerateAccessToken("usr_1", "sess_1", "dev_1", "expired@kron.com", "expired", secret, -1*time.Minute)
	if err != nil {
		t.Fatalf("unexpected error generating token: %v", err)
	}

	_, err = ParseAndValidateToken(tokenStr, secret)
	if err != ErrExpiredToken {
		t.Fatalf("expected ErrExpiredToken for expired token, got %v", err)
	}
}
