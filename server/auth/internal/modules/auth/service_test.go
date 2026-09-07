package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/modules/auth/oauth"
	"auth.kron.com/pkg/crypto"
	"auth.kron.com/pkg/email"
	"auth.kron.com/pkg/jwt"
	"github.com/jackc/pgx/v5"
)

// mockRepository implements Repository for unit testing service business logic.
type mockRepository struct {
	users             map[string]*User            // key: id or email or username
	securityTokens    map[string]*SecurityToken   // key: token_hash
	sessions          map[string]*UserSession     // key: id
	outboxEvents      []*OutboxEvent
	blacklistedTokens map[string]bool
	blacklistedSess   map[string]bool
	userRevocations   map[string]int64
	oauthStates       map[string]string
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		users:             make(map[string]*User),
		securityTokens:    make(map[string]*SecurityToken),
		sessions:          make(map[string]*UserSession),
		blacklistedTokens: make(map[string]bool),
		blacklistedSess:   make(map[string]bool),
		userRevocations:   make(map[string]int64),
		oauthStates:       make(map[string]string),
	}
}

func (m *mockRepository) WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	// In memory mock transaction runner
	return fn(nil)
}

func (m *mockRepository) CreateUser(ctx context.Context, email, username string, passwordHash *string) (*User, error) {
	return m.CreateUserTx(ctx, nil, email, username, passwordHash)
}

func (m *mockRepository) CreateUserTx(ctx context.Context, tx pgx.Tx, email, username string, passwordHash *string) (*User, error) {
	for _, u := range m.users {
		if u.Email == email || u.Username == username {
			return nil, ErrConflict
		}
	}
	id := "usr_" + username
	u := &User{
		ID:           id,
		Email:        email,
		Username:     username,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}
	m.users[id] = u
	m.users[email] = u
	m.users[username] = u
	return u, nil
}

