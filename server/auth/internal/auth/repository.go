package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

type dbExecutor interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func (r *Repository) GetOAuthAccount(ctx context.Context, provider, providerUserID string) (*OAuthAccount, error) {
	query := `
	SELECT id, user_id, provider, provider_user_id, created_at, updated_at
	FROM oauth_accounts
	WHERE provider=$1 AND provider_user_id=$2
	`
	var acc OAuthAccount
	err := r.db.QueryRow(ctx, query, provider, providerUserID).
		Scan(&acc.ID, &acc.UserID, &acc.Provider, &acc.ProviderUserID, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &acc, nil
}

func (r *Repository) GetOAuthAccountByUserAndProvider(ctx context.Context, userID uuid.UUID, provider string) (*OAuthAccount, error) {
	query := `
	SELECT id, user_id, provider, provider_user_id, created_at, updated_at
	FROM oauth_accounts
	WHERE user_id=$1 AND provider=$2
	`
	var acc OAuthAccount
	err := r.db.QueryRow(ctx, query, userID, provider).
		Scan(&acc.ID, &acc.UserID, &acc.Provider, &acc.ProviderUserID, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &acc, nil
}

func (r *Repository) ListOAuthAccountsByUserID(ctx context.Context, userID uuid.UUID) ([]OAuthAccount, error) {
	query := `
	SELECT id, user_id, provider, provider_user_id, created_at, updated_at
	FROM oauth_accounts
	WHERE user_id=$1
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []OAuthAccount
	for rows.Next() {
		var acc OAuthAccount
		err := rows.Scan(&acc.ID, &acc.UserID, &acc.Provider, &acc.ProviderUserID, &acc.CreatedAt, &acc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, acc)
	}

	return accounts, rows.Err()
}


func (r *Repository) CreateUser(ctx context.Context, email string, name, avatar *string, emailVerified bool) (*User, error) {
	return r.createUser(ctx, r.db, email, name, avatar, emailVerified)
}

func (r *Repository) CreateUserWithPassword(ctx context.Context, email string, name *string, passwordHash string, emailVerified bool, verificationHash string, verificationExpiresAt time.Time) (*User, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	user, err := r.createUser(ctx, tx, email, name, nil, emailVerified)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `INSERT INTO user_passwords (user_id, password_hash) VALUES ($1,$2)`, user.ID, passwordHash); err != nil {
		return nil, err
	}

	if !emailVerified && verificationHash != "" {
		if _, err := tx.Exec(ctx, `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, user.ID, verificationHash, verificationExpiresAt); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return user, nil
}

func (r *Repository) createUser(ctx context.Context, db dbExecutor, email string, name, avatar *string, emailVerified bool) (*User, error) {
	query := `
	INSERT INTO users (email, name, avatar_url, email_verified)
	VALUES ($1,$2,$3,$4)
	RETURNING id, email, name, avatar_url, email_verified, created_at, updated_at
	`
	var u User
	err := db.QueryRow(ctx, query, email, name, avatar, emailVerified).
		Scan(&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrConflict
		}
		return nil, err
	}

	return &u, nil
}

func (r *Repository) UpsertOAuthAccount(ctx context.Context, acc OAuthAccount, tokens OAuthTokens) error {
	query := `
	INSERT INTO oauth_accounts (
		user_id,
		provider,
		provider_user_id,
		access_token,
		refresh_token,
		id_token,
		token_type,
		scope,
		token_expiry
	)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
	ON CONFLICT (provider, provider_user_id)
	DO UPDATE SET
		user_id = EXCLUDED.user_id,
		access_token = EXCLUDED.access_token,
		refresh_token = EXCLUDED.refresh_token,
		id_token = EXCLUDED.id_token,
		token_type = EXCLUDED.token_type,
		scope = EXCLUDED.scope,
		token_expiry = EXCLUDED.token_expiry,
		updated_at = now()
	`

	_, err := r.db.Exec(
		ctx,
		query,
		acc.UserID,
		acc.Provider,
		acc.ProviderUserID,
		tokens.AccessToken,
		tokens.RefreshToken,
		tokens.IDToken,
		tokens.TokenType,
		tokens.Scope,
		tokens.TokenExpiry,
	)
	return err
}

