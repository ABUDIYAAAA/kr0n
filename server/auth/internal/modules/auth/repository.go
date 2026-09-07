package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var (
	// ErrNotFound indicates a queried record was not found in the database.
	ErrNotFound = errors.New("resource not found")
	// ErrConflict indicates a uniqueness constraint was violated.
	ErrConflict = errors.New("resource conflict or already exists")
)

// User represents the database entity for a user account.
type User struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	Username        string     `json:"username"`
	PasswordHash    *string    `json:"-"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// OAuthAccount represents a linked external OAuth provider account.
type OAuthAccount struct {
	ID             string         `json:"id"`
	UserID         string         `json:"user_id"`
	Provider       string         `json:"provider"`
	ProviderUserID string         `json:"provider_user_id"`
	ProviderEmail  string         `json:"provider_email"`
	RawClaims      map[string]any `json:"raw_claims"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// SecurityToken represents verification and password reset tokens.
type SecurityToken struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	TokenHash string     `json:"token_hash"`
	Type      string     `json:"type"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
}

// UserSession represents an active or revoked user login session.
type UserSession struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	SessionTokenHash string    `json:"session_token_hash"`
	DeviceID         string    `json:"device_id"`
	IPAddress        string    `json:"ip_address"`
	UserAgent        string    `json:"user_agent"`
	IsRevoked        bool      `json:"is_revoked"`
	LastActiveAt     time.Time `json:"last_active_at"`
	ExpiresAt        time.Time `json:"expires_at"`
	CreatedAt        time.Time `json:"created_at"`
}

// OutboxEvent represents a transactional outbox message to be published to Kafka.
type OutboxEvent struct {
	ID             string     `json:"id"`
	EventType      string     `json:"event_type"`
	Payload        []byte     `json:"payload"`
	IdempotencyKey string     `json:"idempotency_key"`
	Status         string     `json:"status"` // PENDING, PUBLISHED, FAILED
	RetryCount     int        `json:"retry_count"`
	ErrorMessage   string     `json:"error_message,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	PublishedAt    *time.Time `json:"published_at,omitempty"`
}

// Repository defines data access operations for auth against PostgreSQL and Redis.
type Repository interface {
	// Transaction execution wrapper
	WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error

	// User operations
	CreateUser(ctx context.Context, email, username string, passwordHash *string) (*User, error)
	CreateUserTx(ctx context.Context, tx pgx.Tx, email, username string, passwordHash *string) (*User, error)
	GetUserByID(ctx context.Context, id string) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByUsername(ctx context.Context, username string) (*User, error)
	GetUserByEmailOrUsername(ctx context.Context, login string) (*User, error)
	UpdateUsername(ctx context.Context, userID, username string) error
	UpdatePasswordTx(ctx context.Context, tx pgx.Tx, userID, passwordHash string) error
	VerifyUserEmail(ctx context.Context, userID string) error

	// OAuth Account operations
	CreateOAuthAccount(ctx context.Context, account *OAuthAccount) error
	GetOAuthAccountByProvider(ctx context.Context, provider, providerUserID string) (*OAuthAccount, error)

	// Security Token operations
	CreateSecurityToken(ctx context.Context, token *SecurityToken) error
	CreateSecurityTokenTx(ctx context.Context, tx pgx.Tx, token *SecurityToken) error
	GetValidSecurityToken(ctx context.Context, tokenHash, tokenType string) (*SecurityToken, error)
	MarkSecurityTokenUsed(ctx context.Context, tokenID string) error
	MarkSecurityTokenUsedTx(ctx context.Context, tx pgx.Tx, tokenID string) error

	// Session operations (PostgreSQL)
	CreateSession(ctx context.Context, session *UserSession) error
	GetSessionByID(ctx context.Context, sessionID string) (*UserSession, error)
	GetSessionByTokenHash(ctx context.Context, tokenHash string) (*UserSession, error)
	GetUserActiveSessions(ctx context.Context, userID string) ([]UserSession, error)
	RevokeSession(ctx context.Context, sessionID, userID string) error
	RevokeAllUserSessions(ctx context.Context, userID string, exceptSessionID string) error
	UpdateSessionActivity(ctx context.Context, sessionID, ipAddress, userAgent string) error

	// Outbox pattern operations
	InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *OutboxEvent) error
	GetPendingOutboxEvents(ctx context.Context, limit int) ([]OutboxEvent, error)
	MarkOutboxEventPublished(ctx context.Context, id string) error
	MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error

	// Redis Blacklisting & Caching
	BlacklistToken(ctx context.Context, jti string, ttl time.Duration) error
	IsTokenBlacklisted(ctx context.Context, jti string) (bool, error)
	BlacklistSession(ctx context.Context, sessionID string, ttl time.Duration) error
	IsSessionBlacklisted(ctx context.Context, sessionID string) (bool, error)
	BlacklistUserRevocation(ctx context.Context, userID string, revokedAt time.Time, ttl time.Duration) error
	GetUserRevocationTimestamp(ctx context.Context, userID string) (int64, error)
	StoreOAuthState(ctx context.Context, state, provider string, ttl time.Duration) error
	VerifyAndConsumeOAuthState(ctx context.Context, state string) (string, error)
}

