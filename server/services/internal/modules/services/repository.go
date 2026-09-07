package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var (
	ErrNotFound = errors.New("service entity not found")
	ErrConflict = errors.New("service with this name already exists for user")
)

type ServiceEntity struct {
	ID              string            `json:"id"`
	UserID          string            `json:"user_id"`
	Name            string            `json:"name"`
	GitHubRepoID    int64             `json:"github_repo_id"`
	RepoName        string            `json:"repo_name"`
	RepoFullName    string            `json:"repo_full_name"`
	RepoOwner       string            `json:"repo_owner"`
	Branch          string            `json:"branch"`
	RootDirectory   string            `json:"root_directory"`
	BuildCommand    *string           `json:"build_command,omitempty"`
	InstallCommand  *string           `json:"install_command,omitempty"`
	RunCommand      *string           `json:"run_command,omitempty"`
	OutputDirectory *string           `json:"output_directory,omitempty"`
	EnvVariables    map[string]string `json:"env_variables"`
	Status          string            `json:"status"`
	HealthStatus    string            `json:"health_status"`
	Config          map[string]any    `json:"config"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}

type OutboxEvent struct {
	ID             string     `json:"id"`
	EventType      string     `json:"event_type"`
	Payload        []byte     `json:"payload"`
	IdempotencyKey string     `json:"idempotency_key"`
	Status         string     `json:"status"`
	RetryCount     int        `json:"retry_count"`
	ErrorMessage   string     `json:"error_message,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	PublishedAt    *time.Time `json:"published_at,omitempty"`
}

type Repository interface {
	WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error

	CreateService(ctx context.Context, s *ServiceEntity) error
	CreateServiceTx(ctx context.Context, tx pgx.Tx, s *ServiceEntity) error
	GetServiceByID(ctx context.Context, id string) (*ServiceEntity, error)
	GetServiceByUserIDAndName(ctx context.Context, userID, name string) (*ServiceEntity, error)
	ListServicesByUserID(ctx context.Context, userID string, page, limit int) ([]ServiceEntity, int64, error)
	UpdateService(ctx context.Context, s *ServiceEntity) error
	DeleteService(ctx context.Context, id, userID string) error

	InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *OutboxEvent) error
	GetPendingOutboxEvents(ctx context.Context, limit int) ([]OutboxEvent, error)
	MarkOutboxEventPublished(ctx context.Context, id string) error
	MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error
}

type sqlRepository struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewRepository(db *pgxpool.Pool, redisClient *redis.Client) Repository {
	return &sqlRepository{
		db:    db,
		redis: redisClient,
	}
}

func (r *sqlRepository) WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	if r.db == nil {
		return fn(nil)
	}

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

func (r *sqlRepository) CreateService(ctx context.Context, s *ServiceEntity) error {
	return r.WithTx(ctx, func(tx pgx.Tx) error {
		return r.CreateServiceTx(ctx, tx, s)
	})
}

func (r *sqlRepository) CreateServiceTx(ctx context.Context, tx pgx.Tx, s *ServiceEntity) error {
	if s.ID == "" {
		s.ID = "svc_" + uuid.NewString()
	}

	envJSON, err := json.Marshal(s.EnvVariables)
	if err != nil {
		envJSON = []byte("{}")
	}

	configJSON, err := json.Marshal(s.Config)
	if err != nil {
		configJSON = []byte("{}")
	}

	query := `
		INSERT INTO services (id, user_id, name, github_repo_id, repo_name, repo_full_name, repo_owner, branch, root_directory, build_command, install_command, run_command, output_directory, env_variables, status, health_status, config, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
		RETURNING created_at, updated_at;
	`

	var execer pgx.Tx
	if tx != nil {
		execer = tx
	}

	row := execer.QueryRow(ctx, query, s.ID, s.UserID, s.Name, s.GitHubRepoID, s.RepoName, s.RepoFullName, s.RepoOwner, s.Branch, s.RootDirectory, s.BuildCommand, s.InstallCommand, s.RunCommand, s.OutputDirectory, envJSON, s.Status, s.HealthStatus, configJSON)
	err = row.Scan(&s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("failed to insert service: %w", err)
	}

	return nil
}

func (r *sqlRepository) GetServiceByID(ctx context.Context, id string) (*ServiceEntity, error) {
	if r.db == nil {
		return nil, ErrNotFound
	}

	query := `
		SELECT id, user_id, name, github_repo_id, repo_name, repo_full_name, repo_owner, branch, root_directory, build_command, install_command, run_command, output_directory, env_variables, status, health_status, config, created_at, updated_at
		FROM services
		WHERE id = $1;
	`

	var s ServiceEntity
	var envRaw, configRaw []byte

	err := r.db.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.Name, &s.GitHubRepoID, &s.RepoName, &s.RepoFullName, &s.RepoOwner, &s.Branch, &s.RootDirectory,
		&s.BuildCommand, &s.InstallCommand, &s.RunCommand, &s.OutputDirectory, &envRaw, &s.Status, &s.HealthStatus, &configRaw,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to query service by id: %w", err)
	}

	_ = json.Unmarshal(envRaw, &s.EnvVariables)
	_ = json.Unmarshal(configRaw, &s.Config)

	return &s, nil
}

