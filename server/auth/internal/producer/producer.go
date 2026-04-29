package producer

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"time"

	auth "auth/internal/auth"

	"github.com/google/uuid"
	kafkago "github.com/segmentio/kafka-go"
)

const defaultTemplateVerification = "verification"

type Config struct {
	Broker    string
	Topic     string
	PublicURL string
	AppName   string
}

type KafkaEmailSender struct {
	writer    *kafkago.Writer
	publicURL string
	appName   string
}

type Envelope struct {
	MessageID   string            `json:"message_id"`
	Kind        string            `json:"kind"`
	To          []string          `json:"to"`
	Cc          []string          `json:"cc,omitempty"`
	Bcc         []string          `json:"bcc,omitempty"`
	Subject     string            `json:"subject"`
	Template    string            `json:"template"`
	Data        map[string]any    `json:"data"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	ReplyTo     string            `json:"reply_to,omitempty"`
	Correlation string            `json:"correlation_id,omitempty"`
}

func New(cfg Config) *KafkaEmailSender {
	writer := &kafkago.Writer{
		Addr:         kafkago.TCP(cfg.Broker),
		Topic:        cfg.Topic,
		Balancer:     &kafkago.LeastBytes{},
		RequiredAcks: kafkago.RequireAll,
		Async:        false,
		BatchTimeout: 500 * time.Millisecond,
		BatchSize:    1,
	}
	if strings.TrimSpace(cfg.AppName) == "" {
		cfg.AppName = "kr0n"
	}
	return &KafkaEmailSender{writer: writer, publicURL: strings.TrimRight(cfg.PublicURL, "/"), appName: cfg.AppName}
}

func (p *KafkaEmailSender) Close() error {
	if p == nil || p.writer == nil {
		return nil
	}
	return p.writer.Close()
}

func (p *KafkaEmailSender) SendVerificationEmail(ctx context.Context, payload auth.VerificationEmailPayload) error {
	if p == nil || p.writer == nil {
		return fmt.Errorf("email producer is not initialized")
	}
	if strings.TrimSpace(payload.Email) == "" {
		return auth.ErrInvalidInput
	}
	if strings.TrimSpace(payload.Token) == "" {
		return auth.ErrInvalidInput
	}

	link := fmt.Sprintf("%s/auth/email/verify?token=%s", p.publicURL, url.QueryEscape(payload.Token))
	name := "there"
	if payload.Name != nil && strings.TrimSpace(*payload.Name) != "" {
		name = strings.TrimSpace(*payload.Name)
	}

	envelope := Envelope{
		MessageID: uuid.NewString(),
		Kind:      "verification",
		To:        []string{strings.TrimSpace(payload.Email)},
		Subject:   "Verify your email",
		Template:  defaultTemplateVerification,
		Data: map[string]any{
			"Name": name,
			"Link": link,
		},
		Metadata: map[string]string{
			"source":  p.appName,
			"event":   "email_verification",
			"channel": "auth",
		},
	}

	raw, err := json.Marshal(envelope)
	if err != nil {
		return err
	}

	err = p.writer.WriteMessages(ctx, kafkago.Message{
		Key:   []byte(envelope.MessageID),
		Value: raw,
		Time:  time.Now().UTC(),
	})
	return err
}
