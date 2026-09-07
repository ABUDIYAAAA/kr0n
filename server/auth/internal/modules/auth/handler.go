package auth

import (
	"errors"
	"net/http"
	"strings"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/pkg/crypto"
	"auth.kron.com/pkg/jwt"
	"auth.kron.com/pkg/response"
	"auth.kron.com/pkg/validator"
	"github.com/go-chi/chi/v5"
)

// Handler handles HTTP requests for the authentication module.
type Handler struct {
	service Service
	cfg     *config.Config
}

// NewHandler creates a new instance of Handler.
func NewHandler(service Service, cfg *config.Config) *Handler {
	return &Handler{
		service: service,
		cfg:     cfg,
	}
}

// ==========================================
// Handlers
// ==========================================

// Signup handles user registration.
// POST /api/v1/auth/signup
func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Invalid request payload", fieldErrors)
		return
	}

	deviceID := h.getOrExtractDeviceID(r)
	ip := getClientIP(r)
	userAgent := r.UserAgent()

	authResp, rawRefreshToken, err := h.service.Signup(r.Context(), req, deviceID, ip, userAgent)
	if err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			response.ErrorResponse(w, http.StatusConflict, ErrCodeUserExists, "A user with this email or username already exists", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to register user", nil)
		return
	}

	// Set signed cookies for access token, refresh token, and permanent device ID
	h.setAuthCookies(w, authResp.AccessToken, rawRefreshToken, deviceID)

	response.Success(w, http.StatusCreated, "User registered successfully", authResp)
}

// Login handles user authentication.
// POST /api/v1/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Invalid request payload", fieldErrors)
		return
	}

	deviceID := h.getOrExtractDeviceID(r)
	ip := getClientIP(r)
	userAgent := r.UserAgent()

	authResp, rawRefreshToken, err := h.service.Login(r.Context(), req, deviceID, ip, userAgent)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeInvalidCreds, "Invalid login credentials", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Login failed", nil)
		return
	}

	// Set signed cookies
	h.setAuthCookies(w, authResp.AccessToken, rawRefreshToken, deviceID)

	response.Success(w, http.StatusOK, "Login successful", authResp)
}

// Refresh handles token refreshment.
// POST /api/v1/auth/refresh
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	// 1. Try reading refresh token from signed cookie first
	refreshToken, err := crypto.GetSignedCookie(r, h.cfg.CookieNameRefresh, h.cfg.CookieAccessSignature)
	if err != nil || refreshToken == "" {
		// 2. Fallback to request body
		var req RefreshTokenRequest
		_, _ = validator.DecodeAndValidate(r, &req)
		refreshToken = req.RefreshToken
	}

	if refreshToken == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Refresh token is missing or invalid", nil)
		return
	}

	deviceID := h.getOrExtractDeviceID(r)
	ip := getClientIP(r)
	userAgent := r.UserAgent()

	authResp, rawRefreshToken, err := h.service.RefreshToken(r.Context(), refreshToken, deviceID, ip, userAgent)
	if err != nil {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, err.Error(), nil)
		return
	}

	// Set updated signed cookies
	h.setAuthCookies(w, authResp.AccessToken, rawRefreshToken, deviceID)

	response.Success(w, http.StatusOK, "Token refreshed successfully", authResp)
}

// GetMe retrieves the authenticated user's profile and active session details.
// GET /api/v1/auth/me
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	sessionID, _ := r.Context().Value(ContextKeySessionID).(string)

	user, session, err := h.service.GetMe(r.Context(), userID, sessionID)
	if err != nil {
		response.ErrorResponse(w, http.StatusNotFound, ErrCodeUserNotFound, "User not found", nil)
		return
	}

	data := map[string]any{
		"user":    user,
		"session": session,
	}

	response.Success(w, http.StatusOK, "User profile retrieved", data)
}

