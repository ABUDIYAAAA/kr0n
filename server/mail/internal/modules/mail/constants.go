package mail

import "time"

const (
	// Kafka Email Event Types
	EventEmailVerification = "EMAIL_VERIFICATION"
	EventPasswordReset     = "PASSWORD_RESET"
	EventWelcomeEmail      = "WELCOME_EMAIL"
	EventCustomEmail       = "CUSTOM_EMAIL"

	// Template Identifiers
	TemplateEmailVerification = "email_verification"
	TemplatePasswordReset     = "password_reset"
	TemplateWelcomeEmail      = "welcome_email"
	TemplateCustomEmail       = "custom_email"

	// Mail Dispatch Statuses
	StatusPending = "PENDING"
	StatusSent    = "SENT"
	StatusFailed  = "FAILED"

	// Redis Key Formats
	RedisKeyMailStats     = "mail:stats"
	RedisKeyMailRateLimit = "mail:ratelimit:%s"

	// Default System Parameters
	DefaultDispatchTimeout = 10 * time.Second
	DefaultRetentionDays   = 30
	DefaultCleanupInterval = 24 * time.Hour
)
