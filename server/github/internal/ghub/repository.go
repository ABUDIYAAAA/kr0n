package ghub

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations for the github module.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new repository with the given database pool.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// --- Installations ---

func (r *Repository) UpsertInstallation(ctx context.Context, inst *Installation) (*Installation, error) {
	query := `
		INSERT INTO installations (installation_id, account_login, account_type, account_id, app_id, suspended)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (installation_id) DO UPDATE SET
			account_login = EXCLUDED.account_login,
			account_type  = EXCLUDED.account_type,
			account_id    = EXCLUDED.account_id,
			app_id        = EXCLUDED.app_id,
			suspended     = EXCLUDED.suspended,
			updated_at    = now()
		RETURNING id, installation_id, account_login, account_type, account_id, app_id, suspended, created_at, updated_at`

	var out Installation
	err := r.db.QueryRow(ctx, query,
		inst.InstallationID, inst.AccountLogin, inst.AccountType,
		inst.AccountID, inst.AppID, inst.Suspended,
	).Scan(
		&out.ID, &out.InstallationID, &out.AccountLogin, &out.AccountType,
		&out.AccountID, &out.AppID, &out.Suspended, &out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *Repository) GetInstallationByID(ctx context.Context, installationID int64) (*Installation, error) {
	query := `
		SELECT id, installation_id, account_login, account_type, account_id, app_id, suspended, created_at, updated_at
		FROM installations WHERE installation_id = $1`

	var out Installation
	err := r.db.QueryRow(ctx, query, installationID).Scan(
		&out.ID, &out.InstallationID, &out.AccountLogin, &out.AccountType,
		&out.AccountID, &out.AppID, &out.Suspended, &out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInstallationNotFound
		}
		return nil, err
	}
	return &out, nil
}

func (r *Repository) ListInstallations(ctx context.Context) ([]Installation, error) {
	query := `
		SELECT id, installation_id, account_login, account_type, account_id, app_id, suspended, created_at, updated_at
		FROM installations ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Installation
	for rows.Next() {
		var inst Installation
		if err := rows.Scan(
			&inst.ID, &inst.InstallationID, &inst.AccountLogin, &inst.AccountType,
			&inst.AccountID, &inst.AppID, &inst.Suspended, &inst.CreatedAt, &inst.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, inst)
	}
	return out, rows.Err()
}

func (r *Repository) DeleteInstallation(ctx context.Context, installationID int64) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM installations WHERE installation_id = $1`, installationID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrInstallationNotFound
	}
	return nil
}

func (r *Repository) SuspendInstallation(ctx context.Context, installationID int64, suspended bool) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE installations SET suspended = $1, updated_at = now() WHERE installation_id = $2`,
		suspended, installationID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrInstallationNotFound
	}
	return nil
}

// --- Repositories ---

func (r *Repository) UpsertRepo(ctx context.Context, repo *Repo) (*Repo, error) {
	query := `
		INSERT INTO repositories (installation_id, github_repo_id, owner, name, full_name, default_branch, private)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (github_repo_id) DO UPDATE SET
			installation_id = EXCLUDED.installation_id,
			owner           = EXCLUDED.owner,
			name            = EXCLUDED.name,
			full_name       = EXCLUDED.full_name,
			default_branch  = EXCLUDED.default_branch,
			private         = EXCLUDED.private,
			updated_at      = now()
		RETURNING id, installation_id, github_repo_id, owner, name, full_name, default_branch, private, created_at, updated_at`

	var out Repo
	err := r.db.QueryRow(ctx, query,
		repo.InstallationID, repo.GitHubRepoID, repo.Owner,
		repo.Name, repo.FullName, repo.DefaultBranch, repo.Private,
	).Scan(
		&out.ID, &out.InstallationID, &out.GitHubRepoID, &out.Owner,
		&out.Name, &out.FullName, &out.DefaultBranch, &out.Private,
		&out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *Repository) ListReposByInstallation(ctx context.Context, installationID int64) ([]Repo, error) {
	query := `
		SELECT id, installation_id, github_repo_id, owner, name, full_name, default_branch, private, created_at, updated_at
		FROM repositories WHERE installation_id = $1 ORDER BY full_name`

	rows, err := r.db.Query(ctx, query, installationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Repo
	for rows.Next() {
		var repo Repo
		if err := rows.Scan(
			&repo.ID, &repo.InstallationID, &repo.GitHubRepoID, &repo.Owner,
			&repo.Name, &repo.FullName, &repo.DefaultBranch, &repo.Private,
			&repo.CreatedAt, &repo.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, repo)
	}
	return out, rows.Err()
}

func (r *Repository) GetRepoByID(ctx context.Context, id uuid.UUID) (*Repo, error) {
	query := `
		SELECT id, installation_id, github_repo_id, owner, name, full_name, default_branch, private, created_at, updated_at
		FROM repositories WHERE id = $1`

	var out Repo
	err := r.db.QueryRow(ctx, query, id).Scan(
		&out.ID, &out.InstallationID, &out.GitHubRepoID, &out.Owner,
		&out.Name, &out.FullName, &out.DefaultBranch, &out.Private,
		&out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRepositoryNotFound
		}
		return nil, err
	}
	return &out, nil
}

func (r *Repository) GetRepoByFullName(ctx context.Context, fullName string) (*Repo, error) {
	query := `
		SELECT id, installation_id, github_repo_id, owner, name, full_name, default_branch, private, created_at, updated_at
		FROM repositories WHERE full_name = $1`

	var out Repo
	err := r.db.QueryRow(ctx, query, fullName).Scan(
		&out.ID, &out.InstallationID, &out.GitHubRepoID, &out.Owner,
		&out.Name, &out.FullName, &out.DefaultBranch, &out.Private,
		&out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRepositoryNotFound
		}
		return nil, err
	}
	return &out, nil
}

func (r *Repository) DeleteReposByGitHubIDs(ctx context.Context, ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	_, err := r.db.Exec(ctx, `DELETE FROM repositories WHERE github_repo_id = ANY($1)`, ids)
	return err
}

// --- Project Repo Links ---

func (r *Repository) CreateLink(ctx context.Context, link *ProjectRepoLink) (*ProjectRepoLink, error) {
	query := `
		INSERT INTO project_repo_links (project_id, repo_id, branch, auto_deploy)
		VALUES ($1, $2, $3, $4)
		RETURNING id, project_id, repo_id, branch, auto_deploy, created_at, updated_at`

	var out ProjectRepoLink
	err := r.db.QueryRow(ctx, query,
		link.ProjectID, link.RepoID, link.Branch, link.AutoDeploy,
	).Scan(
		&out.ID, &out.ProjectID, &out.RepoID, &out.Branch,
		&out.AutoDeploy, &out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrLinkAlreadyExists
		}
		return nil, err
	}
	return &out, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func (r *Repository) DeleteLinkByRepoID(ctx context.Context, repoID uuid.UUID) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM project_repo_links WHERE repo_id = $1`, repoID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrLinkNotFound
	}
	return nil
}

