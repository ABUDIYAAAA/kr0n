package mail

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"mail.kron.com/pkg/smtp"
	"mail.kron.com/pkg/templates"
)

// EmailJob represents an incoming mail event item pushed to the worker queue.
type EmailJob struct {
	Ctx     context.Context
	Payload EmailEventPayload
}

// WorkerPool manages a bounded number of worker goroutines consuming mail dispatches.
type WorkerPool struct {
	repo        Repository
	templateMgr *templates.TemplateManager
	smtpMgr     *smtp.SMTPManager
	jobQueue    chan EmailJob
	workerCount int
	maxRetries  int
	wg          sync.WaitGroup
	quit        chan struct{}
}

// NewWorkerPool initializes worker pool with configured pool size, queue capacity, and retry parameters.
func NewWorkerPool(repo Repository, tm *templates.TemplateManager, sm *smtp.SMTPManager, workerCount, queueCapacity, maxRetries int) *WorkerPool {
	if workerCount <= 0 {
		workerCount = 10
	}
	if queueCapacity <= 0 {
		queueCapacity = 100
	}
	if maxRetries <= 0 {
		maxRetries = 3
	}

	return &WorkerPool{
		repo:        repo,
		templateMgr: tm,
		smtpMgr:     sm,
		jobQueue:    make(chan EmailJob, queueCapacity),
		workerCount: workerCount,
		maxRetries:  maxRetries,
		quit:        make(chan struct{}),
	}
}

// Start launches worker goroutines that process queued email jobs concurrently.
func (wp *WorkerPool) Start(ctx context.Context) {
	log.Printf("[WORKER POOL] Launching %d worker goroutines (Queue Capacity: %d)...", wp.workerCount, cap(wp.jobQueue))

	for i := 1; i <= wp.workerCount; i++ {
		wp.wg.Add(1)
		go wp.workerWorker(ctx, i)
	}
}

// Submit enqueues an incoming EmailEventPayload job into the worker queue with blocking backpressure.
func (wp *WorkerPool) Submit(ctx context.Context, payload EmailEventPayload) bool {
	select {
	case wp.jobQueue <- EmailJob{Ctx: ctx, Payload: payload}:
		return true
	case <-ctx.Done():
		log.Printf("[WORKER POOL WARN] Context cancelled while waiting to enqueue event %s", payload.EventID)
		return false
	}
}

// workerWorker is a single worker loop pulling jobs from the channel until closed.
func (wp *WorkerPool) workerWorker(ctx context.Context, workerID int) {
	defer wp.wg.Done()
	log.Printf("[WORKER POOL] Worker #%d ready for jobs", workerID)

	for {
		select {
		case <-wp.quit:
			return
		case job, ok := <-wp.jobQueue:
			if !ok {
				return
			}
			if err := wp.ProcessJob(job.Ctx, job.Payload); err != nil {
				log.Printf("[WORKER #%d ERROR] Job processing failed for %s: %v", workerID, job.Payload.ToEmail, err)
			}
		}
	}
}

