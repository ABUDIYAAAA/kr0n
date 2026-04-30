package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL              string
	Port                     string
	EmailKafkaBroker         string
	EmailKafkaTopic          string
	AuthPublicURL            string
	AuthSessionTTL           time.Duration
	AuthEmailVerificationTTL time.Duration
	AuthPasswordResetTTL     time.Duration
	AuthCookieName           string
	AuthCookieDomain         string
	AuthCookieSecure         bool
	AuthCookieSameSite       string
	GoogleOAuthClientID      string
	GoogleOAuthClientSecret  string
	GoogleOAuthRedirectURL   string
	GoogleOAuthScopes        string
	GitHubAppID              string
	GitHubAppName            string
	GitHubAppClientID        string
	GitHubAppClientSecret    string
	GitHubAppPrivateKeyPath  string
	GitHubAppRedirectURL     string
	GitHubAppScopes          string
	MaxConns                 int32
	MinConns                 int32
	MaxConnLifetime          time.Duration
	MaxConnIdleTime          time.Duration
	HealthCheckPeriod        time.Duration
	ConnectTimeout           time.Duration
}

const defaultGitHubScopes = "repo read:org read:user user:email admin:repo_hook"

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL:              getString("DATABASE_URL", ""),
		Port:                     getString("PORT", "8080"),
		EmailKafkaBroker:         getString("EMAIL_KAFKA_BROKER", getString("KAFKA_BROKER", "localhost:9092")),
		EmailKafkaTopic:          getString("EMAIL_KAFKA_TOPIC", getString("KAFKA_TOPIC", "emails.outbound")),
		AuthPublicURL:            getString("AUTH_PUBLIC_URL", "http://localhost:8080"),
		AuthSessionTTL:           getDuration("AUTH_SESSION_TTL", 30*24*time.Hour),
		AuthEmailVerificationTTL: getDuration("AUTH_EMAIL_VERIFICATION_TTL", 24*time.Hour),
		AuthPasswordResetTTL:     getDuration("AUTH_PASSWORD_RESET_TTL", 1*time.Hour),
		AuthCookieName:           getString("AUTH_COOKIE_NAME", "kr0n_session"),
		AuthCookieDomain:         getString("AUTH_COOKIE_DOMAIN", ""),
		AuthCookieSecure:         getBool("AUTH_COOKIE_SECURE", true),
		AuthCookieSameSite:       getString("AUTH_COOKIE_SAMESITE", "Lax"),
		GoogleOAuthClientID:      getString("GOOGLE_OAUTH_CLIENT_ID", ""),
		GoogleOAuthClientSecret:  getString("GOOGLE_OAUTH_CLIENT_SECRET", ""),
		GoogleOAuthRedirectURL:   getString("GOOGLE_OAUTH_REDIRECT_URL", ""),
		GoogleOAuthScopes:        getString("GOOGLE_OAUTH_SCOPES", "openid email profile"),
		GitHubAppID:              getString("GITHUB_APP_ID", ""),
		GitHubAppName:            getString("GITHUB_APP_NAME", ""),
		GitHubAppClientID:        getString("GITHUB_APP_CLIENT_ID", ""),
		GitHubAppClientSecret:    getString("GITHUB_APP_CLIENT_SECRET", ""),
		GitHubAppPrivateKeyPath:  getString("GITHUB_APP_PRIVATE_KEY_PATH", ""),
		GitHubAppRedirectURL:     getString("GITHUB_APP_REDIRECT_URL", ""),
		GitHubAppScopes:          getString("GITHUB_APP_SCOPES", defaultGitHubScopes),

		MaxConns: getInt32("MAX_CONNS", 20),
		MinConns: getInt32("MIN_CONNS", 5),

		MaxConnLifetime:   getDuration("MAX_CONN_LIFETIME", time.Hour),
		MaxConnIdleTime:   getDuration("MAX_CONN_IDLE_TIME", 15*time.Minute),
		HealthCheckPeriod: getDuration("HEALTH_CHECK_PERIOD", time.Minute),
		ConnectTimeout:    getDuration("CONNECT_TIMEOUT", 5*time.Second),
	}

	return cfg, nil
}

func getString(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func getInt32(key string, fallback int32) int32 {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}

	i, err := strconv.Atoi(val)
	if err != nil {
		panic(fmt.Sprintf("invalid int for %s: %v", key, err))
	}

	return int32(i)
}

func getDuration(key string, fallback time.Duration) time.Duration {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}

	d, err := time.ParseDuration(val)
	if err != nil {
		panic(fmt.Sprintf("invalid duration for %s: %v", key, err))
	}

	return d
}

func getBool(key string, fallback bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}

	b, err := strconv.ParseBool(val)
	if err != nil {
		panic(fmt.Sprintf("invalid bool for %s: %v", key, err))
	}

	return b
}
