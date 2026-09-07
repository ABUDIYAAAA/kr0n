package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/modules/auth/oauth"
	"auth.kron.com/pkg/email"
	"auth.kron.com/pkg/jwt"
	"github.com/go-chi/chi/v5"
)

func setupTestHandler() (*Handler, *mockRepository, *config.Config) {
	repo := newMockRepository()
	cfg := createTestConfig()
	cfg.CookieNameAccess = "kron_access"
	cfg.CookieNameRefresh = "kron_refresh"
	cfg.CookieNameDeviceID = "kron_device"

	reg := oauth.NewRegistry()
	reg.Register(&mockOAuthProvider{
		name: "google",
		user: &oauth.OAuthUser{
			Provider:          "google",
			ProviderUserID:    "g_123",
			Email:             "google@kron.com",
			EmailVerified:     true,
			Name:              "Google User",
			PreferredUsername: "guser",
		},
	})

	svc := NewService(repo, cfg, email.NewLogEmailService(), reg)
	handler := NewHandler(svc, cfg)
	return handler, repo, cfg
}

func TestHandlerSignup(t *testing.T) {
	handler, _, _ := setupTestHandler()

	// 1. Invalid JSON body
	req := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBufferString("{invalid json"))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handler.Signup(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid json, got %d", rr.Code)
	}

	// 2. Validation Failure (short password)
	signupBody, _ := json.Marshal(SignupRequest{
		Email:    "test@kron.com",
		Username: "testuser",
		Password: "123", // invalid
	})
	req = httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.Signup(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for validation failure, got %d", rr.Code)
	}

	// 3. Valid Signup
	signupBody, _ = json.Marshal(SignupRequest{
		Email:    "test@kron.com",
		Username: "testuser",
		Password: "Password123!",
	})
	req = httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.Signup(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 for valid signup, got %d", rr.Code)
	}

	// 4. Duplicate Signup
	req = httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.Signup(rr, req)
	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate signup, got %d", rr.Code)
	}
}

func TestHandlerLoginAndRefresh(t *testing.T) {
	handler, _, cfg := setupTestHandler()

	// Signup user first
	signupBody, _ := json.Marshal(SignupRequest{
		Email:    "login@kron.com",
		Username: "loginuser",
		Password: "Password123!",
	})
	req := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handler.Signup(rr, req)

	// 1. Invalid Login credentials
	loginBody, _ := json.Marshal(LoginRequest{
		Login:    "login@kron.com",
		Password: "WrongPassword!",
	})
	req = httptest.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.Login(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for wrong password, got %d", rr.Code)
	}

	// 2. Successful Login
	loginBody, _ = json.Marshal(LoginRequest{
		Login:    "login@kron.com",
		Password: "Password123!",
	})
	req = httptest.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.Login(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid login, got %d", rr.Code)
	}

	// Extract refresh cookie from login response
	var refreshCookie *http.Cookie
	for _, c := range rr.Result().Cookies() {
		if c.Name == cfg.CookieNameRefresh {
			refreshCookie = c
			break
		}
	}

	// 3. Refresh with signed cookie
	req = httptest.NewRequest(http.MethodPost, "/refresh", nil)
	if refreshCookie != nil {
		req.AddCookie(refreshCookie)
	}
	rr = httptest.NewRecorder()
	handler.Refresh(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for refresh, got %d", rr.Code)
	}

	// 4. Refresh missing token
	req = httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.Refresh(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing refresh token, got %d", rr.Code)
	}
}

func TestHandlerGetMeAndUpdateUsername(t *testing.T) {
	handler, repo, _ := setupTestHandler()

	signupBody, _ := json.Marshal(SignupRequest{
		Email:    "me@kron.com",
		Username: "meuser",
		Password: "Password123!",
	})
	req := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handler.Signup(rr, req)

	user, _ := repo.GetUserByEmail(context.Background(), "me@kron.com")

	// GetMe unauthorized context
	req = httptest.NewRequest(http.MethodGet, "/me", nil)
	rr = httptest.NewRecorder()
	handler.GetMe(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthorized GetMe, got %d", rr.Code)
	}

	// GetMe valid context
	ctx := context.WithValue(req.Context(), ContextKeyUserID, user.ID)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.GetMe(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for GetMe, got %d", rr.Code)
	}

	// UpdateUsername valid
	updateBody, _ := json.Marshal(UpdateUsernameRequest{Username: "meuserupdated"})
	req = httptest.NewRequest(http.MethodPatch, "/username", bytes.NewBuffer(updateBody))
	req.Header.Set("Content-Type", "application/json")
	ctx = context.WithValue(req.Context(), ContextKeyUserID, user.ID)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.UpdateUsername(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for UpdateUsername, got %d", rr.Code)
	}
}

