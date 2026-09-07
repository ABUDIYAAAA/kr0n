package config

import (
	"os"
	"testing"
	"time"
)

func TestNewConfig(t *testing.T) {
	// Set required env vars
	os.Setenv("DB_URL", "postgres://user:pass@localhost:5432/testdb")
	os.Setenv("REDIS_URI", "redis://localhost:6379")
	os.Setenv("JWT_ACCESS_SECRET", "access_secret_12345678901234567890")
	os.Setenv("JWT_REFRESH_SECRET", "refresh_secret_12345678901234567890")
	os.Setenv("COOKIE_ACCESS_SIGNATURE", "cookie_sig_12345678901234567890")
	defer func() {
		os.Unsetenv("DB_URL")
		os.Unsetenv("REDIS_URI")
		os.Unsetenv("JWT_ACCESS_SECRET")
		os.Unsetenv("JWT_REFRESH_SECRET")
		os.Unsetenv("COOKIE_ACCESS_SIGNATURE")
	}()

	cfg, err := NewConfig()
	if err != nil {
		t.Fatalf("expected NewConfig to succeed, got %v", err)
	}

	if cfg.Port != "8080" {
		t.Errorf("expected default Port 8080, got %s", cfg.Port)
	}
	if cfg.Env != "development" {
		t.Errorf("expected default Env development, got %s", cfg.Env)
	}
	if cfg.JWTAccessTTL != 15*time.Minute {
		t.Errorf("expected default JWTAccessTTL 15m, got %v", cfg.JWTAccessTTL)
	}
	if cfg.JWTRefreshTTL != 720*time.Hour {
		t.Errorf("expected default JWTRefreshTTL 720h, got %v", cfg.JWTRefreshTTL)
	}
}

func TestNewConfig_MissingRequired(t *testing.T) {
	os.Unsetenv("DB_URL")
	os.Unsetenv("REDIS_URI")
	os.Unsetenv("JWT_ACCESS_SECRET")
	os.Unsetenv("JWT_REFRESH_SECRET")
	os.Unsetenv("COOKIE_ACCESS_SIGNATURE")

	_, err := NewConfig()
	if err == nil {
		t.Fatalf("expected error when required env vars are missing")
	}
}