// sqlRepository implements Repository using pgxpool and redis.Client.
type sqlRepository struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

// NewRepository creates a new instance of SQL & Redis backed Repository.
func NewRepository(db *pgxpool.Pool, redisClient *redis.Client) Repository {
	return &sqlRepository{
		db:    db,
		redis: redisClient,
	}
}

// WithTx runs callback functions inside a single database transaction block.
func (r *sqlRepository) WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ==========================================
// PostgreSQL Operations
// ==========================================

func (r *sqlRepository) CreateUser(ctx context.Context, email, username string, passwordHash *string) (*User, error) {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}

	query := `
		INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, email, username, password_hash, email_verified_at, created_at, updated_at;
	`

	var user User
	err = r.db.QueryRow(ctx, query, id.String(), email, username, passwordHash).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerifiedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("failed to insert user: %w", err)
	}

	return &user, nil
}

func (r *sqlRepository) CreateUserTx(ctx context.Context, tx pgx.Tx, email, username string, passwordHash *string) (*User, error) {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}

	query := `
		INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, email, username, password_hash, email_verified_at, created_at, updated_at;
	`

	var user User
	err = tx.QueryRow(ctx, query, id.String(), email, username, passwordHash).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerifiedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("failed to insert user in transaction: %w", err)
	}

	return &user, nil
}

func (r *sqlRepository) GetUserByID(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified_at, created_at, updated_at
		FROM users
		WHERE id = $1;
	`

	var user User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerifiedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &user, nil
}

func (r *sqlRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified_at, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER($1);
	`

	var user User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerifiedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

func (r *sqlRepository) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified_at, created_at, updated_at
		FROM users
		WHERE LOWER(username) = LOWER($1);
	`

	var user User
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerifiedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return &user, nil
}

func (r *sqlRepository) GetUserByEmailOrUsername(ctx context.Context, login string) (*User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified_at, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1);
	`

	var user User
	err := r.db.QueryRow(ctx, query, login).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerifiedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user by email/username: %w", err)
	}

	return &user, nil
}

