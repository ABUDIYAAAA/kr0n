package ghub

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

// EventPublisher is the interface for publishing deployment trigger events.
type EventPublisher interface {
	PublishDeployTrigger(ctx context.Context, event DeployTriggerEvent) error
}

// Service encapsulates all business logic for the github module.
type Service struct {
	repo      *Repository
	gh        *GitHubClient
	publisher EventPublisher
}

// NewService creates a new service with the given dependencies.
func NewService(repo *Repository, gh *GitHubClient, publisher EventPublisher) *Service {
	return &Service{
		repo:      repo,
		gh:        gh,
		publisher: publisher,
	}
}

// --- Installation Management ---

func (s *Service) ListInstallations(ctx context.Context) ([]Installation, error) {
	return s.repo.ListInstallations(ctx)
}

func (s *Service) GetInstallation(ctx context.Context, installationID int64) (*Installation, error) {
	return s.repo.GetInstallationByID(ctx, installationID)
}

// --- Repository Management ---

func (s *Service) ListReposByInstallation(ctx context.Context, installationID int64) ([]Repo, error) {
	return s.repo.ListReposByInstallation(ctx, installationID)
}

func (s *Service) ListAllRepos(ctx context.Context, installationID *int64) ([]Repo, error) {
	return s.repo.ListAllRepos(ctx, installationID)
}

func (s *Service) SyncInstallationRepos(ctx context.Context, installationID int64) ([]Repo, error) {
	remoteRepos, err := s.gh.ListInstallationRepos(ctx, installationID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch repos from github: %w", err)
	}

	inst, err := s.repo.GetInstallationByID(ctx, installationID)
	if err != nil {
		return nil, err
	}

	var synced []Repo
	for _, remote := range remoteRepos {
		owner := remote.Owner.Login
		if owner == "" {
			parts := strings.SplitN(remote.FullName, "/", 2)
			if len(parts) == 2 {
				owner = parts[0]
			} else {
				owner = inst.AccountLogin
			}
		}

		repo := &Repo{
			InstallationID: installationID,
			GitHubRepoID:   remote.ID,
			Owner:          owner,
			Name:           remote.Name,
			FullName:       remote.FullName,
			DefaultBranch:  remote.DefaultBranch,
			Private:        remote.Private,
		}

		saved, err := s.repo.UpsertRepo(ctx, repo)
		if err != nil {
			log.Printf("warn: failed to upsert repo %s: %v", remote.FullName, err)
			continue
		}
		synced = append(synced, *saved)
	}

	return synced, nil
}

// --- Project Linking ---

