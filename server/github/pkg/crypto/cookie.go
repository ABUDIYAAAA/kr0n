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

var (
	ErrInvalidCookieSignature = errors.New("invalid or tampered cookie signature")
	ErrCookieNotFound         = errors.New("cookie not found")
)

func SignValue(value, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(value))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", value, sig)
}

func VerifySignedValue(signedValue, secret string) (string, error) {
	lastDot := strings.LastIndex(signedValue, ".")
	if lastDot == -1 {
		return "", ErrInvalidCookieSignature
	}

	value := signedValue[:lastDot]
	expectedSig := signedValue[lastDot+1:]

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(value))
	actualSigBytes := mac.Sum(nil)

	sigBytes, err := hex.DecodeString(expectedSig)
	if err != nil {
		return "", ErrInvalidCookieSignature
	}

	if !hmac.Equal(sigBytes, actualSigBytes) {
		return "", ErrInvalidCookieSignature
	}

	return value, nil
}

func GetSignedCookie(r *http.Request, cookieName, secret string) (string, error) {
	cookie, err := r.Cookie(cookieName)
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return "", ErrCookieNotFound
		}
		return "", err
	}

	if secret == "" {
		return cookie.Value, nil
	}

	return VerifySignedValue(cookie.Value, secret)
}
