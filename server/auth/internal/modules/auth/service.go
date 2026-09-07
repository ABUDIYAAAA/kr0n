package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/modules/auth/oauth"
	"auth.kron.com/pkg/crypto"
	"auth.kron.com/pkg/email"
	"auth.kron.com/pkg/jwt"
	"auth.kron.com/pkg/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	// Service-level errors
	ErrInvalidCredentials       = errors.New("invalid email/username or password")
	ErrUserAlreadyExists        = errors.New("user with this email or username already exists")
	ErrUsernameAlreadyTaken     = errors.New("username is already taken")
	ErrEmailAlreadyVerified     = errors.New("email is already verified")
	ErrInvalidSecurityToken     = errors.New("invalid or expired verification token")
	ErrSessionNotFoundOrRevoked = errors.New("session has been revoked or expired")
	ErrOAuthProviderNotFound    = errors.New("oauth provider is not configured")
)

// Service defines high-level authentication business logic.
type Service interface {
	Signup(ctx context.Context, req SignupRequest, deviceID, ip, userAgent string) (*AuthResponse, string, error)
	Login(ctx context.Context, req LoginRequest, deviceID, ip, userAgent string) (*AuthResponse, string, error)
	RefreshToken(ctx context.Context, refreshTokenStr, deviceID, ip, userAgent string) (*AuthResponse, string, error)
	GetMe(ctx context.Context, userID, sessionID string) (*UserResponse, *SessionResponse, error)
	UpdateUsername(ctx context.Context, userID, newUsername string) (*UserResponse, error)
	VerifyEmail(ctx context.Context, tokenStr string) error
	ResendVerificationEmail(ctx context.Context, req ResendVerificationRequest) error
	ForgotPassword(ctx context.Context, req ForgotPasswordRequest) error
	ResetPassword(ctx context.Context, req ResetPasswordRequest) error
	Logout(ctx context.Context, sessionID, userID, tokenJTI string) error
	ListUserSessions(ctx context.Context, userID, currentSessionID string, page, limit int) ([]SessionResponse, response.PaginationMeta, error)
	RevokeSession(ctx context.Context, sessionIDToRevoke, currentUserID string) error
	RevokeAllOtherSessions(ctx context.Context, currentUserID, currentSessionID string) error

	// OAuth
	GetOAuthAuthURL(ctx context.Context, providerName string) (*OAuthURLResponse, error)
	HandleOAuthCallback(ctx context.Context, providerName, code, state, deviceID, ip, userAgent string) (*AuthResponse, string, error)
}

// authService implements Service interface.
type authService struct {
	repo          Repository
	cfg           *config.Config
	emailService  email.EmailService
	oauthRegistry *oauth.Registry
}

// NewService creates a new authService instance.
func NewService(repo Repository, cfg *config.Config, emailService email.EmailService, oauthRegistry *oauth.Registry) Service {
	return &authService{
		repo:          repo,
		cfg:           cfg,
		emailService:  emailService,
		oauthRegistry: oauthRegistry,
	}
}

// ==========================================
// Standard Authentication Flows
// ==========================================

