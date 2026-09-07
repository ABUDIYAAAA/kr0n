package crypto

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

var (
	// ErrInvalidCookie indicates that the cookie value format or signature is invalid.
	ErrInvalidCookie = errors.New("invalid or tampered cookie")
	// ErrCookieNotFound indicates that the requested cookie was not present in the request.
	ErrCookieNotFound = errors.New("cookie not found")
)

// SignValue signs an arbitrary string value with an HMAC-SHA256 signature using the secret key.
// Format: "<raw_value>.<hex_signature>"
func SignValue(value string, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(value))
	signature := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", value, signature)
}

// VerifySignedValue verifies the HMAC-SHA256 signature and extracts the original unsigned value.
func VerifySignedValue(signedValue string, secret string) (string, error) {
	lastDot := strings.LastIndex(signedValue, ".")
	if lastDot == -1 {
		return "", ErrInvalidCookie
	}

	rawVal := signedValue[:lastDot]
	signatureHex := signedValue[lastDot+1:]

	expectedMAC := hmac.New(sha256.New, []byte(secret))
	expectedMAC.Write([]byte(rawVal))
	expectedSignature := expectedMAC.Sum(nil)

	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		return "", ErrInvalidCookie
	}

	if !hmac.Equal(sigBytes, expectedSignature) {
		return "", ErrInvalidCookie
	}

	return rawVal, nil
}

// CookieOptions defines configuration parameters for setting HTTP cookies.
type CookieOptions struct {
	Name     string
	Value    string
	Secret   string
	Domain   string
	Path     string
	MaxAge   int
	Expires  time.Time
	Secure   bool
	HTTPOnly bool
	SameSite http.SameSite
}

// SetSignedCookie signs the value and attaches the cookie to the HTTP response.
func SetSignedCookie(w http.ResponseWriter, opts CookieOptions) {
	if opts.Path == "" {
		opts.Path = "/"
	}

	cookieVal := opts.Value
	if opts.Secret != "" {
		cookieVal = SignValue(opts.Value, opts.Secret)
	}

	cookie := &http.Cookie{
		Name:     opts.Name,
		Value:    cookieVal,
		Path:     opts.Path,
		Domain:   opts.Domain,
		MaxAge:   opts.MaxAge,
		Expires:  opts.Expires,
		Secure:   opts.Secure,
		HttpOnly: opts.HTTPOnly,
		SameSite: opts.SameSite,
	}

	http.SetCookie(w, cookie)
}

// GetSignedCookie retrieves and verifies a signed cookie from an HTTP request.
func GetSignedCookie(r *http.Request, name string, secret string) (string, error) {
	cookie, err := r.Cookie(name)
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

// ClearCookie unsets a cookie on the client by setting its MaxAge to -1.
func ClearCookie(w http.ResponseWriter, name string, domain string, path string) {
	if path == "" {
		path = "/"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     path,
		Domain:   domain,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}
