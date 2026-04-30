package ghub

import (
	"time"

	"github.com/google/uuid"
)

// --- Request DTOs ---

// LinkRepoRequest binds a repository to a project for deployments.
type LinkRepoRequest struct {
	ProjectID  uuid.UUID `json:"project_id" binding:"required"`
	Branch     string    `json:"branch"`
	AutoDeploy *bool     `json:"auto_deploy"`
}

// --- Response DTOs ---

type InstallationResponse struct {
	ID             uuid.UUID `json:"id"`
	InstallationID int64     `json:"installation_id"`
	AccountLogin   string    `json:"account_login"`
	AccountType    string    `json:"account_type"`
	Suspended      bool      `json:"suspended"`
	CreatedAt      time.Time `json:"created_at"`
}

type RepositoryResponse struct {
	ID             uuid.UUID `json:"id"`
	InstallationID int64     `json:"installation_id"`
	GitHubRepoID   int64     `json:"github_repo_id"`
	Owner          string    `json:"owner"`
	Name           string    `json:"name"`
	FullName       string    `json:"full_name"`
	DefaultBranch  string    `json:"default_branch"`
	Private        bool      `json:"private"`
	CreatedAt      time.Time `json:"created_at"`
}

type ProjectRepoLinkResponse struct {
	ID         uuid.UUID          `json:"id"`
	ProjectID  uuid.UUID          `json:"project_id"`
	Branch     string             `json:"branch"`
	AutoDeploy bool               `json:"auto_deploy"`
	Repo       RepositoryResponse `json:"repository"`
	CreatedAt  time.Time          `json:"created_at"`
}

type RepoAccessResponse struct {
	CloneURL   string    `json:"clone_url,omitempty"`
	ArchiveURL string    `json:"archive_url,omitempty"`
	Token      string    `json:"token"`
	ExpiresAt  time.Time `json:"expires_at"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

type MessageResponse struct {
	Message string `json:"message" example:"success message"`
}

// --- Kafka Event DTOs ---

// DeployTriggerEvent is published to Kafka when a deployment-worthy event occurs.
type DeployTriggerEvent struct {
	EventID        string `json:"event_id"`
	DeliveryID     string `json:"delivery_id"`
	EventType      string `json:"event_type"`
	ProjectID      string `json:"project_id"`
	InstallationID int64  `json:"installation_id"`
	RepoID         string `json:"repo_id"`
	RepoFullName   string `json:"repo_full_name"`
	Branch         string `json:"branch"`
	CommitSHA      string `json:"commit_sha"`
	Sender         string `json:"sender"`
	Timestamp      string `json:"timestamp"`
}

// --- GitHub Webhook Payload DTOs ---

type WebhookInstallationEvent struct {
	Action       string `json:"action"`
	Installation struct {
		ID      int64  `json:"id"`
		AppID   int64  `json:"app_id"`
		Account struct {
			Login string `json:"login"`
			ID    int64  `json:"id"`
			Type  string `json:"type"`
		} `json:"account"`
		SuspendedAt *time.Time `json:"suspended_at"`
	} `json:"installation"`
	Repositories []struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		FullName string `json:"full_name"`
		Private  bool   `json:"private"`
	} `json:"repositories"`
	Sender struct {
		Login string `json:"login"`
	} `json:"sender"`
}

type WebhookInstallationReposEvent struct {
	Action       string `json:"action"`
	Installation struct {
		ID      int64 `json:"id"`
		Account struct {
			Login string `json:"login"`
			ID    int64  `json:"id"`
			Type  string `json:"type"`
		} `json:"account"`
	} `json:"installation"`
	RepositoriesAdded []struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		FullName string `json:"full_name"`
		Private  bool   `json:"private"`
	} `json:"repositories_added"`
	RepositoriesRemoved []struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		FullName string `json:"full_name"`
	} `json:"repositories_removed"`
	Sender struct {
		Login string `json:"login"`
	} `json:"sender"`
}

type WebhookPushEvent struct {
	Ref        string `json:"ref"`
	Before     string `json:"before"`
	After      string `json:"after"`
	Repository struct {
		ID            int64  `json:"id"`
		Name          string `json:"name"`
		FullName      string `json:"full_name"`
		Private       bool   `json:"private"`
		DefaultBranch string `json:"default_branch"`
	} `json:"repository"`
	Installation struct {
		ID int64 `json:"id"`
	} `json:"installation"`
	Sender struct {
		Login string `json:"login"`
	} `json:"sender"`
}

type WebhookPullRequestEvent struct {
	Action      string `json:"action"`
	Number      int    `json:"number"`
	PullRequest struct {
		Head struct {
			Ref string `json:"ref"`
			SHA string `json:"sha"`
		} `json:"head"`
		Base struct {
			Ref string `json:"ref"`
		} `json:"base"`
	} `json:"pull_request"`
	Repository struct {
		ID       int64  `json:"id"`
		FullName string `json:"full_name"`
	} `json:"repository"`
	Installation struct {
		ID int64 `json:"id"`
	} `json:"installation"`
	Sender struct {
		Login string `json:"login"`
	} `json:"sender"`
}

// --- GitHub API Response DTOs ---

type GitHubRepoInfo struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	FullName      string `json:"full_name"`
	Private       bool   `json:"private"`
	DefaultBranch string `json:"default_branch"`
	Owner         struct {
		Login string `json:"login"`
	} `json:"owner"`
}

type GitHubInstallationTokenResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}
