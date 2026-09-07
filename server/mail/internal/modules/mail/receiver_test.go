package mail

import (
	"context"
	"encoding/json"
	"testing"

	pkf "mail.kron.com/pkg/kafka"
)

type mockKafkaReceiver struct {
	handler pkf.MessageHandler
}

func (m *mockKafkaReceiver) Start(ctx context.Context, handler pkf.MessageHandler) error {
	m.handler = handler
	return nil
}

type mockMailService struct {
	processed []EmailEventPayload
}

func (m *mockMailService) ProcessEmailEvent(ctx context.Context, payload EmailEventPayload) error {
	m.processed = append(m.processed, payload)
	return nil
}

func (m *mockMailService) GetStats(ctx context.Context) (*EmailStatsResponse, error) {
	return nil, nil
}

func (m *mockMailService) Stop() {}

func TestEventReceiver(t *testing.T) {
	mockKafka := &mockKafkaReceiver{}
	mockSvc := &mockMailService{}

	er := NewEventReceiver(mockKafka, mockSvc)
	ctx := context.Background()

	err := er.Start(ctx)
	if err != nil {
		t.Fatalf("EventReceiver.Start failed: %v", err)
	}

	if mockKafka.handler == nil {
		t.Fatalf("expected handler to be set on mockKafkaReceiver")
	}

	// 1. Process malformed JSON payload (should be skipped without error)
	err = mockKafka.handler(ctx, []byte("key1"), []byte("invalid json"))
	if err != nil {
		t.Fatalf("expected nil error for malformed json, got %v", err)
	}
	if len(mockSvc.processed) != 0 {
		t.Fatalf("expected 0 processed events for malformed json, got %d", len(mockSvc.processed))
	}

	// 2. Process valid payload
	payloadBytes, _ := json.Marshal(EmailEventPayload{
		EventID:        "evt_k1",
		EventType:      EventWelcomeEmail,
		ToEmail:        "frank@kron.com",
		Username:       "frank",
		IdempotencyKey: "key_frank",
	})

	err = mockKafka.handler(ctx, []byte("key_frank"), payloadBytes)
	if err != nil {
		t.Fatalf("handler failed for valid payload: %v", err)
	}

	if len(mockSvc.processed) != 1 {
		t.Fatalf("expected 1 processed event, got %d", len(mockSvc.processed))
	}
	if mockSvc.processed[0].EventID != "evt_k1" || mockSvc.processed[0].ToEmail != "frank@kron.com" {
		t.Fatalf("unexpected processed payload: %+v", mockSvc.processed[0])
	}
}
