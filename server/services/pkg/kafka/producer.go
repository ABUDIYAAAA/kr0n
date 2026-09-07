package kafka

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
	topic  string
}

func NewProducer(brokers []string, topic string) *Producer {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireAll,
		MaxAttempts:  5,
		BatchTimeout: 10 * time.Millisecond,
		Async:        false,
	}

	return &Producer{
		writer: writer,
		topic:  topic,
	}
}

func (p *Producer) PublishEvent(ctx context.Context, key string, payload []byte) error {
	msg := kafka.Message{
		Key:   []byte(key),
		Value: payload,
		Time:  time.Now().UTC(),
		Headers: []kafka.Header{
			{Key: "idempotency_key", Value: []byte(key)},
		},
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("failed to write kafka message to topic '%s': %w", p.topic, err)
	}

	log.Printf("[KAFKA PRODUCER] Published event [Key: %s] to topic '%s'", key, p.topic)
	return nil
}

func (p *Producer) Close() error {
	if p.writer != nil {
		if err := p.writer.Close(); err != nil {
			return fmt.Errorf("failed to close kafka producer: %w", err)
		}
	}
	log.Printf("[KAFKA PRODUCER] Closed connection for topic '%s'", p.topic)
	return nil
}
