package kafka

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

// MessageHandler is a consumer callback function invoked when a message is received.
type MessageHandler func(ctx context.Context, key []byte, value []byte) error

// Receiver encapsulates Kafka consumer configuration and lifecycle.
type Receiver struct {
	reader  *kafka.Reader
	topic   string
	groupID string
}

// NewReceiver creates a configured Kafka message receiver/consumer instance.
func NewReceiver(brokers []string, topic, groupID string) *Receiver {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        brokers,
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       10,         // 10 Bytes minimum fetch size
		MaxBytes:       10 * 1024 * 1024, // 10MB maximum fetch size
		MaxWait:        1 * time.Second,
		CommitInterval: 1 * time.Second,
		StartOffset:    kafka.FirstOffset,
	})

	return &Receiver{
		reader:  reader,
		topic:   topic,
		groupID: groupID,
	}
}

// Start listens for incoming Kafka messages in a blocking loop until context is canceled.
func (r *Receiver) Start(ctx context.Context, handler MessageHandler) error {
	log.Printf("[KAFKA RECEIVER] Started listening on topic '%s' (Group: '%s')", r.topic, r.groupID)

	for {
		select {
		case <-ctx.Done():
			log.Printf("[KAFKA RECEIVER] Stopping receiver loop for topic '%s'...", r.topic)
			return ctx.Err()
		default:
			msg, err := r.reader.FetchMessage(ctx)
			if err != nil {
				if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
					return nil
				}
				log.Printf("[KAFKA RECEIVER ERROR] Failed to fetch message: %v", err)
				time.Sleep(500 * time.Millisecond)
				continue
			}

			// Process message with handler callback
			if err := handler(ctx, msg.Key, msg.Value); err != nil {
				log.Printf("[KAFKA RECEIVER ERROR] Handler failed for message offset %d: %v", msg.Offset, err)
				// Note: Depending on retry policy, we may choose whether to commit or dead-letter
			}

			// Commit offset after processing
			if err := r.reader.CommitMessages(ctx, msg); err != nil {
				log.Printf("[KAFKA RECEIVER ERROR] Failed to commit message offset %d: %v", msg.Offset, err)
			}
		}
	}
}

// Close gracefully closes the Kafka reader connection pool.
func (r *Receiver) Close() error {
	if r.reader != nil {
		if err := r.reader.Close(); err != nil {
			return fmt.Errorf("failed to close kafka receiver reader: %w", err)
		}
	}
	log.Printf("[KAFKA RECEIVER] Consumer for topic '%s' closed cleanly", r.topic)
	return nil
}
