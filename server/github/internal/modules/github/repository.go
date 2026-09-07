package github

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var (
	ErrNotFound = errors.New("record not found")
	ErrConflict = errors.New("record already exists")
)

type Installation struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	InstallationID int64     `json:"installation_id"`
	AccountLogin   string    `json:"account_login"`
	AccountType    string    `json:"account_type"`
	AvatarURL      string    `json:"avatar_url"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type TrackedRepo struct {
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
	UpdatedAt     time.Time `json:"updated_at"`
}

type Repository interface {
	SaveInstallation(ctx context.Context, inst *Installation) error
	GetInstallationByUserID(ctx context.Context, userID string) (*Installation, error)
	GetInstallationByInstallationID(ctx context.Context, instID int64) (*Installation, error)
	TrackRepository(ctx context.Context, repo *TrackedRepo) error
	UntrackRepository(ctx context.Context, userID string, repoID string) error
	GetTrackedRepositoriesByUserID(ctx context.Context, userID string) ([]TrackedRepo, error)
	GetTrackedRepositoryByGitHubID(ctx context.Context, githubRepoID int64) ([]TrackedRepo, error)
}

type githubRepository struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewRepository(db *pgxpool.Pool, redisClient *redis.Client) Repository {
	return &githubRepository{
		db:    db,
		redis: redisClient,
	}
}

func (r *githubRepository) SaveInstallation(ctx context.Context, inst *Installation) error {
	if r.db == nil {
		return nil
	}

	if inst.ID == "" {
		inst.ID = "inst_" + uuid.NewString()
	}

	query := `
		INSERT INTO github_installations (id, user_id, installation_id, account_login, account_type, avatar_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (installation_id) DO UPDATE
		SET user_id = EXCLUDED.user_id,
		    account_login = EXCLUDED.account_login,
		    account_type = EXCLUDED.account_type,
		    avatar_url = EXCLUDED.avatar_url,
		    updated_at = EXCLUDED.updated_at
	`
	now := time.Now().UTC()
	_, err := r.db.Exec(ctx, query, inst.ID, inst.UserID, inst.InstallationID, inst.AccountLogin, inst.AccountType, inst.AvatarURL, now, now)
	if err != nil {
		return fmt.Errorf("failed to save installation: %w", err)
	}
	return nil
}

func (r *githubRepository) GetInstallationByUserID(ctx context.Context, userID string) (*Installation, error) {
	if r.db == nil {
		return nil, ErrNotFound
	}

	query := `
		SELECT id, user_id, installation_id, account_login, account_type, avatar_url, created_at, updated_at
		FROM github_installations
		WHERE user_id = $1
		ORDER BY updated_at DESC
		LIMIT 1
	`
	inst := &Installation{}
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&inst.ID, &inst.UserID, &inst.InstallationID, &inst.AccountLogin, &inst.AccountType, &inst.AvatarURL, &inst.CreatedAt, &inst.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to query installation by user_id: %w", err)
	}
	return inst, nil
}

func (r *githubRepository) GetInstallationByInstallationID(ctx context.Context, instID int64) (*Installation, error) {
	if r.db == nil {
		return nil, ErrNotFound
	}

	query := `
		SELECT id, user_id, installation_id, account_login, account_type, avatar_url, created_at, updated_at
		FROM github_installations
		WHERE installation_id = $1
		LIMIT 1
	`
	inst := &Installation{}
	err := r.db.QueryRow(ctx, query, instID).Scan(
		&inst.ID, &inst.UserID, &inst.InstallationID, &inst.AccountLogin, &inst.AccountType, &inst.AvatarURL, &inst.CreatedAt, &inst.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to query installation by installation_id: %w", err)
	}
	return inst, nil
}

func (r *githubRepository) TrackRepository(ctx context.Context, repo *TrackedRepo) error {
	if r.db == nil {
		return nil
	}

	if repo.ID == "" {
		repo.ID = "repo_" + uuid.NewString()
	}

	query := `
		INSERT INTO github_tracked_repos (id, user_id, github_repo_id, repo_name, full_name, owner_login, is_private, default_branch, html_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (user_id, github_repo_id) DO UPDATE
		SET repo_name = EXCLUDED.repo_name,
		    full_name = EXCLUDED.full_name,
		    owner_login = EXCLUDED.owner_login,
		    is_private = EXCLUDED.is_private,
		    default_branch = EXCLUDED.default_branch,
		    html_url = EXCLUDED.html_url,
		    updated_at = EXCLUDED.updated_at
	`
	now := time.Now().UTC()
	_, err := r.db.Exec(ctx, query, repo.ID, repo.UserID, repo.GitHubRepoID, repo.RepoName, repo.FullName, repo.OwnerLogin, repo.IsPrivate, repo.DefaultBranch, repo.HTMLURL, now, now)
	if err != nil {
		return fmt.Errorf("failed to track repository: %w", err)
	}
	return nil
}

func (r *githubRepository) UntrackRepository(ctx context.Context, userID string, repoID string) error {
	if r.db == nil {
		return nil
	}

	query := `DELETE FROM github_tracked_repos WHERE user_id = $1 AND (id = $2 OR github_repo_id::text = $2)`
	res, err := r.db.Exec(ctx, query, userID, repoID)
	if err != nil {
		return fmt.Errorf("failed to untrack repository: %w", err)
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *githubRepository) GetTrackedRepositoriesByUserID(ctx context.Context, userID string) ([]TrackedRepo, error) {
	if r.db == nil {
		return []TrackedRepo{}, nil
	}

	query := `
		SELECT id, user_id, github_repo_id, repo_name, full_name, owner_login, is_private, default_branch, html_url, created_at, updated_at
		FROM github_tracked_repos
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list tracked repositories: %w", err)
	}
	defer rows.Close()

	var list []TrackedRepo
	for rows.Next() {
		var item TrackedRepo
		if err := rows.Scan(&item.ID, &item.UserID, &item.GitHubRepoID, &item.RepoName, &item.FullName, &item.OwnerLogin, &item.IsPrivate, &item.DefaultBranch, &item.HTMLURL, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, nil
}

func (r *githubRepository) GetTrackedRepositoryByGitHubID(ctx context.Context, githubRepoID int64) ([]TrackedRepo, error) {
	if r.db == nil {
		return []TrackedRepo{}, nil
	}

	query := `
		SELECT id, user_id, github_repo_id, repo_name, full_name, owner_login, is_private, default_branch, html_url, created_at, updated_at
		FROM github_tracked_repos
		WHERE github_repo_id = $1
	`
	rows, err := r.db.Query(ctx, query, githubRepoID)
	if err != nil {
		return nil, fmt.Errorf("failed to query tracked repos by github id: %w", err)
	}
	defer rows.Close()

	var list []TrackedRepo
	for rows.Next() {
		var item TrackedRepo
		if err := rows.Scan(&item.ID, &item.UserID, &item.GitHubRepoID, &item.RepoName, &item.FullName, &item.OwnerLogin, &item.IsPrivate, &item.DefaultBranch, &item.HTMLURL, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, nil
}