func (m *mockRepository) GetUserByID(ctx context.Context, id string) (*User, error) {
	u, ok := m.users[id]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (m *mockRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	u, ok := m.users[email]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (m *mockRepository) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	u, ok := m.users[username]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (m *mockRepository) GetUserByEmailOrUsername(ctx context.Context, login string) (*User, error) {
	u, ok := m.users[login]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (m *mockRepository) UpdateUsername(ctx context.Context, userID, username string) error {
	u, ok := m.users[userID]
	if !ok {
		return ErrNotFound
	}
	if existing, exists := m.users[username]; exists && existing.ID != userID {
		return ErrConflict
	}
	delete(m.users, u.Username)
	u.Username = username
	m.users[username] = u
	return nil
}

func (m *mockRepository) UpdatePasswordTx(ctx context.Context, tx pgx.Tx, userID, passwordHash string) error {
	u, ok := m.users[userID]
	if !ok {
		return ErrNotFound
	}
	u.PasswordHash = &passwordHash
	return nil
}

func (m *mockRepository) VerifyUserEmail(ctx context.Context, userID string) error {
	u, ok := m.users[userID]
	if !ok {
		return ErrNotFound
	}
	now := time.Now().UTC()
	u.EmailVerifiedAt = &now
	return nil
}

func (m *mockRepository) CreateOAuthAccount(ctx context.Context, account *OAuthAccount) error {
	return nil
}

func (m *mockRepository) GetOAuthAccountByProvider(ctx context.Context, provider, providerUserID string) (*OAuthAccount, error) {
	return nil, ErrNotFound
}

func (m *mockRepository) CreateSecurityToken(ctx context.Context, token *SecurityToken) error {
	return m.CreateSecurityTokenTx(ctx, nil, token)
}

func (m *mockRepository) CreateSecurityTokenTx(ctx context.Context, tx pgx.Tx, token *SecurityToken) error {
	if token.ID == "" {
		token.ID = "tok_" + token.TokenHash[:8]
	}
	m.securityTokens[token.TokenHash] = token
	return nil
}

func (m *mockRepository) GetValidSecurityToken(ctx context.Context, tokenHash, tokenType string) (*SecurityToken, error) {
	tok, ok := m.securityTokens[tokenHash]
	if !ok || tok.Type != tokenType || tok.UsedAt != nil || tok.ExpiresAt.Before(time.Now().UTC()) {
		return nil, ErrNotFound
	}
	return tok, nil
}

func (m *mockRepository) MarkSecurityTokenUsed(ctx context.Context, tokenID string) error {
	return m.MarkSecurityTokenUsedTx(ctx, nil, tokenID)
}

func (m *mockRepository) MarkSecurityTokenUsedTx(ctx context.Context, tx pgx.Tx, tokenID string) error {
	for _, tok := range m.securityTokens {
		if tok.ID == tokenID {
			now := time.Now().UTC()
			tok.UsedAt = &now
			return nil
		}
	}
	return ErrNotFound
}

func (m *mockRepository) CreateSession(ctx context.Context, session *UserSession) error {
	if session.ID == "" {
		session.ID = "sess_" + session.SessionTokenHash[:8]
	}
	session.CreatedAt = time.Now().UTC()
	session.LastActiveAt = time.Now().UTC()
	m.sessions[session.ID] = session
	return nil
}

func (m *mockRepository) GetSessionByID(ctx context.Context, sessionID string) (*UserSession, error) {
	s, ok := m.sessions[sessionID]
	if !ok {
		return nil, ErrNotFound
	}
	return s, nil
}

func (m *mockRepository) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*UserSession, error) {
	for _, s := range m.sessions {
		if s.SessionTokenHash == tokenHash {
			return s, nil
		}
	}
	return nil, ErrNotFound
}

func (m *mockRepository) GetUserActiveSessions(ctx context.Context, userID string) ([]UserSession, error) {
	var list []UserSession
	for _, s := range m.sessions {
		if s.UserID == userID && !s.IsRevoked {
			list = append(list, *s)
		}
	}
	return list, nil
}

func (m *mockRepository) RevokeSession(ctx context.Context, sessionID, userID string) error {
	s, ok := m.sessions[sessionID]
	if !ok {
		return ErrNotFound
	}
	s.IsRevoked = true
	return nil
}

func (m *mockRepository) RevokeAllUserSessions(ctx context.Context, userID string, exceptSessionID string) error {
	for _, s := range m.sessions {
		if s.UserID == userID && s.ID != exceptSessionID {
			s.IsRevoked = true
		}
	}
	return nil
}

func (m *mockRepository) UpdateSessionActivity(ctx context.Context, sessionID, ipAddress, userAgent string) error {
	s, ok := m.sessions[sessionID]
	if !ok {
		return ErrNotFound
	}
	s.LastActiveAt = time.Now().UTC()
	return nil
}

func (m *mockRepository) InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *OutboxEvent) error {
	m.outboxEvents = append(m.outboxEvents, event)
	return nil
}

func (m *mockRepository) GetPendingOutboxEvents(ctx context.Context, limit int) ([]OutboxEvent, error) {
	var list []OutboxEvent
	for _, e := range m.outboxEvents {
		if e.Status == "PENDING" {
			list = append(list, *e)
		}
	}
	return list, nil
}

func (m *mockRepository) MarkOutboxEventPublished(ctx context.Context, id string) error {
	for _, e := range m.outboxEvents {
		if e.ID == id {
			e.Status = "PUBLISHED"
			now := time.Now().UTC()
			e.PublishedAt = &now
			return nil
		}
	}
	return ErrNotFound
}

func (m *mockRepository) MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error {
	for _, e := range m.outboxEvents {
		if e.ID == id {
			e.RetryCount++
			e.ErrorMessage = errMsg
			if e.RetryCount >= 5 {
				e.Status = "FAILED"
			}
			return nil
		}
	}
	return ErrNotFound
}

func (m *mockRepository) BlacklistToken(ctx context.Context, jti string, ttl time.Duration) error {
	m.blacklistedTokens[jti] = true
	return nil
}

func (m *mockRepository) IsTokenBlacklisted(ctx context.Context, jti string) (bool, error) {
	return m.blacklistedTokens[jti], nil
}

func (m *mockRepository) BlacklistSession(ctx context.Context, sessionID string, ttl time.Duration) error {
	m.blacklistedSess[sessionID] = true
	return nil
}

func (m *mockRepository) IsSessionBlacklisted(ctx context.Context, sessionID string) (bool, error) {
	return m.blacklistedSess[sessionID], nil
}

func (m *mockRepository) BlacklistUserRevocation(ctx context.Context, userID string, revokedAt time.Time, ttl time.Duration) error {
	m.userRevocations[userID] = revokedAt.Unix()
	return nil
}

func (m *mockRepository) GetUserRevocationTimestamp(ctx context.Context, userID string) (int64, error) {
	return m.userRevocations[userID], nil
}

func (m *mockRepository) StoreOAuthState(ctx context.Context, state, provider string, ttl time.Duration) error {
	m.oauthStates[state] = provider
	return nil
}

func (m *mockRepository) VerifyAndConsumeOAuthState(ctx context.Context, state string) (string, error) {
	p, ok := m.oauthStates[state]
	if !ok {
		return "", errors.New("invalid state")
	}
	delete(m.oauthStates, state)
	return p, nil
}

// ==========================================
// Service Business Logic Tests
// ==========================================

func createTestConfig() *config.Config {
	return &config.Config{
		JWTAccessSecret:       "access-secret-32-chars-key-12345",
		JWTRefreshSecret:      "refresh-secret-32-chars-key-123",
		JWTAccessTTL:          15 * time.Minute,
		JWTRefreshTTL:         720 * time.Hour,
		CookieAccessSignature: "cookie-signature-secret",
		FrontendURL:           "http://localhost:3000",
	}
}

func TestSignupSuccessAndOutboxPattern(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())

	ctx := context.Background()
	req := SignupRequest{
		Email:    "alice@kron.com",
		Username: "alice",
		Password: "Password123!",
	}

	authResp, refreshToken, err := svc.Signup(ctx, req, "dev_1", "127.0.0.1", "Mozilla/5.0")
	if err != nil {
		t.Fatalf("unexpected error during signup: %v", err)
	}

	if authResp.User.Email != "alice@kron.com" || authResp.User.Username != "alice" {
		t.Fatalf("user profile mismatch: %+v", authResp.User)
	}

	if authResp.AccessToken == "" || refreshToken == "" {
		t.Fatalf("tokens should not be empty")
	}

	// Assert outbox event was created inside transaction
	if len(repo.outboxEvents) != 1 {
		t.Fatalf("expected 1 outbox event in transaction, got %d", len(repo.outboxEvents))
	}

	outbox := repo.outboxEvents[0]
	if outbox.EventType != "EMAIL_VERIFICATION" || outbox.Status != "PENDING" {
		t.Fatalf("outbox event mismatch: %+v", outbox)
	}
}

