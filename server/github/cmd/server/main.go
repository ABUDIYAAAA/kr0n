package main

import (
	"github/internal/config"
	"github/internal/database"
	"github/internal/ghub"
	"github/internal/health"
	"github/internal/producer"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

// @title           GitHub Integration API
// @version         1.0
// @description     GitHub App webhook + repo management service for kr0n.
// @BasePath        /
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Unable to load config:", err)
	}

	pool, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Unable to connect to db:", err)
	}
	defer pool.Close()

	// Load GitHub App private key
	var privateKey []byte
	if cfg.GitHubAppPrivateKeyPath != "" {
		privateKey, err = os.ReadFile(cfg.GitHubAppPrivateKeyPath)
		if err != nil {
			log.Printf("warn: failed to load GitHub App private key from %s: %v", cfg.GitHubAppPrivateKeyPath, err)
		}
	}

	// Kafka producer for deployment events
	deployPublisher := producer.New(producer.Config{
		Broker: cfg.KafkaBroker,
		Topic:  cfg.KafkaTopic,
	})
	defer deployPublisher.Close()

	r := gin.Default()
	health.RegisterRoutes(r, pool)

	ghub.RegisterRoutes(r, pool, ghub.ModuleConfig{
		GitHubAppCfg: ghub.GitHubAppCfg{
			AppID:      cfg.GitHubAppID,
			AppName:    cfg.GitHubAppName,
			PrivateKey: privateKey,
		},
		WebhookSecret:  cfg.GitHubWebhookSecret,
		EventPublisher: deployPublisher,
	})

	log.Printf("GitHub service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
