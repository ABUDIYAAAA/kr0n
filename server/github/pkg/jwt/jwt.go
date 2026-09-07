package jwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
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

func ParseAndValidateToken(tokenStr string, secret string) (*Claims, error) {
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

	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now().UTC()) {
		return nil, ErrExpiredToken
	}

	return claims, nil
}
