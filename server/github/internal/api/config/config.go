package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	Environment           string
	FrontendURL           string
	DBConn                string
	RedisConn             string
	JWTAccessSecret       string
	CookieNameAccess      string
	CookieAccessSignature string
	GitHubAppID           int64
	GitHubAppClientID     string
	GitHubAppClientSecret string
	GitHubPrivateKeyPath  string
	GitHubPrivateKey      []byte
	GitHubWebhookSecret   string
	KafkaBrokers          []string
	KafkaServiceTopic     string
	KafkaDeploymentTopic  string
	KafkaGroupID           string
}

func NewConfig() (*Config, error) {
	_ = godotenv.Load()

	port := getEnv("PORT", "8082")
	env := getEnv("ENVIRONMENT", "development")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:3000")
	dbConn := getEnv("DB_CONN", "")
	redisConn := getEnv("REDIS_CONN", "")

	jwtAccessSecret := getEnv("JWT_ACCESS_SECRET", "")
	cookieNameAccess := getEnv("COOKIE_NAME_ACCESS", "kron_access")
	cookieAccessSignature := getEnv("COOKIE_ACCESS_SIGNATURE", "")

	appIDStr := getEnv("GITHUB_APP_ID", "0")
	appID, _ := strconv.ParseInt(appIDStr, 10, 64)

	githubAppClientID := getEnv("GITHUB_APP_CLIENT_ID", "")
	githubAppClientSecret := getEnv("GITHUB_APP_CLIENT_SECRET", "")
	githubPrivateKeyPath := getEnv("GITHUB_APP_PRIVATE_KEY_PATH", "./keys/github-app.private-key.pem")
	githubWebhookSecret := getEnv("GITHUB_WEBHOOK_SECRET", "")

	var privateKeyBytes []byte
	if githubPrivateKeyPath != "" {
		data, err := os.ReadFile(githubPrivateKeyPath)
		if err == nil {
			privateKeyBytes = data
		}
	}

	if jwtAccessSecret == "" && env == "production" {
		return nil, errors.New("JWT_ACCESS_SECRET is required")
	}

	kafkaBrokersStr := getEnv("KAFKA_BROKERS", "localhost:9092")
	kafkaBrokers := strings.Split(kafkaBrokersStr, ",")

	return &Config{
		Port:                  port,
		Environment:           env,
		FrontendURL:           frontendURL,
		DBConn:                dbConn,
		RedisConn:             redisConn,
		JWTAccessSecret:       jwtAccessSecret,
		CookieNameAccess:      cookieNameAccess,
		CookieAccessSignature: cookieAccessSignature,
		GitHubAppID:           appID,
		GitHubAppClientID:     githubAppClientID,
		GitHubAppClientSecret: githubAppClientSecret,
		GitHubPrivateKeyPath:  githubPrivateKeyPath,
		GitHubPrivateKey:      privateKeyBytes,
		GitHubWebhookSecret:   githubWebhookSecret,
		KafkaBrokers:          kafkaBrokers,
		KafkaServiceTopic:     getEnv("KAFKA_SERVICE_TOPIC", "service.events"),
		KafkaDeploymentTopic:  getEnv("KAFKA_DEPLOYMENT_TOPIC", "deployment.events"),
		KafkaGroupID:          getEnv("KAFKA_GROUP_ID", "github-service-group"),
	}, nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return fallback
}
