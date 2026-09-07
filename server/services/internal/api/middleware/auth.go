package middleware

import (
	"context"
	"net/http"

	"services.kron.com/internal/api/config"
	"services.kron.com/pkg/crypto"
	"services.kron.com/pkg/jwt"
	"services.kron.com/pkg/response"
)

const ContextKeyUserID = "user_id"

func RequireAuth(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr, err := crypto.GetSignedCookie(r, cfg.CookieNameAccess, cfg.CookieAccessSignature)
			if err != nil || tokenStr == "" {
				response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication cookie required", nil)
				return
			}

			claims, err := jwt.ParseAndValidateToken(tokenStr, cfg.JWTAccessSecret)
			if err != nil {
				response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired access cookie", nil)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, ContextKeyUserID, claims.UserID)
			ctx = context.WithValue(ctx, "session_id", claims.SessionID)
			ctx = context.WithValue(ctx, "jwt_claims", claims)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
