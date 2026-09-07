package config

import (
	"time"

	"github.com/caarlos0/env"
	"github.com/joho/godotenv"
)

// Config holds all runtime environment configuration for the mail microservice.
type Config struct {
	// Service Metadata
	ServiceName string `env:"SERVICE_NAME" envDefault:"mail-service"`

	// Database & Cache
	DBConn    string `env:"DB_URL,required"`
	RedisConn string `env:"REDIS_URI,required"`

	// Kafka Messaging Configuration
	KafkaBrokers    []string `env:"KAFKA_BROKERS" envSeparator:"," envDefault:"localhost:9092"`
	KafkaGroupID    string   `env:"KAFKA_GROUP_ID" envDefault:"mail-service-group"`
	KafkaEmailTopic string   `env:"KAFKA_EMAIL_TOPIC" envDefault:"email-events"`

	// Worker Pool & Batching Configuration
	WorkerPoolSize int `env:"MAIL_WORKER_POOL_SIZE" envDefault:"10"`
	QueueCapacity  int `env:"MAIL_QUEUE_CAPACITY" envDefault:"100"`
	MailMaxRetries int `env:"MAIL_MAX_RETRIES" envDefault:"3"`

	// Maintenance & Idempotency Retention
	IdempotencyRetentionDays int           `env:"IDEMPOTENCY_RETENTION_DAYS" envDefault:"30"`
	CleanupInterval          time.Duration `env:"CLEANUP_INTERVAL" envDefault:"24h"`

	// Default SMTP Account Credentials
	SMTPHost      string `env:"SMTP_HOST" envDefault:"localhost"`
	SMTPPort      int    `env:"SMTP_PORT" envDefault:"587"`
	SMTPUsername  string `env:"SMTP_USERNAME"`
	SMTPPassword  string `env:"SMTP_PASSWORD"`
	SMTPFromEmail string `env:"SMTP_FROM_EMAIL" envDefault:"no-reply@kron.com"`
	SMTPFromName  string `env:"SMTP_FROM_NAME" envDefault:"Kr0n Team"`
}

// NewConfig loads .env file if present and parses environment variables into Config struct.
func NewConfig() (*Config, error) {
	_ = godotenv.Load()

	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