func TestSignupDuplicateUser(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())

	ctx := context.Background()
	req := SignupRequest{
		Email:    "bob@kron.com",
		Username: "bob",
		Password: "Password123!",
	}

	_, _, err := svc.Signup(ctx, req, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("first signup should succeed: %v", err)
	}

	// Attempt duplicate signup with same email
	_, _, err = svc.Signup(ctx, req, "dev_1", "127.0.0.1", "UA")
	if err != ErrUserAlreadyExists {
		t.Fatalf("expected ErrUserAlreadyExists for duplicate email, got %v", err)
	}
}

func TestLoginCredentialsValidation(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())

	ctx := context.Background()
	password := "SecretPass123!"

	_, _, _ = svc.Signup(ctx, SignupRequest{
		Email:    "charlie@kron.com",
		Username: "charlie",
		Password: password,
	}, "dev_1", "127.0.0.1", "UA")

	// Correct Login via Email
	resp, _, err := svc.Login(ctx, LoginRequest{
		Login:    "charlie@kron.com",
		Password: password,
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("login via email failed: %v", err)
	}
	if resp.User.Username != "charlie" {
		t.Fatalf("login response user mismatch: %+v", resp.User)
	}

	// Correct Login via Username
	resp2, _, err := svc.Login(ctx, LoginRequest{
		Login:    "charlie",
		Password: password,
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("login via username failed: %v", err)
	}
	if resp2.User.Email != "charlie@kron.com" {
		t.Fatalf("login response user mismatch: %+v", resp2.User)
	}

	// Wrong password
	_, _, err = svc.Login(ctx, LoginRequest{
		Login:    "charlie",
		Password: "WrongPassword!",
	}, "dev_1", "127.0.0.1", "UA")
	if err != ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials for wrong password, got %v", err)
	}
}

