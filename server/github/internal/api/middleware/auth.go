package middleware

import (
	"context"
	"net/http"

	"github.kron.com/internal/api/config"
	"github.kron.com/pkg/crypto"
	"github.kron.com/pkg/jwt"
	"github.kron.com/pkg/response"
)

// RequireAuth strictly enforces signed cookie-based authentication across services.
func RequireAuth(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 1. Extract signed access cookie
			tokenStr, err := crypto.GetSignedCookie(r, cfg.CookieNameAccess, cfg.CookieAccessSignature)
			if err != nil || tokenStr == "" {
				response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication cookie required", nil)
				return
			}

			// 2. Parse and validate JWT signature & expiration using shared secret
			claims, err := jwt.ParseAndValidateToken(tokenStr, cfg.JWTAccessSecret)
			if err != nil {
				response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired access cookie", nil)
				return
			}

			// 3. Attach user context
			ctx := r.Context()
			ctx = context.WithValue(ctx, "user_id", claims.UserID)
			ctx = context.WithValue(ctx, "session_id", claims.SessionID)
			ctx = context.WithValue(ctx, "jwt_claims", claims)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
