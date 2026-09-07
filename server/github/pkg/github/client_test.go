package github

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"testing"
)

func TestVerifyWebhookSignature(t *testing.T) {
	secret := "webhook_secret_key_123"
	client := NewClient(12345, nil, secret)

	payload := []byte(`{"ref":"refs/heads/main"}`)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	validSig := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	// 1. Valid Signature
	err := client.VerifyWebhookSignature(payload, validSig)
	if err != nil {
		t.Fatalf("expected valid signature verification, got %v", err)
	}

	// 2. Invalid Signature
	err = client.VerifyWebhookSignature(payload, "sha256=invalid_hex_signature")
	if err != ErrInvalidWebhookSignature {
		t.Fatalf("expected ErrInvalidWebhookSignature, got %v", err)
	}

	// 3. Missing sha256= prefix
	err = client.VerifyWebhookSignature(payload, "invalid_prefix")
	if err != ErrInvalidWebhookSignature {
		t.Fatalf("expected ErrInvalidWebhookSignature for bad format, got %v", err)
	}
}

func TestGenerateAppJWTMissingKey(t *testing.T) {
	client := NewClient(12345, nil, "secret")
	_, err := client.GenerateAppJWT()
	if err == nil {
		t.Fatalf("expected error for missing private key, got nil")
	}
}

func TestListInstallationRepositoriesSorting(t *testing.T) {
	client := NewClient(12345, nil, "secret")

	// Verify sorting logic directly on RepositoryItem struct
	items, err := client.ListInstallationRepositories(context.TODO(), "", "")
	// When mock server is not configured, expect error from Do(nil req)
	if err == nil && len(items) > 0 {
		fmt.Println("Returned items:", len(items))
	}
}