func (r *sqlRepository) GetServiceByUserIDAndName(ctx context.Context, userID, name string) (*ServiceEntity, error) {
	if r.db == nil {
		return nil, ErrNotFound
	}

	query := `
		SELECT id, user_id, name, github_repo_id, repo_name, repo_full_name, repo_owner, branch, root_directory, build_command, install_command, run_command, output_directory, env_variables, status, health_status, config, created_at, updated_at
		FROM services
		WHERE user_id = $1 AND name = $2;
	`

	var s ServiceEntity
	var envRaw, configRaw []byte

	err := r.db.QueryRow(ctx, query, userID, name).Scan(
		&s.ID, &s.UserID, &s.Name, &s.GitHubRepoID, &s.RepoName, &s.RepoFullName, &s.RepoOwner, &s.Branch, &s.RootDirectory,
		&s.BuildCommand, &s.InstallCommand, &s.RunCommand, &s.OutputDirectory, &envRaw, &s.Status, &s.HealthStatus, &configRaw,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to query service by name: %w", err)
	}

	_ = json.Unmarshal(envRaw, &s.EnvVariables)
	_ = json.Unmarshal(configRaw, &s.Config)

	return &s, nil
}

func (r *sqlRepository) ListServicesByUserID(ctx context.Context, userID string, page, limit int) ([]ServiceEntity, int64, error) {
	if r.db == nil {
		return []ServiceEntity{}, 0, nil
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := `
		SELECT id, user_id, name, github_repo_id, repo_name, repo_full_name, repo_owner, branch, root_directory, build_command, install_command, run_command, output_directory, env_variables, status, health_status, config, created_at, updated_at, COUNT(*) OVER() as total_count
		FROM services
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3;
	`

	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query user services: %w", err)
	}
	defer rows.Close()

	var list []ServiceEntity
	var totalCount int64

	for rows.Next() {
		var s ServiceEntity
		var envRaw, configRaw []byte

		if err := rows.Scan(
			&s.ID, &s.UserID, &s.Name, &s.GitHubRepoID, &s.RepoName, &s.RepoFullName, &s.RepoOwner, &s.Branch, &s.RootDirectory,
			&s.BuildCommand, &s.InstallCommand, &s.RunCommand, &s.OutputDirectory, &envRaw, &s.Status, &s.HealthStatus, &configRaw,
			&s.CreatedAt, &s.UpdatedAt, &totalCount,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan service row: %w", err)
		}

		_ = json.Unmarshal(envRaw, &s.EnvVariables)
		_ = json.Unmarshal(configRaw, &s.Config)
		list = append(list, s)
	}

	return list, totalCount, nil
}

func (r *sqlRepository) UpdateService(ctx context.Context, s *ServiceEntity) error {
	if r.db == nil {
		return nil
	}

	envJSON, err := json.Marshal(s.EnvVariables)
	if err != nil {
		envJSON = []byte("{}")
	}

	configJSON, err := json.Marshal(s.Config)
	if err != nil {
		configJSON = []byte("{}")
	}

	query := `
		UPDATE services
		SET branch = $1, root_directory = $2, build_command = $3, install_command = $4, run_command = $5, output_directory = $6, env_variables = $7, status = $8, health_status = $9, config = $10, updated_at = NOW()
		WHERE id = $11 AND user_id = $12
		RETURNING updated_at;
	`

	err = r.db.QueryRow(ctx, query, s.Branch, s.RootDirectory, s.BuildCommand, s.InstallCommand, s.RunCommand, s.OutputDirectory, envJSON, s.Status, s.HealthStatus, configJSON, s.ID, s.UserID).Scan(&s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("failed to update service: %w", err)
	}

	return nil
}

func (r *sqlRepository) DeleteService(ctx context.Context, id, userID string) error {
	if r.db == nil {
		return nil
	}

	query := `DELETE FROM services WHERE id = $1 AND user_id = $2;`
	res, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *sqlRepository) InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *OutboxEvent) error {
	if event.ID == "" {
		event.ID = "evt_" + uuid.NewString()
	}

	query := `
		INSERT INTO outbox_events (id, event_type, payload, idempotency_key, status, retry_count, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW());
	`

	var execer pgx.Tx = tx
	if tx == nil {
		_, err := r.db.Exec(ctx, query, event.ID, event.EventType, event.Payload, event.IdempotencyKey, "PENDING", 0)
		return err
	}

	_, err := execer.Exec(ctx, query, event.ID, event.EventType, event.Payload, event.IdempotencyKey, "PENDING", 0)
	if err != nil {
		return fmt.Errorf("failed to insert outbox event: %w", err)
	}

	return nil
}

func (r *sqlRepository) GetPendingOutboxEvents(ctx context.Context, limit int) ([]OutboxEvent, error) {
	if r.db == nil {
		return []OutboxEvent{}, nil
	}

	query := `
		SELECT id, event_type, payload, idempotency_key, status, retry_count, COALESCE(error_message, ''), created_at
		FROM outbox_events
		WHERE status = 'PENDING' AND retry_count < 5
		ORDER BY created_at ASC
		LIMIT $1;
	`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending outbox events: %w", err)
	}
	defer rows.Close()

	var events []OutboxEvent
	for rows.Next() {
		var e OutboxEvent
		if err := rows.Scan(&e.ID, &e.EventType, &e.Payload, &e.IdempotencyKey, &e.Status, &e.RetryCount, &e.ErrorMessage, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan outbox event: %w", err)
		}
		events = append(events, e)
	}

	return events, nil
}

func (r *sqlRepository) MarkOutboxEventPublished(ctx context.Context, id string) error {
	if r.db == nil {
		return nil
	}

	query := `
		UPDATE outbox_events
		SET status = 'PUBLISHED', published_at = NOW()
		WHERE id = $1;
	`

	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *sqlRepository) MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error {
	if r.db == nil {
		return nil
	}

	query := `
		UPDATE outbox_events
		SET retry_count = retry_count + 1, error_message = $1, status = CASE WHEN retry_count + 1 >= 5 THEN 'FAILED' ELSE 'PENDING' END
		WHERE id = $2;
	`

	_, err := r.db.Exec(ctx, query, errMsg, id)
	return err
}
