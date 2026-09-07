package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/modules/auth"
	"auth.kron.com/pkg/jwt"
	"github.com/jackc/pgx/v5"
)

type mockMiddlewareRepo struct {
	blacklistedTokens map[string]bool
	blacklistedSess   map[string]bool
	userRevocations   map[string]int64
}

func newMockMiddlewareRepo() *mockMiddlewareRepo {
	return &mockMiddlewareRepo{
		blacklistedTokens: make(map[string]bool),
		blacklistedSess:   make(map[string]bool),
		userRevocations:   make(map[string]int64),
	}
}

func (m *mockMiddlewareRepo) WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error { return nil }
func (m *mockMiddlewareRepo) CreateUser(ctx context.Context, email, username string, passwordHash *string) (*auth.User, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) CreateUserTx(ctx context.Context, tx pgx.Tx, email, username string, passwordHash *string) (*auth.User, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) GetUserByID(ctx context.Context, id string) (*auth.User, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) GetUserByEmail(ctx context.Context, email string) (*auth.User, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) GetUserByUsername(ctx context.Context, username string) (*auth.User, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) GetUserByEmailOrUsername(ctx context.Context, login string) (*auth.User, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) UpdateUsername(ctx context.Context, userID, username string) error {
	return nil
}
func (m *mockMiddlewareRepo) UpdatePasswordTx(ctx context.Context, tx pgx.Tx, userID, passwordHash string) error {
	return nil
}
func (m *mockMiddlewareRepo) VerifyUserEmail(ctx context.Context, userID string) error {
	return nil
}
func (m *mockMiddlewareRepo) CreateOAuthAccount(ctx context.Context, account *auth.OAuthAccount) error {
	return nil
}
func (m *mockMiddlewareRepo) GetOAuthAccountByProvider(ctx context.Context, provider, providerUserID string) (*auth.OAuthAccount, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) CreateSecurityToken(ctx context.Context, token *auth.SecurityToken) error {
	return nil
}
func (m *mockMiddlewareRepo) CreateSecurityTokenTx(ctx context.Context, tx pgx.Tx, token *auth.SecurityToken) error {
	return nil
}
func (m *mockMiddlewareRepo) GetValidSecurityToken(ctx context.Context, tokenHash, tokenType string) (*auth.SecurityToken, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) MarkSecurityTokenUsed(ctx context.Context, tokenID string) error {
	return nil
}
func (m *mockMiddlewareRepo) MarkSecurityTokenUsedTx(ctx context.Context, tx pgx.Tx, tokenID string) error {
	return nil
}
func (m *mockMiddlewareRepo) CreateSession(ctx context.Context, session *auth.UserSession) error {
	return nil
}
func (m *mockMiddlewareRepo) GetSessionByID(ctx context.Context, sessionID string) (*auth.UserSession, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*auth.UserSession, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) GetUserActiveSessions(ctx context.Context, userID string) ([]auth.UserSession, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) RevokeSession(ctx context.Context, sessionID, userID string) error {
	return nil
}
func (m *mockMiddlewareRepo) RevokeAllUserSessions(ctx context.Context, userID, exceptSessionID string) error {
	return nil
}
func (m *mockMiddlewareRepo) UpdateSessionActivity(ctx context.Context, sessionID, ipAddress, userAgent string) error {
	return nil
}
func (m *mockMiddlewareRepo) InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *auth.OutboxEvent) error {
	return nil
}
func (m *mockMiddlewareRepo) GetPendingOutboxEvents(ctx context.Context, limit int) ([]auth.OutboxEvent, error) {
	return nil, nil
}
func (m *mockMiddlewareRepo) MarkOutboxEventPublished(ctx context.Context, id string) error {
	return nil
}
func (m *mockMiddlewareRepo) MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error {
	return nil
}
func (m *mockMiddlewareRepo) BlacklistToken(ctx context.Context, jti string, ttl time.Duration) error {
	m.blacklistedTokens[jti] = true
	return nil
}
func (m *mockMiddlewareRepo) IsTokenBlacklisted(ctx context.Context, jti string) (bool, error) {
	return m.blacklistedTokens[jti], nil
}
func (m *mockMiddlewareRepo) BlacklistSession(ctx context.Context, sessionID string, ttl time.Duration) error {
	m.blacklistedSess[sessionID] = true
	return nil
}
func (m *mockMiddlewareRepo) IsSessionBlacklisted(ctx context.Context, sessionID string) (bool, error) {
	return m.blacklistedSess[sessionID], nil
}
func (m *mockMiddlewareRepo) BlacklistUserRevocation(ctx context.Context, userID string, revokedAt time.Time, ttl time.Duration) error {
	m.userRevocations[userID] = revokedAt.Unix()
	return nil
}
func (m *mockMiddlewareRepo) GetUserRevocationTimestamp(ctx context.Context, userID string) (int64, error) {
	return m.userRevocations[userID], nil
}
func (m *mockMiddlewareRepo) StoreOAuthState(ctx context.Context, state, provider string, ttl time.Duration) error {
	return nil
}
func (m *mockMiddlewareRepo) VerifyAndConsumeOAuthState(ctx context.Context, state string) (string, error) {
	return "", nil
}

func testConfig() *config.Config {
	return &config.Config{
		JWTAccessSecret:       "access-secret-32-chars-key-12345",
		JWTRefreshSecret:      "refresh-secret-32-chars-key-123",
		JWTAccessTTL:          15 * time.Minute,
		CookieNameAccess:      "kron_access",
		CookieNameDeviceID:    "kron_device_id",
		CookieAccessSignature: "cookie-secret-12345",
	}
}

func TestRequireAuthMiddleware(t *testing.T) {
	cfg := testConfig()
	repo := newMockMiddlewareRepo()

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, _ := r.Context().Value(auth.ContextKeyUserID).(string)
		if userID == "" {
			t.Fatalf("expected userID in context")
		}
		w.WriteHeader(http.StatusOK)
	})

	mw := RequireAuth(cfg, repo)(nextHandler)

	// 1. Missing Token
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	rr := httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing token, got %d", rr.Code)
	}

	// 2. Valid Token via Header
	validToken, claims, err := jwt.GenerateAccessToken("usr_1", "sess_1", "dev_1", "alice@kron.com", "alice", cfg.JWTAccessSecret, cfg.JWTAccessTTL)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	req = httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	rr = httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid token, got %d", rr.Code)
	}

	// 3. Blacklisted Token
	repo.blacklistedTokens[claims.ID] = true
	req = httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	rr = httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for blacklisted token, got %d", rr.Code)
	}

	// 4. Blacklisted Session
	repo.blacklistedTokens[claims.ID] = false
	repo.blacklistedSess["sess_1"] = true
	req = httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	rr = httptest.NewRecorder()
	mw.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for blacklisted session, got %d", rr.Code)
	}
}

func TestDeviceTrackingMiddleware(t *testing.T) {
	cfg := testConfig()

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		devID, _ := r.Context().Value(auth.ContextKeyDeviceID).(string)
		if devID == "" {
			t.Fatalf("expected deviceID in context")
		}
		w.WriteHeader(http.StatusOK)
	})

	mw := DeviceTrackingMiddleware(cfg)(nextHandler)

	// New Request without device cookie
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	mw.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	cookies := rr.Result().Cookies()
	var devCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == cfg.CookieNameDeviceID {
			devCookie = c
			break
		}
	}
	if devCookie == nil {
		t.Fatalf("expected device cookie to be set")
	}

	// Next request with signed device cookie
	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	req2.AddCookie(devCookie)
	rr2 := httptest.NewRecorder()
	mw.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr2.Code)
	}
}
