package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.kron.com/internal/api/config"
	pkgh "github.kron.com/pkg/github"
)

var (
	ErrInstallationNotFound = errors.New("github app installation not found for user")
	ErrRepoNotTracked       = errors.New("tracked repository not found")
)

type Service interface {
	GetInstallationStatus(ctx context.Context, userID string) (*InstallationStatusResponse, error)
	SaveInstallationCallback(ctx context.Context, userID string, req InstallationCallbackRequest) (*InstallationStatusResponse, error)
	ListUserRepositories(ctx context.Context, userID string, visibility string) ([]pkgh.RepositoryItem, error)
	TrackRepository(ctx context.Context, userID string, req TrackRepositoryRequest) (*TrackedRepositoryResponse, error)
	ListTrackedRepositories(ctx context.Context, userID string) ([]TrackedRepositoryResponse, error)
	UntrackRepository(ctx context.Context, userID string, repoID string) error
	HandleWebhookEvent(ctx context.Context, eventType string, signatureHeader string, body []byte) error
}

type githubService struct {
	repo     Repository
	cfg      *config.Config
	ghClient *pkgh.Client
}

func NewService(repo Repository, cfg *config.Config, ghClient *pkgh.Client) Service {
	if ghClient == nil {
		ghClient = pkgh.NewClient(cfg.GitHubAppID, cfg.GitHubPrivateKey, cfg.GitHubWebhookSecret)
	}

	return &githubService{
		repo:     repo,
		cfg:      cfg,
		ghClient: ghClient,
	}
}

func (s *githubService) GetInstallationStatus(ctx context.Context, userID string) (*InstallationStatusResponse, error) {
	inst, err := s.repo.GetInstallationByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return &InstallationStatusResponse{Installed: false}, nil
		}
		return nil, err
	}

	return &InstallationStatusResponse{
		Installed:      true,
		InstallationID: inst.InstallationID,
		AccountLogin:   inst.AccountLogin,
		AccountType:    inst.AccountType,
		AvatarURL:      inst.AvatarURL,
		UpdatedAt:      inst.UpdatedAt,
	}, nil
}

func (s *githubService) SaveInstallationCallback(ctx context.Context, userID string, req InstallationCallbackRequest) (*InstallationStatusResponse, error) {
	inst := &Installation{
		UserID:         userID,
		InstallationID: req.InstallationID,
		AccountLogin:   "github-user",
		AccountType:    "User",
	}

	if err := s.repo.SaveInstallation(ctx, inst); err != nil {
		return nil, fmt.Errorf("failed to save github installation: %w", err)
	}

	return s.GetInstallationStatus(ctx, userID)
}

func (s *githubService) ListUserRepositories(ctx context.Context, userID string, visibility string) ([]pkgh.RepositoryItem, error) {
	inst, err := s.repo.GetInstallationByUserID(ctx, userID)
	if err != nil {
		return nil, ErrInstallationNotFound
	}

	// 1. Get installation access token
	token, _, err := s.ghClient.ExchangeInstallationToken(ctx, inst.InstallationID)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange installation access token for installation ID %d: %w", inst.InstallationID, err)
	}

	// 2. Fetch user repositories directly from GitHub REST API
	repos, err := s.ghClient.ListInstallationRepositories(ctx, token, visibility)
	if err != nil {
		return nil, fmt.Errorf("failed to list github repositories: %w", err)
	}

	return repos, nil
}

func (s *githubService) TrackRepository(ctx context.Context, userID string, req TrackRepositoryRequest) (*TrackedRepositoryResponse, error) {
	defaultBranch := strings.TrimSpace(req.DefaultBranch)
	if defaultBranch == "" {
		defaultBranch = "main"
	}

	record := &TrackedRepo{
		UserID:        userID,
		GitHubRepoID:  req.GitHubRepoID,
		RepoName:      req.RepoName,
		FullName:      req.FullName,
		OwnerLogin:    req.OwnerLogin,
		IsPrivate:     req.IsPrivate,
		DefaultBranch: defaultBranch,
		HTMLURL:       req.HTMLURL,
	}

	if err := s.repo.TrackRepository(ctx, record); err != nil {
		return nil, fmt.Errorf("failed to track repository: %w", err)
	}

	return &TrackedRepositoryResponse{
		ID:            record.ID,
		UserID:        record.UserID,
		GitHubRepoID:  record.GitHubRepoID,
		RepoName:      record.RepoName,
		FullName:      record.FullName,
		OwnerLogin:    record.OwnerLogin,
		IsPrivate:     record.IsPrivate,
		DefaultBranch: record.DefaultBranch,
		HTMLURL:       record.HTMLURL,
		CreatedAt:     record.CreatedAt,
	}, nil
}

