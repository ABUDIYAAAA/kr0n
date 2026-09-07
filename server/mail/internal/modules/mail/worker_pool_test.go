package mail

import (
	"context"
	"strings"
	"testing"
	"time"

	"mail.kron.com/internal/api/config"
	"mail.kron.com/pkg/smtp"
	"mail.kron.com/pkg/templates"
)

type mockRepository struct {
	processedEvents map[string]bool
	emailLogs       map[string]*EmailLog
	templates       map[string]*DBTemplate
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		processedEvents: make(map[string]bool),
		emailLogs:       make(map[string]*EmailLog),
		templates:       make(map[string]*DBTemplate),
	}
}

func (m *mockRepository) IsEventProcessed(ctx context.Context, idempotencyKey string) (bool, error) {
	return m.processedEvents[idempotencyKey], nil
}

func (m *mockRepository) MarkEventProcessed(ctx context.Context, idempotencyKey, eventID, eventType string) error {
	m.processedEvents[idempotencyKey] = true
	return nil
}

func (m *mockRepository) CreateEmailLog(ctx context.Context, log *EmailLog) error {
	if log.ID == "" {
		log.ID = "log_" + log.EventID
	}
	m.emailLogs[log.ID] = log
	return nil
}

func (m *mockRepository) UpdateEmailLogStatus(ctx context.Context, id, status, errorMsg string, sentAt *time.Time) error {
	l, ok := m.emailLogs[id]
	if !ok {
		return ErrNotFound
	}
	l.Status = status
	l.ErrorMessage = errorMsg
	l.SentAt = sentAt
	return nil
}

func (m *mockRepository) GetEmailLogByID(ctx context.Context, id string) (*EmailLog, error) {
	l, ok := m.emailLogs[id]
	if !ok {
		return nil, ErrNotFound
	}
	return l, nil
}

func (m *mockRepository) ListEmailLogs(ctx context.Context, limit, offset int) ([]EmailLog, error) {
	var list []EmailLog
	for _, l := range m.emailLogs {
		list = append(list, *l)
	}
	return list, nil
}

func (m *mockRepository) GetEmailStats(ctx context.Context) (*EmailStatsResponse, error) {
	var sent, failed, pending int64
	for _, l := range m.emailLogs {
		switch l.Status {
		case StatusSent:
			sent++
		case StatusFailed:
			failed++
		case StatusPending:
			pending++
		}
	}
	return &EmailStatsResponse{
		TotalProcessed: int64(len(m.emailLogs)),
		TotalSent:      sent,
		TotalFailed:    failed,
		TotalPending:   pending,
	}, nil
}

func (m *mockRepository) GetAllTemplates(ctx context.Context) ([]DBTemplate, error) {
	var list []DBTemplate
	for _, t := range m.templates {
		list = append(list, *t)
	}
	return list, nil
}

func (m *mockRepository) UpsertTemplate(ctx context.Context, tpl *DBTemplate) error {
	m.templates[tpl.ID] = tpl
	return nil
}

func (m *mockRepository) CleanupOldProcessedEvents(ctx context.Context, olderThan time.Duration) (int64, error) {
	return 0, nil
}

func setupWorkerPool() (*WorkerPool, *mockRepository) {
	repo := newMockRepository()
	tm := templates.NewTemplateManager()
	cfg := &config.Config{
		SMTPHost:      "localhost",
		SMTPPort:      1025,
		SMTPUsername:  "user",
		SMTPPassword:  "pass",
		SMTPFromEmail: "noreply@kron.com",
		SMTPFromName:  "Kr0n Mailer",
	}
	sm := smtp.NewSMTPManager(cfg)
	wp := NewWorkerPool(repo, tm, sm, 2, 10, 1)
	return wp, repo
}

func TestProcessJobValidationAndIdempotency(t *testing.T) {
	wp, repo := setupWorkerPool()
	ctx := context.Background()

	// 1. Missing recipient email
	err := wp.ProcessJob(ctx, EmailEventPayload{EventID: "evt_1"})
	if err == nil || !strings.Contains(err.Error(), "missing recipient email") {
		t.Fatalf("expected missing recipient email error, got %v", err)
	}

	// 2. Successful job execution
	payload := EmailEventPayload{
		EventID:           "evt_2",
		EventType:         EventEmailVerification,
		ToEmail:           "alice@kron.com",
		Username:          "alice",
		VerificationToken: "token_123",
		VerificationURL:   "http://localhost/verify",
		IdempotencyKey:    "key_alice_1",
	}

	err = wp.ProcessJob(ctx, payload)
	if err != nil {
		t.Fatalf("ProcessJob failed: %v", err)
	}

	// Verify idempotency record saved
	if !repo.processedEvents["key_alice_1"] {
		t.Fatalf("expected idempotency key key_alice_1 to be marked as processed")
	}

	// Verify email log updated to SENT
	logRec, err := repo.GetEmailLogByID(ctx, "log_evt_2")
	if err != nil {
		t.Fatalf("failed to find email log: %v", err)
	}
	if logRec.Status != StatusSent {
		t.Fatalf("expected email log status SENT, got %s", logRec.Status)
	}

	// 3. Re-submitting same idempotency key should skip execution
	err = wp.ProcessJob(ctx, payload)
	if err != nil {
		t.Fatalf("ProcessJob for duplicate event should return nil error, got %v", err)
	}
}

func TestProcessJobDefaultTemplates(t *testing.T) {
	wp, repo := setupWorkerPool()
	ctx := context.Background()

	// EventPasswordReset default template
	err := wp.ProcessJob(ctx, EmailEventPayload{
		EventID:        "evt_pwd",
		EventType:      EventPasswordReset,
		ToEmail:        "bob@kron.com",
		Username:       "bob",
		ResetToken:     "token_pwd",
		ResetURL:       "http://localhost/reset",
		IdempotencyKey: "key_pwd",
	})
	if err != nil {
		t.Fatalf("ProcessJob for password reset failed: %v", err)
	}

	logRec, _ := repo.GetEmailLogByID(ctx, "log_evt_pwd")
	if logRec.TemplateID != TemplatePasswordReset {
		t.Fatalf("expected template %s, got %s", TemplatePasswordReset, logRec.TemplateID)
	}

	// EventWelcomeEmail default template
	err = wp.ProcessJob(ctx, EmailEventPayload{
		EventID:        "evt_welcome",
		EventType:      EventWelcomeEmail,
		ToEmail:        "charlie@kron.com",
		Username:       "charlie",
		IdempotencyKey: "key_welcome",
	})
	if err != nil {
		t.Fatalf("ProcessJob for welcome email failed: %v", err)
	}

	logRec2, _ := repo.GetEmailLogByID(ctx, "log_evt_welcome")
	if logRec2.TemplateID != TemplateWelcomeEmail {
		t.Fatalf("expected template %s, got %s", TemplateWelcomeEmail, logRec2.TemplateID)
	}
}

func TestWorkerPoolStartSubmitAndStop(t *testing.T) {
	wp, _ := setupWorkerPool()
	ctx := context.Background()

	wp.Start(ctx)

	submitted := wp.Submit(ctx, EmailEventPayload{
		EventID:        "evt_async",
		EventType:      EventWelcomeEmail,
		ToEmail:        "dave@kron.com",
		Username:       "dave",
		IdempotencyKey: "key_dave",
	})

	if !submitted {
		t.Fatalf("expected Submit to return true")
	}

	time.Sleep(50 * time.Millisecond)
	wp.Stop()
}