func TestForgotPasswordAndResetPasswordFlow(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())

	ctx := context.Background()
	emailAddr := "dave@kron.com"

	_, _, _ = svc.Signup(ctx, SignupRequest{
		Email:    emailAddr,
		Username: "dave",
		Password: "OldPassword123!",
	}, "dev_1", "127.0.0.1", "UA")

	// 1. Trigger Forgot Password
	err := svc.ForgotPassword(ctx, ForgotPasswordRequest{Email: emailAddr})
	if err != nil {
		t.Fatalf("forgot password failed: %v", err)
	}

	// Check outbox has password reset event
	if len(repo.outboxEvents) < 2 { // 1 for signup, 1 for forgot password
		t.Fatalf("expected at least 2 outbox events, got %d", len(repo.outboxEvents))
	}

	// 2. Trigger Reset Password with invalid token
	err = svc.ResetPassword(ctx, ResetPasswordRequest{
		Token:       "invalid-reset-token-string",
		NewPassword: "NewPassword123!",
	})
	if err != ErrInvalidSecurityToken {
		t.Fatalf("expected ErrInvalidSecurityToken for invalid token, got %v", err)
	}

	// Test Non-existent email (must return nil without leaking user presence)
	err = svc.ForgotPassword(ctx, ForgotPasswordRequest{Email: "nonexistent@kron.com"})
	if err != nil {
		t.Fatalf("expected nil error for non-existent email in ForgotPassword, got %v", err)
	}
}

func TestRefreshTokenBlacklistEnforcement(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())

	ctx := context.Background()

	_, refreshTokenStr, err := svc.Signup(ctx, SignupRequest{
		Email:    "eve@kron.com",
		Username: "eve",
		Password: "Password123!",
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("signup failed: %v", err)
	}

	// Refresh token successfully
	newAuthResp, _, err := svc.RefreshToken(ctx, refreshTokenStr, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("refresh token failed: %v", err)
	}
	if newAuthResp.AccessToken == "" {
		t.Fatalf("new access token should not be empty")
	}

	// Parse claims to get session ID
	claims, err := jwt.ParseAndValidateToken(refreshTokenStr, cfg.JWTRefreshSecret)
	if err != nil {
		t.Fatalf("failed to parse refresh token: %v", err)
	}

	// Blacklist session in Redis
	_ = repo.BlacklistSession(ctx, claims.SessionID, 1*time.Hour)

	// Refresh token should fail now because session is blacklisted in Redis
	_, _, err = svc.RefreshToken(ctx, refreshTokenStr, "dev_1", "127.0.0.1", "UA")
	if err != ErrSessionNotFoundOrRevoked {
		t.Fatalf("expected ErrSessionNotFoundOrRevoked for blacklisted session, got %v", err)
	}
}

func TestLogoutBlacklisting(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())

	ctx := context.Background()

	authResp, _, err := svc.Signup(ctx, SignupRequest{
		Email:    "frank@kron.com",
		Username: "frank",
		Password: "Password123!",
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("signup failed: %v", err)
	}

	claims, err := jwt.ParseAndValidateToken(authResp.AccessToken, cfg.JWTAccessSecret)
	if err != nil {
		t.Fatalf("failed to parse access token: %v", err)
	}

	// Perform Logout
	err = svc.Logout(ctx, claims.SessionID, claims.UserID, claims.ID)
	if err != nil {
		t.Fatalf("logout failed: %v", err)
	}

	// Check Redis blacklists
	isTokenBlacklisted, _ := repo.IsTokenBlacklisted(ctx, claims.ID)
	isSessionBlacklisted, _ := repo.IsSessionBlacklisted(ctx, claims.SessionID)

	if !isTokenBlacklisted {
		t.Fatalf("access token JTI should be blacklisted in Redis after logout")
	}

	if !isSessionBlacklisted {
		t.Fatalf("session ID should be blacklisted in Redis after logout")
	}
}

type mockOAuthProvider struct {
	name string
	user *oauth.OAuthUser
	err  error
}

func (m *mockOAuthProvider) Name() string { return m.name }
func (m *mockOAuthProvider) GetAuthURL(state string) string {
	return "https://auth.mock.com?state=" + state
}
func (m *mockOAuthProvider) ExchangeCode(ctx context.Context, code string) (*oauth.OAuthUser, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.user, nil
}

