package middleware

import (
	"context"
	"net/http"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/modules/auth"
	"auth.kron.com/pkg/crypto"
	"github.com/google/uuid"
)

// DeviceTrackingMiddleware ensures every client has a signed, persistent device tracking cookie.
func DeviceTrackingMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var deviceID string

			// 1. Try reading existing signed device cookie
			signedDeviceID, err := crypto.GetSignedCookie(r, cfg.CookieNameDeviceID, cfg.CookieAccessSignature)
			if err == nil && signedDeviceID != "" {
				deviceID = signedDeviceID
			} else {
				// 2. Generate new UUIDv7 device ID
				newID, err := uuid.NewV7()
				if err != nil {
					newID = uuid.New()
				}
				deviceID = newID.String()

				// 3. Set permanent signed device cookie on response
				crypto.SetSignedCookie(w, crypto.CookieOptions{
					Name:     cfg.CookieNameDeviceID,
					Value:    deviceID,
					Secret:   cfg.CookieAccessSignature,
					Domain:   cfg.CookieDomain,
					Path:     "/",
					MaxAge:   auth.DeviceCookieMaxAge,
					HTTPOnly: true,
					Secure:   false, // Set to true in production with HTTPS
					SameSite: http.SameSiteLaxMode,
				})
			}

			// 4. Inject device ID into context
			ctx := context.WithValue(r.Context(), auth.ContextKeyDeviceID, deviceID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