// UpdateUsername updates the user's username handle.
// PATCH /api/v1/auth/username
func (h *Handler) UpdateUsername(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	var req UpdateUsernameRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Invalid username request", fieldErrors)
		return
	}

	user, err := h.service.UpdateUsername(r.Context(), userID, req.Username)
	if err != nil {
		if errors.Is(err, ErrUsernameAlreadyTaken) {
			response.ErrorResponse(w, http.StatusConflict, ErrCodeUsernameTaken, "This username is already taken", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to update username", nil)
		return
	}

	response.Success(w, http.StatusOK, "Username updated successfully", user)
}

// VerifyEmail confirms user email using a security token.
// GET or POST /api/v1/auth/verify-email
func (h *Handler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var token string
	if r.Method == http.MethodGet {
		token = r.URL.Query().Get("token")
	} else {
		var req VerifyEmailRequest
		if fieldErrors, err := validator.DecodeAndValidate(r, &req); err == nil {
			token = req.Token
		} else {
			response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Invalid verification token", fieldErrors)
			return
		}
	}

	if token == "" {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidRequest, "Verification token parameter is required", nil)
		return
	}

	if err := h.service.VerifyEmail(r.Context(), token); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidToken, "Verification link is invalid or expired", nil)
		return
	}

	response.Success(w, http.StatusOK, "Email verified successfully", nil)
}

// ResendVerification sends a new email verification token.
// POST /api/v1/auth/resend-verification
func (h *Handler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var req ResendVerificationRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Invalid email address", fieldErrors)
		return
	}

	if err := h.service.ResendVerificationEmail(r.Context(), req); err != nil {
		if errors.Is(err, ErrEmailAlreadyVerified) {
			response.ErrorResponse(w, http.StatusBadRequest, ErrCodeEmailNotVerified, "Email is already verified", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to resend verification email", nil)
		return
	}

	response.Success(w, http.StatusOK, "Verification email sent if account exists and is unverified", nil)
}

// Logout terminates current session and clears cookies.
// POST /api/v1/auth/logout
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(ContextKeyUserID).(string)
	sessionID, _ := r.Context().Value(ContextKeySessionID).(string)

	var tokenJTI string
	if claims, ok := r.Context().Value(ContextKeyClaims).(*jwt.Claims); ok && claims != nil {
		tokenJTI = claims.ID
	}

	_ = h.service.Logout(r.Context(), sessionID, userID, tokenJTI)

	// Clear auth cookies
	crypto.ClearCookie(w, h.cfg.CookieNameAccess, h.cfg.CookieDomain, "/")
	crypto.ClearCookie(w, h.cfg.CookieNameRefresh, h.cfg.CookieDomain, "/")

	response.Success(w, http.StatusOK, "Logged out successfully", nil)
}

// ListSessions lists all active sessions for the user.
// GET /api/v1/auth/sessions
func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	currentSessionID, _ := r.Context().Value(ContextKeySessionID).(string)

	sessions, err := h.service.ListUserSessions(r.Context(), userID, currentSessionID)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to list sessions", nil)
		return
	}

	response.Success(w, http.StatusOK, "Active sessions retrieved", sessions)
}

// RevokeSession revokes a specific session.
// DELETE /api/v1/auth/sessions/{id}
func (h *Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	sessionIDToRevoke := chi.URLParam(r, "id")
	if sessionIDToRevoke == "" {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidRequest, "Session ID is required", nil)
		return
	}

	if err := h.service.RevokeSession(r.Context(), sessionIDToRevoke, userID); err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to revoke session", nil)
		return
	}

	response.Success(w, http.StatusOK, "Session revoked successfully", nil)
}

// RevokeAllOtherSessions revokes all sessions except the current active one.
// DELETE /api/v1/auth/sessions
func (h *Handler) RevokeAllOtherSessions(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	currentSessionID, _ := r.Context().Value(ContextKeySessionID).(string)

	if err := h.service.RevokeAllOtherSessions(r.Context(), userID, currentSessionID); err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to revoke sessions", nil)
		return
	}

	response.Success(w, http.StatusOK, "All other sessions revoked successfully", nil)
}

