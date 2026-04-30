package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL            string
	Port                   string
	KafkaBroker            string
	KafkaTopic             string
	GitHubWebhookSecret    string
	GitHubAppID            string
	GitHubAppName          string
	GitHubAppPrivateKeyPath string
	MaxConns               int32
	MinConns               int32
	MaxConnLifetime        time.Duration
	MaxConnIdleTime        time.Duration
	HealthCheckPeriod      time.Duration
	ConnectTimeout         time.Duration
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL:             getString("DATABASE_URL", ""),
		Port:                    getString("PORT", "8081"),
		KafkaBroker:             getString("KAFKA_BROKER", "localhost:9092"),
		KafkaTopic:              getString("KAFKA_TOPIC", "deployments.triggers"),
		GitHubWebhookSecret:     getString("GITHUB_WEBHOOK_SECRET", ""),
		GitHubAppID:             getString("GITHUB_APP_ID", ""),
		GitHubAppName:           getString("GITHUB_APP_NAME", ""),
		GitHubAppPrivateKeyPath: getString("GITHUB_APP_PRIVATE_KEY_PATH", ""),
		MaxConns:                getInt32("MAX_CONNS", 20),
		MinConns:                getInt32("MIN_CONNS", 5),

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
