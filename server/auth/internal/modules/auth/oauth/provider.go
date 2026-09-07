package oauth

import (
	"context"
	"errors"
	"fmt"
)

var (
	// ErrProviderNotFound is returned when an unregistered OAuth provider is requested.
	ErrProviderNotFound = errors.New("unsupported or unregistered oauth provider")
	// ErrOAuthExchangeFailed indicates the code exchange or user info retrieval failed.
	ErrOAuthExchangeFailed = errors.New("oauth authentication exchange failed")
)

// OAuthUser contains standardized user profile details returned by any OAuth provider.
type OAuthUser struct {
	Provider          string         `json:"provider"`
	ProviderUserID    string         `json:"provider_user_id"`
	Email             string         `json:"email"`
	EmailVerified     bool           `json:"email_verified"`
	Name              string         `json:"name"`
	PreferredUsername string         `json:"preferred_username"`
	AvatarURL         string         `json:"avatar_url,omitempty"`
	RawClaims         map[string]any `json:"raw_claims,omitempty"`
}

// OAuthProvider defines the contract required to support any 3rd-party OAuth 2.0 provider.
type OAuthProvider interface {
	Name() string
	GetAuthURL(state string) string
	ExchangeCode(ctx context.Context, code string) (*OAuthUser, error)
}

// Registry manages and provides access to registered OAuth providers.
type Registry struct {
	providers map[string]OAuthProvider
}

// NewRegistry initializes a new empty OAuth provider registry.
func NewRegistry() *Registry {
	return &Registry{
		providers: make(map[string]OAuthProvider),
	}
}

// Register registers an OAuth provider under its specified name.
func (r *Registry) Register(provider OAuthProvider) {
	r.providers[provider.Name()] = provider
}

// Get retrieves a provider by its identifier name.
func (r *Registry) Get(name string) (OAuthProvider, error) {
	p, ok := r.providers[name]
	if !ok {
		return nil, fmt.Errorf("%w: %s", ErrProviderNotFound, name)
	}
	return p, nil
}
