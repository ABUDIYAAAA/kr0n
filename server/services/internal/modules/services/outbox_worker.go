package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"services.kron.com/pkg/kafka"
)

type OutboxWorker struct {
	repo         Repository
	producer     *kafka.Producer
	batchSize    int
	pollInterval time.Duration
}

func NewOutboxWorker(repo Repository, producer *kafka.Producer, batchSize int, pollInterval time.Duration) *OutboxWorker {
	if batchSize <= 0 {
		batchSize = 10
	}
	if pollInterval <= 0 {
		pollInterval = 100 * time.Millisecond
	}

	return &OutboxWorker{
		repo:         repo,
		producer:     producer,
		batchSize:    batchSize,
		pollInterval: pollInterval,
	}
}

func (w *OutboxWorker) Start(ctx context.Context) error {
	log.Printf("[OUTBOX WORKER] Starting outbox event poller (batch size: %d, poll: %v)...", w.batchSize, w.pollInterval)
	ticker := time.NewTicker(w.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[OUTBOX WORKER] Stopping poller loop...")
			return ctx.Err()
		case <-ticker.C:
			if err := w.processBatch(ctx); err != nil {
				log.Printf("[OUTBOX WORKER ERROR] Error processing batch: %v", err)
			}
		}
	}
}

func (w *OutboxWorker) processBatch(ctx context.Context) error {
	events, err := w.repo.GetPendingOutboxEvents(ctx, w.batchSize)
	if err != nil {
		return fmt.Errorf("failed to fetch pending outbox events: %w", err)
	}

	if len(events) == 0 {
		return nil
	}

	for _, event := range events {
		if w.producer != nil {
			if err := w.producer.PublishEvent(ctx, event.IdempotencyKey, event.Payload); err != nil {
				log.Printf("[OUTBOX WORKER ERROR] Failed to publish event %s: %v", event.ID, err)
				_ = w.repo.MarkOutboxEventFailed(ctx, event.ID, err.Error())
				continue
			}
		}

		if err := w.repo.MarkOutboxEventPublished(ctx, event.ID); err != nil {
			log.Printf("[OUTBOX WORKER ERROR] Failed to mark event %s as published: %v", event.ID, err)
		}
	}

	return nil
}
