package github

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidWebhookSignature = errors.New("invalid github webhook hmac signature")
	ErrGitHubAPI               = errors.New("github api request failed")
)

type RepositoryItem struct {
	ID            int64     `json:"id"`
	Name          string    `json:"name"`
	FullName      string    `json:"full_name"`
	OwnerLogin    string    `json:"owner_login"`
	Private       bool      `json:"private"`
	DefaultBranch string    `json:"default_branch"`
	HTMLURL       string    `json:"html_url"`
	Description   string    `json:"description,omitempty"`
	PushedAt      time.Time `json:"pushed_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Client struct {
	appID         int64
	privateKeyPEM []byte
	webhookSecret string
	httpClient    *http.Client
}

func NewClient(appID int64, privateKeyPEM []byte, webhookSecret string) *Client {
	return &Client{
		appID:         appID,
		privateKeyPEM: privateKeyPEM,
		webhookSecret: webhookSecret,
		httpClient:    &http.Client{Timeout: 15 * time.Second},
	}
}

// VerifyWebhookSignature verifies HMAC-SHA256 signature in X-Hub-Signature-256 header.
func (c *Client) VerifyWebhookSignature(payload []byte, signatureHeader string) error {
	if c.webhookSecret == "" {
		// If secret is not set, allow in dev mode
		return nil
	}

	if signatureHeader == "" || !strings.HasPrefix(signatureHeader, "sha256=") {
		return ErrInvalidWebhookSignature
	}

	signatureHex := strings.TrimPrefix(signatureHeader, "sha256=")
	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		return ErrInvalidWebhookSignature
	}

	mac := hmac.New(sha256.New, []byte(c.webhookSecret))
	mac.Write(payload)
	expectedMAC := mac.Sum(nil)

	if !hmac.Equal(sigBytes, expectedMAC) {
		return ErrInvalidWebhookSignature
	}

	return nil
}

// GenerateAppJWT generates a signed JWT to authenticate as a GitHub App.
func (c *Client) GenerateAppJWT() (string, error) {
	if len(c.privateKeyPEM) == 0 {
		return "", errors.New("github app private key is missing")
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(c.privateKeyPEM)
	if err != nil {
		return "", fmt.Errorf("failed to parse github app rsa private key: %w", err)
	}

	now := time.Now().UTC()
	claims := jwt.RegisteredClaims{
		IssuedAt:  jwt.NewNumericDate(now.Add(-60 * time.Second)), // 1 minute clock drift allowance
		ExpiresAt: jwt.NewNumericDate(now.Add(10 * time.Minute)),  // Max 10 min TTL for GitHub App JWT
		Issuer:    fmt.Sprintf("%d", c.appID),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenStr, err := token.SignedString(privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign github app jwt: %w", err)
	}

	return tokenStr, nil
}

// ExchangeInstallationToken exchanges App JWT for an installation access token.
func (c *Client) ExchangeInstallationToken(ctx context.Context, installationID int64) (string, time.Time, error) {
	jwtToken, err := c.GenerateAppJWT()
	if err != nil {
		return "", time.Time{}, err
	}

	url := fmt.Sprintf("https://api.github.com/app/installations/%d/access_tokens", installationID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return "", time.Time{}, err
	}

	req.Header.Set("Authorization", "Bearer "+jwtToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to request installation token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", time.Time{}, fmt.Errorf("github API returned status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp struct {
		Token     string    `json:"token"`
		ExpiresAt time.Time `json:"expires_at"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", time.Time{}, fmt.Errorf("failed to decode installation token response: %w", err)
	}

	return tokenResp.Token, tokenResp.ExpiresAt, nil
}

// ListInstallationRepositories fetches repositories accessible to the GitHub App installation.
func (c *Client) ListInstallationRepositories(ctx context.Context, installationToken, visibility string) ([]RepositoryItem, error) {
	url := "https://api.github.com/installation/repositories?per_page=100"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+installationToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch installation repositories: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github api returned status %d: %s", resp.StatusCode, string(body))
	}

	var ghResp struct {
		Repositories []struct {
			ID            int64     `json:"id"`
			Name          string    `json:"name"`
			FullName      string    `json:"full_name"`
			Private       bool      `json:"private"`
			DefaultBranch string    `json:"default_branch"`
			HTMLURL       string    `json:"html_url"`
			Description   string    `json:"description"`
			PushedAt      time.Time `json:"pushed_at"`
			UpdatedAt     time.Time `json:"updated_at"`
			Owner         struct {
				Login string `json:"login"`
			} `json:"owner"`
		} `json:"repositories"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&ghResp); err != nil {
		return nil, fmt.Errorf("failed to decode github repositories response: %w", err)
	}

	var items []RepositoryItem
	for _, repo := range ghResp.Repositories {
		// Filter by visibility if requested
		if visibility == "private" && !repo.Private {
			continue
		}
		if visibility == "public" && repo.Private {
			continue
		}

		defaultBranch := repo.DefaultBranch
		if defaultBranch == "" {
			defaultBranch = "main"
		}

		items = append(items, RepositoryItem{
			ID:            repo.ID,
			Name:          repo.Name,
			FullName:      repo.FullName,
			OwnerLogin:    repo.Owner.Login,
			Private:       repo.Private,
			DefaultBranch: defaultBranch,
			HTMLURL:       repo.HTMLURL,
			Description:   repo.Description,
			PushedAt:      repo.PushedAt,
			UpdatedAt:     repo.UpdatedAt,
		})
	}

	// Sort repositories by last_updated descending (most recent pushed_at / updated_at first)
	sort.Slice(items, func(i, j int) bool {
		timeI := items[i].PushedAt
		if timeI.IsZero() {
			timeI = items[i].UpdatedAt
		}
		timeJ := items[j].PushedAt
		if timeJ.IsZero() {
			timeJ = items[j].UpdatedAt
		}
		return timeI.After(timeJ)
	})

	return items, nil
}
