package mail

import (
	"context"
	"errors"
	"log"
	"time"

	"mail.kron.com/internal/api/config"
	"mail.kron.com/pkg/smtp"
	"mail.kron.com/pkg/templates"
)

var (
	ErrInvalidEventPayload = errors.New("invalid or incomplete email event payload")
	ErrLogNotFound         = errors.New("email log not found")
)

// Service defines business operations for internal email background processing & audit query.
type Service interface {
	ProcessEmailEvent(ctx context.Context, payload EmailEventPayload) error
	GetStats(ctx context.Context) (*EmailStatsResponse, error)
	Stop()
}

// mailService implements Service interface with Bounded WorkerPool & background maintenance.
type mailService struct {
	repo          Repository
	cfg           *config.Config
	workerPool    *WorkerPool
	cancelCleanup context.CancelFunc
}

// NewService constructs mailService, initializing TemplateManager, SMTPManager, WorkerPool, and maintenance ticker.
func NewService(repo Repository, cfg *config.Config) Service {
	templateMgr := templates.NewTemplateManager()
	smtpMgr := smtp.NewSMTPManager(cfg)
	workerPool := NewWorkerPool(repo, templateMgr, smtpMgr, cfg.WorkerPoolSize, cfg.QueueCapacity, cfg.MailMaxRetries)

	ctx := context.Background()
	workerPool.Start(ctx)

	cleanupCtx, cancelCleanup := context.WithCancel(context.Background())

	svc := &mailService{
		repo:          repo,
		cfg:           cfg,
		workerPool:    workerPool,
		cancelCleanup: cancelCleanup,
	}

	svc.startCleanupTicker(cleanupCtx)
	return svc
}

// ProcessEmailEvent submits incoming Kafka events to the bounded WorkerPool for asynchronous execution.
func (s *mailService) ProcessEmailEvent(ctx context.Context, payload EmailEventPayload) error {
	if payload.ToEmail == "" {
		return ErrInvalidEventPayload
	}

	// Submit job to worker pool
	s.workerPool.Submit(ctx, payload)
	return nil
}

// GetStats queries count aggregations for mail processing operations.
func (s *mailService) GetStats(ctx context.Context) (*EmailStatsResponse, error) {
	return s.repo.GetEmailStats(ctx)
}

// startCleanupTicker runs a periodic maintenance ticker to prune idempotency entries based on runtime configuration.
func (s *mailService) startCleanupTicker(ctx context.Context) {
	retentionWindow := time.Duration(s.cfg.IdempotencyRetentionDays) * 24 * time.Hour
	cleanupInterval := s.cfg.CleanupInterval
	if cleanupInterval <= 0 {
		cleanupInterval = DefaultCleanupInterval
	}

	go func() {
		// Run initial cleanup sweep on startup
		if count, err := s.repo.CleanupOldProcessedEvents(ctx, retentionWindow); err == nil && count > 0 {
			log.Printf("[MAINTENANCE] Cleaned up %d old idempotency records (>%d days old)", count, s.cfg.IdempotencyRetentionDays)
		}

		ticker := time.NewTicker(cleanupInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if count, err := s.repo.CleanupOldProcessedEvents(ctx, retentionWindow); err != nil {
					log.Printf("[MAINTENANCE ERROR] Failed to cleanup old idempotency records: %v", err)
				} else if count > 0 {
					log.Printf("[MAINTENANCE] Cleaned up %d old idempotency records", count)
				}
			}
		}
	}()
}

// Stop cleanly terminates the background worker pool workers and maintenance tickers.
func (s *mailService) Stop() {
	if s.cancelCleanup != nil {
		s.cancelCleanup()
	}
	if s.workerPool != nil {
		s.workerPool.Stop()
	}
}