// Signup registers a new user, sends email verification token via Outbox pattern, and establishes a session.
func (s *authService) Signup(ctx context.Context, req SignupRequest, deviceID, ip, userAgent string) (*AuthResponse, string, error) {
	// 1. Sanitize input
	emailLower := strings.ToLower(strings.TrimSpace(req.Email))
	usernameClean := strings.ToLower(strings.TrimSpace(req.Username))

	// 2. Hash password with bcrypt
	passwordHash, err := crypto.HashPassword(req.Password)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash password: %w", err)
	}

	var user *User
	idempotencyKey := fmt.Sprintf("signup:%s:%d", emailLower, time.Now().UnixNano())

	// 3. Execute User creation, Token creation, and Outbox Event insertion inside a single SQL Transaction
	err = s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		var txErr error
		user, txErr = s.repo.CreateUserTx(ctx, tx, emailLower, usernameClean, &passwordHash)
		if txErr != nil {
			if errors.Is(txErr, ErrConflict) {
				return ErrUserAlreadyExists
			}
			return txErr
		}

		rawToken, txErr := crypto.GenerateRandomToken(32)
		if txErr != nil {
			return fmt.Errorf("failed to generate verification token: %w", txErr)
		}

		tokenHash := crypto.HashTokenSHA256(rawToken)
		securityToken := &SecurityToken{
			UserID:    user.ID,
			TokenHash: tokenHash,
			Type:      TokenTypeEmailVerification,
			ExpiresAt: time.Now().UTC().Add(EmailVerificationTokenTTL),
		}

		if txErr := s.repo.CreateSecurityTokenTx(ctx, tx, securityToken); txErr != nil {
			return fmt.Errorf("failed to create security token: %w", txErr)
		}

		// Prepare Transactional Outbox Event
		verificationURL := fmt.Sprintf("%s/authentication/emailverified", s.cfg.FrontendURL)
		eventPayload := map[string]any{
			"event_id":           uuid.NewString(),
			"event_type":         "EMAIL_VERIFICATION",
			"to_email":           user.Email,
			"username":           user.Username,
			"template_id":        "email_verification",
			"idempotency_key":    idempotencyKey,
			"timestamp":          time.Now().UTC(),
			"verification_token": rawToken,
			"verification_url":   verificationURL,
			"metadata": map[string]string{
				"source": "user_signup",
			},
		}

		payloadBytes, txErr := json.Marshal(eventPayload)
		if txErr != nil {
			return fmt.Errorf("failed to marshal outbox event payload: %w", txErr)
		}

		outboxEvent := &OutboxEvent{
			EventType:      "EMAIL_VERIFICATION",
			Payload:        payloadBytes,
			IdempotencyKey: idempotencyKey,
			Status:         "PENDING",
		}

		if txErr := s.repo.InsertOutboxEventTx(ctx, tx, outboxEvent); txErr != nil {
			return fmt.Errorf("failed to insert outbox event: %w", txErr)
		}

		return nil
	})

	if err != nil {
		return nil, "", err
	}

	// 4. Create active session and issue tokens
	authResp, refreshToken, err := s.createSessionAndTokens(ctx, user, deviceID, ip, userAgent)
	if err != nil {
		return nil, "", err
	}

	return authResp, refreshToken, nil
}

// Login authenticates a user via email or username and creates an active session.
func (s *authService) Login(ctx context.Context, req LoginRequest, deviceID, ip, userAgent string) (*AuthResponse, string, error) {
	loginClean := strings.ToLower(strings.TrimSpace(req.Login))

	user, err := s.repo.GetUserByEmailOrUsername(ctx, loginClean)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}

	if user.PasswordHash == nil || !crypto.ComparePassword(*user.PasswordHash, req.Password) {
		return nil, "", ErrInvalidCredentials
	}

	return s.createSessionAndTokens(ctx, user, deviceID, ip, userAgent)
}

// RefreshToken validates an existing refresh token, checks revocation, and issues new tokens.
func (s *authService) RefreshToken(ctx context.Context, refreshTokenStr, deviceID, ip, userAgent string) (*AuthResponse, string, error) {
	if refreshTokenStr == "" {
		return nil, "", errors.New("refresh token is required")
	}

	// 1. Parse and validate JWT refresh token
	claims, err := jwt.ParseAndValidateToken(refreshTokenStr, s.cfg.JWTRefreshSecret)
	if err != nil {
		return nil, "", errors.New("invalid or expired refresh token")
	}

	if claims.TokenType != TokenTypeRefresh {
		return nil, "", errors.New("token provided is not a refresh token")
	}

	// 2. Check instant session revocation in Redis
	isBlacklisted, err := s.repo.IsSessionBlacklisted(ctx, claims.SessionID)
	if err == nil && isBlacklisted {
		return nil, "", ErrSessionNotFoundOrRevoked
	}

	// 3. Verify session in PostgreSQL
	session, err := s.repo.GetSessionByID(ctx, claims.SessionID)
	if err != nil || session.IsRevoked || session.ExpiresAt.Before(time.Now()) {
		return nil, "", ErrSessionNotFoundOrRevoked
	}

	// 4. Fetch user details
	user, err := s.repo.GetUserByID(ctx, claims.UserID)
	if err != nil {
		return nil, "", ErrNotFound
	}

	// 5. Update session activity
	_ = s.repo.UpdateSessionActivity(ctx, session.ID, ip, userAgent)

	// 6. Generate fresh access token
	accessToken, _, err := jwt.GenerateAccessToken(
		user.ID,
		session.ID,
		deviceID,
		user.Email,
		user.Username,
		s.cfg.JWTAccessSecret,
		s.cfg.JWTAccessTTL,
	)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate access token: %w", err)
	}

	authResp := &AuthResponse{
		User: UserResponse{
			ID:              user.ID,
			Email:           user.Email,
			Username:        user.Username,
			EmailVerifiedAt: user.EmailVerifiedAt,
			CreatedAt:       user.CreatedAt,
			UpdatedAt:       user.UpdatedAt,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshTokenStr,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
	}

	return authResp, refreshTokenStr, nil
}

