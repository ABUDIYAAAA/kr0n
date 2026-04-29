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
	"strconv"
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

	githubAuthURL       = "https://github.com/login/oauth/authorize"
	githubTokenURL      = "https://github.com/login/oauth/access_token"
	githubUserInfoURL   = "https://api.github.com/user"
	githubUserEmailsURL = "https://api.github.com/user/emails"
	defaultGitHubScopes = "repo read:org read:user user:email admin:repo_hook"

	oauthStateLogin   = "login"
	oauthStateConnect = "connect"
	oauthStateTTL     = 5 * time.Minute
)

type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

type GitHubOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

type Handler struct {
	svc                  *Service
	sessionCookieCfg     CookieConfig
	googleStateCookieCfg CookieConfig
	githubStateCookieCfg CookieConfig
	googleCfg            GoogleOAuthConfig
	githubCfg            GitHubOAuthConfig
	httpClient           *http.Client
}

func NewHandler(svc *Service, sessionCookieCfg CookieConfig, googleCfg GoogleOAuthConfig, githubCfg GitHubOAuthConfig) *Handler {
	if sessionCookieCfg.Path == "" {
		sessionCookieCfg.Path = "/"
	}

	if sessionCookieCfg.Name == "" {
		sessionCookieCfg.Name = "forms_session"
	}

	if len(googleCfg.Scopes) == 0 {
		googleCfg.Scopes = strings.Fields(defaultGoogleScopes)
	}
	if len(githubCfg.Scopes) == 0 {
		githubCfg.Scopes = strings.Fields(defaultGitHubScopes)
	}

	googleStateCookieCfg := CookieConfig{
		Name:     "google_oauth_state",
		Domain:   sessionCookieCfg.Domain,
		Path:     "/auth/google/callback",
		Secure:   sessionCookieCfg.Secure,
		HTTPOnly: true,
		SameSite: sessionCookieCfg.SameSite,
	}

	githubStateCookieCfg := CookieConfig{
		Name:     "github_oauth_state",
		Domain:   sessionCookieCfg.Domain,
		Path:     "/auth/github/callback",
		Secure:   sessionCookieCfg.Secure,
		HTTPOnly: true,
		SameSite: sessionCookieCfg.SameSite,
	}

	return &Handler{
		svc:                  svc,
		sessionCookieCfg:     sessionCookieCfg,
		googleStateCookieCfg: googleStateCookieCfg,
		githubStateCookieCfg: githubStateCookieCfg,
		googleCfg:            googleCfg,
		githubCfg:            githubCfg,
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

	state, err := buildOAuthState(oauthStateLogin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize oauth state"})
		return
	}

	setStateCookie(c, h.googleStateCookieCfg, state, oauthStateTTL)
	c.Redirect(http.StatusTemporaryRedirect, h.buildGoogleAuthURL(state))
}

// GoogleConnect initiates the Google OAuth flow to link a provider to the current user.
// @Summary Connect Google account
// @Description Redirects the user to Google's OAuth consent screen to connect a provider.
// @Tags auth
// @Security ApiKeyAuth
// @Success 307
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/google/connect [get]
func (h *Handler) GoogleConnect(c *gin.Context) {
	if !h.googleConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "google oauth is not configured"})
		return
	}

	if _, ok := CurrentUser(c); !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	state, err := buildOAuthState(oauthStateConnect)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize oauth state"})
		return
	}

	setStateCookie(c, h.googleStateCookieCfg, state, oauthStateTTL)
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

	stateFromCookie, err := c.Cookie(h.googleStateCookieCfg.Name)
	clearCookie(c, h.googleStateCookieCfg)
	if err != nil || subtle.ConstantTimeCompare([]byte(state), []byte(stateFromCookie)) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}

	mode, ok := parseOAuthState(state)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}
	if mode != oauthStateLogin && mode != oauthStateConnect {
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

	tokenExpiry := (*time.Time)(nil)
	if tokens.ExpiresIn > 0 {
		expiry := time.Now().UTC().Add(time.Duration(tokens.ExpiresIn) * time.Second)
		tokenExpiry = &expiry
	}

	oauthTokens := OAuthTokens{
		AccessToken:  tokens.AccessToken,
		RefreshToken: coreutils.NullableString(tokens.RefreshToken),
		IDToken:      coreutils.NullableString(tokens.IDToken),
		TokenType:    tokens.TokenType,
		Scope:        coreutils.NullableString(tokens.Scope),
		TokenExpiry:  tokenExpiry,
	}
	if oauthTokens.TokenType == "" {
		oauthTokens.TokenType = "Bearer"
	}

	profileReq := OAuthCallbackRequest{
		ProviderUserID: profile.Sub,
		Email:          profile.Email,
		EmailVerified:  profile.EmailVerified,
		Name:           profile.Name,
		AvatarURL:      profile.Picture,
	}

	if mode == oauthStateConnect {
		user, _, ok := h.authenticateFromCookie(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		if err := h.svc.HandleOAuthConnect(c.Request.Context(), user.ID, "google", profileReq, oauthTokens); err != nil {
			switch {
			case errors.Is(err, ErrConflict), errors.Is(err, ErrProviderAlreadyConnected):
				c.JSON(http.StatusConflict, gin.H{"error": "provider already linked"})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "provider connected"})
		return
	}

	res, token, err := h.svc.HandleOAuthLogin(
		c.Request.Context(),
		"google",
		profileReq,
		oauthTokens,
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

// Providers lists which auth providers are configured.
// @Summary List configured providers
// @Description Returns which auth providers are configured on the server.
// @Tags auth
// @Success 200 {object} ProvidersResponse
// @Router /auth/providers [get]
func (h *Handler) Providers(c *gin.Context) {
	providers := map[string]ProviderStatus{
		"google": {
			Configured: h.googleConfigured(),
			Scopes:     h.googleCfg.Scopes,
		},
		"github": {
			Configured: h.githubConfigured(),
			Scopes:     h.githubCfg.Scopes,
		},
		"password": {
			Configured: true,
		},
	}

	c.JSON(http.StatusOK, ProvidersResponse{Providers: providers})
}

// Signup creates a password-based account.
// @Summary Create account
// @Description Creates a user with email and password and triggers email verification.
// @Tags auth
// @Accept json
// @Param payload body SignupRequest true "Signup payload"
// @Success 201 {object} MessageResponse
// @Failure 400 {object} ErrorResponse "Invalid input"
// @Failure 409 {object} ErrorResponse "Email already in use"
// @Router /auth/signup [post]
func (h *Handler) Signup(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid signup payload"})
		return
	}

	if _, err := h.svc.SignupWithPassword(c.Request.Context(), req.Email, req.Password, req.Name); err != nil {
		switch {
		case errors.Is(err, ErrConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email or password"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "account created"})
}

// Login authenticates a user via email and password.
// @Summary Login with password
// @Description Logs in using email and password and sets the session cookie.
// @Tags auth
// @Accept json
// @Param payload body LoginRequest true "Login payload"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} ErrorResponse "Invalid credentials"
// @Failure 403 {object} ErrorResponse "Email not verified"
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid login payload"})
		return
	}

	res, token, err := h.svc.LoginWithPassword(c.Request.Context(), req.Email, req.Password, c.GetHeader("User-Agent"), coreutils.NormalizeClientIP(c.ClientIP()))
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		case errors.Is(err, ErrEmailNotVerified):
			c.JSON(http.StatusForbidden, gin.H{"error": "email not verified"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	setSessionCookie(c, h.sessionCookieCfg, token, res.Session.ExpiresAt)
	c.JSON(http.StatusOK, res)
}

// VerifyEmail validates an email verification token.
// @Summary Verify email
// @Description Marks the user email as verified using the provided token.
// @Tags auth
// @Accept json
// @Param payload body VerifyEmailRequest true "Verification payload"
// @Success 200 {object} MessageResponse
// @Failure 400 {object} ErrorResponse "Invalid token"
// @Router /auth/email/verify [post]
func (h *Handler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid verification payload"})
		return
	}

	if err := h.svc.VerifyEmail(c.Request.Context(), req.Token); err != nil {
		switch {
		case errors.Is(err, ErrInvalidVerificationToken):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "email verified"})
}

// RequestEmailVerification triggers a new email verification event.
// @Summary Resend verification email
// @Description Sends a verification email if the account exists and is unverified.
// @Tags auth
// @Accept json
// @Param payload body ResendVerificationRequest true "Resend payload"
// @Success 202 {object} MessageResponse
// @Router /auth/email/verification [post]
func (h *Handler) RequestEmailVerification(c *gin.Context) {
	var req ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}

	if err := h.svc.RequestEmailVerification(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "verification email sent"})
}

// GitHubLogin initiates the GitHub OAuth login flow.
// @Summary Initiate GitHub OAuth
// @Description Redirects the user to GitHub's OAuth consent screen.
// @Tags auth
// @Success 307
// @Router /auth/github [get]
func (h *Handler) GitHubLogin(c *gin.Context) {
	if !h.githubConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "github oauth is not configured"})
		return
	}

	state, err := buildOAuthState(oauthStateLogin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize oauth state"})
		return
	}

	setStateCookie(c, h.githubStateCookieCfg, state, oauthStateTTL)
	c.Redirect(http.StatusTemporaryRedirect, h.buildGitHubAuthURL(state))
}

