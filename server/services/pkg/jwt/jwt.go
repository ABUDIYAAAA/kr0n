package jwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid or malformed jwt token")
	ErrExpiredToken = errors.New("jwt token has expired")
)

type Claims struct {
	UserID    string `json:"sub"`
	SessionID string `json:"sid"`
	DeviceID  string `json:"did"`
	Email     string `json:"email"`
	Username  string `json:"username"`
	TokenType string `json:"type"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(userID, sessionID, deviceID, email, username, secret string, ttl time.Duration) (string, *Claims, error) {
	now := time.Now().UTC()
	if ttl <= 0 {
		ttl = 15 * time.Minute
	}
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
			Issuer:    "kron.com",
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

func ParseAndValidateToken(tokenStr, secret string) (*Claims, error) {
	if tokenStr == "" || secret == "" {
		return nil, ErrInvalidToken
	}

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