// GetMe returns the authenticated user profile and active session details.
func (s *authService) GetMe(ctx context.Context, userID, sessionID string) (*UserResponse, *SessionResponse, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	userResp := &UserResponse{
		ID:              user.ID,
		Email:           user.Email,
		Username:        user.Username,
		EmailVerifiedAt: user.EmailVerifiedAt,
		CreatedAt:       user.CreatedAt,
		UpdatedAt:       user.UpdatedAt,
	}

	var sessionResp *SessionResponse
	if sessionID != "" {
		session, err := s.repo.GetSessionByID(ctx, sessionID)
		if err == nil {
			sessionResp = &SessionResponse{
				ID:           session.ID,
				DeviceID:     session.DeviceID,
				IPAddress:    session.IPAddress,
				UserAgent:    session.UserAgent,
				IsCurrent:    true,
				LastActiveAt: session.LastActiveAt,
				CreatedAt:    session.CreatedAt,
				ExpiresAt:    session.ExpiresAt,
			}
		}
	}

	return userResp, sessionResp, nil
}

// UpdateUsername updates the authenticated user's unique username handle.
func (s *authService) UpdateUsername(ctx context.Context, userID, newUsername string) (*UserResponse, error) {
	usernameClean := strings.ToLower(strings.TrimSpace(newUsername))

	err := s.repo.UpdateUsername(ctx, userID, usernameClean)
	if err != nil {
		if errors.Is(err, ErrConflict) {
			return nil, ErrUsernameAlreadyTaken
		}
		return nil, err
	}

	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &UserResponse{
		ID:              user.ID,
		Email:           user.Email,
		Username:        user.Username,
		EmailVerifiedAt: user.EmailVerifiedAt,
		CreatedAt:       user.CreatedAt,
		UpdatedAt:       user.UpdatedAt,
	}, nil
}

// ==========================================
// Email Verification
// ==========================================

// VerifyEmail verifies an email address using a hashed verification token.
func (s *authService) VerifyEmail(ctx context.Context, tokenStr string) error {
	tokenHash := crypto.HashTokenSHA256(strings.TrimSpace(tokenStr))

	token, err := s.repo.GetValidSecurityToken(ctx, tokenHash, TokenTypeEmailVerification)
	if err != nil {
		return ErrInvalidSecurityToken
	}

	if err := s.repo.VerifyUserEmail(ctx, token.UserID); err != nil {
		return err
	}

	_ = s.repo.MarkSecurityTokenUsed(ctx, token.ID)
	return nil
}

// ResendVerificationEmail generates and dispatches a new verification token.
func (s *authService) ResendVerificationEmail(ctx context.Context, req ResendVerificationRequest) error {
	emailLower := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.repo.GetUserByEmail(ctx, emailLower)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			// Do not leak user existence
			return nil
		}
		return err
	}

	if user.EmailVerifiedAt != nil {
		return ErrEmailAlreadyVerified
	}

	idempotencyKey := fmt.Sprintf("resend_verify:%s:%d", user.ID, time.Now().UnixNano())

	return s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		rawToken, txErr := crypto.GenerateRandomToken(32)
		if txErr != nil {
			return fmt.Errorf("failed to generate verification token: %w", txErr)
		}

		tokenHash := crypto.HashTokenSHA256(rawToken)
		securityToken := &SecurityToken{
			UserID:    user.ID,
			TokenHash: tokenHash,
			Type:      TokenTypeEmailVerification,
			ExpiresAt: time.Now().UTC().Add(EmailVerificationTokenTTL),
		}

		if txErr := s.repo.CreateSecurityTokenTx(ctx, tx, securityToken); txErr != nil {
			return fmt.Errorf("failed to create security token: %w", txErr)
		}

		verificationURL := fmt.Sprintf("%s/authentication/emailverified", s.cfg.FrontendURL)
		eventPayload := map[string]any{
			"event_id":           uuid.NewString(),
			"event_type":         "EMAIL_VERIFICATION",
			"to_email":           user.Email,
			"username":           user.Username,
			"template_id":        "email_verification",
			"idempotency_key":    idempotencyKey,
			"timestamp":          time.Now().UTC(),
			"verification_token": rawToken,
			"verification_url":   verificationURL,
			"metadata": map[string]string{
				"source": "resend_verification",
			},
		}

		payloadBytes, txErr := json.Marshal(eventPayload)
		if txErr != nil {
			return fmt.Errorf("failed to marshal outbox event payload: %w", txErr)
		}

		outboxEvent := &OutboxEvent{
			EventType:      "EMAIL_VERIFICATION",
			Payload:        payloadBytes,
			IdempotencyKey: idempotencyKey,
			Status:         "PENDING",
		}

		return s.repo.InsertOutboxEventTx(ctx, tx, outboxEvent)
	})
}