// GitHubConnect initiates the GitHub OAuth flow to link a provider to the current user.
// @Summary Connect GitHub account
// @Description Redirects the user to GitHub's OAuth consent screen to connect a provider.
// @Tags auth
// @Security ApiKeyAuth
// @Success 307
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/github/connect [get]
func (h *Handler) GitHubConnect(c *gin.Context) {
	if !h.githubConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "github oauth is not configured"})
		return
	}

	if _, ok := CurrentUser(c); !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	state, err := buildOAuthState(oauthStateConnect)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize oauth state"})
		return
	}

	setStateCookie(c, h.githubStateCookieCfg, state, oauthStateTTL)
	c.Redirect(http.StatusTemporaryRedirect, h.buildGitHubAuthURL(state))
}

// GitHubCallback handles the GitHub OAuth callback.
// @Summary GitHub OAuth callback
// @Description Validates OAuth state and code, creates/logs in the user, and sets a session cookie.
// @Tags auth
// @Param code query string true "OAuth code"
// @Param state query string true "OAuth state"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse "Missing code or state"
// @Failure 401 {object} ErrorResponse "Invalid state"
// @Failure 500 {object} ErrorResponse "Internal error"
// @Router /auth/github/callback [get]
func (h *Handler) GitHubCallback(c *gin.Context) {
	if !h.githubConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "github oauth is not configured"})
		return
	}

	if errMsg := strings.TrimSpace(c.Query("error")); errMsg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "github oauth error: " + errMsg})
		return
	}

	code := strings.TrimSpace(c.Query("code"))
	state := strings.TrimSpace(c.Query("state"))
	if code == "" || state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing oauth code or state"})
		return
	}

	stateFromCookie, err := c.Cookie(h.githubStateCookieCfg.Name)
	clearCookie(c, h.githubStateCookieCfg)
	if err != nil || subtle.ConstantTimeCompare([]byte(state), []byte(stateFromCookie)) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}

	mode, ok := parseOAuthState(state)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}
	if mode != oauthStateLogin && mode != oauthStateConnect {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}

	tokens, err := h.exchangeGitHubCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	profile, email, verified, err := h.getGitHubProfile(c.Request.Context(), tokens.AccessToken)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	if profile.ID == 0 || strings.TrimSpace(email) == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "github profile is missing required identifiers"})
		return
	}

	name := strings.TrimSpace(profile.Name)
	if name == "" {
		name = profile.Login
	}

	oauthTokens := OAuthTokens{
		AccessToken: tokens.AccessToken,
		TokenType:   tokens.TokenType,
		Scope:       coreutils.NullableString(tokens.Scope),
	}
	if oauthTokens.TokenType == "" {
		oauthTokens.TokenType = "Bearer"
	}

	profileReq := OAuthCallbackRequest{
		ProviderUserID: strconv.FormatInt(profile.ID, 10),
		Email:          email,
		EmailVerified:  verified,
		Name:           name,
		AvatarURL:      profile.AvatarURL,
	}

	if mode == oauthStateConnect {
		user, _, ok := h.authenticateFromCookie(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		if err := h.svc.HandleOAuthConnect(c.Request.Context(), user.ID, "github", profileReq, oauthTokens); err != nil {
			switch {
			case errors.Is(err, ErrConflict), errors.Is(err, ErrProviderAlreadyConnected):
				c.JSON(http.StatusConflict, gin.H{"error": "provider already linked"})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "provider connected"})
		return
	}

	res, token, err := h.svc.HandleOAuthLogin(
		c.Request.Context(),
		"github",
		profileReq,
		oauthTokens,
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

func (h *Handler) githubConfigured() bool {
	return strings.TrimSpace(h.githubCfg.ClientID) != "" &&
		strings.TrimSpace(h.githubCfg.ClientSecret) != "" &&
		strings.TrimSpace(h.githubCfg.RedirectURL) != ""
}

func (h *Handler) buildGitHubAuthURL(state string) string {
	v := url.Values{}
	v.Set("client_id", h.githubCfg.ClientID)
	v.Set("redirect_uri", h.githubCfg.RedirectURL)
	v.Set("scope", strings.Join(h.githubCfg.Scopes, " "))
	v.Set("state", state)

	return githubAuthURL + "?" + v.Encode()
}

type githubTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
}

type githubUserInfo struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

type githubEmail struct {
	Email    string `json:"email"`
	Primary  bool   `json:"primary"`
	Verified bool   `json:"verified"`
}

func (h *Handler) exchangeGitHubCode(ctx context.Context, code string) (*githubTokenResponse, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", h.githubCfg.ClientID)
	form.Set("client_secret", h.githubCfg.ClientSecret)
	form.Set("redirect_uri", h.githubCfg.RedirectURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, githubTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

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
		return nil, fmt.Errorf("github token exchange failed with status %d", resp.StatusCode)
	}

	var out githubTokenResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	if strings.TrimSpace(out.AccessToken) == "" {
		return nil, fmt.Errorf("github token response missing access_token")
	}

	return &out, nil
}

func (h *Handler) getGitHubProfile(ctx context.Context, accessToken string) (*githubUserInfo, string, bool, error) {
	user, err := h.getGitHubUser(ctx, accessToken)
	if err != nil {
		return nil, "", false, err
	}

	emails, err := h.getGitHubEmails(ctx, accessToken)
	if err != nil {
		return nil, "", false, err
	}

	email, verified := selectGitHubEmail(emails)
	if email == "" {
		email = strings.TrimSpace(user.Email)
		verified = email != ""
	}

	return user, email, verified, nil
}

func (h *Handler) getGitHubUser(ctx context.Context, accessToken string) (*githubUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "kr0n-auth")

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
		return nil, fmt.Errorf("github user request failed with status %d", resp.StatusCode)
	}

	var out githubUserInfo
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}

	return &out, nil
}

