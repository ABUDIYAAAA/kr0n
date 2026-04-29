package email

import "time"

type Kind string

const (
	KindVerification  Kind = "verification"
	KindPasswordReset Kind = "password_reset"
	KindWelcome       Kind = "welcome"
	KindNotification  Kind = "notification"
)

type Envelope struct {
	MessageID   string            `json:"message_id"`
	Kind        Kind              `json:"kind"`
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

type RenderedEmail struct {
	Subject string
	HTML    string
	Text    string
}

type DeliveryStatus string

const (
	DeliveryStatusProcessing DeliveryStatus = "processing"
	DeliveryStatusDelivered  DeliveryStatus = "delivered"
	DeliveryStatusFailed     DeliveryStatus = "failed"
	DeliveryStatusSkipped    DeliveryStatus = "skipped"
)

type DeliveryRecord struct {
	ID              string         `json:"id"`
	MessageID       string         `json:"message_id"`
	Kind            Kind           `json:"kind"`
	Template        string         `json:"template"`
	Recipient       string         `json:"recipient"`
	Subject         string         `json:"subject"`
	Status          DeliveryStatus `json:"status"`
	AttemptCount    int            `json:"attempt_count"`
	ProviderMessage string         `json:"provider_message_id,omitempty"`
	LastError       string         `json:"last_error,omitempty"`
	Payload         map[string]any `json:"payload,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	SentAt          *time.Time     `json:"sent_at,omitempty"`
}
