package auth

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
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

func (r *Repository) CreateUser(ctx context.Context, email string, name, avatar *string) (*User, error) {
	query := `
	INSERT INTO users (email, name, avatar_url)
	VALUES ($1,$2,$3)
	RETURNING id, email, name, avatar_url, email_verified, created_at, updated_at
	`
	var u User
	err := r.db.QueryRow(ctx, query, email, name, avatar).
		Scan(&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt)

	return &u, err
}

func (r *Repository) CreateOAuthAccount(ctx context.Context, userID uuid.UUID, provider, sub string) error {
	query := `
	INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
	VALUES ($1,$2,$3)
	`
	_, err := r.db.Exec(ctx, query, userID, provider, sub)
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