func (h *Handler) getGitHubEmails(ctx context.Context, accessToken string) ([]githubEmail, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUserEmailsURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "kr0n-auth")

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
		return nil, fmt.Errorf("github email request failed with status %d", resp.StatusCode)
	}

	var out []githubEmail
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}

	return out, nil
}

func selectGitHubEmail(emails []githubEmail) (string, bool) {
	for _, email := range emails {
		if email.Primary && email.Verified {
			return email.Email, true
		}
	}

	for _, email := range emails {
		if email.Verified {
			return email.Email, true
		}
	}

	for _, email := range emails {
		if email.Primary {
			return email.Email, email.Verified
		}
	}

	if len(emails) > 0 {
		return emails[0].Email, emails[0].Verified
	}

	return "", false
}

func buildOAuthState(mode string) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}
	return mode + ":" + token, nil
}

func parseOAuthState(state string) (string, bool) {
	parts := strings.SplitN(state, ":", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", false
	}
	return parts[0], true
}

func (h *Handler) authenticateFromCookie(c *gin.Context) (*User, *Session, bool) {
	rawToken, err := c.Cookie(h.sessionCookieCfg.Name)
	if err != nil || strings.TrimSpace(rawToken) == "" {
		return nil, nil, false
	}

	user, session, err := h.svc.AuthenticateToken(c.Request.Context(), rawToken)
	if err != nil {
		clearCookie(c, h.sessionCookieCfg)
		return nil, nil, false
	}

	return user, session, true
}
