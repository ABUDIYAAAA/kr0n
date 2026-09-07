package github

import "time"

// InstallationStatusResponse payload indicating whether user has installed GitHub App.
type InstallationStatusResponse struct {
	Installed      bool      `json:"installed"`
	InstallationID int64     `json:"installation_id,omitempty"`
	AccountLogin   string    `json:"account_login,omitempty"`
	AccountType    string    `json:"account_type,omitempty"`
	AvatarURL      string    `json:"avatar_url,omitempty"`
	UpdatedAt      time.Time `json:"updated_at,omitempty"`
}

// InstallationCallbackRequest query or body parameters received after app installation.
type InstallationCallbackRequest struct {
	InstallationID int64  `json:"installation_id" validate:"required"`
	SetupAction    string `json:"setup_action,omitempty"`
}

// TrackRepositoryRequest payload for adding a repository to user deployment tracking.
type TrackRepositoryRequest struct {
	GitHubRepoID  int64  `json:"github_repo_id" validate:"required"`
	RepoName      string `json:"repo_name" validate:"required"`
	FullName      string `json:"full_name" validate:"required"`
	OwnerLogin    string `json:"owner_login" validate:"required"`
	IsPrivate     bool   `json:"is_private"`
	DefaultBranch string `json:"default_branch" validate:"required"`
	HTMLURL       string `json:"html_url" validate:"required"`
}

// TrackedRepositoryResponse payload details for tracked user repository.
type TrackedRepositoryResponse struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	GitHubRepoID  int64     `json:"github_repo_id"`
	RepoName      string    `json:"repo_name"`
	FullName      string    `json:"full_name"`
	OwnerLogin    string    `json:"owner_login"`
	IsPrivate     bool      `json:"is_private"`
	DefaultBranch string    `json:"default_branch"`
	HTMLURL       string    `json:"html_url"`
	CreatedAt     time.Time `json:"created_at"`
}