// GetOAuthURL returns the authorization URL for a 3rd party provider.
// GET /api/v1/auth/oauth/{provider}/url
func (h *Handler) GetOAuthURL(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider == "" {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidRequest, "Provider name is required", nil)
		return
	}

	oauthURL, err := h.service.GetOAuthAuthURL(r.Context(), provider)
	if err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeOAuthFailed, err.Error(), nil)
		return
	}

	response.Success(w, http.StatusOK, "OAuth authorization URL generated", oauthURL)
}

// HandleOAuthCallback handles the authorization code exchange from OAuth providers.
// GET / POST /api/v1/auth/oauth/{provider}/callback
func (h *Handler) HandleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	if code == "" || state == "" {
		var req OAuthCallbackRequest
		if err := r.ParseForm(); err == nil {
			code = r.FormValue("code")
			state = r.FormValue("state")
		}
		if code == "" || state == "" {
			_, _ = validator.DecodeAndValidate(r, &req)
			code = req.Code
			state = req.State
		}
	}

	if code == "" || state == "" {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidRequest, "Missing code or state parameter", nil)
		return
	}

	deviceID := h.getOrExtractDeviceID(r)
	ip := getClientIP(r)
	userAgent := r.UserAgent()

	authResp, rawRefreshToken, err := h.service.HandleOAuthCallback(r.Context(), provider, code, state, deviceID, ip, userAgent)
	if err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeOAuthFailed, err.Error(), nil)
		return
	}

	// Set signed cookies
	h.setAuthCookies(w, authResp.AccessToken, rawRefreshToken, deviceID)

	response.Success(w, http.StatusOK, "OAuth authentication successful", authResp)
}

// ==========================================
// Cookie & Request Extraction Helpers
// ==========================================

func (h *Handler) setAuthCookies(w http.ResponseWriter, accessToken, refreshToken, deviceID string) {
	// 1. Signed Access Token Cookie
	crypto.SetSignedCookie(w, crypto.CookieOptions{
		Name:     h.cfg.CookieNameAccess,
		Value:    accessToken,
		Secret:   h.cfg.CookieAccessSignature,
		Domain:   h.cfg.CookieDomain,
		Path:     "/",
		MaxAge:   int(h.cfg.JWTAccessTTL.Seconds()),
		HTTPOnly: true,
		Secure:   false, // Set to true in TLS/production
		SameSite: http.SameSiteLaxMode,
	})

	// 2. Signed Refresh Token Cookie
	if refreshToken != "" {
		crypto.SetSignedCookie(w, crypto.CookieOptions{
			Name:     h.cfg.CookieNameRefresh,
			Value:    refreshToken,
			Secret:   h.cfg.CookieAccessSignature,
			Domain:   h.cfg.CookieDomain,
			Path:     "/",
			MaxAge:   int(h.cfg.JWTRefreshTTL.Seconds()),
			HTTPOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
		})
	}

	// 3. Permanent Signed Device ID Cookie (10 years)
	if deviceID != "" {
		crypto.SetSignedCookie(w, crypto.CookieOptions{
			Name:     h.cfg.CookieNameDeviceID,
			Value:    deviceID,
			Secret:   h.cfg.CookieAccessSignature,
			Domain:   h.cfg.CookieDomain,
			Path:     "/",
			MaxAge:   DeviceCookieMaxAge,
			HTTPOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
		})
	}
}

func (h *Handler) getOrExtractDeviceID(r *http.Request) string {
	if deviceID, ok := r.Context().Value(ContextKeyDeviceID).(string); ok && deviceID != "" {
		return deviceID
	}

	deviceID, err := crypto.GetSignedCookie(r, h.cfg.CookieNameDeviceID, h.cfg.CookieAccessSignature)
	if err == nil && deviceID != "" {
		return deviceID
	}

	return ""
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	// Check X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	// Fallback to RemoteAddr (strip port)
	remote := r.RemoteAddr
	if idx := strings.LastIndex(remote, ":"); idx != -1 {
		return remote[:idx]
	}
	return remote
}
