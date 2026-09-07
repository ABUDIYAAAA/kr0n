package jwt

import (
	"errors"
	"testing"
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

func TestParseAndValidateToken(t *testing.T) {
	secret := "test_secret_key_123"

	// 1. Valid token
	claims := Claims{
		UserID:    "usr_1",
		SessionID: "sess_1",
		RegisteredClaims: jwtlib.RegisteredClaims{
			ExpiresAt: jwtlib.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))

	parsedClaims, err := ParseAndValidateToken(tokenStr, secret)
	if err != nil {
		t.Fatalf("ParseAndValidateToken failed: %v", err)
	}
	if parsedClaims.UserID != "usr_1" {
		t.Fatalf("unexpected user ID: %s", parsedClaims.UserID)
	}

	// 2. Expired token
	expiredClaims := Claims{
		UserID: "usr_1",
		RegisteredClaims: jwtlib.RegisteredClaims{
			ExpiresAt: jwtlib.NewNumericDate(time.Now().Add(-1 * time.Hour)),
		},
	}
	token2 := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, expiredClaims)
	tokenStr2, _ := token2.SignedString([]byte(secret))

	_, err = ParseAndValidateToken(tokenStr2, secret)
	if !errors.Is(err, ErrExpiredToken) {
		t.Fatalf("expected ErrExpiredToken, got %v", err)
	}

	// 3. Invalid Secret
	_, err = ParseAndValidateToken(tokenStr, "wrong_secret")
	if !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("expected ErrInvalidToken for wrong secret, got %v", err)
	}
}
