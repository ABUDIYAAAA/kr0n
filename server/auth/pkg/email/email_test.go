package email

import (
	"context"
	"testing"
)

func TestLogEmailService(t *testing.T) {
	svc := NewLogEmailService()
	ctx := context.Background()

	err := svc.SendVerificationEmail(ctx, "test@kron.com", "testuser", "token123", "http://localhost/verify")
	if err != nil {
		t.Fatalf("unexpected error sending verification email: %v", err)
	}

	err = svc.SendPasswordResetEmail(ctx, "test@kron.com", "testuser", "token456", "http://localhost/reset")
	if err != nil {
		t.Fatalf("unexpected error sending password reset email: %v", err)
	}
}
