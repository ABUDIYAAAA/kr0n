package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	coreutils "auth/internal/core/utils"
)

const (
	githubAuthURL       = "https://github.com/login/oauth/authorize"
	githubTokenURL      = "https://github.com/login/oauth/access_token"
	githubUserInfoURL   = "https://api.github.com/user"
	githubUserEmailsURL = "https://api.github.com/user/emails"
)

func (s *Service) LinkGitHubAccountFromCode(ctx context.Context, userID uuid.UUID, code string) error {
	tokens, err := s.exchangeGitHubCode(ctx, code)
	if err != nil {
		return err
	}

	profile, email, verified, err := s.getGitHubProfile(ctx, tokens.AccessToken)
	if err != nil {
		return err
	}

	name := strings.TrimSpace(profile.Name)
	if name == "" {
		name = profile.Login
	}

	profileReq := OAuthCallbackRequest{
		ProviderUserID: strconv.FormatInt(profile.ID, 10),
		Email:          email,
		EmailVerified:  verified,
		Name:           name,
		AvatarURL:      profile.AvatarURL,
	}
	oauthTokens := OAuthTokens{
		AccessToken: tokens.AccessToken,
		TokenType:   tokens.TokenType,
		Scope:       coreutils.NullableString(tokens.Scope),
	}
	if oauthTokens.TokenType == "" {
		oauthTokens.TokenType = "Bearer"
	}

	return s.HandleOAuthConnect(ctx, userID, "github", profileReq, oauthTokens)
}

func (s *Service) exchangeGitHubCode(ctx context.Context, code string) (*GitHubTokenResponse, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", s.githubAppCfg.ClientID)
	form.Set("client_secret", s.githubAppCfg.ClientSecret)
	form.Set("redirect_uri", s.githubAppCfg.RedirectURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, githubTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	if s.httpClient == nil {
		s.httpClient = &http.Client{Timeout: 10 * time.Second}
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github token exchange failed with status %d", resp.StatusCode)
	}

	var out GitHubTokenResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	if strings.TrimSpace(out.AccessToken) == "" {
		return nil, fmt.Errorf("github token response missing access_token")
	}

	return &out, nil
}

func (s *Service) getGitHubProfile(ctx context.Context, accessToken string) (*GitHubUserInfo, string, bool, error) {
	user, err := s.getGitHubUser(ctx, accessToken)
	if err != nil {
		return nil, "", false, err
	}

	emails, err := s.getGitHubEmails(ctx, accessToken)
	if err != nil {
		return nil, "", false, err
	}

	email, verified := selectGitHubEmail(emails)
	if email == "" {
		email = strings.TrimSpace(user.Email)
		verified = email != ""
	}

	return user, email, verified, nil
}

func (s *Service) getGitHubUser(ctx context.Context, accessToken string) (*GitHubUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "kr0n-auth")

	if s.httpClient == nil {
		s.httpClient = &http.Client{Timeout: 10 * time.Second}
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github user request failed with status %d", resp.StatusCode)
	}

	var out GitHubUserInfo
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}

	return &out, nil
}

func (s *Service) getGitHubEmails(ctx context.Context, accessToken string) ([]GitHubEmail, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUserEmailsURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "kr0n-auth")

	if s.httpClient == nil {
		s.httpClient = &http.Client{Timeout: 10 * time.Second}
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github email request failed with status %d", resp.StatusCode)
	}

	var out []GitHubEmail
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}

	return out, nil
}

func selectGitHubEmail(emails []GitHubEmail) (string, bool) {
	for _, email := range emails {
		if email.Primary && email.Verified {
			return email.Email, true
		}
	}

	for _, email := range emails {
		if email.Verified {
			return email.Email, true
		}
	}

	for _, email := range emails {
		if email.Primary {
			return email.Email, email.Verified
		}
	}

	if len(emails) > 0 {
		return emails[0].Email, emails[0].Verified
	}

	return "", false
}