// ForgotPassword generates password reset security token and queues outbox email event.
func (s *authService) ForgotPassword(ctx context.Context, req ForgotPasswordRequest) error {
	emailLower := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.repo.GetUserByEmail(ctx, emailLower)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			// Do not leak user account existence
			return nil
		}
		return err
	}

	idempotencyKey := fmt.Sprintf("pwd_reset:%s:%d", user.ID, time.Now().UnixNano())

	return s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		rawToken, txErr := crypto.GenerateRandomToken(32)
		if txErr != nil {
			return fmt.Errorf("failed to generate password reset token: %w", txErr)
		}

		tokenHash := crypto.HashTokenSHA256(rawToken)
		securityToken := &SecurityToken{
			UserID:    user.ID,
			TokenHash: tokenHash,
			Type:      TokenTypePasswordReset,
			ExpiresAt: time.Now().UTC().Add(PasswordResetTokenTTL),
		}

		if txErr := s.repo.CreateSecurityTokenTx(ctx, tx, securityToken); txErr != nil {
			return fmt.Errorf("failed to create password reset security token: %w", txErr)
		}

		resetURL := fmt.Sprintf("%s/authentication/resetpassword", s.cfg.FrontendURL)
		eventPayload := map[string]any{
			"event_id":        uuid.NewString(),
			"event_type":      "PASSWORD_RESET",
			"to_email":        user.Email,
			"username":        user.Username,
			"template_id":     "password_reset",
			"idempotency_key": idempotencyKey,
			"timestamp":       time.Now().UTC(),
			"reset_token":     rawToken,
			"reset_url":       resetURL,
			"metadata": map[string]string{
				"source": "forgot_password",
			},
		}

		payloadBytes, txErr := json.Marshal(eventPayload)
		if txErr != nil {
			return fmt.Errorf("failed to marshal outbox payload: %w", txErr)
		}

		outboxEvent := &OutboxEvent{
			EventType:      "PASSWORD_RESET",
			Payload:        payloadBytes,
			IdempotencyKey: idempotencyKey,
			Status:         "PENDING",
		}

		return s.repo.InsertOutboxEventTx(ctx, tx, outboxEvent)
	})
}

// ResetPassword validates reset token, hashes new password, updates user, and revokes all active sessions.
func (s *authService) ResetPassword(ctx context.Context, req ResetPasswordRequest) error {
	tokenHash := crypto.HashTokenSHA256(strings.TrimSpace(req.Token))

	token, err := s.repo.GetValidSecurityToken(ctx, tokenHash, TokenTypePasswordReset)
	if err != nil {
		return ErrInvalidSecurityToken
	}

	newHash, err := crypto.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	err = s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		if txErr := s.repo.UpdatePasswordTx(ctx, tx, token.UserID, newHash); txErr != nil {
			return txErr
		}

		return s.repo.MarkSecurityTokenUsedTx(ctx, tx, token.ID)
	})
	if err != nil {
		return err
	}

	// Revoke all active user sessions & blacklist in Redis
	_ = s.repo.RevokeAllUserSessions(ctx, token.UserID, "")
	_ = s.repo.BlacklistUserRevocation(ctx, token.UserID, time.Now().UTC(), s.cfg.JWTAccessTTL)

	return nil
}

// ==========================================
// Session Management & Instant Revocation
// ==========================================

// Logout revokes the current session in DB and blacklists the token/session in Redis.
func (s *authService) Logout(ctx context.Context, sessionID, userID, tokenJTI string) error {
	if sessionID != "" {
		_ = s.repo.RevokeSession(ctx, sessionID, userID)
		// Blacklist session in Redis for the access token TTL duration
		_ = s.repo.BlacklistSession(ctx, sessionID, s.cfg.JWTAccessTTL)
	}

	if tokenJTI != "" {
		// Blacklist the specific access token JTI in Redis
		_ = s.repo.BlacklistToken(ctx, tokenJTI, s.cfg.JWTAccessTTL)
	}

	return nil
}

