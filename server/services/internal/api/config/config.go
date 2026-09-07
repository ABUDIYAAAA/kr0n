package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	Env                   string
	DBConn                string
	RedisConn             string
	FrontendURL           string
	JWTAccessSecret       string
	CookieNameAccess      string
	CookieAccessSignature string
	KafkaBrokers          []string
	KafkaServiceTopic     string
	OutboxBatchSize       int
	OutboxPollInterval    time.Duration
}

func NewConfig() (*Config, error) {
	_ = godotenv.Load()

	port := getEnv("PORT", "8083")
	env := getEnv("ENV", "development")
	dbConn := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kron_services?sslmode=disable")
	redisConn := getEnv("REDIS_URL", "redis://localhost:6379/0")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:3000")
	jwtAccessSecret := getEnv("JWT_ACCESS_SECRET", "super-secret-access-key-kron-2026")
	cookieNameAccess := getEnv("COOKIE_NAME_ACCESS", "kron_access")
	cookieAccessSignature := getEnv("COOKIE_ACCESS_SIGNATURE", "super-secret-cookie-signature-kron-2026")
	kafkaServiceTopic := getEnv("KAFKA_SERVICE_TOPIC", "service.events")

	kafkaBrokers := []string{getEnv("KAFKA_BROKERS", "localhost:9092")}

	batchSizeStr := getEnv("OUTBOX_BATCH_SIZE", "10")
	batchSize, err := strconv.Atoi(batchSizeStr)
	if err != nil {
		batchSize = 10
	}

	pollIntervalMsStr := getEnv("OUTBOX_POLL_INTERVAL_MS", "100")
	pollIntervalMs, err := strconv.Atoi(pollIntervalMsStr)
	if err != nil {
		pollIntervalMs = 100
	}

	if jwtAccessSecret == "" {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET must be set")
	}

	return &Config{
		Port:                  port,
		Env:                   env,
		DBConn:                dbConn,
		RedisConn:             redisConn,
		FrontendURL:           frontendURL,
		JWTAccessSecret:       jwtAccessSecret,
		CookieNameAccess:      cookieNameAccess,
		CookieAccessSignature: cookieAccessSignature,
		KafkaBrokers:          kafkaBrokers,
		KafkaServiceTopic:     kafkaServiceTopic,
		OutboxBatchSize:       batchSize,
		OutboxPollInterval:    time.Duration(pollIntervalMs) * time.Millisecond,
	}, nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
