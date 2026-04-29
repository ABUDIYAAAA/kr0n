package kafka

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	emailsvc "email/internal/email"

	kafkago "github.com/segmentio/kafka-go"
)

type Consumer struct {
	reader      *kafkago.Reader
	handler     *emailsvc.Handler
	logger      *log.Logger
	retryLimit  int
	backoffBase time.Duration
}

func NewConsumer(broker, topic, groupID string, minBytes, maxBytes int, maxWait time.Duration, queueDepth int, handler *emailsvc.Handler, logger *log.Logger, retryLimit int) *Consumer {
	if logger == nil {
		logger = log.Default()
	}
	if queueDepth <= 0 {
		queueDepth = 100
	}
	if retryLimit <= 0 {
		retryLimit = 3
	}
	reader := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers:       []string{broker},
		Topic:         topic,
		GroupID:       groupID,
		MinBytes:      minBytes,
		MaxBytes:      maxBytes,
		MaxWait:       maxWait,
		QueueCapacity: queueDepth,
	})
	return &Consumer{reader: reader, handler: handler, logger: logger, retryLimit: retryLimit, backoffBase: 500 * time.Millisecond}
}

func (c *Consumer) Close() error {
	if c == nil || c.reader == nil {
		return nil
	}
	return c.reader.Close()
}

func (c *Consumer) Run(ctx context.Context) error {
	if c == nil || c.reader == nil {
		return nil
	}
	for {
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				return nil
			}
			return err
		}

		if err := c.processMessage(ctx, msg.Value); err != nil {
			c.logger.Printf("email consumer failed topic=%s partition=%d offset=%d err=%v", msg.Topic, msg.Partition, msg.Offset, err)
		}
		if err := c.reader.CommitMessages(ctx, msg); err != nil {
			return fmt.Errorf("commit kafka message: %w", err)
		}
	}
}

func (c *Consumer) processMessage(ctx context.Context, payload []byte) error {
	envelope, err := emailsvc.EnvelopeFromJSON(payload)
	if err != nil {
		return err
	}

	var lastErr error
	for attempt := 1; attempt <= c.retryLimit; attempt++ {
		lastErr = c.handler.Handle(ctx, envelope)
		if lastErr == nil {
			return nil
		}
		time.Sleep(c.backoffBase * time.Duration(attempt))
	}

	return lastErr
}