// ListUserSessions returns active sessions for the user with pagination metadata.
func (s *authService) ListUserSessions(ctx context.Context, userID, currentSessionID string, page, limit int) ([]SessionResponse, response.PaginationMeta, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	sessions, totalCount, err := s.repo.GetUserActiveSessions(ctx, userID, page, limit)
	if err != nil {
		return nil, response.PaginationMeta{}, err
	}

	result := make([]SessionResponse, 0, len(sessions))
	for _, sess := range sessions {
		result = append(result, SessionResponse{
			ID:           sess.ID,
			DeviceID:     sess.DeviceID,
			IPAddress:    sess.IPAddress,
			UserAgent:    sess.UserAgent,
			IsCurrent:    sess.ID == currentSessionID,
			LastActiveAt: sess.LastActiveAt,
			CreatedAt:    sess.CreatedAt,
			ExpiresAt:    sess.ExpiresAt,
		})
	}

	totalPages := 0
	if limit > 0 {
		totalPages = int((totalCount + int64(limit) - 1) / int64(limit))
	}
	meta := response.PaginationMeta{
		Page:       page,
		Limit:      limit,
		TotalCount: totalCount,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
	}

	return result, meta, nil
}

// RevokeSession revokes a specific session belonging to the user.
func (s *authService) RevokeSession(ctx context.Context, sessionIDToRevoke, currentUserID string) error {
	err := s.repo.RevokeSession(ctx, sessionIDToRevoke, currentUserID)
	if err != nil {
		return err
	}

	// Instantly blacklist session ID in Redis
	_ = s.repo.BlacklistSession(ctx, sessionIDToRevoke, s.cfg.JWTAccessTTL)
	return nil
}

// RevokeAllOtherSessions revokes all sessions for the user except the current one.
func (s *authService) RevokeAllOtherSessions(ctx context.Context, currentUserID, currentSessionID string) error {
	err := s.repo.RevokeAllUserSessions(ctx, currentUserID, currentSessionID)
	if err != nil {
		return err
	}

	// Blacklist user revocation timestamp in Redis
	_ = s.repo.BlacklistUserRevocation(ctx, currentUserID, time.Now().UTC(), s.cfg.JWTAccessTTL)
	return nil
}

// ==========================================
// OAuth 2.0 Management
// ==========================================

// GetOAuthAuthURL generates a provider consent URL and stores CSRF state in Redis.
func (s *authService) GetOAuthAuthURL(ctx context.Context, providerName string) (*OAuthURLResponse, error) {
	provider, err := s.oauthRegistry.Get(providerName)
	if err != nil {
		return nil, ErrOAuthProviderNotFound
	}

	state, err := crypto.GenerateRandomToken(16)
	if err != nil {
		return nil, fmt.Errorf("failed to generate oauth state: %w", err)
	}

	// Save state in Redis for 10 minutes
	if err := s.repo.StoreOAuthState(ctx, state, providerName, 10*time.Minute); err != nil {
		return nil, fmt.Errorf("failed to store oauth state: %w", err)
	}

	authURL := provider.GetAuthURL(state)
	return &OAuthURLResponse{
		URL:   authURL,
		State: state,
	}, nil
}

// HandleOAuthCallback processes code exchange, provisions user, and links OAuth account.
func (s *authService) HandleOAuthCallback(ctx context.Context, providerName, code, state, deviceID, ip, userAgent string) (*AuthResponse, string, error) {
	// 1. Verify and consume OAuth state from Redis
	storedProvider, err := s.repo.VerifyAndConsumeOAuthState(ctx, state)
	if err != nil || storedProvider != providerName {
		return nil, "", errors.New("invalid or expired oauth state parameter")
	}

	provider, err := s.oauthRegistry.Get(providerName)
	if err != nil {
		return nil, "", ErrOAuthProviderNotFound
	}

	// 2. Exchange code for user profile from provider
	oauthUser, err := provider.ExchangeCode(ctx, code)
	if err != nil {
		return nil, "", fmt.Errorf("oauth code exchange failed: %w", err)
	}

	// 3. Check if OAuth account is already linked
	existingOAuth, err := s.repo.GetOAuthAccountByProvider(ctx, providerName, oauthUser.ProviderUserID)
	var user *User

	if err == nil && existingOAuth != nil {
		// Existing linked account found -> fetch user
		user, err = s.repo.GetUserByID(ctx, existingOAuth.UserID)
		if err != nil {
			return nil, "", err
		}
	} else {
		// Try finding existing user by email
		emailLower := strings.ToLower(strings.TrimSpace(oauthUser.Email))
		user, err = s.repo.GetUserByEmail(ctx, emailLower)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, "", err
		}

		if user == nil {
			// Create a brand new user from OAuth details
			candidateUsername := s.generateUsernameFromOAuth(oauthUser)
			uniqueUsername := s.ensureUniqueUsername(ctx, candidateUsername)

			user, err = s.repo.CreateUser(ctx, emailLower, uniqueUsername, nil)
			if err != nil {
				return nil, "", fmt.Errorf("failed to create user from oauth: %w", err)
			}

			if oauthUser.EmailVerified {
				_ = s.repo.VerifyUserEmail(ctx, user.ID)
			}
		}

		// Link OAuth account
		oauthAccount := &OAuthAccount{
			UserID:         user.ID,
			Provider:       providerName,
			ProviderUserID: oauthUser.ProviderUserID,
			ProviderEmail:  oauthUser.Email,
			RawClaims:      oauthUser.RawClaims,
		}
		if err := s.repo.CreateOAuthAccount(ctx, oauthAccount); err != nil {
			log.Printf("[WARN] failed to link oauth account: %v", err)
		}
	}

	// 4. Create active session and issue tokens
	return s.createSessionAndTokens(ctx, user, deviceID, ip, userAgent)
}

