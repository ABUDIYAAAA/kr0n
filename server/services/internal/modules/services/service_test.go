package services

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"services.kron.com/internal/api/config"
)

type mockRepository struct {
	services     map[string]*ServiceEntity
	outboxEvents []*OutboxEvent
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		services:     make(map[string]*ServiceEntity),
		outboxEvents: make([]*OutboxEvent, 0),
	}
}

func (m *mockRepository) WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	return fn(nil)
}

func (m *mockRepository) CreateService(ctx context.Context, s *ServiceEntity) error {
	return m.CreateServiceTx(ctx, nil, s)
}

func (m *mockRepository) CreateServiceTx(ctx context.Context, tx pgx.Tx, s *ServiceEntity) error {
	if s.ID == "" {
		s.ID = "svc_test_" + s.Name
	}
	s.CreatedAt = time.Now().UTC()
	s.UpdatedAt = time.Now().UTC()
	m.services[s.ID] = s
	return nil
}

func (m *mockRepository) GetServiceByID(ctx context.Context, id string) (*ServiceEntity, error) {
	s, ok := m.services[id]
	if !ok {
		return nil, ErrNotFound
	}
	return s, nil
}

func (m *mockRepository) GetServiceByUserIDAndName(ctx context.Context, userID, name string) (*ServiceEntity, error) {
	for _, s := range m.services {
		if s.UserID == userID && s.Name == name {
			return s, nil
		}
	}
	return nil, ErrNotFound
}

func (m *mockRepository) ListServicesByUserID(ctx context.Context, userID string, page, limit int) ([]ServiceEntity, int64, error) {
	var list []ServiceEntity
	for _, s := range m.services {
		if s.UserID == userID {
			list = append(list, *s)
		}
	}
	return list, int64(len(list)), nil
}

func (m *mockRepository) UpdateService(ctx context.Context, s *ServiceEntity) error {
	s.UpdatedAt = time.Now().UTC()
	m.services[s.ID] = s
	return nil
}

func (m *mockRepository) DeleteService(ctx context.Context, id, userID string) error {
	s, ok := m.services[id]
	if !ok || s.UserID != userID {
		return ErrNotFound
	}
	delete(m.services, id)
	return nil
}

func (m *mockRepository) InsertOutboxEventTx(ctx context.Context, tx pgx.Tx, event *OutboxEvent) error {
	m.outboxEvents = append(m.outboxEvents, event)
	return nil
}

func (m *mockRepository) GetPendingOutboxEvents(ctx context.Context, limit int) ([]OutboxEvent, error) {
	var list []OutboxEvent
	for _, e := range m.outboxEvents {
		if e.Status == "PENDING" {
			list = append(list, *e)
		}
	}
	return list, nil
}

func (m *mockRepository) MarkOutboxEventPublished(ctx context.Context, id string) error {
	for _, e := range m.outboxEvents {
		if e.ID == id {
			e.Status = "PUBLISHED"
		}
	}
	return nil
}

func (m *mockRepository) MarkOutboxEventFailed(ctx context.Context, id string, errMsg string) error {
	for _, e := range m.outboxEvents {
		if e.ID == id {
			e.RetryCount++
			e.ErrorMessage = errMsg
		}
	}
	return nil
}

func TestCreateServiceAndOutbox(t *testing.T) {
	repo := newMockRepository()
	cfg := &config.Config{}
	svc := NewService(repo, cfg)
	ctx := context.Background()

	// 1. Create service
	created, err := svc.CreateService(ctx, "usr_100", CreateServiceRequest{
		GitHubRepoID: 5544,
		RepoName:     "my-frontend",
		RepoFullName: "org/my-frontend",
		RepoOwner:    "org",
		Branch:       "main",
		BuildCommand: stringPtr("npm run build"),
	})
	if err != nil {
		t.Fatalf("CreateService failed: %v", err)
	}

	if created.Name != "my-frontend" {
		t.Fatalf("expected name 'my-frontend', got '%s'", created.Name)
	}

	if len(repo.outboxEvents) != 1 {
		t.Fatalf("expected 1 outbox event, got %d", len(repo.outboxEvents))
	}
	if repo.outboxEvents[0].EventType != "SERVICE_CREATED" {
		t.Fatalf("expected event type SERVICE_CREATED, got %s", repo.outboxEvents[0].EventType)
	}

	// 2. Test name collision randomization
	created2, err := svc.CreateService(ctx, "usr_100", CreateServiceRequest{
		GitHubRepoID: 5544,
		RepoName:     "my-frontend",
		RepoFullName: "org/my-frontend",
		RepoOwner:    "org",
	})
	if err != nil {
		t.Fatalf("CreateService collision failed: %v", err)
	}
	if created2.Name == "my-frontend" {
		t.Fatalf("expected randomized suffix on collision, got %s", created2.Name)
	}
}

func TestUpdateAndDeleteService(t *testing.T) {
	repo := newMockRepository()
	cfg := &config.Config{}
	svc := NewService(repo, cfg)
	ctx := context.Background()

	created, _ := svc.CreateService(ctx, "usr_100", CreateServiceRequest{
		GitHubRepoID: 1234,
		RepoName:     "backend",
		RepoFullName: "org/backend",
		RepoOwner:    "org",
	})

	// Update service
	updated, err := svc.UpdateService(ctx, "usr_100", created.ID, UpdateServiceRequest{
		Branch:       "staging",
		BuildCommand: stringPtr("go build -o app ./cmd/api"),
	})
	if err != nil {
		t.Fatalf("UpdateService failed: %v", err)
	}
	if updated.Branch != "staging" {
		t.Fatalf("expected branch 'staging', got '%s'", updated.Branch)
	}

	// Delete service
	err = svc.DeleteService(ctx, "usr_100", created.ID)
	if err != nil {
		t.Fatalf("DeleteService failed: %v", err)
	}

	_, err = svc.GetServiceByID(ctx, "usr_100", created.ID)
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound after delete, got %v", err)
	}
}

func stringPtr(s string) *string {
	return &s
}