func (r *Repository) GetUser(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `SELECT id, email, name, avatar_url, email_verified, created_at, updated_at FROM users WHERE id=$1`
	var u User
	err := r.db.QueryRow(ctx, query, id).
		Scan(&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &u, err
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, name, avatar_url, email_verified, created_at, updated_at FROM users WHERE email=$1`
	var u User
	err := r.db.QueryRow(ctx, query, email).
		Scan(&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *Repository) GetUserWithPasswordHashByEmail(ctx context.Context, email string) (*User, string, error) {
	query := `
	SELECT
	    u.id,
	    u.email,
	    u.name,
	    u.avatar_url,
	    u.email_verified,
	    u.created_at,
	    u.updated_at,
	    p.password_hash
	FROM users u
	JOIN user_passwords p ON p.user_id = u.id
	WHERE u.email = $1
	`
	var u User
	var hash string
	err := r.db.QueryRow(ctx, query, email).
		Scan(&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt, &hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, "", ErrNotFound
		}
		return nil, "", err
	}

	return &u, hash, nil
}

func (r *Repository) UserHasPassword(ctx context.Context, userID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM user_passwords WHERE user_id = $1)`
	var exists bool
	err := r.db.QueryRow(ctx, query, userID).Scan(&exists)
	return exists, err
}


func (r *Repository) UpdateUserEmailVerified(ctx context.Context, userID uuid.UUID, verified bool) error {
	query := `UPDATE users SET email_verified = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, verified, userID)
	return err
}

func (r *Repository) ReplaceEmailVerificationToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM email_verification_tokens WHERE user_id = $1`, userID); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, userID, tokenHash, expiresAt); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) VerifyEmailToken(ctx context.Context, tokenHash string) (uuid.UUID, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)

	var tokenID uuid.UUID
	var userID uuid.UUID
	err = tx.QueryRow(ctx, `
	SELECT id, user_id
	FROM email_verification_tokens
	WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
	FOR UPDATE
	`, tokenHash).Scan(&tokenID, &userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, ErrNotFound
		}
		return uuid.Nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE email_verification_tokens SET used_at = now() WHERE id = $1`, tokenID); err != nil {
		return uuid.Nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE users SET email_verified = true WHERE id = $1`, userID); err != nil {
		return uuid.Nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}

	return userID, nil
}

