package mail

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
	ErrNotFound = errors.New("record not found")
	ErrConflict = errors.New("resource conflict")
)

// EmailLog represents an email dispatch log record in PostgreSQL.
type EmailLog struct {
	ID           string            `json:"id"`
	EventID      string            `json:"event_id"`
	EventType    string            `json:"event_type"`
	TemplateID   string            `json:"template_id"`
	ToEmail      string            `json:"to_email"`
	Subject      string            `json:"subject"`
	Status       string            `json:"status"`
	ErrorMessage string            `json:"error_message,omitempty"`
	Metadata     map[string]string `json:"metadata,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	SentAt       *time.Time        `json:"sent_at,omitempty"`
}

// DBTemplate represents a dynamic email template stored in PostgreSQL.
type DBTemplate struct {
	ID              string    `json:"id"`
	SubjectTemplate string    `json:"subject_template"`
	HTMLTemplate    string    `json:"html_template"`
	TextTemplate    string    `json:"text_template"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Repository defines data access contract for mail operations and idempotency.
type Repository interface {
	IsEventProcessed(ctx context.Context, idempotencyKey string) (bool, error)
	MarkEventProcessed(ctx context.Context, idempotencyKey, eventID, eventType string) error
	CreateEmailLog(ctx context.Context, log *EmailLog) error
	UpdateEmailLogStatus(ctx context.Context, id, status, errorMsg string, sentAt *time.Time) error
	GetEmailLogByID(ctx context.Context, id string) (*EmailLog, error)
	ListEmailLogs(ctx context.Context, limit, offset int) ([]EmailLog, error)
	GetEmailStats(ctx context.Context) (*EmailStatsResponse, error)

	// Dynamic Template Store operations
	GetAllTemplates(ctx context.Context) ([]DBTemplate, error)
	UpsertTemplate(ctx context.Context, tpl *DBTemplate) error

	// Maintenance
	CleanupOldProcessedEvents(ctx context.Context, olderThan time.Duration) (int64, error)
}

// mailRepository implements Repository using PostgreSQL pgxpool & Redis.
type mailRepository struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

// NewRepository initializes a new mail repository instance.
func NewRepository(db *pgxpool.Pool, redisClient *redis.Client) Repository {
	return &mailRepository{
		db:    db,
		redis: redisClient,
	}
}

// IsEventProcessed checks whether an event idempotency key has already been consumed.
func (r *mailRepository) IsEventProcessed(ctx context.Context, idempotencyKey string) (bool, error) {
	if idempotencyKey == "" {
		return false, nil
	}

	query := `SELECT EXISTS(SELECT 1 FROM processed_events WHERE idempotency_key = $1);`
	var exists bool
	err := r.db.QueryRow(ctx, query, idempotencyKey).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check idempotency key: %w", err)
	}

	return exists, nil
}

// MarkEventProcessed records the idempotency key in PostgreSQL to prevent duplicate execution.
func (r *mailRepository) MarkEventProcessed(ctx context.Context, idempotencyKey, eventID, eventType string) error {
	if idempotencyKey == "" {
		return nil
	}

	query := `
		INSERT INTO processed_events (idempotency_key, event_id, event_type, processed_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (idempotency_key) DO NOTHING;
	`

	_, err := r.db.Exec(ctx, query, idempotencyKey, eventID, eventType)
	if err != nil {
		return fmt.Errorf("failed to record processed event idempotency key: %w", err)
	}

	return nil
}

// CleanupOldProcessedEvents deletes idempotency records older than the specified duration.
func (r *mailRepository) CleanupOldProcessedEvents(ctx context.Context, olderThan time.Duration) (int64, error) {
	cutoff := time.Now().UTC().Add(-olderThan)
	query := `DELETE FROM processed_events WHERE processed_at < $1;`

	res, err := r.db.Exec(ctx, query, cutoff)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup old processed events: %w", err)
	}

	return res.RowsAffected(), nil
}

