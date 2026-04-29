package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                   string
	KafkaBroker            string
	KafkaTopic             string
	KafkaGroupID           string
	KafkaMinBytes          int
	KafkaMaxBytes          int
	KafkaMaxWait           time.Duration
	KafkaReaderQueueDepth  int
	TemplateDir            string
	DatabaseURL            string
	DBMaxConns             int32
	DBMinConns             int32
	DBMaxConnLifetime      time.Duration
	DBMaxConnIdleTime      time.Duration
	DBHealthCheckPeriod    time.Duration
	ConnectTimeout         time.Duration
	SmtpHost               string
	SmtpPort               string
	SmtpUser               string
	SmtpPass               string
	SmtpFrom               string
	SmtpDialTimeout        time.Duration
	SmtpTLSEnabled         bool
	SmtpInsecureSkipVerify bool
	ConsumerRetryLimit     int
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:                   getString("PORT", "8080"),
		KafkaBroker:            getString("KAFKA_BROKER", "localhost:9092"),
		KafkaTopic:             getString("KAFKA_TOPIC", "emails.outbound"),
		KafkaGroupID:           getString("KAFKA_GROUP_ID", "email-service"),
		KafkaMinBytes:          int(getInt32("KAFKA_MIN_BYTES", 1)),
		KafkaMaxBytes:          int(getInt32("KAFKA_MAX_BYTES", 10_000_000)),
		KafkaMaxWait:           getDuration("KAFKA_MAX_WAIT", 3*time.Second),
		KafkaReaderQueueDepth:  int(getInt32("KAFKA_READER_QUEUE_DEPTH", 100)),
		TemplateDir:            getString("TEMPLATE_DIR", "templates"),
		DatabaseURL:            getString("DATABASE_URL", ""),
		DBMaxConns:             getInt32("DB_MAX_CONNS", 10),
		DBMinConns:             getInt32("DB_MIN_CONNS", 1),
		DBMaxConnLifetime:      getDuration("DB_MAX_CONN_LIFETIME", time.Hour),
		DBMaxConnIdleTime:      getDuration("DB_MAX_CONN_IDLE_TIME", 15*time.Minute),
		DBHealthCheckPeriod:    getDuration("DB_HEALTH_CHECK_PERIOD", time.Minute),
		ConnectTimeout:         getDuration("CONNECT_TIMEOUT", 5*time.Second),
		SmtpHost:               getString("SMTP_HOST", "localhost"),
		SmtpPort:               getString("SMTP_PORT", "587"),
		SmtpUser:               getString("SMTP_USER", ""),
		SmtpPass:               getString("SMTP_PASS", ""),
		SmtpFrom:               getString("SMTP_FROM", getString("SMTP_USER", "no-reply@localhost")),
		SmtpDialTimeout:        getDuration("SMTP_DIAL_TIMEOUT", 10*time.Second),
		SmtpTLSEnabled:         getBool("SMTP_TLS_ENABLED", true),
		SmtpInsecureSkipVerify: getBool("SMTP_INSECURE_SKIP_VERIFY", false),
		ConsumerRetryLimit:     int(getInt32("CONSUMER_RETRY_LIMIT", 3)),
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
