package ghub

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	githubAPIBaseURL = "https://api.github.com"
	userAgent        = "kr0n-github"
)

// GitHubAppCfg holds the configuration for the GitHub App.
type GitHubAppCfg struct {
	AppID      string
	AppName    string
	PrivateKey []byte // Raw PEM bytes
}

// GitHubClient abstracts all communication with the GitHub API.
type GitHubClient struct {
	httpClient *http.Client
	appCfg     GitHubAppCfg
	rsaKey     *rsa.PrivateKey
	tokenCache *TokenCache
}

// NewGitHubClient creates a new GitHub API client.
// The private key is parsed once at init; PKCS1 and PKCS8 formats are both accepted.
func NewGitHubClient(appCfg GitHubAppCfg) *GitHubClient {
	c := &GitHubClient{
		httpClient: &http.Client{Timeout: 15 * time.Second},
		appCfg:     appCfg,
		tokenCache: NewTokenCache(),
	}

	if len(appCfg.PrivateKey) > 0 {
		key, err := parsePrivateKey(appCfg.PrivateKey)
		if err == nil {
			c.rsaKey = key
		}
	}

	return c
}

// parsePrivateKey decodes a PEM block and tries PKCS1 then PKCS8.
func parsePrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block from private key")
	}

	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key as PKCS1 or PKCS8: %w", err)
	}

	rsaKey, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("PKCS8 key is not RSA")
	}
	return rsaKey, nil
}

// createAppJWT generates a short-lived JWT signed with the App's private key.
// This JWT is used to authenticate as the GitHub App itself (not an installation).
func (c *GitHubClient) createAppJWT() (string, error) {
	if c.rsaKey == nil {
		return "", ErrPrivateKeyNotLoaded
	}

	now := time.Now()
	claims := jwt.RegisteredClaims{
		Issuer:    c.appCfg.AppID,
		IssuedAt:  jwt.NewNumericDate(now.Add(-60 * time.Second)),
		ExpiresAt: jwt.NewNumericDate(now.Add(10 * time.Minute)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return token.SignedString(c.rsaKey)
}

// --- Installation Token ---

// GetInstallationToken returns a cached or freshly generated installation access token.
func (c *GitHubClient) GetInstallationToken(ctx context.Context, installationID int64) (string, time.Time, error) {
	if token, expiresAt, ok := c.tokenCache.Get(installationID); ok {
		return token, expiresAt, nil
	}

	appJWT, err := c.createAppJWT()
	if err != nil {
		return "", time.Time{}, err
	}

	url := fmt.Sprintf("%s/app/installations/%d/access_tokens", githubAPIBaseURL, installationID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return "", time.Time{}, err
	}
	req.Header.Set("Authorization", "Bearer "+appJWT)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", userAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", time.Time{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", time.Time{}, err
	}

	if resp.StatusCode != http.StatusCreated {
		return "", time.Time{}, fmt.Errorf("github token request failed: status %d, body: %s", resp.StatusCode, string(body))
	}

	var tokenResp GitHubInstallationTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", time.Time{}, err
	}

	c.tokenCache.Set(installationID, tokenResp.Token, tokenResp.ExpiresAt)
	return tokenResp.Token, tokenResp.ExpiresAt, nil
}

// --- Repository Operations ---

// ListInstallationRepos fetches all repositories accessible to an installation.
func (c *GitHubClient) ListInstallationRepos(ctx context.Context, installationID int64) ([]GitHubRepoInfo, error) {
	token, _, err := c.GetInstallationToken(ctx, installationID)
	if err != nil {
		return nil, err
	}

	var allRepos []GitHubRepoInfo
	page := 1

	for {
		url := fmt.Sprintf("%s/installation/repositories?per_page=100&page=%d", githubAPIBaseURL, page)
		body, err := c.doAuthenticatedGet(ctx, url, token)
		if err != nil {
			return nil, err
		}

		var result struct {
			Repositories []GitHubRepoInfo `json:"repositories"`
		}
		if err := json.Unmarshal(body, &result); err != nil {
			return nil, err
		}

		allRepos = append(allRepos, result.Repositories...)

		if len(result.Repositories) < 100 {
			break
		}
		page++
	}

	return allRepos, nil
}

// GetRepoArchiveURL returns an authenticated URL to download the repo archive.
func (c *GitHubClient) GetRepoArchiveURL(ctx context.Context, installationID int64, owner, repo, ref string) (string, string, time.Time, error) {
	token, expiresAt, err := c.GetInstallationToken(ctx, installationID)
	if err != nil {
		return "", "", time.Time{}, err
	}

	archiveURL := fmt.Sprintf("%s/repos/%s/%s/tarball/%s", githubAPIBaseURL, owner, repo, ref)
	return archiveURL, token, expiresAt, nil
}

// GetAuthenticatedCloneURL returns a clone URL with an embedded installation token.
func (c *GitHubClient) GetAuthenticatedCloneURL(ctx context.Context, installationID int64, owner, repo string) (string, string, time.Time, error) {
	token, expiresAt, err := c.GetInstallationToken(ctx, installationID)
	if err != nil {
		return "", "", time.Time{}, err
	}

	cloneURL := fmt.Sprintf("https://x-access-token:%s@github.com/%s/%s.git", token, owner, repo)
	return cloneURL, token, expiresAt, nil
}

// --- Helpers ---

func (c *GitHubClient) doAuthenticatedGet(ctx context.Context, url, token string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", userAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api request failed: status %d, url: %s", resp.StatusCode, url)
	}

	return body, nil
}

// ExtractBranchFromRef extracts the branch name from a git ref (e.g., "refs/heads/main" → "main").
func ExtractBranchFromRef(ref string) string {
	const prefix = "refs/heads/"
	if strings.HasPrefix(ref, prefix) {
		return strings.TrimPrefix(ref, prefix)
	}
	return ref
}