// CreateEmailLog inserts a new email audit log record into PostgreSQL.
func (r *mailRepository) CreateEmailLog(ctx context.Context, logRecord *EmailLog) error {
	if logRecord.ID == "" {
		id, err := uuid.NewV7()
		if err != nil {
			logRecord.ID = uuid.NewString()
		} else {
			logRecord.ID = id.String()
		}
	}

	metadataJSON, err := json.Marshal(logRecord.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	query := `
		INSERT INTO email_logs (id, event_id, event_type, template_id, to_email, subject, status, error_message, metadata, created_at, sent_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	now := time.Now().UTC()
	if logRecord.CreatedAt.IsZero() {
		logRecord.CreatedAt = now
	}

	_, err = r.db.Exec(ctx, query,
		logRecord.ID,
		logRecord.EventID,
		logRecord.EventType,
		logRecord.TemplateID,
		logRecord.ToEmail,
		logRecord.Subject,
		logRecord.Status,
		logRecord.ErrorMessage,
		metadataJSON,
		logRecord.CreatedAt,
		logRecord.SentAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("failed to insert email log: %w", err)
	}

	return nil
}

// UpdateEmailLogStatus updates the dispatch status and error outcome of an email log.
func (r *mailRepository) UpdateEmailLogStatus(ctx context.Context, id, status, errorMsg string, sentAt *time.Time) error {
	query := `
		UPDATE email_logs
		SET status = $1, error_message = $2, sent_at = $3
		WHERE id = $4
	`

	res, err := r.db.Exec(ctx, query, status, errorMsg, sentAt, id)
	if err != nil {
		return fmt.Errorf("failed to update email log status: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

// GetEmailLogByID retrieves a single email log record by primary key UUID.
func (r *mailRepository) GetEmailLogByID(ctx context.Context, id string) (*EmailLog, error) {
	query := `
		SELECT id, event_id, event_type, COALESCE(template_id, ''), to_email, subject, status, error_message, metadata, created_at, sent_at
		FROM email_logs
		WHERE id = $1
	`

	var record EmailLog
	var metadataBytes []byte

	err := r.db.QueryRow(ctx, query, id).Scan(
		&record.ID,
		&record.EventID,
		&record.EventType,
		&record.TemplateID,
		&record.ToEmail,
		&record.Subject,
		&record.Status,
		&record.ErrorMessage,
		&metadataBytes,
		&record.CreatedAt,
		&record.SentAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to query email log by id: %w", err)
	}

	if len(metadataBytes) > 0 {
		_ = json.Unmarshal(metadataBytes, &record.Metadata)
	}

	return &record, nil
}

// ListEmailLogs returns a paginated list of email logs ordered by creation timestamp descending.
func (r *mailRepository) ListEmailLogs(ctx context.Context, limit, offset int) ([]EmailLog, error) {
	query := `
		SELECT id, event_id, event_type, COALESCE(template_id, ''), to_email, subject, status, error_message, metadata, created_at, sent_at
		FROM email_logs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list email logs: %w", err)
	}
	defer rows.Close()

	var logs []EmailLog
	for rows.Next() {
		var record EmailLog
		var metadataBytes []byte

		if err := rows.Scan(
			&record.ID,
			&record.EventID,
			&record.EventType,
			&record.TemplateID,
			&record.ToEmail,
			&record.Subject,
			&record.Status,
			&record.ErrorMessage,
			&metadataBytes,
			&record.CreatedAt,
			&record.SentAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan email log row: %w", err)
		}

		if len(metadataBytes) > 0 {
			_ = json.Unmarshal(metadataBytes, &record.Metadata)
		}

		logs = append(logs, record)
	}

	return logs, nil
}

// GetEmailStats computes count aggregations for sent, failed, and pending emails.
func (r *mailRepository) GetEmailStats(ctx context.Context) (*EmailStatsResponse, error) {
	query := `
		SELECT
			COUNT(*) AS total_processed,
			COUNT(*) FILTER (WHERE status = 'SENT') AS total_sent,
			COUNT(*) FILTER (WHERE status = 'FAILED') AS total_failed,
			COUNT(*) FILTER (WHERE status = 'PENDING') AS total_pending
		FROM email_logs
	`

	var stats EmailStatsResponse
	err := r.db.QueryRow(ctx, query).Scan(
		&stats.TotalProcessed,
		&stats.TotalSent,
		&stats.TotalFailed,
		&stats.TotalPending,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to compute email stats: %w", err)
	}

	return &stats, nil
}

// GetAllTemplates loads all dynamic email templates stored in PostgreSQL.
func (r *mailRepository) GetAllTemplates(ctx context.Context) ([]DBTemplate, error) {
	query := `
		SELECT id, subject_template, html_template, text_template, updated_at
		FROM email_templates;
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query email templates: %w", err)
	}
	defer rows.Close()

	var templates []DBTemplate
	for rows.Next() {
		var t DBTemplate
		if err := rows.Scan(&t.ID, &t.SubjectTemplate, &t.HTMLTemplate, &t.TextTemplate, &t.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan email template row: %w", err)
		}
		templates = append(templates, t)
	}

	return templates, nil
}

// UpsertTemplate inserts or updates a dynamic email template in PostgreSQL.
func (r *mailRepository) UpsertTemplate(ctx context.Context, tpl *DBTemplate) error {
	query := `
		INSERT INTO email_templates (id, subject_template, html_template, text_template, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (id) DO UPDATE SET
			subject_template = EXCLUDED.subject_template,
			html_template = EXCLUDED.html_template,
			text_template = EXCLUDED.text_template,
			updated_at = NOW();
	`

	_, err := r.db.Exec(ctx, query, tpl.ID, tpl.SubjectTemplate, tpl.HTMLTemplate, tpl.TextTemplate)
	if err != nil {
		return fmt.Errorf("failed to upsert email template: %w", err)
	}

	return nil
}
