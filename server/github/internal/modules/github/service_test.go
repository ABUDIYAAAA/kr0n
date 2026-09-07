package github

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"testing"
	"time"

	"github.kron.com/internal/api/config"
	pkgh "github.kron.com/pkg/github"
)

type mockRepository struct {
	installations map[string]*Installation
	trackedRepos  map[string]*TrackedRepo
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		installations: make(map[string]*Installation),
		trackedRepos:  make(map[string]*TrackedRepo),
	}
}

func (m *mockRepository) SaveInstallation(ctx context.Context, inst *Installation) error {
	if inst.ID == "" {
		inst.ID = "inst_1"
	}
	inst.UpdatedAt = time.Now().UTC()
	m.installations[inst.UserID] = inst
	return nil
}

func (m *mockRepository) GetInstallationByUserID(ctx context.Context, userID string) (*Installation, error) {
	inst, ok := m.installations[userID]
	if !ok {
		return nil, ErrNotFound
	}
	return inst, nil
}

func (m *mockRepository) GetInstallationByInstallationID(ctx context.Context, instID int64) (*Installation, error) {
	for _, inst := range m.installations {
		if inst.InstallationID == instID {
			return inst, nil
		}
	}
	return nil, ErrNotFound
}

func (m *mockRepository) TrackRepository(ctx context.Context, repo *TrackedRepo) error {
	if repo.ID == "" {
		repo.ID = "repo_1"
	}
	repo.CreatedAt = time.Now().UTC()
	m.trackedRepos[repo.ID] = repo
	return nil
}

func (m *mockRepository) UntrackRepository(ctx context.Context, userID string, repoID string) error {
	for id, repo := range m.trackedRepos {
		if repo.UserID == userID && (repo.ID == repoID || string(rune(repo.GitHubRepoID)) == repoID) {
			delete(m.trackedRepos, id)
			return nil
		}
	}
	return ErrNotFound
}

func (m *mockRepository) GetTrackedRepositoriesByUserID(ctx context.Context, userID string) ([]TrackedRepo, error) {
	var list []TrackedRepo
	for _, repo := range m.trackedRepos {
		if repo.UserID == userID {
			list = append(list, *repo)
		}
	}
	return list, nil
}

func (m *mockRepository) GetTrackedRepositoryByGitHubID(ctx context.Context, githubRepoID int64) ([]TrackedRepo, error) {
	var list []TrackedRepo
	for _, repo := range m.trackedRepos {
		if repo.GitHubRepoID == githubRepoID {
			list = append(list, *repo)
		}
	}
	return list, nil
}

func TestInstallationStatusAndCallback(t *testing.T) {
	repo := newMockRepository()
	cfg := &config.Config{
		GitHubWebhookSecret: "secret",
	}
	svc := NewService(repo, cfg, nil)
	ctx := context.Background()

	// 1. Installation status uninstalled
	status, err := svc.GetInstallationStatus(ctx, "usr_1")
	if err != nil {
		t.Fatalf("GetInstallationStatus failed: %v", err)
	}
	if status.Installed {
		t.Fatalf("expected Installed to be false for new user")
	}

	// 2. Save installation callback
	status, err = svc.SaveInstallationCallback(ctx, "usr_1", InstallationCallbackRequest{InstallationID: 998877})
	if err != nil {
		t.Fatalf("SaveInstallationCallback failed: %v", err)
	}
	if !status.Installed || status.InstallationID != 998877 {
		t.Fatalf("unexpected installation status: %+v", status)
	}
}

func TestListUserRepositoriesUninstalled(t *testing.T) {
	repo := newMockRepository()
	cfg := &config.Config{
		GitHubWebhookSecret: "secret",
	}
	svc := NewService(repo, cfg, nil)
	ctx := context.Background()

	// Uninstalled user should return ErrInstallationNotFound
	_, err := svc.ListUserRepositories(ctx, "usr_2", "all")
	if err != ErrInstallationNotFound {
		t.Fatalf("expected ErrInstallationNotFound, got %v", err)
	}
}

func TestTrackAndUntrackRepository(t *testing.T) {
	repo := newMockRepository()
	cfg := &config.Config{
		GitHubWebhookSecret: "secret",
	}
	svc := NewService(repo, cfg, nil)
	ctx := context.Background()

	// Track repo
	tracked, err := svc.TrackRepository(ctx, "usr_1", TrackRepositoryRequest{
		GitHubRepoID:  101,
		RepoName:      "kr0n-server",
		FullName:      "kron/kr0n-server",
		OwnerLogin:    "kron",
		IsPrivate:     true,
		DefaultBranch: "main",
		HTMLURL:       "https://github.com/kron/kr0n-server",
	})
	if err != nil {
		t.Fatalf("TrackRepository failed: %v", err)
	}
	if tracked.FullName != "kron/kr0n-server" {
		t.Fatalf("unexpected tracked repo: %+v", tracked)
	}

	// List tracked repos
	list, err := svc.ListTrackedRepositories(ctx, "usr_1")
	if err != nil {
		t.Fatalf("ListTrackedRepositories failed: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 tracked repo, got %d", len(list))
	}

	// Untrack repo
	err = svc.UntrackRepository(ctx, "usr_1", tracked.ID)
	if err != nil {
		t.Fatalf("UntrackRepository failed: %v", err)
	}

	list, _ = svc.ListTrackedRepositories(ctx, "usr_1")
	if len(list) != 0 {
		t.Fatalf("expected 0 tracked repos after untrack, got %d", len(list))
	}
}

func TestHandleWebhookEventPush(t *testing.T) {
	repo := newMockRepository()
	webhookSecret := "my_webhook_secret_123"
	cfg := &config.Config{
		GitHubWebhookSecret: webhookSecret,
	}
	ghClient := pkgh.NewClient(12345, nil, webhookSecret)
	svc := NewService(repo, cfg, ghClient)
	ctx := context.Background()

	// Track repo ID 101 first
	_, _ = svc.TrackRepository(ctx, "usr_1", TrackRepositoryRequest{
		GitHubRepoID:  101,
		RepoName:      "kr0n-server",
		FullName:      "kron/kr0n-server",
		OwnerLogin:    "kron",
		DefaultBranch: "main",
		HTMLURL:       "https://github.com/kron/kr0n-server",
	})

	// Construct Webhook Payload for Push on Default Branch
	payload := map[string]any{
		"ref":   "refs/heads/main",
		"after": "c0ff33",
		"repository": map[string]any{
			"id":             101,
			"name":           "kr0n-server",
			"full_name":      "kron/kr0n-server",
			"default_branch": "main",
		},
		"pusher": map[string]any{
			"name": "nimit",
		},
	}

	payloadBytes, _ := json.Marshal(payload)

	// Sign payload
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(payloadBytes)
	signature := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	// Handle Webhook
	err := svc.HandleWebhookEvent(ctx, "push", signature, payloadBytes)
	if err != nil {
		t.Fatalf("HandleWebhookEvent failed for valid push event: %v", err)
	}

	// Non-default branch push should be ignored
	payload["ref"] = "refs/heads/feature-branch"
	payloadBytes2, _ := json.Marshal(payload)
	mac2 := hmac.New(sha256.New, []byte(webhookSecret))
	mac2.Write(payloadBytes2)
	sig2 := "sha256=" + hex.EncodeToString(mac2.Sum(nil))

	err = svc.HandleWebhookEvent(ctx, "push", sig2, payloadBytes2)
	if err != nil {
		t.Fatalf("HandleWebhookEvent failed for feature branch push: %v", err)
	}
}
