package services

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"services.kron.com/internal/api/config"
	"services.kron.com/internal/api/middleware"
)

func setupTestHandler() (*Handler, *mockRepository, *config.Config) {
	repo := newMockRepository()
	cfg := &config.Config{}
	svc := NewService(repo, cfg)
	handler := NewHandler(svc, cfg)
	return handler, repo, cfg
}

func TestHandlerCreateAndListService(t *testing.T) {
	handler, _, _ := setupTestHandler()

	// 1. CreateService unauthorized
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rr := httptest.NewRecorder()
	handler.CreateService(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthorized context, got %d", rr.Code)
	}

	// 2. CreateService authorized
	body, _ := json.Marshal(CreateServiceRequest{
		GitHubRepoID: 9900,
		RepoName:     "api-service",
		RepoFullName: "company/api-service",
		RepoOwner:    "company",
		Name:         "my-api",
	})
	req = httptest.NewRequest(http.MethodPost, "/", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), middleware.ContextKeyUserID, "usr_200")
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.CreateService(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 for CreateService, got %d", rr.Code)
	}

	// 3. ListUserServices
	req = httptest.NewRequest(http.MethodGet, "/?page=1&limit=10", nil)
	req = req.WithContext(ctx)
	rr = httptest.NewRecorder()
	handler.ListUserServices(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for ListUserServices, got %d", rr.Code)
	}
}

func TestHandlerSuggestName(t *testing.T) {
	handler, _, _ := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/suggest-name?repo_name=my-app", nil)
	ctx := context.WithValue(req.Context(), middleware.ContextKeyUserID, "usr_200")
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	handler.SuggestServiceName(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for SuggestServiceName, got %d", rr.Code)
	}
}
