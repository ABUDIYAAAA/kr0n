package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

const (
	// GitHubProviderName identifier for GitHub OAuth.
	GitHubProviderName = "github"
	githubUserURL      = "https://api.github.com/user"
	githubEmailsURL    = "https://api.github.com/user/emails"
)

// GitHubProvider handles OAuth 2.0 authentication flow with GitHub.
type GitHubProvider struct {
	config *oauth2.Config
}

// NewGitHubProvider initializes a new GitHub OAuth provider instance.
func NewGitHubProvider(clientID, clientSecret, redirectURL string) *GitHubProvider {
	return &GitHubProvider{
		config: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Scopes: []string{
				"read:user",
				"user:email",
			},
			Endpoint: github.Endpoint,
		},
	}
}

// Name returns the identifier for GitHub OAuth.
func (g *GitHubProvider) Name() string {
	return GitHubProviderName
}

// GetAuthURL generates the GitHub authorization URL.
func (g *GitHubProvider) GetAuthURL(state string) string {
	return g.config.AuthCodeURL(state, oauth2.AccessTypeOnline)
}

type githubUserResponse struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

type githubEmailResponse struct {
	Email      string `json:"email"`
	Primary    bool   `json:"primary"`
	Verified   bool   `json:"verified"`
	Visibility string `json:"visibility"`
}

// ExchangeCode exchanges an authorization code for GitHub user profile details.
func (g *GitHubProvider) ExchangeCode(ctx context.Context, code string) (*OAuthUser, error) {
	token, err := g.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("github token exchange failed: %w", err)
	}

	client := g.config.Client(ctx, token)

	// 1. Fetch user basic profile
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUserURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create github user request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch github user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github user API returned status %d: %s", resp.StatusCode, string(body))
	}

	var userResp githubUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return nil, fmt.Errorf("failed to decode github user response: %w", err)
	}

	email := userResp.Email
	emailVerified := false

	// 2. Fetch emails if not publicly visible on primary profile
	if email == "" {
		emailReq, err := http.NewRequestWithContext(ctx, http.MethodGet, githubEmailsURL, nil)
		if err == nil {
			emailResp, err := client.Do(emailReq)
			if err == nil && emailResp.StatusCode == http.StatusOK {
				defer emailResp.Body.Close()
				var emails []githubEmailResponse
				if err := json.NewDecoder(emailResp.Body).Decode(&emails); err == nil {
					for _, e := range emails {
						if e.Primary && e.Verified {
							email = e.Email
							emailVerified = true
							break
						}
					}
					if email == "" && len(emails) > 0 {
						email = emails[0].Email
						emailVerified = emails[0].Verified
					}
				}
			}
		}
	} else {
		emailVerified = true
	}

	if email == "" {
		return nil, fmt.Errorf("could not retrieve any email address from github account")
	}

	rawClaims := map[string]any{
		"id":         userResp.ID,
		"login":      userResp.Login,
		"name":       userResp.Name,
		"email":      email,
		"avatar_url": userResp.AvatarURL,
	}

	return &OAuthUser{
		Provider:          GitHubProviderName,
		ProviderUserID:    strconv.FormatInt(userResp.ID, 10),
		Email:             email,
		EmailVerified:     emailVerified,
		Name:              userResp.Name,
		PreferredUsername: userResp.Login,
		AvatarURL:         userResp.AvatarURL,
		RawClaims:         rawClaims,
	}, nil
}
