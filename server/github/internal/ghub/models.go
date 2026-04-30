package ghub

import (
	"time"

	"github.com/google/uuid"
)

// Base is the shared primary key + timestamp columns for all tables.
type Base struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Installation represents a GitHub App installation on a user or org account.
type Installation struct {
	Base

	InstallationID int64  `json:"installation_id"`
	AccountLogin   string `json:"account_login"`
	AccountType    string `json:"account_type"`
	AccountID      int64  `json:"account_id"`
	AppID          int64  `json:"app_id"`
	Suspended      bool   `json:"suspended"`
}

// Repo represents a GitHub repository associated with an installation.
// Named Repo (not Repository) to avoid collision with the DB Repository struct.
type Repo struct {
	Base

	InstallationID int64  `json:"installation_id"`
	GitHubRepoID   int64  `json:"github_repo_id"`
	Owner          string `json:"owner"`
	Name           string `json:"name"`
	FullName       string `json:"full_name"`
	DefaultBranch  string `json:"default_branch"`
	Private        bool   `json:"private"`
}

// ProjectRepoLink binds a deployment project to a repository and branch.
type ProjectRepoLink struct {
	Base

	ProjectID  uuid.UUID `json:"project_id"`
	RepoID     uuid.UUID `json:"repo_id"`
	Branch     string    `json:"branch"`
	AutoDeploy bool      `json:"auto_deploy"`
}
