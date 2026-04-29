package email

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGRepository struct {
	pool *pgxpool.Pool
}

func NewPGRepository(pool *pgxpool.Pool) *PGRepository {
	if pool == nil {
		return nil
	}
	return &PGRepository{pool: pool}
}

func (r *PGRepository) Reserve(ctx context.Context, record *DeliveryRecord) (*DeliveryRecord, error) {
	if r == nil || r.pool == nil {
		return record, nil
	}

	payload, _ := json.Marshal(record.Payload)
	query := `
	INSERT INTO email_deliveries (
		message_id,
		kind,
		template,
		recipient,
		subject,
		status,
		attempt_count,
		payload,
		created_at,
		updated_at,
		last_attempt_at
	)
	VALUES ($1,$2,$3,$4,$5,$6,1,$7,now(),now(),now())
	ON CONFLICT (message_id) DO UPDATE SET
		attempt_count = email_deliveries.attempt_count + 1,
		status = CASE WHEN email_deliveries.status = 'delivered' THEN email_deliveries.status ELSE EXCLUDED.status END,
		updated_at = now(),
		last_attempt_at = now()
	WHERE email_deliveries.status <> 'delivered'
	RETURNING id, message_id, kind, template, recipient, subject, status, attempt_count, provider_message_id, last_error, payload, created_at, updated_at, sent_at
	`
	var out DeliveryRecord
	var rawPayload []byte
	err := r.pool.QueryRow(ctx, query,
		record.MessageID,
		record.Kind,
		record.Template,
		record.Recipient,
		record.Subject,
		record.Status,
		payload,
	).Scan(
		&out.ID,
		&out.MessageID,
		&out.Kind,
		&out.Template,
		&out.Recipient,
		&out.Subject,
		&out.Status,
		&out.AttemptCount,
		&out.ProviderMessage,
		&out.LastError,
		&rawPayload,
		&out.CreatedAt,
		&out.UpdatedAt,
		&out.SentAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAlreadyDelivered
		}
		return nil, err
	}
	_ = json.Unmarshal(rawPayload, &out.Payload)
	return &out, nil
}

func (r *PGRepository) MarkDelivered(ctx context.Context, messageID, providerMessageID string, sentAt time.Time) error {
	if r == nil || r.pool == nil {
		return nil
	}
	_, err := r.pool.Exec(ctx, `
	UPDATE email_deliveries
	SET status = 'delivered', provider_message_id = $2, sent_at = $3, updated_at = now(), last_error = NULL
	WHERE message_id = $1
	`, messageID, providerMessageID, sentAt)
	return err
}

func (r *PGRepository) MarkFailed(ctx context.Context, messageID, lastErr string) error {
	if r == nil || r.pool == nil {
		return nil
	}
	_, err := r.pool.Exec(ctx, `
	UPDATE email_deliveries
	SET status = 'failed', last_error = $2, updated_at = now(), last_attempt_at = now()
	WHERE message_id = $1
	`, messageID, lastErr)
	return err
}