// ProcessJob performs idempotency check, template rendering, SMTP dispatch with exponential retries, and audit logging.
func (wp *WorkerPool) ProcessJob(ctx context.Context, payload EmailEventPayload) error {
	if payload.ToEmail == "" {
		return fmt.Errorf("invalid event payload: missing recipient email")
	}

	// 1. Idempotency Check
	if payload.IdempotencyKey != "" {
		isProcessed, err := wp.repo.IsEventProcessed(ctx, payload.IdempotencyKey)
		if err == nil && isProcessed {
			log.Printf("[WORKER POOL] Duplicate event skipped (Idempotency Key: %s)", payload.IdempotencyKey)
			return nil
		}
	}

	// 2. Assemble Data Context for Template Rendering
	data := make(map[string]any)
	if payload.TemplateData != nil {
		for k, v := range payload.TemplateData {
			data[k] = v
		}
	}
	if payload.Username != "" {
		data["username"] = payload.Username
	}
	if payload.VerificationToken != "" {
		data["verification_token"] = payload.VerificationToken
	}
	if payload.VerificationURL != "" {
		data["verification_url"] = payload.VerificationURL
	}
	if payload.ResetToken != "" {
		data["reset_token"] = payload.ResetToken
	}
	if payload.ResetURL != "" {
		data["reset_url"] = payload.ResetURL
	}
	if payload.Subject != "" {
		data["subject"] = payload.Subject
	}
	if payload.Body != "" {
		data["body"] = payload.Body
	}

	// Select Template ID (default to email_verification / password_reset / welcome / custom)
	templateID := payload.TemplateID
	if templateID == "" {
		switch payload.EventType {
		case EventEmailVerification:
			templateID = TemplateEmailVerification
		case EventPasswordReset:
			templateID = TemplatePasswordReset
		case EventWelcomeEmail:
			templateID = TemplateWelcomeEmail
		default:
			templateID = TemplateCustomEmail
		}
	}

	// 3. Render HTML/Text Template
	rendered, err := wp.templateMgr.Render(templateID, data)
	if err != nil {
		return fmt.Errorf("template rendering failed for '%s': %w", templateID, err)
	}

	// 4. Record PENDING Log in PostgreSQL
	logRecord := &EmailLog{
		EventID:    payload.EventID,
		EventType:  payload.EventType,
		TemplateID: templateID,
		ToEmail:    payload.ToEmail,
		Subject:    rendered.Subject,
		Status:     StatusPending,
		Metadata:   payload.Metadata,
		CreatedAt:  time.Now().UTC(),
	}

	if err := wp.repo.CreateEmailLog(ctx, logRecord); err != nil {
		log.Printf("[WARN] Failed to insert initial email log: %v", err)
	}

	// 5. Dispatch Email via Multi-SMTP Manager with Exponential Backoff Retries
	var sendErr error
	backoff := []time.Duration{1 * time.Second, 3 * time.Second, 10 * time.Second}

	for attempt := 1; attempt <= wp.maxRetries; attempt++ {
		sendErr = wp.smtpMgr.SendMail(payload.SMTPAccountID, payload.ToEmail, rendered.Subject, rendered.HTMLBody, rendered.TextBody)
		if sendErr == nil {
			break
		}
		if attempt < wp.maxRetries {
			backoffDuration := backoff[0]
			if attempt-1 < len(backoff) {
				backoffDuration = backoff[attempt-1]
			}
			log.Printf("[WORKER POOL WARN] Email dispatch attempt %d/%d failed for %s: %v. Retrying in %v...", attempt, wp.maxRetries, payload.ToEmail, sendErr, backoffDuration)
			time.Sleep(backoffDuration)
		}
	}

	now := time.Now().UTC()

	if sendErr != nil {
		_ = wp.repo.UpdateEmailLogStatus(ctx, logRecord.ID, StatusFailed, sendErr.Error(), nil)
		return fmt.Errorf("email dispatch failed after %d attempts: %w", wp.maxRetries, sendErr)
	}

	// 6. Update Log Status & Record Idempotency Key
	_ = wp.repo.UpdateEmailLogStatus(ctx, logRecord.ID, StatusSent, "", &now)
	if payload.IdempotencyKey != "" {
		_ = wp.repo.MarkEventProcessed(ctx, payload.IdempotencyKey, payload.EventID, payload.EventType)
	}

	log.Printf("[WORKER POOL] Mail dispatched successfully [To: %s, Template: %s, Key: %s]", payload.ToEmail, templateID, payload.IdempotencyKey)
	return nil
}

// Stop gracefully shuts down all worker goroutines after current jobs complete.
func (wp *WorkerPool) Stop() {
	log.Println("[WORKER POOL] Stopping worker pool and waiting for active workers to drain...")
	close(wp.quit)
	close(wp.jobQueue)
	wp.wg.Wait()
	log.Println("[WORKER POOL] All worker goroutines stopped cleanly")
}