// ==========================================
// Helper Methods
// ==========================================

func (s *authService) createSessionAndTokens(ctx context.Context, user *User, deviceID, ip, userAgent string) (*AuthResponse, string, error) {
	// 1. Generate session token hash
	sessionRawToken, err := crypto.GenerateRandomToken(32)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate session token: %w", err)
	}
	sessionTokenHash := crypto.HashTokenSHA256(sessionRawToken)

	// 2. Create session in DB
	session := &UserSession{
		UserID:           user.ID,
		SessionTokenHash: sessionTokenHash,
		DeviceID:         deviceID,
		IPAddress:        ip,
		UserAgent:        userAgent,
		IsRevoked:        false,
		ExpiresAt:        time.Now().UTC().Add(s.cfg.JWTRefreshTTL),
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, "", fmt.Errorf("failed to create session: %w", err)
	}

	// 3. Issue Access Token
	accessToken, _, err := jwt.GenerateAccessToken(
		user.ID,
		session.ID,
		deviceID,
		user.Email,
		user.Username,
		s.cfg.JWTAccessSecret,
		s.cfg.JWTAccessTTL,
	)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// 4. Issue Refresh Token
	refreshToken, _, err := jwt.GenerateRefreshToken(
		user.ID,
		session.ID,
		deviceID,
		s.cfg.JWTRefreshSecret,
		s.cfg.JWTRefreshTTL,
	)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	authResp := &AuthResponse{
		User: UserResponse{
			ID:              user.ID,
			Email:           user.Email,
			Username:        user.Username,
			EmailVerifiedAt: user.EmailVerifiedAt,
			CreatedAt:       user.CreatedAt,
			UpdatedAt:       user.UpdatedAt,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
	}

	return authResp, refreshToken, nil
}

func (s *authService) generateUsernameFromOAuth(oauthUser *oauth.OAuthUser) string {
	if oauthUser.PreferredUsername != "" {
		return sanitizeUsername(oauthUser.PreferredUsername)
	}
	if oauthUser.Name != "" {
		return sanitizeUsername(oauthUser.Name)
	}
	if parts := strings.Split(oauthUser.Email, "@"); len(parts) > 0 {
		return sanitizeUsername(parts[0])
	}
	return "user"
}

func sanitizeUsername(input string) string {
	reg := regexp.MustCompile("[^a-zA-Z0-9]+")
	cleaned := reg.ReplaceAllString(input, "")
	cleaned = strings.ToLower(cleaned)
	if len(cleaned) < 3 {
		cleaned = "usr" + cleaned
	}
	if len(cleaned) > 20 {
		cleaned = cleaned[:20]
	}
	return cleaned
}

func (s *authService) ensureUniqueUsername(ctx context.Context, base string) string {
	username := base
	for i := 0; i < 10; i++ {
		_, err := s.repo.GetUserByUsername(ctx, username)
		if errors.Is(err, ErrNotFound) {
			return username
		}
		randomSuffix, _ := crypto.GenerateRandomToken(2)
		username = fmt.Sprintf("%s%s", base, randomSuffix)
	}
	// Fallback with timestamp
	return fmt.Sprintf("%s%d", base, time.Now().Unix()%10000)
}
