package templates

import (
	"strings"
	"testing"
)

func TestBuiltinTemplatesRendering(t *testing.T) {
	tm := NewTemplateManager()

	// 1. Email Verification Template
	res1, err := tm.Render("email_verification", map[string]any{
		"username":         "Alice",
		"verification_url": "http://localhost:3000/verify?token=123",
	})
	if err != nil {
		t.Fatalf("failed to render email_verification template: %v", err)
	}
	if !strings.Contains(res1.Subject, "Verify your email address") {
		t.Fatalf("unexpected subject: %s", res1.Subject)
	}
	if !strings.Contains(res1.HTMLBody, "Alice") || !strings.Contains(res1.HTMLBody, "http://localhost:3000/verify?token=123") {
		t.Fatalf("unexpected html body: %s", res1.HTMLBody)
	}

	// 2. Password Reset Template
	res2, err := tm.Render("password_reset", map[string]any{
		"username":  "Bob",
		"reset_url": "http://localhost:3000/reset?token=456",
	})
	if err != nil {
		t.Fatalf("failed to render password_reset template: %v", err)
	}
	if !strings.Contains(res2.Subject, "Reset your Kr0n Password") {
		t.Fatalf("unexpected subject: %s", res2.Subject)
	}
	if !strings.Contains(res2.HTMLBody, "Bob") {
		t.Fatalf("unexpected html body: %s", res2.HTMLBody)
	}

	// 3. Welcome Email Template
	res3, err := tm.Render("welcome_email", map[string]any{
		"username": "Charlie",
	})
	if err != nil {
		t.Fatalf("failed to render welcome_email template: %v", err)
	}
	if !strings.Contains(res3.Subject, "Welcome to Kr0n!") {
		t.Fatalf("unexpected subject: %s", res3.Subject)
	}

	// 4. Custom Email Template Fallback
	res4, err := tm.Render("custom_email", map[string]any{
		"subject": "System Alert",
		"body":    "Your account settings were updated.",
	})
	if err != nil {
		t.Fatalf("failed to render custom_email template: %v", err)
	}
	if res4.Subject != "System Alert" || !strings.Contains(res4.HTMLBody, "Your account settings were updated.") {
		t.Fatalf("unexpected custom email result: %+v", res4)
	}

	// 5. Unknown Template ID Fallback to custom_email
	res5, err := tm.Render("unknown_template_id", map[string]any{
		"subject": "Fallback Subject",
		"content": "Fallback Content",
	})
	if err != nil {
		t.Fatalf("expected fallback to custom_email, got error: %v", err)
	}
	if res5.Subject != "Fallback Subject" || !strings.Contains(res5.TextBody, "Fallback Content") {
		t.Fatalf("unexpected fallback result: %+v", res5)
	}
}

func TestRegisterCustomTemplate(t *testing.T) {
	tm := NewTemplateManager()

	err := tm.RegisterTemplate(
		"invoice",
		"Invoice #{{.invoice_id}}",
		"<h1>Invoice {{.invoice_id}}</h1><p>Amount: ${{.amount}}</p>",
		"Invoice {{.invoice_id}} Amount: ${{.amount}}",
	)
	if err != nil {
		t.Fatalf("failed to register custom template: %v", err)
	}

	res, err := tm.Render("invoice", map[string]any{
		"invoice_id": "INV-1001",
		"amount":     "99.00",
	})
	if err != nil {
		t.Fatalf("failed to render custom invoice template: %v", err)
	}
	if res.Subject != "Invoice #INV-1001" || !strings.Contains(res.HTMLBody, "99.00") {
		t.Fatalf("unexpected render output: %+v", res)
	}
}

func TestRegisterInvalidTemplate(t *testing.T) {
	tm := NewTemplateManager()

	// Invalid subject template syntax
	err := tm.RegisterTemplate("bad_subj", "{{.invalid", "<html></html>", "text")
	if err == nil {
		t.Fatalf("expected error for invalid subject template, got nil")
	}

	// Invalid HTML template syntax
	err = tm.RegisterTemplate("bad_html", "Subject", "<html>{{.invalid</html>", "text")
	if err == nil {
		t.Fatalf("expected error for invalid html template, got nil")
	}

	// Invalid Text template syntax
	err = tm.RegisterTemplate("bad_text", "Subject", "<html></html>", "{{.invalid")
	if err == nil {
		t.Fatalf("expected error for invalid text template, got nil")
	}
}
