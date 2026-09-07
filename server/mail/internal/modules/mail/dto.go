package mail

import "time"

// EmailEventPayload is the standard message schema received over Kafka.
type EmailEventPayload struct {
	EventID           string            `json:"event_id"`
	EventType         string            `json:"event_type"` // e.g. EMAIL_VERIFICATION, PASSWORD_RESET, WELCOME_EMAIL
	ToEmail           string            `json:"to_email"`
	Username          string            `json:"username,omitempty"`
	TemplateID        string            `json:"template_id"`               // Identifier for template
	SMTPAccountID     string            `json:"smtp_account_id,omitempty"` // Multi-SMTP selection
	IdempotencyKey    string            `json:"idempotency_key"`           // Idempotency Key
	VerificationToken string            `json:"verification_token,omitempty"`
	VerificationURL   string            `json:"verification_url,omitempty"`
	ResetToken        string            `json:"reset_token,omitempty"`
	ResetURL          string            `json:"reset_url,omitempty"`
	Subject           string            `json:"subject,omitempty"`
	Body              string            `json:"body,omitempty"`
	Metadata          map[string]string `json:"metadata,omitempty"`
	TemplateData      map[string]any    `json:"template_data,omitempty"`
	Timestamp         time.Time         `json:"timestamp"`
}

// EmailLogResponse represents details of a processed email dispatch log.
type EmailLogResponse struct {
	ID           string            `json:"id"`
	EventID      string            `json:"event_id"`
	EventType    string            `json:"event_type"`
	TemplateID   string            `json:"template_id,omitempty"`
	ToEmail      string            `json:"to_email"`
	Subject      string            `json:"subject"`
	Status       string            `json:"status"`
	ErrorMessage string            `json:"error_message,omitempty"`
	Metadata     map[string]string `json:"metadata,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	SentAt       *time.Time        `json:"sent_at,omitempty"`
}

// EmailStatsResponse represents aggregated mail microservice statistics.
type EmailStatsResponse struct {
	TotalProcessed int64 `json:"total_processed"`
	TotalSent      int64 `json:"total_sent"`
	TotalFailed    int64 `json:"total_failed"`
	TotalPending   int64 `json:"total_pending"`
}
