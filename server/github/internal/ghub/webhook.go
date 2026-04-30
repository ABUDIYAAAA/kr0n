package ghub

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const (
	signatureHeader = "X-Hub-Signature-256"
	eventHeader     = "X-GitHub-Event"
	deliveryHeader  = "X-GitHub-Delivery"
	maxWebhookBody  = 5 << 20 // 5 MB
)

// WebhookPayload holds the parsed and verified webhook data.
type WebhookPayload struct {
	EventType  string // e.g. "push", "installation", "installation_repositories", "pull_request"
	DeliveryID string // X-GitHub-Delivery header (unique per event)
	Body       []byte // Raw JSON body
}

// ParseAndVerifyWebhook reads the request body, verifies the HMAC-SHA256 signature,
// and returns the parsed webhook payload. Returns ErrWebhookSignature on failure.
func ParseAndVerifyWebhook(r *http.Request, secret string) (*WebhookPayload, error) {
	if r.Body == nil {
		return nil, fmt.Errorf("empty request body")
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, maxWebhookBody))
	if err != nil {
		return nil, fmt.Errorf("failed to read webhook body: %w", err)
	}

	eventType := r.Header.Get(eventHeader)
	if eventType == "" {
		return nil, fmt.Errorf("missing %s header", eventHeader)
	}

	deliveryID := r.Header.Get(deliveryHeader)
	if deliveryID == "" {
		return nil, fmt.Errorf("missing %s header", deliveryHeader)
	}

	signature := r.Header.Get(signatureHeader)
	if signature == "" {
		return nil, ErrWebhookSignature
	}

	if !verifySignature(body, secret, signature) {
		return nil, ErrWebhookSignature
	}

	return &WebhookPayload{
		EventType:  eventType,
		DeliveryID: deliveryID,
		Body:       body,
	}, nil
}

// verifySignature checks the HMAC-SHA256 signature from GitHub.
func verifySignature(body []byte, secret, signature string) bool {
	if !strings.HasPrefix(signature, "sha256=") {
		return false
	}

	sigHex := strings.TrimPrefix(signature, "sha256=")
	sigBytes, err := hex.DecodeString(sigHex)
	if err != nil {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := mac.Sum(nil)

	return hmac.Equal(sigBytes, expected)
}
