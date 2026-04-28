package auth

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"

	coreutils "auth/internal/core/utils"

	"github.com/gin-gonic/gin"
)

const (
	googleAuthURL       = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL      = "https://oauth2.googleapis.com/token"
	googleUserInfoURL   = "https://openidconnect.googleapis.com/v1/userinfo"
	defaultGoogleScopes = "openid email profile"
	googleStateTTL      = 5 * time.Minute
)

type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

type Handler struct {
	svc              *Service
	sessionCookieCfg CookieConfig
	stateCookieCfg   CookieConfig
	googleCfg        GoogleOAuthConfig
	httpClient       *http.Client
}

func NewHandler(svc *Service, sessionCookieCfg CookieConfig, googleCfg GoogleOAuthConfig) *Handler {
	if sessionCookieCfg.Path == "" {
		sessionCookieCfg.Path = "/"
	}

	if sessionCookieCfg.Name == "" {
		sessionCookieCfg.Name = "forms_session"
	}

	if len(googleCfg.Scopes) == 0 {
		googleCfg.Scopes = strings.Fields(defaultGoogleScopes)
	}

	stateCookieCfg := CookieConfig{
		Name:     "google_oauth_state",
		Domain:   sessionCookieCfg.Domain,
		Path:     "/auth/google/callback",
		Secure:   sessionCookieCfg.Secure,
		HTTPOnly: true,
		SameSite: sessionCookieCfg.SameSite,
	}

	return &Handler{
		svc:              svc,
		sessionCookieCfg: sessionCookieCfg,
		stateCookieCfg:   stateCookieCfg,
		googleCfg:        googleCfg,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GoogleLogin initiates the Google OAuth login flow.
// @Summary Initiate Google OAuth
// @Description Redirects the user to Google's OAuth consent screen.
// @Tags auth
// @Success 307
// @Router /auth/google [get]
func (h *Handler) GoogleLogin(c *gin.Context) {
	if !h.googleConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "google oauth is not configured"})
		return
	}

	state, err := generateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize oauth state"})
		return
	}

	setStateCookie(c, h.stateCookieCfg, state, googleStateTTL)
	c.Redirect(http.StatusTemporaryRedirect, h.buildGoogleAuthURL(state))
}

// GoogleCallback handles the Google OAuth callback.
// @Summary Google OAuth callback
// @Description Validates OAuth state and code, creates/logs in the user, and sets a session cookie.
// @Tags auth
// @Param code query string true "OAuth code"
// @Param state query string true "OAuth state"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse "Missing code or state"
// @Failure 401 {object} ErrorResponse "Invalid state"
// @Failure 500 {object} ErrorResponse "Internal error"
// @Router /auth/google/callback [get]
func (h *Handler) GoogleCallback(c *gin.Context) {
	if !h.googleConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "google oauth is not configured"})
		return
	}

	code := strings.TrimSpace(c.Query("code"))
	state := strings.TrimSpace(c.Query("state"))
	if code == "" || state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing oauth code or state"})
		return
	}

	stateFromCookie, err := c.Cookie(h.stateCookieCfg.Name)
	clearCookie(c, h.stateCookieCfg)
	if err != nil || subtle.ConstantTimeCompare([]byte(state), []byte(stateFromCookie)) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}

	tokens, err := h.exchangeGoogleCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	profile, err := h.getGoogleProfile(c.Request.Context(), tokens.AccessToken)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	if profile.Sub == "" || strings.TrimSpace(profile.Email) == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "google profile is missing required identifiers"})
		return
	}

	res, token, err := h.svc.HandleOAuthLogin(
		c.Request.Context(),
		"google",
		OAuthCallbackRequest{
			ProviderUserID: profile.Sub,
			Email:          profile.Email,
			Name:           profile.Name,
			AvatarURL:      profile.Picture,
		},
		c.GetHeader("User-Agent"),
		coreutils.NormalizeClientIP(c.ClientIP()),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	setSessionCookie(c, h.sessionCookieCfg, token, res.Session.ExpiresAt)
	c.JSON(http.StatusOK, res)
}

// Me returns the current authenticated user and session.
// @Summary Get current user
// @Description Returns the profile of the currently logged-in user and their session details.
// @Tags auth
// @Security ApiKeyAuth
// @Success 200 {object} LoginResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/me [get]
func (h *Handler) Me(c *gin.Context) {
	user, ok := CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	session, ok := CurrentSession(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": mapUserResponse(user),
		"session": SessionResponse{
			ID:        session.ID,
			UserID:    session.UserID,
			UserAgent: session.UserAgent,
			IPAddress: session.IPAddress,
			ExpiresAt: session.ExpiresAt,
			CreatedAt: session.CreatedAt,
			UpdatedAt: session.UpdatedAt,
		},
	})
}

