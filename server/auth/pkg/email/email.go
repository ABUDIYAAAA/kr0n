package email

import (
	"context"
	"fmt"
	"log"
)

// EmailService defines the abstraction for sending transactional system emails.
type EmailService interface {
	SendVerificationEmail(ctx context.Context, toEmail, username, verificationToken, verificationURL string) error
	SendPasswordResetEmail(ctx context.Context, toEmail, username, resetToken, resetURL string) error
}

// LogEmailService is a development/mock email service that logs email dispatches to stdout.
type LogEmailService struct{}

// NewLogEmailService creates a new logger-backed email service.
func NewLogEmailService() *LogEmailService {
	return &LogEmailService{}
}

// SendVerificationEmail logs email verification details and provides a clean extension point.
func (s *LogEmailService) SendVerificationEmail(ctx context.Context, toEmail, username, verificationToken, verificationURL string) error {
	// TODO: Integrate production email provider (e.g. Resend, AWS SES, SendGrid, Postmark, or SMTP)
	// Example payload setup:
	// subject := "Verify your email address - Kr0n"
	// link := fmt.Sprintf("%s?token=%s", verificationURL, verificationToken)
	fullURL := fmt.Sprintf("%s?token=%s", verificationURL, verificationToken)
	log.Printf("[EMAIL] Verification email sent to %s (%s). Verification link: %s", toEmail, username, fullURL)
	return nil
}

// SendPasswordResetEmail logs password reset details and provides a clean extension point.
func (s *LogEmailService) SendPasswordResetEmail(ctx context.Context, toEmail, username, resetToken, resetURL string) error {
	// TODO: Integrate production email provider (e.g. Resend, AWS SES, SendGrid, Postmark, or SMTP)
	fullURL := fmt.Sprintf("%s?token=%s", resetURL, resetToken)
	log.Printf("[EMAIL] Password reset email sent to %s (%s). Reset link: %s", toEmail, username, fullURL)
	return nil
}
