package producer

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github/internal/ghub"

	kafkago "github.com/segmentio/kafka-go"
)

// Config holds the Kafka producer configuration.
type Config struct {
	Broker string
	Topic  string
}

// KafkaDeployPublisher publishes deployment trigger events to Kafka.
type KafkaDeployPublisher struct {
	writer *kafkago.Writer
}

// New creates a new Kafka deployment event publisher.
func New(cfg Config) *KafkaDeployPublisher {
	topic := strings.TrimSpace(cfg.Topic)
	if topic == "" {
		topic = "deployments.triggers"
	}

	writer := &kafkago.Writer{
		Addr:         kafkago.TCP(cfg.Broker),
		Topic:        topic,
		Balancer:     &kafkago.LeastBytes{},
		RequiredAcks: kafkago.RequireAll,
		Async:        false,
		BatchTimeout: 500 * time.Millisecond,
		BatchSize:    1,
	}

	return &KafkaDeployPublisher{writer: writer}
}

// PublishDeployTrigger publishes a deployment trigger event to Kafka.
func (p *KafkaDeployPublisher) PublishDeployTrigger(ctx context.Context, event ghub.DeployTriggerEvent) error {
	if p == nil || p.writer == nil {
		return fmt.Errorf("deploy publisher is not initialized")
	}

	raw, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return p.writer.WriteMessages(ctx, kafkago.Message{
		Key:   []byte(event.EventID),
		Value: raw,
		Time:  time.Now().UTC(),
	})
}

// Close closes the Kafka writer.
func (p *KafkaDeployPublisher) Close() error {
	if p == nil || p.writer == nil {
		return nil
	}
	return p.writer.Close()
}
