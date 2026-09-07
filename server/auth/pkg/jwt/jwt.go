package jwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	// ErrInvalidToken indicates the token signature or claims could not be verified.
	ErrInvalidToken = errors.New("invalid or malformed token")
	// ErrExpiredToken indicates the token has passed its expiration time.
	ErrExpiredToken = errors.New("token has expired")
)

// Claims defines custom JWT claims carried within auth tokens.
type Claims struct {
	UserID    string `json:"sub"`
	SessionID string `json:"sid"`
	DeviceID  string `json:"dev,omitempty"`
	Email     string `json:"email,omitempty"`
	Username  string `json:"usr,omitempty"`
	TokenType string `json:"typ"`
	jwt.RegisteredClaims
}

// GenerateAccessToken signs a new short-lived JWT access token.
func GenerateAccessToken(userID, sessionID, deviceID, email, username, secret string, ttl time.Duration) (string, *Claims, error) {
	now := time.Now().UTC()
	tokenID := uuid.NewString()

	claims := &Claims{
		UserID:    userID,
		SessionID: sessionID,
		DeviceID:  deviceID,
		Email:     email,
		Username:  username,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        tokenID,
			Subject:   userID,
			Issuer:    "auth.kron.com",
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	return signedToken, claims, nil
}

// GenerateRefreshToken signs a new long-lived JWT refresh token.
func GenerateRefreshToken(userID, sessionID, deviceID, secret string, ttl time.Duration) (string, *Claims, error) {
	now := time.Now().UTC()
	tokenID := uuid.NewString()

	claims := &Claims{
		UserID:    userID,
		SessionID: sessionID,
		DeviceID:  deviceID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        tokenID,
			Subject:   userID,
			Issuer:    "auth.kron.com",
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return signedToken, claims, nil
}

// ParseAndValidateToken parses a JWT string, validates its HMAC signature and returns the Claims.
func ParseAndValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