func (s *githubService) ListTrackedRepositories(ctx context.Context, userID string) ([]TrackedRepositoryResponse, error) {
	list, err := s.repo.GetTrackedRepositoriesByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]TrackedRepositoryResponse, 0, len(list))
	for _, item := range list {
		result = append(result, TrackedRepositoryResponse{
			ID:            item.ID,
			UserID:        item.UserID,
			GitHubRepoID:  item.GitHubRepoID,
			RepoName:      item.RepoName,
			FullName:      item.FullName,
			OwnerLogin:    item.OwnerLogin,
			IsPrivate:     item.IsPrivate,
			DefaultBranch: item.DefaultBranch,
			HTMLURL:       item.HTMLURL,
			CreatedAt:     item.CreatedAt,
		})
	}
	return result, nil
}

func (s *githubService) UntrackRepository(ctx context.Context, userID string, repoID string) error {
	return s.repo.UntrackRepository(ctx, userID, repoID)
}

func (s *githubService) HandleWebhookEvent(ctx context.Context, eventType string, signatureHeader string, body []byte) error {
	// 1. Verify HMAC-SHA256 webhook signature
	if err := s.ghClient.VerifyWebhookSignature(body, signatureHeader); err != nil {
		return fmt.Errorf("webhook signature verification failed: %w", err)
	}

	if eventType != "push" {
		log.Printf("[GITHUB WEBHOOK] Ignored non-push event type '%s'", eventType)
		return nil
	}

	// 2. Parse push event JSON directly
	var pushEvent struct {
		Ref   string `json:"ref"`
		After string `json:"after"`
		Repo  struct {
			ID            int64  `json:"id"`
			FullName      string `json:"full_name"`
			DefaultBranch string `json:"default_branch"`
		} `json:"repository"`
		Pusher struct {
			Name string `json:"name"`
		} `json:"pusher"`
	}

	if err := json.Unmarshal(body, &pushEvent); err != nil {
		return fmt.Errorf("invalid push webhook payload JSON: %w", err)
	}

	// 3. Check if pushed repository is tracked by any user
	trackedRepos, err := s.repo.GetTrackedRepositoryByGitHubID(ctx, pushEvent.Repo.ID)
	if err != nil || len(trackedRepos) == 0 {
		log.Printf("[GITHUB WEBHOOK] Push event ignored: repository '%s' (ID: %d) is not tracked", pushEvent.Repo.FullName, pushEvent.Repo.ID)
		return nil
	}

	// 4. Verify push is on default branch
	defaultRef := "refs/heads/" + pushEvent.Repo.DefaultBranch
	if pushEvent.Repo.DefaultBranch == "" {
		defaultRef = "refs/heads/main"
	}

	if pushEvent.Ref != defaultRef && pushEvent.Ref != "refs/heads/master" {
		log.Printf("[GITHUB WEBHOOK] Push event ignored: ref '%s' is not default branch '%s'", pushEvent.Ref, defaultRef)
		return nil
	}

	// 5. Log Push Detection
	log.Printf("[GITHUB PUSH DETECTED] [TODO: Publish Push Event to Kafka] Repository: %s (ID: %d) | Ref: %s | Commit: %s | Pusher: %s | Tracked By Users: %d",
		pushEvent.Repo.FullName, pushEvent.Repo.ID, pushEvent.Ref, pushEvent.After, pushEvent.Pusher.Name, len(trackedRepos))

	return nil
}
