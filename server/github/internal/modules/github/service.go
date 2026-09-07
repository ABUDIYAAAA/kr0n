package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.kron.com/internal/api/config"
	pkgh "github.kron.com/pkg/github"
	pkfk "github.kron.com/pkg/kafka"
	"github.kron.com/pkg/response"
)

var (
	ErrInstallationNotFound = errors.New("github app installation not found for user")
	ErrRepoNotTracked       = errors.New("tracked repository not found")
)

type Service interface {
	GetInstallationStatus(ctx context.Context, userID string) (*InstallationStatusResponse, error)
	SaveInstallationCallback(ctx context.Context, userID string, req InstallationCallbackRequest) (*InstallationStatusResponse, error)
	ListUserRepositories(ctx context.Context, userID string, visibility string, page, limit int) ([]pkgh.RepositoryItem, response.PaginationMeta, error)
	ListRepositoryContents(ctx context.Context, userID string, repoFullName string, branch string, path string) ([]pkgh.ContentItem, error)
	TrackRepository(ctx context.Context, userID string, req TrackRepositoryRequest) (*TrackedRepositoryResponse, error)
	ListTrackedRepositories(ctx context.Context, userID string, page, limit int) ([]TrackedRepositoryResponse, response.PaginationMeta, error)
	UntrackRepository(ctx context.Context, userID string, repoID string) error
	HandleWebhookEvent(ctx context.Context, eventType string, signatureHeader string, body []byte) error
}

type githubService struct {
	repo          Repository
	cfg           *config.Config
	ghClient      *pkgh.Client
	kafkaProducer *pkfk.Producer
}

func NewService(repo Repository, cfg *config.Config, ghClient *pkgh.Client, kafkaProducer *pkfk.Producer) Service {
	if ghClient == nil {
		ghClient = pkgh.NewClient(cfg.GitHubAppID, cfg.GitHubPrivateKey, cfg.GitHubWebhookSecret)
	}

	return &githubService{
		repo:          repo,
		cfg:           cfg,
		ghClient:      ghClient,
		kafkaProducer: kafkaProducer,
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

func (s *githubService) ListUserRepositories(ctx context.Context, userID string, visibility string, page, limit int) ([]pkgh.RepositoryItem, response.PaginationMeta, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	inst, err := s.repo.GetInstallationByUserID(ctx, userID)
	if err != nil {
		return nil, response.PaginationMeta{}, ErrInstallationNotFound
	}

	// 1. Get installation access token
	token, _, err := s.ghClient.ExchangeInstallationToken(ctx, inst.InstallationID)
	if err != nil {
		return nil, response.PaginationMeta{}, fmt.Errorf("failed to exchange installation access token for installation ID %d: %w", inst.InstallationID, err)
	}

	// 2. Fetch user repositories directly from GitHub REST API
	repos, err := s.ghClient.ListInstallationRepositories(ctx, token, visibility)
	if err != nil {
		return nil, response.PaginationMeta{}, fmt.Errorf("failed to list github repositories: %w", err)
	}

	totalCount := int64(len(repos))
	start := (page - 1) * limit
	if start > int(totalCount) {
		start = int(totalCount)
	}
	end := start + limit
	if end > int(totalCount) {
		end = int(totalCount)
	}

	slicedRepos := repos[start:end]
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

	return slicedRepos, meta, nil
}

func (s *githubService) ListRepositoryContents(ctx context.Context, userID string, repoFullName string, branch string, path string) ([]pkgh.ContentItem, error) {
	inst, err := s.repo.GetInstallationByUserID(ctx, userID)
	if err != nil {
		return nil, ErrInstallationNotFound
	}

	token, _, err := s.ghClient.ExchangeInstallationToken(ctx, inst.InstallationID)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange installation token: %w", err)
	}

	parts := strings.Split(repoFullName, "/")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid repository full name '%s'", repoFullName)
	}

	return s.ghClient.ListRepositoryContents(ctx, token, parts[0], parts[1], branch, path)
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

func (s *githubService) ListTrackedRepositories(ctx context.Context, userID string, page, limit int) ([]TrackedRepositoryResponse, response.PaginationMeta, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	list, totalCount, err := s.repo.GetTrackedRepositoriesByUserID(ctx, userID, page, limit)
	if err != nil {
		return nil, response.PaginationMeta{}, err
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

	// 5. Publish Deployment Trigger Event to Kafka
	log.Printf("[GITHUB PUSH DETECTED] Repository: %s (ID: %d) | Ref: %s | Commit: %s | Pusher: %s | Tracked By Users: %d",
		pushEvent.Repo.FullName, pushEvent.Repo.ID, pushEvent.Ref, pushEvent.After, pushEvent.Pusher.Name, len(trackedRepos))

	if s.kafkaProducer != nil {
		userIDs := make([]string, 0, len(trackedRepos))
		for _, tr := range trackedRepos {
			userIDs = append(userIDs, tr.UserID)
		}

		evtMap := map[string]any{
			"event_id":       uuid.NewString(),
			"event_type":     "DEPLOYMENT_TRIGGERED",
			"github_repo_id": pushEvent.Repo.ID,
			"repo_full_name": pushEvent.Repo.FullName,
			"ref":            pushEvent.Ref,
			"commit_sha":     pushEvent.After,
			"pusher":         pushEvent.Pusher.Name,
			"user_ids":       userIDs,
			"triggered_at":   time.Now().UTC().Format(time.RFC3339),
		}
		evtBytes, _ := json.Marshal(evtMap)
		idempotencyKey := fmt.Sprintf("deploy_push:%d:%s", pushEvent.Repo.ID, pushEvent.After)

		if err := s.kafkaProducer.PublishEvent(ctx, idempotencyKey, evtBytes); err != nil {
			log.Printf("[GITHUB WEBHOOK KAFKA ERROR] Failed to publish deployment trigger event: %v", err)
		} else {
			log.Printf("[GITHUB WEBHOOK KAFKA SUCCESS] Published deployment trigger event for repo %s (Commit: %s)", pushEvent.Repo.FullName, pushEvent.After)
		}
	}

	return nil
}