func (r *sqlRepository) UpdateUsername(ctx context.Context, userID, username string) error {
	query := `
		UPDATE users
		SET username = $2, updated_at = NOW()
		WHERE id = $1;
	`

	res, err := r.db.Exec(ctx, query, userID, username)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("failed to update username: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *sqlRepository) UpdatePasswordTx(ctx context.Context, tx pgx.Tx, userID, passwordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $2, updated_at = NOW()
		WHERE id = $1;
	`

	res, err := tx.Exec(ctx, query, userID, passwordHash)
	if err != nil {
		return fmt.Errorf("failed to update user password in transaction: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *sqlRepository) VerifyUserEmail(ctx context.Context, userID string) error {
	query := `
		UPDATE users
		SET email_verified_at = NOW(), updated_at = NOW()
		WHERE id = $1;
	`

	res, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to verify user email: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *sqlRepository) CreateOAuthAccount(ctx context.Context, account *OAuthAccount) error {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}
	account.ID = id.String()

	claimsJSON, err := json.Marshal(account.RawClaims)
	if err != nil {
		claimsJSON = []byte("{}")
	}

	query := `
		INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email, raw_claims, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		ON CONFLICT (provider, provider_user_id) 
		DO UPDATE SET provider_email = EXCLUDED.provider_email, raw_claims = EXCLUDED.raw_claims, updated_at = NOW();
	`

	_, err = r.db.Exec(ctx, query, account.ID, account.UserID, account.Provider, account.ProviderUserID, account.ProviderEmail, claimsJSON)
	if err != nil {
		return fmt.Errorf("failed to save oauth account: %w", err)
	}

	return nil
}

func (r *sqlRepository) GetOAuthAccountByProvider(ctx context.Context, provider, providerUserID string) (*OAuthAccount, error) {
	query := `
		SELECT id, user_id, provider, provider_user_id, provider_email, raw_claims, created_at, updated_at
		FROM oauth_accounts
		WHERE provider = $1 AND provider_user_id = $2;
	`

	var acc OAuthAccount
	var claimsJSON []byte

	err := r.db.QueryRow(ctx, query, provider, providerUserID).Scan(
		&acc.ID,
		&acc.UserID,
		&acc.Provider,
		&acc.ProviderUserID,
		&acc.ProviderEmail,
		&claimsJSON,
		&acc.CreatedAt,
		&acc.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get oauth account: %w", err)
	}

	if len(claimsJSON) > 0 {
		_ = json.Unmarshal(claimsJSON, &acc.RawClaims)
	}

	return &acc, nil
}

func (r *sqlRepository) CreateSecurityToken(ctx context.Context, token *SecurityToken) error {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}
	token.ID = id.String()

	query := `
		INSERT INTO security_tokens (id, user_id, token_hash, type, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW());
	`

	_, err = r.db.Exec(ctx, query, token.ID, token.UserID, token.TokenHash, token.Type, token.ExpiresAt)
	if err != nil {
		return fmt.Errorf("failed to insert security token: %w", err)
	}

	return nil
}

func (r *sqlRepository) CreateSecurityTokenTx(ctx context.Context, tx pgx.Tx, token *SecurityToken) error {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}
	token.ID = id.String()

	query := `
		INSERT INTO security_tokens (id, user_id, token_hash, type, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW());
	`

	_, err = tx.Exec(ctx, query, token.ID, token.UserID, token.TokenHash, token.Type, token.ExpiresAt)
	if err != nil {
		return fmt.Errorf("failed to insert security token in transaction: %w", err)
	}

	return nil
}

func (r *sqlRepository) GetValidSecurityToken(ctx context.Context, tokenHash, tokenType string) (*SecurityToken, error) {
	query := `
		SELECT id, user_id, token_hash, type, expires_at, used_at, created_at
		FROM security_tokens
		WHERE token_hash = $1 AND type = $2 AND used_at IS NULL AND expires_at > NOW();
	`

	var t SecurityToken
	err := r.db.QueryRow(ctx, query, tokenHash, tokenType).Scan(
		&t.ID,
		&t.UserID,
		&t.TokenHash,
		&t.Type,
		&t.ExpiresAt,
		&t.UsedAt,
		&t.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get valid security token: %w", err)
	}

	return &t, nil
}

func (r *sqlRepository) MarkSecurityTokenUsed(ctx context.Context, tokenID string) error {
	query := `
		UPDATE security_tokens
		SET used_at = NOW()
		WHERE id = $1;
	`

	_, err := r.db.Exec(ctx, query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to mark security token used: %w", err)
	}

	return nil
}

func (r *sqlRepository) MarkSecurityTokenUsedTx(ctx context.Context, tx pgx.Tx, tokenID string) error {
	query := `
		UPDATE security_tokens
		SET used_at = NOW()
		WHERE id = $1;
	`

	_, err := tx.Exec(ctx, query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to mark security token used in transaction: %w", err)
	}

	return nil
}

func (r *sqlRepository) CreateSession(ctx context.Context, session *UserSession) error {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}
	session.ID = id.String()

	query := `
		INSERT INTO user_sessions (id, user_id, session_token_hash, device_id, ip_address, user_agent, is_revoked, last_active_at, expires_at, created_at)
		VALUES ($1, $2, $3, $4, NULLIF($5, '')::inet, $6, $7, NOW(), $8, NOW())
		RETURNING created_at, last_active_at;
	`

	err = r.db.QueryRow(ctx, query, session.ID, session.UserID, session.SessionTokenHash, session.DeviceID, session.IPAddress, session.UserAgent, session.IsRevoked, session.ExpiresAt).Scan(
		&session.CreatedAt,
		&session.LastActiveAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert user session: %w", err)
	}

	return nil
}

func (r *sqlRepository) GetSessionByID(ctx context.Context, sessionID string) (*UserSession, error) {
	query := `
		SELECT id, user_id, session_token_hash, device_id, COALESCE(ip_address::text, ''), COALESCE(user_agent, ''), is_revoked, last_active_at, expires_at, created_at
		FROM user_sessions
		WHERE id = $1;
	`

	var s UserSession
	err := r.db.QueryRow(ctx, query, sessionID).Scan(
		&s.ID,
		&s.UserID,
		&s.SessionTokenHash,
		&s.DeviceID,
		&s.IPAddress,
		&s.UserAgent,
		&s.IsRevoked,
		&s.LastActiveAt,
		&s.ExpiresAt,
		&s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get session by id: %w", err)
	}

	return &s, nil
}

func (r *sqlRepository) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*UserSession, error) {
	query := `
		SELECT id, user_id, session_token_hash, device_id, COALESCE(ip_address::text, ''), COALESCE(user_agent, ''), is_revoked, last_active_at, expires_at, created_at
		FROM user_sessions
		WHERE session_token_hash = $1;
	`

	var s UserSession
	err := r.db.QueryRow(ctx, query, tokenHash).Scan(
		&s.ID,
		&s.UserID,
		&s.SessionTokenHash,
		&s.DeviceID,
		&s.IPAddress,
		&s.UserAgent,
		&s.IsRevoked,
		&s.LastActiveAt,
		&s.ExpiresAt,
		&s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get session by token hash: %w", err)
	}

	return &s, nil
}

func (r *sqlRepository) GetUserActiveSessions(ctx context.Context, userID string) ([]UserSession, error) {
	query := `
		SELECT id, user_id, session_token_hash, device_id, COALESCE(ip_address::text, ''), COALESCE(user_agent, ''), is_revoked, last_active_at, expires_at, created_at
		FROM user_sessions
		WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > NOW()
		ORDER BY last_active_at DESC;
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query active sessions: %w", err)
	}
	defer rows.Close()

	var sessions []UserSession
	for rows.Next() {
		var s UserSession
		if err := rows.Scan(
			&s.ID,
			&s.UserID,
			&s.SessionTokenHash,
			&s.DeviceID,
			&s.IPAddress,
			&s.UserAgent,
			&s.IsRevoked,
			&s.LastActiveAt,
			&s.ExpiresAt,
			&s.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan session row: %w", err)
		}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

func (r *sqlRepository) RevokeSession(ctx context.Context, sessionID, userID string) error {
	query := `
		UPDATE user_sessions
		SET is_revoked = TRUE
		WHERE id = $1 AND user_id = $2;
	`

	res, err := r.db.Exec(ctx, query, sessionID, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke session: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *sqlRepository) RevokeAllUserSessions(ctx context.Context, userID string, exceptSessionID string) error {
	query := `
		UPDATE user_sessions
		SET is_revoked = TRUE
		WHERE user_id = $1 AND ($2 = '' OR id != $2) AND is_revoked = FALSE;
	`

	_, err := r.db.Exec(ctx, query, userID, exceptSessionID)
	if err != nil {
		return fmt.Errorf("failed to revoke all user sessions: %w", err)
	}

	return nil
}

func (r *sqlRepository) UpdateSessionActivity(ctx context.Context, sessionID, ipAddress, userAgent string) error {
	query := `
		UPDATE user_sessions
		SET last_active_at = NOW(),
		    ip_address = COALESCE(NULLIF($2, '')::inet, ip_address),
		    user_agent = COALESCE(NULLIF($3, ''), user_agent)
		WHERE id = $1;
	`

	_, err := r.db.Exec(ctx, query, sessionID, ipAddress, userAgent)
	if err != nil {
		return fmt.Errorf("failed to update session activity: %w", err)
	}

	return nil
}

// ==========================================
// Outbox Operations
// ==========================================

func (r *sqlRepository) InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *OutboxEvent) error {
	if event.ID == "" {
		id, err := uuid.NewV7()
		if err != nil {
			event.ID = uuid.NewString()
		} else {
			event.ID = id.String()
		}
	}

	query := `
		INSERT INTO outbox_events (id, event_type, payload, idempotency_key, status, retry_count, created_at)
		VALUES ($1, $2, $3, $4, 'PENDING', 0, NOW());
	`

	_, err := tx.Exec(ctx, query, event.ID, event.EventType, event.Payload, event.IdempotencyKey)
	if err != nil {
		return fmt.Errorf("failed to insert outbox event in transaction: %w", err)
	}

	return nil
}

func (r *sqlRepository) GetPendingOutboxEvents(ctx context.Context, limit int) ([]OutboxEvent, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, event_type, payload, idempotency_key, status, retry_count, error_message, created_at, published_at
		FROM outbox_events
		WHERE status = 'PENDING' AND retry_count < 5
		ORDER BY created_at ASC
		LIMIT $1
		FOR UPDATE SKIP LOCKED;
	`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending outbox events: %w", err)
	}
	defer rows.Close()

	var events []OutboxEvent
	for rows.Next() {
		var e OutboxEvent
		if err := rows.Scan(
			&e.ID,
			&e.EventType,
			&e.Payload,
			&e.IdempotencyKey,
			&e.Status,
			&e.RetryCount,
			&e.ErrorMessage,
			&e.CreatedAt,
			&e.PublishedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan outbox event row: %w", err)
		}
		events = append(events, e)
	}

	return events, nil
}

func (r *sqlRepository) MarkOutboxEventPublished(ctx context.Context, id string) error {
	query := `
		UPDATE outbox_events
		SET status = 'PUBLISHED', published_at = NOW()
		WHERE id = $1;
	`

	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to mark outbox event published: %w", err)
	}

	return nil
}

func (r *sqlRepository) MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error {
	query := `
		UPDATE outbox_events
		SET status = CASE WHEN retry_count + 1 >= 5 THEN 'FAILED' ELSE 'PENDING' END,
		    retry_count = retry_count + 1,
		    error_message = $2
		WHERE id = $1;
	`

	_, err := r.db.Exec(ctx, query, id, errMsg)
	if err != nil {
		return fmt.Errorf("failed to mark outbox event failed: %w", err)
	}

	return nil
}

// ==========================================
// Redis Operations (Blacklisting & State)
// ==========================================

func (r *sqlRepository) BlacklistToken(ctx context.Context, jti string, ttl time.Duration) error {
	if ttl <= 0 {
		return nil
	}
	key := fmt.Sprintf(RedisKeyBlacklistToken, jti)
	return r.redis.Set(ctx, key, "revoked", ttl).Err()
}

func (r *sqlRepository) IsTokenBlacklisted(ctx context.Context, jti string) (bool, error) {
	key := fmt.Sprintf(RedisKeyBlacklistToken, jti)
	val, err := r.redis.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		log.Printf("[WARN] redis error checking token blacklist: %v", err)
		return false, err
	}
	return val == "revoked", nil
}

func (r *sqlRepository) BlacklistSession(ctx context.Context, sessionID string, ttl time.Duration) error {
	if ttl <= 0 {
		return nil
	}
	key := fmt.Sprintf(RedisKeyBlacklistSession, sessionID)
	return r.redis.Set(ctx, key, "revoked", ttl).Err()
}

func (r *sqlRepository) IsSessionBlacklisted(ctx context.Context, sessionID string) (bool, error) {
	key := fmt.Sprintf(RedisKeyBlacklistSession, sessionID)
	val, err := r.redis.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		log.Printf("[WARN] redis error checking session blacklist: %v", err)
		return false, err
	}
	return val == "revoked", nil
}

func (r *sqlRepository) BlacklistUserRevocation(ctx context.Context, userID string, revokedAt time.Time, ttl time.Duration) error {
	if ttl <= 0 {
		return nil
	}
	key := fmt.Sprintf(RedisKeyBlacklistUser, userID)
	return r.redis.Set(ctx, key, strconv.FormatInt(revokedAt.Unix(), 10), ttl).Err()
}

func (r *sqlRepository) GetUserRevocationTimestamp(ctx context.Context, userID string) (int64, error) {
	key := fmt.Sprintf(RedisKeyBlacklistUser, userID)
	val, err := r.redis.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return strconv.ParseInt(val, 10, 64)
}

func (r *sqlRepository) StoreOAuthState(ctx context.Context, state, provider string, ttl time.Duration) error {
	key := fmt.Sprintf(RedisKeyOAuthState, state)
	return r.redis.Set(ctx, key, provider, ttl).Err()
}

func (r *sqlRepository) VerifyAndConsumeOAuthState(ctx context.Context, state string) (string, error) {
	key := fmt.Sprintf(RedisKeyOAuthState, state)
	provider, err := r.redis.GetDel(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", errors.New("invalid or expired oauth state")
	}
	if err != nil {
		return "", err
	}
	return provider, nil
}