func (r *Repository) UpsertSessionByIP(ctx context.Context, s *Session) (*Session, error) {
	query := `
	INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at)
	VALUES ($1,$2,$3,$4,$5)
	ON CONFLICT (user_id, ip_address) WHERE ip_address IS NOT NULL
	DO UPDATE SET
		token_hash = EXCLUDED.token_hash,
		user_agent = EXCLUDED.user_agent,
		expires_at = EXCLUDED.expires_at,
		updated_at = now()
	RETURNING id, user_id, user_agent, ip_address, expires_at, created_at, updated_at
	`
	var out Session
	err := r.db.QueryRow(ctx, query, s.UserID, s.Token, s.UserAgent, s.IPAddress, s.ExpiresAt).
		Scan(&out.ID, &out.UserID, &out.UserAgent, &out.IPAddress, &out.ExpiresAt, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *Repository) RefreshSession(ctx context.Context, sessionID, userID uuid.UUID, tokenHash string, expiresAt time.Time) (*Session, error) {
	query := `
	UPDATE sessions
	SET token_hash = $1,
		expires_at = $2,
		updated_at = now()
	WHERE id = $3 AND user_id = $4
	RETURNING id, user_id, user_agent, ip_address, expires_at, created_at, updated_at
	`
	var out Session
	err := r.db.QueryRow(ctx, query, tokenHash, expiresAt, sessionID, userID).
		Scan(&out.ID, &out.UserID, &out.UserAgent, &out.IPAddress, &out.ExpiresAt, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &out, nil
}

func (r *Repository) GetSessionAndUserByTokenHash(ctx context.Context, tokenHash string) (*Session, *User, error) {
	query := `
	SELECT
		s.id,
		s.user_id,
		s.user_agent,
		s.ip_address,
		s.expires_at,
		s.created_at,
		s.updated_at,
		u.id,
		u.email,
		u.name,
		u.avatar_url,
		u.email_verified,
		u.created_at,
		u.updated_at
	FROM sessions s
	JOIN users u ON u.id = s.user_id
	WHERE s.token_hash = $1 AND s.expires_at > now()
	`

	var sess Session
	var user User
	err := r.db.QueryRow(ctx, query, tokenHash).
		Scan(
			&sess.ID,
			&sess.UserID,
			&sess.UserAgent,
			&sess.IPAddress,
			&sess.ExpiresAt,
			&sess.CreatedAt,
			&sess.UpdatedAt,
			&user.ID,
			&user.Email,
			&user.Name,
			&user.AvatarURL,
			&user.EmailVerified,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, ErrNotFound
		}
		return nil, nil, err
	}

	return &sess, &user, nil
}

func (r *Repository) DeleteSessionByTokenHash(ctx context.Context, tokenHash string) error {
	query := `DELETE FROM sessions WHERE token_hash = $1`
	_, err := r.db.Exec(ctx, query, tokenHash)
	return err
}

func (r *Repository) ListSessionsByUserID(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	query := `
	SELECT id, user_id, user_agent, ip_address, expires_at, created_at, updated_at
	FROM sessions
	WHERE user_id = $1 AND expires_at > now()
	ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		err := rows.Scan(&s.ID, &s.UserID, &s.UserAgent, &s.IPAddress, &s.ExpiresAt, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}

	return sessions, rows.Err()
}

func (r *Repository) DeleteSessionByID(ctx context.Context, sessionID, userID uuid.UUID) error {
	query := `DELETE FROM sessions WHERE id = $1 AND user_id = $2`
	res, err := r.db.Exec(ctx, query, sessionID, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) DeleteAllSessionsByUserID(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM sessions WHERE user_id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *Repository) SaveGitHubInstallation(ctx context.Context, install *GitHubInstallation) (*GitHubInstallation, error) {
	query := `
	INSERT INTO github_installations (user_id, app_id, installation_id, repository_name, branch)
	VALUES ($1, $2, $3, $4, $5)
	ON CONFLICT (user_id, installation_id, repository_name)
	DO UPDATE SET
		branch = EXCLUDED.branch,
		updated_at = now()
	RETURNING id, user_id, app_id, installation_id, repository_name, branch, created_at, updated_at
	`
	var out GitHubInstallation
	err := r.db.QueryRow(ctx, query, install.UserID, install.AppID, install.InstallationID, install.RepositoryName, install.Branch).
		Scan(&out.ID, &out.UserID, &out.AppID, &out.InstallationID, &out.RepositoryName, &out.Branch, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *Repository) GetGitHubInstallationsByUserID(ctx context.Context, userID uuid.UUID) ([]GitHubInstallation, error) {
	query := `
	SELECT id, user_id, app_id, installation_id, repository_name, branch, created_at, updated_at
	FROM github_installations
	WHERE user_id = $1
	ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var installations []GitHubInstallation
	for rows.Next() {
		var install GitHubInstallation
		err := rows.Scan(&install.ID, &install.UserID, &install.AppID, &install.InstallationID, &install.RepositoryName, &install.Branch, &install.CreatedAt, &install.UpdatedAt)
		if err != nil {
			return nil, err
		}
		installations = append(installations, install)
	}

	return installations, rows.Err()
}

