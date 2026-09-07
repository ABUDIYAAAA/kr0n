package auth

import (
	"context"
	"errors"
	"testing"
	"time"
)

type mockPublisher struct {
	published map[string][]byte
	fail      bool
}

func (m *mockPublisher) PublishEvent(ctx context.Context, key string, payload []byte) error {
	if m.fail {
		return errors.New("kafka connection failure")
	}
	m.published[key] = payload
	return nil
}

func TestOutboxWorkerBatchProcessing(t *testing.T) {
	repo := newMockRepository()
	pub := &mockPublisher{published: make(map[string][]byte)}
	worker := NewOutboxWorker(repo, pub, 10, 50*time.Millisecond)

	ctx := context.Background()

	// 1. No outbox events
	err := worker.processBatch(ctx)
	if err != nil {
		t.Fatalf("expected nil error for empty batch, got %v", err)
	}

	// 2. Add pending outbox event
	_ = repo.InsertOutboxEventTx(ctx, nil, &OutboxEvent{
		ID:             "evt_1",
		EventType:      "EMAIL_VERIFICATION",
		Payload:        []byte(`{"to":"alice@kron.com"}`),
		IdempotencyKey: "key_1",
		Status:         "PENDING",
	})

	err = worker.processBatch(ctx)
	if err != nil {
		t.Fatalf("processBatch failed: %v", err)
	}

	if len(pub.published) != 1 {
		t.Fatalf("expected 1 published event, got %d", len(pub.published))
	}
	if repo.outboxEvents[0].Status != "PUBLISHED" {
		t.Fatalf("expected outbox event status PUBLISHED, got %s", repo.outboxEvents[0].Status)
	}

	// 3. Test publishing failure and retry
	pub.fail = true
	_ = repo.InsertOutboxEventTx(ctx, nil, &OutboxEvent{
		ID:             "evt_2",
		EventType:      "PASSWORD_RESET",
		Payload:        []byte(`{"to":"bob@kron.com"}`),
		IdempotencyKey: "key_2",
		Status:         "PENDING",
	})

	err = worker.processBatch(ctx)
	if err != nil {
		t.Fatalf("processBatch should handle publish error gracefully, got %v", err)
	}

	if repo.outboxEvents[1].RetryCount != 1 {
		t.Fatalf("expected retry count 1, got %d", repo.outboxEvents[1].RetryCount)
	}
}

func TestOutboxWorkerStartAndCancel(t *testing.T) {
	repo := newMockRepository()
	pub := &mockPublisher{published: make(map[string][]byte)}
	worker := NewOutboxWorker(repo, pub, 10, 10*time.Millisecond)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
	defer cancel()

	err := worker.Start(ctx)
	if !errors.Is(err, context.DeadlineExceeded) && !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context cancellation error, got %v", err)
	}
}
