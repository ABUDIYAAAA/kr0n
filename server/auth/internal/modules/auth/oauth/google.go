package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

const (
	// GoogleProviderName identifier for Google OAuth.
	GoogleProviderName = "google"
	googleUserInfoURL  = "https://www.googleapis.com/oauth2/v3/userinfo"
)

// GoogleProvider handles OAuth 2.0 authentication flow with Google.
type GoogleProvider struct {
	config *oauth2.Config
}

// NewGoogleProvider initializes a new Google OAuth provider instance.
func NewGoogleProvider(clientID, clientSecret, redirectURL string) *GoogleProvider {
	return &GoogleProvider{
		config: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Scopes: []string{
				"openid",
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		},
	}
}

// Name returns the identifier for Google OAuth.
func (g *GoogleProvider) Name() string {
	return GoogleProviderName
}

// GetAuthURL generates the Google consent screen authorization URL.
func (g *GoogleProvider) GetAuthURL(state string) string {
	return g.config.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
}

type googleUserInfoResponse struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

// ExchangeCode exchanges an authorization code for user profile information from Google.
func (g *GoogleProvider) ExchangeCode(ctx context.Context, code string) (*OAuthUser, error) {
	token, err := g.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("google token exchange failed: %w", err)
	}

	client := g.config.Client(ctx, token)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, googleUserInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create google userinfo request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch google userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("google userinfo returned status %d: %s", resp.StatusCode, string(body))
	}

	var userInfo googleUserInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode google userinfo response: %w", err)
	}

	rawClaims := map[string]any{
		"sub":            userInfo.Sub,
		"email":          userInfo.Email,
		"email_verified": userInfo.EmailVerified,
		"name":           userInfo.Name,
		"picture":        userInfo.Picture,
	}

	return &OAuthUser{
		Provider:          GoogleProviderName,
		ProviderUserID:    userInfo.Sub,
		Email:             userInfo.Email,
		EmailVerified:     userInfo.EmailVerified,
		Name:              userInfo.Name,
		PreferredUsername: userInfo.GivenName,
		AvatarURL:         userInfo.Picture,
		RawClaims:         rawClaims,
	}, nil
}