// Logout terminates the current session.
// @Summary Logout
// @Description Invalidates the current session token and clears the session cookie.
// @Tags auth
// @Security ApiKeyAuth
// @Success 200 {object} MessageResponse "Logged out"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/logout [post]
func (h *Handler) Logout(c *gin.Context) {
	token, ok := CurrentToken(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.svc.LogoutByToken(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	clearCookie(c, h.sessionCookieCfg)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// ListSessions returns all active sessions for the current user.
// @Summary List active sessions
// @Description Returns a list of all active sessions for the authenticated user.
// @Tags auth
// @Security ApiKeyAuth
// @Success 200 {object} SessionListResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/sessions [get]
func (h *Handler) ListSessions(c *gin.Context) {
	user, ok := CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessions, err := h.svc.GetSessions(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SessionListResponse{Sessions: sessions})
}

// RevokeSession terminates a specific session by ID.
// @Summary Revoke session
// @Description Terminates a specific session by its ID. Users can only revoke their own sessions.
// @Tags auth
// @Security ApiKeyAuth
// @Param id path string true "Session ID"
// @Success 200 {object} MessageResponse "Session revoked"
// @Failure 400 {object} ErrorResponse "Invalid ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Session not found"
// @Router /auth/sessions/{id} [delete]
func (h *Handler) RevokeSession(c *gin.Context) {
	user, ok := CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	sessionID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	currentSession, _ := CurrentSession(c)

	if err := h.svc.LogoutSession(c.Request.Context(), sessionID, user.ID); err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If the user revoked their current session, clear their cookie
	if currentSession != nil && currentSession.ID == sessionID {
		clearCookie(c, h.sessionCookieCfg)
	}

	c.JSON(http.StatusOK, gin.H{"message": "session revoked"})
}

// RevokeAllSessions terminates all active sessions for the current user.
// @Summary Revoke all sessions
// @Description Terminates all active sessions for the authenticated user and clears the current session cookie.
// @Tags auth
// @Security ApiKeyAuth
// @Success 200 {object} MessageResponse "All sessions revoked"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/sessions [delete]
func (h *Handler) RevokeAllSessions(c *gin.Context) {
	user, ok := CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.svc.LogoutAllSessions(c.Request.Context(), user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	clearCookie(c, h.sessionCookieCfg)
	c.JSON(http.StatusOK, gin.H{"message": "all sessions revoked"})
}

func (h *Handler) googleConfigured() bool {
	return strings.TrimSpace(h.googleCfg.ClientID) != "" &&
		strings.TrimSpace(h.googleCfg.ClientSecret) != "" &&
		strings.TrimSpace(h.googleCfg.RedirectURL) != ""
}

func (h *Handler) buildGoogleAuthURL(state string) string {
	v := url.Values{}
	v.Set("client_id", h.googleCfg.ClientID)
	v.Set("redirect_uri", h.googleCfg.RedirectURL)
	v.Set("response_type", "code")
	v.Set("scope", strings.Join(h.googleCfg.Scopes, " "))
	v.Set("state", state)
	v.Set("access_type", "offline")
	v.Set("include_granted_scopes", "true")
	v.Set("prompt", "consent")

	return googleAuthURL + "?" + v.Encode()
}

type googleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	IDToken      string `json:"id_token"`
}

type googleUserInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func (h *Handler) exchangeGoogleCode(ctx context.Context, code string) (*googleTokenResponse, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", h.googleCfg.ClientID)
	form.Set("client_secret", h.googleCfg.ClientSecret)
	form.Set("redirect_uri", h.googleCfg.RedirectURL)
	form.Set("grant_type", "authorization_code")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, googleTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google token exchange failed with status %d", resp.StatusCode)
	}

	var out googleTokenResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	if strings.TrimSpace(out.AccessToken) == "" {
		return nil, fmt.Errorf("google token response missing access_token")
	}

	return &out, nil
}

func (h *Handler) getGoogleProfile(ctx context.Context, accessToken string) (*googleUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, googleUserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google userinfo failed with status %d", resp.StatusCode)
	}

	var out googleUserInfo
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}

	return &out, nil
}
