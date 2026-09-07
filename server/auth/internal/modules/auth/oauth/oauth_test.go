package oauth

import (
	"testing"
)

func TestRegistry(t *testing.T) {
	reg := NewRegistry()

	googleP := NewGoogleProvider("client_id", "client_secret", "http://localhost/callback")
	githubP := NewGitHubProvider("client_id", "client_secret", "http://localhost/callback")

	reg.Register(googleP)
	reg.Register(githubP)

	p1, err := reg.Get("google")
	if err != nil {
		t.Fatalf("expected google provider, got error: %v", err)
	}
	if p1.Name() != GoogleProviderName {
		t.Fatalf("expected provider name 'google', got %s", p1.Name())
	}

	p2, err := reg.Get("github")
	if err != nil {
		t.Fatalf("expected github provider, got error: %v", err)
	}
	if p2.Name() != GitHubProviderName {
		t.Fatalf("expected provider name 'github', got %s", p2.Name())
	}

	_, err = reg.Get("unsupported")
	if err == nil {
		t.Fatalf("expected error for unregistered provider, got nil")
	}
}

func TestGoogleProviderURL(t *testing.T) {
	p := NewGoogleProvider("client_id", "client_secret", "http://localhost/callback")
	url := p.GetAuthURL("state123")
	if url == "" {
		t.Fatalf("expected non-empty auth url")
	}
}

func TestGitHubProviderURL(t *testing.T) {
	p := NewGitHubProvider("client_id", "client_secret", "http://localhost/callback")
	url := p.GetAuthURL("state123")
	if url == "" {
		t.Fatalf("expected non-empty auth url")
	}
}