func TestGetMeAndUpdateUsername(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())
	ctx := context.Background()

	authResp, _, err := svc.Signup(ctx, SignupRequest{
		Email:    "grace@kron.com",
		Username: "grace",
		Password: "Password123!",
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("signup failed: %v", err)
	}

	claims, _ := jwt.ParseAndValidateToken(authResp.AccessToken, cfg.JWTAccessSecret)

	// GetMe with valid session
	uResp, sResp, err := svc.GetMe(ctx, claims.UserID, claims.SessionID)
	if err != nil {
		t.Fatalf("GetMe failed: %v", err)
	}
	if uResp.Username != "grace" || sResp == nil {
		t.Fatalf("GetMe returned invalid response: user=%+v sess=%+v", uResp, sResp)
	}

	// GetMe non-existent user
	_, _, err = svc.GetMe(ctx, "usr_nonexistent", "")
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound for non-existent user, got %v", err)
	}

	// UpdateUsername success
	updated, err := svc.UpdateUsername(ctx, claims.UserID, "grace_new")
	if err != nil {
		t.Fatalf("UpdateUsername failed: %v", err)
	}
	if updated.Username != "grace_new" {
		t.Fatalf("expected username grace_new, got %s", updated.Username)
	}

	// UpdateUsername conflict
	_, _, _ = svc.Signup(ctx, SignupRequest{
		Email:    "taken@kron.com",
		Username: "takenuser",
		Password: "Password123!",
	}, "dev_2", "127.0.0.1", "UA")

	_, err = svc.UpdateUsername(ctx, claims.UserID, "takenuser")
	if err != ErrUsernameAlreadyTaken {
		t.Fatalf("expected ErrUsernameAlreadyTaken, got %v", err)
	}
}

func TestEmailVerificationAndResendFlow(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())
	ctx := context.Background()

	// 1. Resend for non-existent user should return nil (privacy)
	err := svc.ResendVerificationEmail(ctx, ResendVerificationRequest{Email: "ghost@kron.com"})
	if err != nil {
		t.Fatalf("expected nil error for non-existent email, got %v", err)
	}

	// 2. Signup user
	authResp, _, err := svc.Signup(ctx, SignupRequest{
		Email:    "hank@kron.com",
		Username: "hank",
		Password: "Password123!",
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("signup failed: %v", err)
	}

	// Verify email with invalid token
	err = svc.VerifyEmail(ctx, "invalid-verification-token")
	if err != ErrInvalidSecurityToken {
		t.Fatalf("expected ErrInvalidSecurityToken, got %v", err)
	}

	// Grab outbox token to simulate valid token verification
	var rawToken string
	if len(repo.outboxEvents) > 0 {
		outbox := repo.outboxEvents[0]
		// Create security token directly in mock repo
		rawToken = "valid-raw-token-12345"
		tokenHash := crypto.HashTokenSHA256(rawToken)
		_ = repo.CreateSecurityToken(ctx, &SecurityToken{
			UserID:    authResp.User.ID,
			TokenHash: tokenHash,
			Type:      TokenTypeEmailVerification,
			ExpiresAt: time.Now().UTC().Add(1 * time.Hour),
		})
		_ = outbox
	}

	err = svc.VerifyEmail(ctx, rawToken)
	if err != nil {
		t.Fatalf("VerifyEmail failed: %v", err)
	}

	// Resend when already verified should return ErrEmailAlreadyVerified
	err = svc.ResendVerificationEmail(ctx, ResendVerificationRequest{Email: "hank@kron.com"})
	if err != ErrEmailAlreadyVerified {
		t.Fatalf("expected ErrEmailAlreadyVerified, got %v", err)
	}
}

func TestResetPasswordSuccessfulFlow(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())
	ctx := context.Background()

	authResp, _, _ := svc.Signup(ctx, SignupRequest{
		Email:    "ivy@kron.com",
		Username: "ivy",
		Password: "OldPassword123!",
	}, "dev_1", "127.0.0.1", "UA")

	rawToken := "reset-token-secret-999"
	tokenHash := crypto.HashTokenSHA256(rawToken)
	_ = repo.CreateSecurityToken(ctx, &SecurityToken{
		UserID:    authResp.User.ID,
		TokenHash: tokenHash,
		Type:      TokenTypePasswordReset,
		ExpiresAt: time.Now().UTC().Add(1 * time.Hour),
	})

	err := svc.ResetPassword(ctx, ResetPasswordRequest{
		Token:       rawToken,
		NewPassword: "NewPassword456!",
	})
	if err != nil {
		t.Fatalf("ResetPassword failed: %v", err)
	}

	// Login with new password should succeed
	_, _, err = svc.Login(ctx, LoginRequest{
		Login:    "ivy@kron.com",
		Password: "NewPassword456!",
	}, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("Login with new password failed: %v", err)
	}
}

