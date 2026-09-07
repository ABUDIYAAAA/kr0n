package github

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
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
	"github.com/redis/go-redis/v9"
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
	redisClient   *redis.Client
}

func NewClient(appID int64, privateKeyPEM []byte, webhookSecret string) *Client {
	return &Client{
		appID:         appID,
		privateKeyPEM: privateKeyPEM,
		webhookSecret: webhookSecret,
		httpClient:    &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) SetRedisClient(redisClient *redis.Client) {
	c.redisClient = redisClient
}

// VerifyWebhookSignature verifies HMAC-SHA256 signature in X-Hub-Signature-256 header.
func (c *Client) VerifyWebhookSignature(payload []byte, signatureHeader string) error {
	if c.webhookSecret == "" || signatureHeader == "" || !strings.HasPrefix(signatureHeader, "sha256=") {
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

// ExchangeInstallationToken exchanges App JWT for an installation access token (cached in Redis with AES-256-GCM encryption).
func (c *Client) ExchangeInstallationToken(ctx context.Context, installationID int64) (string, time.Time, error) {
	cacheKey := fmt.Sprintf("ghtoken:%d", installationID)
	secretKey := c.webhookSecret
	if secretKey == "" {
		secretKey = "kr0n-default-installation-token-secret"
	}

	if c.redisClient != nil {
		if cachedHex, err := c.redisClient.Get(ctx, cacheKey).Result(); err == nil && cachedHex != "" {
			if decryptedToken, err := decryptAESGCM(cachedHex, secretKey); err == nil && decryptedToken != "" {
				return decryptedToken, time.Now().Add(55 * time.Minute), nil
			}
		}
	}

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

	if c.redisClient != nil && tokenResp.Token != "" {
		if encryptedHex, err := encryptAESGCM(tokenResp.Token, secretKey); err == nil {
			_ = c.redisClient.Set(ctx, cacheKey, encryptedHex, 55*time.Minute).Err()
		}
	}

	return tokenResp.Token, tokenResp.ExpiresAt, nil
}

func encryptAESGCM(plaintext string, secret string) (string, error) {
	key := sha256.Sum256([]byte(secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

func decryptAESGCM(ciphertextHex string, secret string) (string, error) {
	ciphertext, err := hex.DecodeString(ciphertextHex)
	if err != nil {
		return "", err
	}

	key := sha256.Sum256([]byte(secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
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

type ContentItem struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Type        string `json:"type"`
	Size        int64  `json:"size"`
	HTMLURL     string `json:"html_url"`
	DownloadURL string `json:"download_url,omitempty"`
}

// ListRepositoryContents lists files and subdirectories at path in a repository for root directory selection.
func (c *Client) ListRepositoryContents(ctx context.Context, installationToken, owner, repo, branch, path string) ([]ContentItem, error) {
	if branch == "" {
		branch = "main"
	}
	cleanPath := strings.Trim(path, "/")

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s?ref=%s", owner, repo, cleanPath, branch)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+installationToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch repository contents: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github api returned status %d: %s", resp.StatusCode, string(body))
	}

	var items []ContentItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, fmt.Errorf("failed to decode repository contents response: %w", err)
	}

	return items, nil
}
