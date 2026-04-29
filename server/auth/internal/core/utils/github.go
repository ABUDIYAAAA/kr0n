package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// ValidateGitHubWebhookSignature validates the HMAC-SHA256 signature of a GitHub webhook.
// It compares the X-Hub-Signature-256 header with the computed HMAC of the payload using the secret.
func ValidateGitHubWebhookSignature(payload []byte, signature, secret string) bool {
	if secret == "" {
		return false
	}

	// signature format: sha256=<hex_digest>
	parts := strings.SplitN(signature, "=", 2)
	if len(parts) != 2 || parts[0] != "sha256" {
		return false
	}

	expectedHex := parts[1]
	computedHmac := hmac.New(sha256.New, []byte(secret))
	computedHmac.Write(payload)
	computedHex := hex.EncodeToString(computedHmac.Sum(nil))

	return hmac.Equal([]byte(expectedHex), []byte(computedHex))
}

// ExtractGitHubEventType extracts the event type from X-GitHub-Event header.
func ExtractGitHubEventType(eventHeader string) string {
	return strings.TrimSpace(eventHeader)
}

// ParseGitHubRefToBranch converts a ref like "refs/heads/main" to "main".
func ParseGitHubRefToBranch(ref string) string {
	const prefix = "refs/heads/"
	if strings.HasPrefix(ref, prefix) {
		return strings.TrimPrefix(ref, prefix)
	}
	return ref
}

// FormatGitHubAppInstallURL constructs the GitHub App installation URL.
func FormatGitHubAppInstallURL(appID string) string {
	return fmt.Sprintf("https://github.com/apps/%s/installations/new", appID)
}