func TestSessionsManagement(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	svc := NewService(repo, cfg, email.NewLogEmailService(), oauth.NewRegistry())
	ctx := context.Background()

	authResp, _, _ := svc.Signup(ctx, SignupRequest{
		Email:    "jack@kron.com",
		Username: "jack",
		Password: "Password123!",
	}, "dev_1", "127.0.0.1", "UA")

	claims, _ := jwt.ParseAndValidateToken(authResp.AccessToken, cfg.JWTAccessSecret)

	// List sessions
	sessions, err := svc.ListUserSessions(ctx, claims.UserID, claims.SessionID)
	if err != nil {
		t.Fatalf("ListUserSessions failed: %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
	if !sessions[0].IsCurrent {
		t.Fatalf("expected IsCurrent to be true")
	}

	// Create second session via login
	_, _, _ = svc.Login(ctx, LoginRequest{
		Login:    "jack@kron.com",
		Password: "Password123!",
	}, "dev_2", "127.0.0.2", "UA")

	sessions, _ = svc.ListUserSessions(ctx, claims.UserID, claims.SessionID)
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}

	// Revoke session
	otherSessID := ""
	for _, s := range sessions {
		if s.ID != claims.SessionID {
			otherSessID = s.ID
		}
	}

	err = svc.RevokeSession(ctx, otherSessID, claims.UserID)
	if err != nil {
		t.Fatalf("RevokeSession failed: %v", err)
	}

	// Revoke all other sessions
	err = svc.RevokeAllOtherSessions(ctx, claims.UserID, claims.SessionID)
	if err != nil {
		t.Fatalf("RevokeAllOtherSessions failed: %v", err)
	}
}

func TestOAuthFlows(t *testing.T) {
	repo := newMockRepository()
	cfg := createTestConfig()
	reg := oauth.NewRegistry()

	mockProvider := &mockOAuthProvider{
		name: "mock_provider",
		user: &oauth.OAuthUser{
			Provider:          "mock_provider",
			ProviderUserID:    "oauth_123",
			Email:             "oauthuser@kron.com",
			EmailVerified:     true,
			Name:              "OAuth User",
			PreferredUsername: "oauthuser",
		},
	}
	reg.Register(mockProvider)

	svc := NewService(repo, cfg, email.NewLogEmailService(), reg)
	ctx := context.Background()

	// Get OAuth URL
	urlResp, err := svc.GetOAuthAuthURL(ctx, "mock_provider")
	if err != nil {
		t.Fatalf("GetOAuthAuthURL failed: %v", err)
	}
	if urlResp.URL == "" || urlResp.State == "" {
		t.Fatalf("GetOAuthAuthURL returned empty URL or State")
	}

	// Unregistered provider
	_, err = svc.GetOAuthAuthURL(ctx, "unknown_provider")
	if err != ErrOAuthProviderNotFound {
		t.Fatalf("expected ErrOAuthProviderNotFound, got %v", err)
	}

	// Handle OAuth Callback - invalid state
	_, _, err = svc.HandleOAuthCallback(ctx, "mock_provider", "code123", "invalid_state", "dev_1", "127.0.0.1", "UA")
	if err == nil {
		t.Fatalf("expected error for invalid state, got nil")
	}

	// Handle OAuth Callback - success
	authResp, refreshToken, err := svc.HandleOAuthCallback(ctx, "mock_provider", "code123", urlResp.State, "dev_1", "127.0.0.1", "UA")
	if err != nil {
		t.Fatalf("HandleOAuthCallback failed: %v", err)
	}
	if authResp.User.Email != "oauthuser@kron.com" || refreshToken == "" {
		t.Fatalf("HandleOAuthCallback returned invalid auth response: %+v", authResp)
	}
}

