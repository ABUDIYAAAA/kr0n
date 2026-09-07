package auth

import (
	"context"
	"errors"
	"log"
	"time"

	pkf "auth.kron.com/pkg/kafka"
)

// OutboxWorker processes pending outbox events from PostgreSQL and publishes them to Kafka.
type OutboxWorker struct {
	repo         Repository
	producer     *pkf.Producer
	batchSize    int
	pollInterval time.Duration
}

// NewOutboxWorker constructs a new transactional OutboxWorker background instance.
func NewOutboxWorker(repo Repository, producer *pkf.Producer, batchSize int, pollInterval time.Duration) *OutboxWorker {
	if batchSize <= 0 {
		batchSize = 50
	}
	if pollInterval <= 0 {
		pollInterval = 1 * time.Second
	}
	return &OutboxWorker{
		repo:         repo,
		producer:     producer,
		batchSize:    batchSize,
		pollInterval: pollInterval,
	}
}

// Start begins background polling for pending outbox events until context is cancelled.
func (w *OutboxWorker) Start(ctx context.Context) error {
	log.Printf("[OUTBOX WORKER] Outbox background worker started (Interval: %v, BatchSize: %d)", w.pollInterval, w.batchSize)

	ticker := time.NewTicker(w.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[OUTBOX WORKER] Stopping outbox worker cleanly...")
			return ctx.Err()

		case <-ticker.C:
			if err := w.processBatch(ctx); err != nil && !errors.Is(err, context.Canceled) {
				log.Printf("[OUTBOX WORKER ERROR] Failed processing outbox batch: %v", err)
			}
		}
	}
}

func (w *OutboxWorker) processBatch(ctx context.Context) error {
	events, err := w.repo.GetPendingOutboxEvents(ctx, w.batchSize)
	if err != nil {
		return err
	}

	if len(events) == 0 {
		return nil
	}

	log.Printf("[OUTBOX WORKER] Polled %d pending outbox events for publishing...", len(events))

	for _, event := range events {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		err := w.producer.PublishEvent(ctx, event.IdempotencyKey, event.Payload)
		if err != nil {
			log.Printf("[OUTBOX WORKER ERROR] Publish failed for Outbox ID %s (Key: %s): %v", event.ID, event.IdempotencyKey, err)
			_ = w.repo.MarkOutboxEventFailed(ctx, event.ID, err.Error())
			continue
		}

		if err := w.repo.MarkOutboxEventPublished(ctx, event.ID); err != nil {
			log.Printf("[OUTBOX WORKER ERROR] Failed marking outbox event %s published: %v", event.ID, err)
		}
	}

	return nil
}