func (s *Service) LinkRepoToProject(ctx context.Context, repoID uuid.UUID, req LinkRepoRequest) (*ProjectRepoLink, error) {
	repo, err := s.repo.GetRepoByID(ctx, repoID)
	if err != nil {
		return nil, err
	}

	projectID := uuid.New()
	if req.ProjectID != nil && *req.ProjectID != uuid.Nil {
		projectID = *req.ProjectID
	}

	branch := strings.TrimSpace(req.Branch)
	if branch == "" {
		branch = "main"
	}

	autoDeploy := true
	if req.AutoDeploy != nil {
		autoDeploy = *req.AutoDeploy
	}

	link := &ProjectRepoLink{
		ProjectID:  projectID,
		RepoID:     repoID,
		Branch:     branch,
		AutoDeploy: autoDeploy,
	}

	saved, err := s.repo.CreateLink(ctx, link)
	if err != nil {
		return nil, err
	}

	trigger := DeployTriggerEvent{
		EventID:        uuid.NewString(),
		EventType:      "project.linked",
		ProjectID:      projectID.String(),
		InstallationID: repo.InstallationID,
		RepoID:         repoID.String(),
		RepoFullName:   repo.FullName,
		Branch:         branch,
		Sender:         "system",
		Timestamp:      time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.publisher.PublishDeployTrigger(ctx, trigger); err != nil {
		log.Printf("warn: failed to publish deploy trigger for new project %s: %v", projectID, err)
	}

	return saved, nil
}

func (s *Service) GetLinkByProjectID(ctx context.Context, projectID uuid.UUID) (*ProjectRepoLink, error) {
	return s.repo.GetLinkByProjectID(ctx, projectID)
}

func (s *Service) DeleteLinkByID(ctx context.Context, linkID uuid.UUID) error {
	return s.repo.DeleteLinkByID(ctx, linkID)
}

func (s *Service) UnlinkRepo(ctx context.Context, repoID uuid.UUID) error {
	return s.repo.DeleteLinkByRepoID(ctx, repoID)
}

// --- Repo Access (for Build Workers) ---

func (s *Service) GetRepoArchiveAccess(ctx context.Context, repoID uuid.UUID) (*RepoAccessResponse, error) {
	repo, err := s.repo.GetRepoByID(ctx, repoID)
	if err != nil {
		return nil, err
	}

	archiveURL, token, expiresAt, err := s.gh.GetRepoArchiveURL(ctx, repo.InstallationID, repo.Owner, repo.Name, repo.DefaultBranch)
	if err != nil {
		return nil, err
	}

	return &RepoAccessResponse{
		ArchiveURL: archiveURL,
		Token:      token,
		ExpiresAt:  expiresAt,
	}, nil
}

func (s *Service) GetRepoCloneAccess(ctx context.Context, repoID uuid.UUID) (*RepoAccessResponse, error) {
	repo, err := s.repo.GetRepoByID(ctx, repoID)
	if err != nil {
		return nil, err
	}

	cloneURL, token, expiresAt, err := s.gh.GetAuthenticatedCloneURL(ctx, repo.InstallationID, repo.Owner, repo.Name)
	if err != nil {
		return nil, err
	}

	return &RepoAccessResponse{
		CloneURL:  cloneURL,
		Token:     token,
		ExpiresAt: expiresAt,
	}, nil
}

// --- Webhook Processing ---

func (s *Service) HandleWebhook(ctx context.Context, payload *WebhookPayload) error {
	switch payload.EventType {
	case "installation":
		return s.handleInstallationEvent(ctx, payload)
	case "installation_repositories":
		return s.handleInstallationReposEvent(ctx, payload)
	case "push":
		return s.handlePushEvent(ctx, payload)
	case "pull_request":
		return s.handlePullRequestEvent(ctx, payload)
	default:
		log.Printf("info: ignoring webhook event type: %s", payload.EventType)
		return nil
	}
}

func (s *Service) handleInstallationEvent(ctx context.Context, payload *WebhookPayload) error {
	var event WebhookInstallationEvent
	if err := json.Unmarshal(payload.Body, &event); err != nil {
		return fmt.Errorf("failed to parse installation event: %w", err)
	}

	switch event.Action {
	case "created":
		inst := &Installation{
			InstallationID: event.Installation.ID,
			AccountLogin:   event.Installation.Account.Login,
			AccountType:    event.Installation.Account.Type,
			AccountID:      event.Installation.Account.ID,
			AppID:          event.Installation.AppID,
			Suspended:      false,
		}

		if _, err := s.repo.UpsertInstallation(ctx, inst); err != nil {
			return fmt.Errorf("failed to save installation: %w", err)
		}

		for _, r := range event.Repositories {
			owner := event.Installation.Account.Login
			repo := &Repo{
				InstallationID: event.Installation.ID,
				GitHubRepoID:   r.ID,
				Owner:          owner,
				Name:           r.Name,
				FullName:       r.FullName,
				Private:        r.Private,
				DefaultBranch:  "main",
			}
			if _, err := s.repo.UpsertRepo(ctx, repo); err != nil {
				log.Printf("warn: failed to save repo %s during installation: %v", r.FullName, err)
			}
		}

		log.Printf("info: installation created: %d for %s", event.Installation.ID, event.Installation.Account.Login)

	case "deleted":
		if err := s.repo.DeleteInstallation(ctx, event.Installation.ID); err != nil {
			log.Printf("warn: failed to delete installation %d: %v", event.Installation.ID, err)
		}
		log.Printf("info: installation deleted: %d", event.Installation.ID)

	case "suspend":
		if err := s.repo.SuspendInstallation(ctx, event.Installation.ID, true); err != nil {
			log.Printf("warn: failed to suspend installation %d: %v", event.Installation.ID, err)
		}

	case "unsuspend":
		if err := s.repo.SuspendInstallation(ctx, event.Installation.ID, false); err != nil {
			log.Printf("warn: failed to unsuspend installation %d: %v", event.Installation.ID, err)
		}
	}

	return nil
}

func (s *Service) handleInstallationReposEvent(ctx context.Context, payload *WebhookPayload) error {
	var event WebhookInstallationReposEvent
	if err := json.Unmarshal(payload.Body, &event); err != nil {
		return fmt.Errorf("failed to parse installation_repositories event: %w", err)
	}

	owner := event.Installation.Account.Login

	for _, r := range event.RepositoriesAdded {
		repo := &Repo{
			InstallationID: event.Installation.ID,
			GitHubRepoID:   r.ID,
			Owner:          owner,
			Name:           r.Name,
			FullName:       r.FullName,
			Private:        r.Private,
			DefaultBranch:  "main",
		}
		if _, err := s.repo.UpsertRepo(ctx, repo); err != nil {
			log.Printf("warn: failed to add repo %s: %v", r.FullName, err)
		}
	}

	if len(event.RepositoriesRemoved) > 0 {
		ids := make([]int64, len(event.RepositoriesRemoved))
		for i, r := range event.RepositoriesRemoved {
			ids[i] = r.ID
		}
		if err := s.repo.DeleteReposByGitHubIDs(ctx, ids); err != nil {
			log.Printf("warn: failed to remove repos: %v", err)
		}
	}

	return nil
}

// extractOwner safely extracts the owner from "owner/repo", returning fallback if malformed.
func extractOwner(fullName, fallback string) string {
	parts := strings.SplitN(fullName, "/", 2)
	if len(parts) == 2 && parts[0] != "" {
		return parts[0]
	}
	return fallback
}

func (s *Service) handlePushEvent(ctx context.Context, payload *WebhookPayload) error {
	var event WebhookPushEvent
	if err := json.Unmarshal(payload.Body, &event); err != nil {
		return fmt.Errorf("failed to parse push event: %w", err)
	}

	branch := ExtractBranchFromRef(event.Ref)

	owner := extractOwner(event.Repository.FullName, "")
	repo := &Repo{
		InstallationID: event.Installation.ID,
		GitHubRepoID:   event.Repository.ID,
		Owner:          owner,
		Name:           event.Repository.Name,
		FullName:       event.Repository.FullName,
		DefaultBranch:  event.Repository.DefaultBranch,
		Private:        event.Repository.Private,
	}
	savedRepo, err := s.repo.UpsertRepo(ctx, repo)
	if err != nil {
		log.Printf("warn: failed to update repo metadata on push: %v", err)
	}

	links, err := s.repo.GetAutoDeployLinks(ctx, event.Repository.FullName, branch)
	if err != nil {
		log.Printf("warn: failed to lookup deploy links for %s@%s: %v", event.Repository.FullName, branch, err)
		return nil
	}

	if len(links) == 0 {
		log.Printf("info: push to %s@%s — no linked projects", event.Repository.FullName, branch)
		return nil
	}

	repoIDStr := ""
	if savedRepo != nil {
		repoIDStr = savedRepo.ID.String()
	}

	for _, link := range links {
		trigger := DeployTriggerEvent{
			EventID:        uuid.NewString(),
			DeliveryID:     payload.DeliveryID,
			EventType:      "repo.push",
			ProjectID:      link.ProjectID.String(),
			InstallationID: event.Installation.ID,
			RepoID:         repoIDStr,
			RepoFullName:   event.Repository.FullName,
			Branch:         branch,
			CommitSHA:      event.After,
			Sender:         event.Sender.Login,
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
		}

		if err := s.publisher.PublishDeployTrigger(ctx, trigger); err != nil {
			log.Printf("error: failed to publish deploy trigger for project %s: %v", link.ProjectID, err)
		} else {
			log.Printf("info: deploy trigger published for project %s (repo %s@%s)", link.ProjectID, event.Repository.FullName, branch)
		}
	}

	return nil
}

func (s *Service) handlePullRequestEvent(ctx context.Context, payload *WebhookPayload) error {
	var event WebhookPullRequestEvent
	if err := json.Unmarshal(payload.Body, &event); err != nil {
		return fmt.Errorf("failed to parse pull_request event: %w", err)
	}

	if event.Action != "opened" && event.Action != "synchronize" && event.Action != "reopened" {
		return nil
	}

	repoIDStr := ""
	dbRepo, err := s.repo.GetRepoByFullName(ctx, event.Repository.FullName)
	if err == nil {
		repoIDStr = dbRepo.ID.String()
	}

	trigger := DeployTriggerEvent{
		EventID:        uuid.NewString(),
		DeliveryID:     payload.DeliveryID,
		EventType:      "repo.pull_request",
		InstallationID: event.Installation.ID,
		RepoID:         repoIDStr,
		RepoFullName:   event.Repository.FullName,
		Branch:         event.PullRequest.Head.Ref,
		CommitSHA:      event.PullRequest.Head.SHA,
		Sender:         event.Sender.Login,
		Timestamp:      time.Now().UTC().Format(time.RFC3339),
	}

	if err := s.publisher.PublishDeployTrigger(ctx, trigger); err != nil {
		log.Printf("error: failed to publish PR deploy trigger: %v", err)
	}

	return nil
}
