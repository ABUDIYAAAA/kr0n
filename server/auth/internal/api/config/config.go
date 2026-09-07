package config

import (
	"time"

	"github.com/caarlos0/env"
	"github.com/joho/godotenv"
)

// Config holds all centralized runtime environment configurations for auth microservice.
type Config struct {
	// Server
	Port        string `env:"PORT"`
	Env         string `env:"ENV" envDefault:"development"`
	FrontendURL string `env:"FRONTEND_URL"`
	CookieSecure bool  `env:"COOKIE_SECURE" envDefault:"false"`

	// Database & Cache
	DBConn    string `env:"DB_URL,required"`
	RedisConn string `env:"REDIS_URI,required"`

	// Kafka Messaging & Transactional Outbox
	KafkaBrokers       []string      `env:"KAFKA_BROKERS" envSeparator:"," envDefault:"localhost:9092"`
	KafkaEmailTopic    string        `env:"KAFKA_EMAIL_TOPIC" envDefault:"email-events"`
	OutboxBatchSize    int           `env:"OUTBOX_BATCH_SIZE" envDefault:"50"`
	OutboxPollInterval time.Duration `env:"OUTBOX_POLL_INTERVAL" envDefault:"1s"`

	// OAuth 2.0 Providers
	GoogleClientID     string `env:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `env:"GOOGLE_CLIENT_SECRET"`
	GoogleCallbackUrl  string `env:"GOOGLE_CLIENT_CALLBACK"`

	// GitHub OAuth
	GithubClientID     string `env:"GITHUB_CLIENT_ID"`
	GithubClientSecret string `env:"GITHUB_CLIENT_SECRET"`
	GithubCallbackUrl  string `env:"GITHUB_CLIENT_CALLBACK"`

	// JWT & Tokens
	JWTAccessSecret  string        `env:"JWT_ACCESS_SECRET,required"`
	JWTRefreshSecret string        `env:"JWT_REFRESH_SECRET,required"`
	JWTAccessTTL     time.Duration `env:"JWT_ACCESS_TTL"`
	JWTRefreshTTL    time.Duration `env:"JWT_REFRESH_TTL"` // 30 days

	// Cookies & Signatures
	CookieDomain          string `env:"COOKIE_DOMAIN" envDefault:""`
	CookieNameAccess      string `env:"COOKIE_NAME_ACCESS" envDefault:"kr0n_access_token"`
	CookieNameRefresh     string `env:"COOKIE_NAME_REFRESH" envDefault:"kr0n_refresh_token"`
	CookieAccessSignature string `env:"COOKIE_ACCESS_SIGNATURE,required"`
	CookieNameDeviceID    string `env:"COOKIE_NAME_DEVICEID" envDefault:"kr0n_device_id"`
}

// NewConfig loads .env variables if present and parses environment into Config struct.
func NewConfig() (*Config, error) {
	_ = godotenv.Load()

	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
