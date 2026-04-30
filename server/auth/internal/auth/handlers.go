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
	"os"
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

type GitHubAppConfig struct {
	AppID          string
	AppName        string
	ClientID       string
	ClientSecret   string
	RedirectURL    string
	PrivateKeyPath string
	Scopes         []string
}


type Handler struct {
	svc                  *Service
	sessionCookieCfg     CookieConfig
	googleStateCookieCfg CookieConfig
	githubStateCookieCfg CookieConfig
	googleCfg            GoogleOAuthConfig
	githubAppCfg         GitHubAppConfig
	webhookSecret        string
	httpClient           *http.Client
}


func NewHandler(svc *Service, sessionCookieCfg CookieConfig, googleCfg GoogleOAuthConfig, githubAppCfg GitHubAppConfig, webhookSecret string) *Handler {

	if len(googleCfg.Scopes) == 0 {
		googleCfg.Scopes = strings.Fields(defaultGoogleScopes)
	}
	if len(githubAppCfg.Scopes) == 0 {
		githubAppCfg.Scopes = strings.Fields(defaultGitHubScopes)
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
		Path:     "/auth/github",
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
		githubAppCfg:         githubAppCfg,
		webhookSecret:        webhookSecret,
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
func (h *Handler) GoogleStart(c *gin.Context) {
	if !h.googleConfigured() {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "google oauth is not configured"})
		return
	}

	mode := oauthStateLogin
	if _, ok := CurrentUser(c); ok {
		mode = oauthStateConnect
	}

	state, err := buildOAuthState(mode)
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
	connected := map[string]bool{}
	if user, ok := CurrentUser(c); ok {
		var err error
		connected, err = h.svc.GetConnectedProviders(c.Request.Context(), user.ID)
		if err != nil {
			h.svc.repo.db.QueryRow(c.Request.Context(), "SELECT 1") // dummy to avoid unused error if needed, but we should handle it
			// if err != nil, we just continue with empty connected map or log it
		}
	}

	providers := map[string]ProviderStatus{
		"google": {
			Connected: connected["google"],
			Scopes:    h.googleCfg.Scopes,
		},
		"github": {
			Connected: connected["github"],
			Scopes:    h.githubAppCfg.Scopes,
		},
		"password": {
			Connected: connected["password"],
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
		case errors.Is(err, ErrInvalidEmail):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
		case errors.Is(err, ErrPasswordTooShort):
			c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 10 characters"})
		case errors.Is(err, ErrPasswordTooLong):
			c.JSON(http.StatusBadRequest, gin.H{"error": "password must not exceed 128 characters"})
		case errors.Is(err, ErrPasswordNeedsLettersAndNumbers):
			c.JSON(http.StatusBadRequest, gin.H{"error": "password must contain both letters and numbers"})
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
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

// Refresh rotates the session token and extends its expiration.
// @Summary Refresh session
// @Description Rotates the current session token and extends its expiration time.
// @Tags auth
// @Security ApiKeyAuth
// @Success 200 {object} LoginResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/refresh [post]
func (h *Handler) Refresh(c *gin.Context) {
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

	refreshed, token, err := h.svc.RefreshSession(c.Request.Context(), session.ID, user.ID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			clearCookie(c, h.sessionCookieCfg)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	setSessionCookie(c, h.sessionCookieCfg, token, refreshed.ExpiresAt)
	c.JSON(http.StatusOK, LoginResponse{
		User:    mapUserResponse(user),
		Session: mapSessionResponse(refreshed),
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

// GitHubInstall initiates the GitHub App installation flow.
// @Summary Initiate GitHub App installation
// @Description Returns the GitHub App installation URL for the user to authorize.
// @Tags github-app
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/github/install [get]
func (h *Handler) GitHubInstall(c *gin.Context) {
	if _, ok := CurrentUser(c); !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if h.githubAppCfg.AppName == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "github app name is not configured"})
		return
	}

	state, err := buildOAuthState(oauthStateConnect)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize installation state"})
		return
	}

	setStateCookie(c, h.githubStateCookieCfg, state, oauthStateTTL)
	installURL := coreutils.FormatGitHubAppInstallURL(h.githubAppCfg.AppName, state)
	c.Redirect(http.StatusTemporaryRedirect, installURL)
}


// GitHubAppCallback handles the GitHub App installation callback.
// @Summary GitHub App installation callback
// @Description Saves the GitHub App installation metadata after user authorizes.
// @Tags github-app
// @Security ApiKeyAuth
// @Param installation_id query string true "GitHub installation ID"
// @Param repository_name query string false "Repository name"
// @Param branch query string false "Branch name"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse "Missing installation_id"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/github/app/callback [get]
func (h *Handler) GitHubAppCallback(c *gin.Context) {
	state := strings.TrimSpace(c.Query("state"))
	stateFromCookie, err := c.Cookie(h.githubStateCookieCfg.Name)
	clearCookie(c, h.githubStateCookieCfg)
	if err != nil || state == "" || subtle.ConstantTimeCompare([]byte(state), []byte(stateFromCookie)) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid installation state"})
		return
	}

	user, ok := CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Handle OAuth code if present (combined flow)
	code := strings.TrimSpace(c.Query("code"))
	if code != "" {
		_ = h.svc.LinkGitHubAccountFromCode(c.Request.Context(), user.ID, code)
	}


	installationIDStr := strings.TrimSpace(c.Query("installation_id"))

	if installationIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing installation_id"})
		return
	}

	installationID, err := strconv.ParseInt(installationIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid installation_id format"})
		return
	}

	repositoryName := strings.TrimSpace(c.Query("repository_name"))
	if repositoryName == "" {
		repositoryName = "account"
	}

	branch := strings.TrimSpace(c.Query("branch"))
	if branch == "" {
		branch = "main"
	}

	appID, err := strconv.ParseInt(h.githubAppCfg.AppID, 10, 64)
	if err != nil {
		appID = 0 // App ID as string fallback
	}

	install, err := h.svc.SaveGitHubInstallation(c.Request.Context(), user.ID, appID, installationID, repositoryName, branch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}


	c.JSON(http.StatusOK, gin.H{
		"message":         "github app installed",
		"installation_id": install.InstallationID,
		"repository_name": install.RepositoryName,
		"branch":          install.Branch,
	})
}

// GitHubInstallations returns all GitHub App installations for the current user.
// @Summary List GitHub App installations
// @Description Returns all GitHub App installations linked to the current user.
// @Tags github-app
// @Security ApiKeyAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /auth/github/installations [get]
func (h *Handler) GitHubInstallations(c *gin.Context) {
	user, ok := CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	installations, err := h.svc.GetGitHubInstallationsByUserID(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"installations": installations,
	})
}

