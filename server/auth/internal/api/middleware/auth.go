package middleware

import (
	"context"
	"net/http"
	"strings"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/modules/auth"
	"auth.kron.com/pkg/crypto"
	"auth.kron.com/pkg/jwt"
	"auth.kron.com/pkg/response"
)

// RequireAuth enforces valid JWT authentication and verifies instant revocation state in Redis.
func RequireAuth(cfg *config.Config, repo auth.Repository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenStr string

			// 1. Try reading Authorization header (Bearer <token>)
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
				tokenStr = strings.TrimSpace(authHeader[7:])
			}

			// 2. Fallback to signed access cookie
			if tokenStr == "" {
				cookieVal, err := crypto.GetSignedCookie(r, cfg.CookieNameAccess, cfg.CookieAccessSignature)
				if err == nil && cookieVal != "" {
					tokenStr = cookieVal
				}
			}

			if tokenStr == "" {
				response.ErrorResponse(w, http.StatusUnauthorized, auth.ErrCodeUnauthorized, "Authentication credentials required", nil)
				return
			}

			// 3. Parse and validate JWT signature & expiration
			claims, err := jwt.ParseAndValidateToken(tokenStr, cfg.JWTAccessSecret)
			if err != nil {
				response.ErrorResponse(w, http.StatusUnauthorized, auth.ErrCodeTokenExpired, "Invalid or expired access token", nil)
				return
			}

			if claims.TokenType != auth.TokenTypeAccess {
				response.ErrorResponse(w, http.StatusUnauthorized, auth.ErrCodeUnauthorized, "Invalid token type", nil)
				return
			}

			// 4. Instant Access Token Revocation check (Redis: Token JTI)
			if claims.ID != "" {
				isBlacklisted, err := repo.IsTokenBlacklisted(r.Context(), claims.ID)
				if err == nil && isBlacklisted {
					response.ErrorResponse(w, http.StatusUnauthorized, auth.ErrCodeTokenRevoked, "Access token has been revoked", nil)
					return
				}
			}

			// 5. Instant Session Revocation check (Redis: Session ID)
			if claims.SessionID != "" {
				isSessionBlacklisted, err := repo.IsSessionBlacklisted(r.Context(), claims.SessionID)
				if err == nil && isSessionBlacklisted {
					response.ErrorResponse(w, http.StatusUnauthorized, auth.ErrCodeTokenRevoked, "Session has been terminated", nil)
					return
				}
			}

			// 6. User Global Revocation check (Redis: User revocation timestamp)
			if claims.UserID != "" && claims.IssuedAt != nil {
				revokedAtUnix, err := repo.GetUserRevocationTimestamp(r.Context(), claims.UserID)
				if err == nil && revokedAtUnix > 0 {
					if claims.IssuedAt.Unix() < revokedAtUnix {
						response.ErrorResponse(w, http.StatusUnauthorized, auth.ErrCodeTokenRevoked, "All active sessions have been invalidated", nil)
						return
					}
				}
			}

			// 7. Attach claims and user information to request context
			ctx := r.Context()
			ctx = context.WithValue(ctx, auth.ContextKeyUserID, claims.UserID)
			ctx = context.WithValue(ctx, auth.ContextKeySessionID, claims.SessionID)
			ctx = context.WithValue(ctx, auth.ContextKeyEmail, claims.Email)
			ctx = context.WithValue(ctx, auth.ContextKeyUsername, claims.Username)
			ctx = context.WithValue(ctx, auth.ContextKeyClaims, claims)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