func (r *Repository) GetLinkByProjectID(ctx context.Context, projectID uuid.UUID) (*ProjectRepoLink, error) {
	query := `
		SELECT id, project_id, repo_id, branch, auto_deploy, created_at, updated_at
		FROM project_repo_links WHERE project_id = $1`

	var out ProjectRepoLink
	err := r.db.QueryRow(ctx, query, projectID).Scan(
		&out.ID, &out.ProjectID, &out.RepoID, &out.Branch,
		&out.AutoDeploy, &out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrLinkNotFound
		}
		return nil, err
	}
	return &out, nil
}

// GetAutoDeployLinks returns all project links with auto_deploy=true for a given repo + branch.
// Used to fan out deploy triggers when a push arrives.
func (r *Repository) GetAutoDeployLinks(ctx context.Context, repoFullName, branch string) ([]ProjectRepoLink, error) {
	query := `
		SELECT l.id, l.project_id, l.repo_id, l.branch, l.auto_deploy, l.created_at, l.updated_at
		FROM project_repo_links l
		JOIN repositories r ON r.id = l.repo_id
		WHERE r.full_name = $1 AND l.branch = $2 AND l.auto_deploy = TRUE`

	rows, err := r.db.Query(ctx, query, repoFullName, branch)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []ProjectRepoLink
	for rows.Next() {
		var link ProjectRepoLink
		if err := rows.Scan(
			&link.ID, &link.ProjectID, &link.RepoID, &link.Branch,
			&link.AutoDeploy, &link.CreatedAt, &link.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, link)
	}
	return out, rows.Err()
}

// GetLinkByID retrieves a single project-repo link by its primary key.
func (r *Repository) GetLinkByID(ctx context.Context, id uuid.UUID) (*ProjectRepoLink, error) {
	query := `
		SELECT id, project_id, repo_id, branch, auto_deploy, created_at, updated_at
		FROM project_repo_links WHERE id = $1`

	var out ProjectRepoLink
	err := r.db.QueryRow(ctx, query, id).Scan(
		&out.ID, &out.ProjectID, &out.RepoID, &out.Branch,
		&out.AutoDeploy, &out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrLinkNotFound
		}
		return nil, err
	}
	return &out, nil
}

// DeleteLinkByID removes a project-repo link by its primary key.
func (r *Repository) DeleteLinkByID(ctx context.Context, id uuid.UUID) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM project_repo_links WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrLinkNotFound
	}
	return nil
}

// ListLinksByRepoID returns all project links for a given repository UUID.
func (r *Repository) ListLinksByRepoID(ctx context.Context, repoID uuid.UUID) ([]ProjectRepoLink, error) {
	query := `
		SELECT id, project_id, repo_id, branch, auto_deploy, created_at, updated_at
		FROM project_repo_links WHERE repo_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, repoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []ProjectRepoLink
	for rows.Next() {
		var link ProjectRepoLink
		if err := rows.Scan(
			&link.ID, &link.ProjectID, &link.RepoID, &link.Branch,
			&link.AutoDeploy, &link.CreatedAt, &link.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, link)
	}
	return out, rows.Err()
}

// ListAllRepos returns all repositories, optionally filtered by installation_id.
func (r *Repository) ListAllRepos(ctx context.Context, installationID *int64) ([]Repo, error) {
	var query string
	var args []any

	if installationID != nil {
		query = `
			SELECT id, installation_id, github_repo_id, owner, name, full_name, default_branch, private, created_at, updated_at
			FROM repositories WHERE installation_id = $1 ORDER BY full_name`
		args = append(args, *installationID)
	} else {
		query = `
			SELECT id, installation_id, github_repo_id, owner, name, full_name, default_branch, private, created_at, updated_at
			FROM repositories ORDER BY full_name`
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Repo
	for rows.Next() {
		var repo Repo
		if err := rows.Scan(
			&repo.ID, &repo.InstallationID, &repo.GitHubRepoID, &repo.Owner,
			&repo.Name, &repo.FullName, &repo.DefaultBranch, &repo.Private,
			&repo.CreatedAt, &repo.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, repo)
	}
	return out, rows.Err()
}
