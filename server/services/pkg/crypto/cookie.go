package crypto

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

var ErrInvalidCookieSignature = errors.New("cookie signature is invalid or tampered")

type CookieOptions struct {
	Name     string
	Value    string
	Secret   string
	Domain   string
	Path     string
	MaxAge   int
	HTTPOnly bool
	Secure   bool
	SameSite http.SameSite
}

func SignValue(value, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(value))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", value, sig)
}

func VerifySignedValue(signedValue, secret string) (string, error) {
	idx := strings.LastIndex(signedValue, ".")
	if idx == -1 {
		return "", ErrInvalidCookieSignature
	}

	value := signedValue[:idx]
	providedSig := signedValue[idx+1:]

	expectedSig := SignValue(value, secret)
	expectedSigIdx := strings.LastIndex(expectedSig, ".")
	expectedSigStr := expectedSig[expectedSigIdx+1:]

	if !hmac.Equal([]byte(providedSig), []byte(expectedSigStr)) {
		return "", ErrInvalidCookieSignature
	}

	return value, nil
}

func GetSignedCookie(r *http.Request, cookieName, secret string) (string, error) {
	cookie, err := r.Cookie(cookieName)
	if err != nil {
		return "", err
	}
	return VerifySignedValue(cookie.Value, secret)
}
