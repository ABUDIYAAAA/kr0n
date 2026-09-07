package github

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.kron.com/internal/api/config"
	pkgh "github.kron.com/pkg/github"
)

func setupTestHandler() (*Handler, *mockRepository, *config.Config) {
	repo := newMockRepository()
	cfg := &config.Config{
		GitHubWebhookSecret: "test_secret_123",
	}
	ghClient := pkgh.NewClient(12345, nil, cfg.GitHubWebhookSecret)
	svc := NewService(repo, cfg, ghClient)
	handler := NewHandler(svc, cfg)
	return handler, repo, cfg
}

func TestHandlerInstallationStatusAndCallback(t *testing.T) {
	handler, _, _ := setupTestHandler()

	// 1. InstallationStatus unauthorized context
	req := httptest.NewRequest(http.MethodGet, "/installation-status", nil)
	rr := httptest.NewRecorder()
	handler.GetInstallationStatus(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthorized context, got %d", rr.Code)
	}

	// 2. InstallationStatus authorized
	ctx := context.WithValue(req.Context(), ContextKeyUserID, "usr_100")
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.GetInstallationStatus(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for authorized context, got %d", rr.Code)
	}

	// 3. Callback missing installation_id
	req = httptest.NewRequest(http.MethodGet, "/installation/callback", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.HandleInstallationCallback(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing installation_id, got %d", rr.Code)
	}

	// 4. Callback valid installation_id
	req = httptest.NewRequest(http.MethodGet, "/installation/callback?installation_id=554433", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.HandleInstallationCallback(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid installation callback, got %d", rr.Code)
	}
}

func TestHandlerRepositoriesAndTracking(t *testing.T) {
	handler, _, _ := setupTestHandler()
	ctx := context.WithValue(context.Background(), ContextKeyUserID, "usr_200")

	// Save installation for user first
	req := httptest.NewRequest(http.MethodGet, "/installation/callback?installation_id=112233", nil)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	handler.HandleInstallationCallback(rr, req)

	// 1. List User Repositories for uninstalled user
	reqUninstalled := httptest.NewRequest(http.MethodGet, "/repositories?visibility=all", nil)
	ctxUninstalled := context.WithValue(context.Background(), ContextKeyUserID, "usr_uninstalled")
	reqUninstalled = reqUninstalled.WithContext(ctxUninstalled)
	rrUninstalled := httptest.NewRecorder()
	handler.ListUserRepositories(rrUninstalled, reqUninstalled)
	if rrUninstalled.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for uninstalled user ListUserRepositories, got %d", rrUninstalled.Code)
	}

	// 2. Track Repository valid
	trackBody, _ := json.Marshal(TrackRepositoryRequest{
		GitHubRepoID:  301,
		RepoName:      "demo-app",
		FullName:      "user/demo-app",
		OwnerLogin:    "user",
		IsPrivate:     false,
		DefaultBranch: "main",
		HTMLURL:       "https://github.com/user/demo-app",
	})
	req = httptest.NewRequest(http.MethodPost, "/repositories/track", bytes.NewBuffer(trackBody))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.TrackRepository(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 for TrackRepository, got %d", rr.Code)
	}

	// 3. List Tracked Repositories
	req = httptest.NewRequest(http.MethodGet, "/repositories/tracked", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.ListTrackedRepositories(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for ListTrackedRepositories, got %d", rr.Code)
	}

	// 4. Untrack Repository
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "repo_1")
	req = httptest.NewRequest(http.MethodDelete, "/repositories/track/repo_1", nil)
	ctxRoute := context.WithValue(ctx, chi.RouteCtxKey, rctx)
	req = req.WithContext(ctxRoute)
	rr = httptest.NewRecorder()
	handler.UntrackRepository(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for UntrackRepository, got %d", rr.Code)
	}
}

func TestHandlerWebhook(t *testing.T) {
	handler, _, cfg := setupTestHandler()

	payload := map[string]any{
		"ref": "refs/heads/main",
		"repository": map[string]any{
			"id":        301,
			"full_name": "user/demo-app",
		},
	}

	body, _ := json.Marshal(payload)
	mac := hmac.New(sha256.New, []byte(cfg.GitHubWebhookSecret))
	mac.Write(body)
	sig := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	req := httptest.NewRequest(http.MethodPost, "/webhooks", bytes.NewBuffer(body))
	req.Header.Set("X-GitHub-Event", "push")
	req.Header.Set("X-Hub-Signature-256", sig)

	rr := httptest.NewRecorder()
	handler.HandleWebhook(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for HandleWebhook, got %d", rr.Code)
	}
}
