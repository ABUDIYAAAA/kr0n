package mail

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	pkf "mail.kron.com/pkg/kafka"
)

// EventReceiver manages Kafka subscription and message deserialization for mail events.
type EventReceiver struct {
	receiver *pkf.Receiver
	service  Service
}

// NewEventReceiver constructs an EventReceiver binding Kafka consumer to mail business logic.
func NewEventReceiver(receiver *pkf.Receiver, service Service) *EventReceiver {
	return &EventReceiver{
		receiver: receiver,
		service:  service,
	}
}

// Start begins listening to Kafka topic for email events until context is canceled.
func (r *EventReceiver) Start(ctx context.Context) error {
	log.Println("[INFO] Starting Mail Event Kafka Receiver worker...")

	return r.receiver.Start(ctx, func(ctx context.Context, key, value []byte) error {
		var payload EmailEventPayload
		if err := json.Unmarshal(value, &payload); err != nil {
			log.Printf("[KAFKA RECEIVER ERROR] Failed to unmarshal email event payload: %v. Raw msg: %s", err, string(value))
			// Skip malformed messages to prevent deadlocks
			return nil
		}

		log.Printf("[KAFKA RECEIVER] Received Email Event [ID: %s, Type: %s, To: %s]", payload.EventID, payload.EventType, payload.ToEmail)

		if err := r.service.ProcessEmailEvent(ctx, payload); err != nil {
			return fmt.Errorf("failed to process email event payload: %w", err)
		}

		return nil
	})
}