func TestHandlerEmailVerificationAndForgotPassword(t *testing.T) {
	handler, _, _ := setupTestHandler()

	// VerifyEmail GET query parameter missing
	req := httptest.NewRequest(http.MethodGet, "/verify-email", nil)
	rr := httptest.NewRecorder()
	handler.VerifyEmail(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing token, got %d", rr.Code)
	}

	// VerifyEmail GET invalid token
	req = httptest.NewRequest(http.MethodGet, "/verify-email?token=invalid_tok", nil)
	rr = httptest.NewRecorder()
	handler.VerifyEmail(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid token, got %d", rr.Code)
	}

	// ForgotPassword valid email
	fpBody, _ := json.Marshal(ForgotPasswordRequest{Email: "someone@kron.com"})
	req = httptest.NewRequest(http.MethodPost, "/forgot-password", bytes.NewBuffer(fpBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.ForgotPassword(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for ForgotPassword, got %d", rr.Code)
	}

	// ResetPassword invalid token
	rpBody, _ := json.Marshal(ResetPasswordRequest{
		Token:       "invalid_token",
		NewPassword: "NewPassword123!",
	})
	req = httptest.NewRequest(http.MethodPost, "/reset-password", bytes.NewBuffer(rpBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	handler.ResetPassword(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid ResetPassword token, got %d", rr.Code)
	}
}

func TestHandlerLogoutAndSessions(t *testing.T) {
	handler, repo, _ := setupTestHandler()

	signupBody, _ := json.Marshal(SignupRequest{
		Email:    "sess@kron.com",
		Username: "sessuser",
		Password: "Password123!",
	})
	req := httptest.NewRequest(http.MethodPost, "/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handler.Signup(rr, req)

	user, _ := repo.GetUserByEmail(context.Background(), "sess@kron.com")
	sessions, _, _ := repo.GetUserActiveSessions(context.Background(), user.ID, 1, 10)
	sessID := sessions[0].ID

	// Logout
	req = httptest.NewRequest(http.MethodPost, "/logout", nil)
	claims := &jwt.Claims{
		UserID:    user.ID,
		SessionID: sessID,
	}
	ctx := context.WithValue(req.Context(), ContextKeyUserID, user.ID)
	ctx = context.WithValue(ctx, ContextKeySessionID, sessID)
	ctx = context.WithValue(ctx, ContextKeyClaims, claims)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.Logout(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for Logout, got %d", rr.Code)
	}

	// ListSessions
	req = httptest.NewRequest(http.MethodGet, "/sessions", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.ListSessions(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for ListSessions, got %d", rr.Code)
	}

	// RevokeSession with Chi URLParam
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", sessID)
	req = httptest.NewRequest(http.MethodDelete, "/sessions/"+sessID, nil)
	ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.RevokeSession(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for RevokeSession, got %d", rr.Code)
	}

	// RevokeAllOtherSessions
	req = httptest.NewRequest(http.MethodDelete, "/sessions", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.RevokeAllOtherSessions(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for RevokeAllOtherSessions, got %d", rr.Code)
	}
}

func TestHandlerOAuth(t *testing.T) {
	handler, _, _ := setupTestHandler()

	// GetOAuthURL
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("provider", "google")
	req := httptest.NewRequest(http.MethodGet, "/oauth/google/url", nil)
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	handler.GetOAuthURL(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for GetOAuthURL, got %d", rr.Code)
	}

	// HandleOAuthCallback missing parameters
	req = httptest.NewRequest(http.MethodGet, "/oauth/google/callback", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.HandleOAuthCallback(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing code/state, got %d", rr.Code)
	}
}

func TestClientIPHelper(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Forwarded-For", "203.0.113.195, 70.41.3.18")
	if ip := getClientIP(req); ip != "203.0.113.195" {
		t.Fatalf("expected 203.0.113.195, got %s", ip)
	}

	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Real-IP", "198.51.100.1")
	if ip := getClientIP(req); ip != "198.51.100.1" {
		t.Fatalf("expected 198.51.100.1, got %s", ip)
	}

	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "192.0.2.1:12345"
	if ip := getClientIP(req); ip != "192.0.2.1" {
		t.Fatalf("expected 192.0.2.1, got %s", ip)
	}
}
