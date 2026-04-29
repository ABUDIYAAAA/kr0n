package email

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	smtpclient "email/internal/smtp"
)

type Sender interface {
	Send(message smtpclient.Message) error
	From() string
}

type Repository interface {
	Reserve(ctx context.Context, record *DeliveryRecord) (*DeliveryRecord, error)
	MarkDelivered(ctx context.Context, messageID, providerMessageID string, sentAt time.Time) error
	MarkFailed(ctx context.Context, messageID, lastErr string) error
}

type Handler struct {
	renderer *Renderer
	sender   Sender
	repo     Repository
	logger   *log.Logger
}

func NewHandler(renderer *Renderer, sender Sender, repo Repository, logger *log.Logger) *Handler {
	if renderer == nil {
		renderer = NewRenderer("templates")
	}
	if logger == nil {
		logger = log.Default()
	}
	return &Handler{renderer: renderer, sender: sender, repo: repo, logger: logger}
}

func (h *Handler) Handle(ctx context.Context, envelope Envelope) error {
	if err := validateEnvelope(envelope); err != nil {
		return err
	}
	if err := RejectReason(envelope); err != nil {
		return err
	}

	to := normalizeList(envelope.To)
	cc := normalizeList(envelope.Cc)
	bcc := normalizeList(envelope.Bcc)
	if len(to) == 0 {
		return ErrInvalidEnvelope
	}

	payload := envelope.Data
	if payload == nil {
		payload = map[string]any{}
	}
	payload["subject"] = envelope.Subject
	payload["kind"] = string(envelope.Kind)
	payload["template"] = envelope.Template
	payload["message_id"] = envelope.MessageID

	rendered, err := h.renderer.Render(envelope.Template, payload)
	if err != nil {
		return err
	}
	if strings.TrimSpace(rendered.Subject) != "" {
		envelope.Subject = rendered.Subject
	}

	var reserved *DeliveryRecord
	if h.repo != nil {
		rec := &DeliveryRecord{
			MessageID: envelope.MessageID,
			Kind:      envelope.Kind,
			Template:  envelope.Template,
			Recipient: strings.Join(to, ","),
			Subject:   envelope.Subject,
			Status:    DeliveryStatusProcessing,
			Payload:   payload,
		}
		reserved, err = h.repo.Reserve(ctx, rec)
		if err != nil {
			if errors.Is(err, ErrAlreadyDelivered) {
				h.logger.Printf("email skipped: already delivered message_id=%s", envelope.MessageID)
				return nil
			}
			return err
		}
	}

	msg := smtpclient.Message{
		To:      to,
		Cc:      cc,
		Bcc:     bcc,
		Subject: envelope.Subject,
		HTML:    rendered.HTML,
		Text:    rendered.Text,
		ReplyTo: envelope.ReplyTo,
	}

	if err := h.sender.Send(msg); err != nil {
		if h.repo != nil && reserved != nil {
			_ = h.repo.MarkFailed(ctx, envelope.MessageID, err.Error())
		}
		return err
	}

	if h.repo != nil && reserved != nil {
		_ = h.repo.MarkDelivered(ctx, envelope.MessageID, "", time.Now().UTC())
	}

	h.logger.Printf("email delivered message_id=%s kind=%s template=%s recipients=%d", envelope.MessageID, envelope.Kind, envelope.Template, len(to))
	return nil
}

func validateEnvelope(envelope Envelope) error {
	if strings.TrimSpace(envelope.MessageID) == "" {
		return ErrInvalidEnvelope
	}
	if strings.TrimSpace(envelope.Template) == "" {
		return ErrInvalidEnvelope
	}
	if strings.TrimSpace(envelope.Subject) == "" {
		return ErrInvalidEnvelope
	}
	if len(envelope.To) == 0 {
		return ErrInvalidEnvelope
	}
	return nil
}

func normalizeList(values []string) []string {
	out := make([]string, 0, len(values))
	seen := map[string]struct{}{}
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		key := strings.ToLower(value)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, value)
	}
	sort.Strings(out)
	return out
}

func EnvelopeFromJSON(raw []byte) (Envelope, error) {
	var env Envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return Envelope{}, fmt.Errorf("decode email envelope: %w", err)
	}
	return env, nil
}