// WebhookGitHub receives GitHub webhook events.
// @Summary GitHub webhook receiver
// @Description Receives and processes GitHub webhook events (push, installation).
// @Tags webhooks
// @Accept json
// @Param X-Hub-Signature-256 header string true "HMAC signature"
// @Param X-GitHub-Event header string true "Event type"
// @Success 200 {object} MessageResponse
// @Failure 400 {object} ErrorResponse "Invalid signature or event"
// @Router /webhooks/github [post]
func (h *Handler) WebhookGitHub(c *gin.Context) {
	signature := c.GetHeader("X-Hub-Signature-256")
	if signature == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing signature"})
		return
	}

	eventType := c.GetHeader("X-GitHub-Event")
	if eventType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing event type"})
		return
	}

	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	// Validate webhook signature
	if !coreutils.ValidateGitHubWebhookSignature(body, signature, h.webhookSecret) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	eventType = coreutils.ExtractGitHubEventType(eventType)

	switch eventType {
	case "push":
		h.handleGitHubPush(c, body)
	case "installation":
		h.handleGitHubInstallation(c, body)
	default:
		// Ignore other events silently, return 200
		c.JSON(http.StatusOK, gin.H{"message": "event received"})
	}
}

func (h *Handler) handleGitHubPush(c *gin.Context, payload []byte) {
	var event GitHubPushEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid push event payload"})
		return
	}

	// Parse branch from ref
	branch := coreutils.ParseGitHubRefToBranch(event.Ref)

	// Get installation metadata
	install, err := h.svc.GetGitHubInstallationByInstallationID(c.Request.Context(), event.Installation.ID)
	if err != nil {
		// Installation not found; silently return 200 (webhook sent before installation saved)
		c.JSON(http.StatusOK, gin.H{"message": "event received"})
		return
	}

	// Verify branch matches installation config
	if install.Branch != "" && install.Branch != branch {
		c.JSON(http.StatusOK, gin.H{"message": "event received (branch mismatch)"})
		return
	}

	// TODO: Queue deployment job or trigger pipeline
	// For now, just log and return 200
	c.JSON(http.StatusOK, gin.H{
		"message":         "push event processed",
		"installation_id": install.InstallationID,
		"repository":      event.Repository.FullName,
		"branch":          branch,
		"after":           event.After,
	})
}

func (h *Handler) handleGitHubInstallation(c *gin.Context, payload []byte) {
	type InstallationEvent struct {
		Action       string `json:"action"`
		Installation struct {
			ID int64 `json:"id"`
		} `json:"installation"`
	}

	var event InstallationEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid installation event payload"})
		return
	}

	// Handle uninstall action by removing installation record
	if event.Action == "deleted" {
		if err := h.svc.DeleteGitHubInstallationByInstallationID(c.Request.Context(), event.Installation.ID); err != nil {
			// If not found, treat as success; otherwise log error and return 500
			if errors.Is(err, ErrNotFound) {
				c.JSON(http.StatusOK, gin.H{"message": "installation deleted (not found)"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "installation deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "installation event received"})
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
	return strings.TrimSpace(h.githubAppCfg.ClientID) != "" &&
		strings.TrimSpace(h.githubAppCfg.ClientSecret) != "" &&
		strings.TrimSpace(h.githubAppCfg.RedirectURL) != ""
}

func (h *Handler) loadGitHubAppPrivateKey() ([]byte, error) {
	if h.githubAppCfg.PrivateKeyPath == "" {
		return nil, errors.New("github app private key path is not configured")
	}
	return os.ReadFile(h.githubAppCfg.PrivateKeyPath)
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
