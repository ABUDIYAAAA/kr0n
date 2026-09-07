package smtp

import (
	"testing"

	"mail.kron.com/internal/api/config"
)

func TestSMTPManager(t *testing.T) {
	cfg := &config.Config{
		SMTPHost:      "localhost",
		SMTPPort:      1025,
		SMTPUsername:  "user",
		SMTPPassword:  "pass",
		SMTPFromEmail: "noreply@kron.com",
		SMTPFromName:  "Kr0n Mailer",
	}

	mgr := NewSMTPManager(cfg)

	// Get default account
	acc, err := mgr.GetAccount("")
	if err != nil {
		t.Fatalf("expected default account, got error: %v", err)
	}
	if acc.FromEmail != "noreply@kron.com" || acc.Host != "localhost" {
		t.Fatalf("unexpected account details: %+v", acc)
	}

	// Register secondary account
	mgr.RegisterAccount(&SMTPAccount{
		ID:        "ses",
		Host:      "email-smtp.us-east-1.amazonaws.com",
		Port:      587,
		Username:  "ses_user",
		Password:  "ses_pass",
		FromEmail: "ses@kron.com",
		FromName:  "AWS SES",
	})

	sesAcc, err := mgr.GetAccount("ses")
	if err != nil {
		t.Fatalf("expected ses account, got error: %v", err)
	}
	if sesAcc.FromEmail != "ses@kron.com" {
		t.Fatalf("unexpected ses account details: %+v", sesAcc)
	}

	// Non-existent account fallback to default
	fallbackAcc, err := mgr.GetAccount("unknown")
	if err != nil {
		t.Fatalf("expected fallback to default, got error: %v", err)
	}
	if fallbackAcc.ID != "default" {
		t.Fatalf("expected default account ID, got %s", fallbackAcc.ID)
	}

	// SendMail in dev/log mode (localhost)
	err = mgr.SendMail("default", "user@kron.com", "Test Subject", "<h1>HTML</h1>", "Text")
	if err != nil {
		t.Fatalf("SendMail failed in dev log mode: %v", err)
	}
}
