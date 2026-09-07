package mail

import (
	"context"
	"testing"
	"time"

	"mail.kron.com/internal/api/config"
)

func TestMailServiceOperations(t *testing.T) {
	repo := newMockRepository()
	cfg := &config.Config{
		WorkerPoolSize:           2,
		QueueCapacity:            10,
		MailMaxRetries:           1,
		IdempotencyRetentionDays: 30,
		CleanupInterval:          50 * time.Millisecond,
		SMTPHost:                 "localhost",
		SMTPPort:                 1025,
		SMTPUsername:             "user",
		SMTPPassword:             "pass",
		SMTPFromEmail:            "noreply@kron.com",
		SMTPFromName:             "Kr0n Mailer",
	}

	svc := NewService(repo, cfg)
	ctx := context.Background()

	// 1. ProcessEmailEvent invalid payload
	err := svc.ProcessEmailEvent(ctx, EmailEventPayload{EventID: "evt_invalid"})
	if err != ErrInvalidEventPayload {
		t.Fatalf("expected ErrInvalidEventPayload for empty to_email, got %v", err)
	}

	// 2. ProcessEmailEvent valid payload
	err = svc.ProcessEmailEvent(ctx, EmailEventPayload{
		EventID:        "evt_svc_1",
		EventType:      EventWelcomeEmail,
		ToEmail:        "eve@kron.com",
		Username:       "eve",
		IdempotencyKey: "key_eve",
	})
	if err != nil {
		t.Fatalf("ProcessEmailEvent failed: %v", err)
	}

	time.Sleep(100 * time.Millisecond)

	// 3. GetStats query
	stats, err := svc.GetStats(ctx)
	if err != nil {
		t.Fatalf("GetStats failed: %v", err)
	}
	if stats.TotalProcessed != 1 || stats.TotalSent != 1 {
		t.Fatalf("unexpected stats: %+v", stats)
	}

	// 4. Stop service cleanly
	svc.Stop()
}
