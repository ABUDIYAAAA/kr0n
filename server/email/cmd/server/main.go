package main

import (
	"context"
	"email/internal/config"
	"email/internal/database"
	emailsvc "email/internal/email"
	health "email/internal/health"
	kafkaworker "email/internal/kafka"
	smtpclient "email/internal/smtp"
	"errors"
	"log"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Unable to load config:", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}
	if db != nil {
		defer db.Close()
	}

	r := gin.Default()
	health.RegisterRoutes(r, db)

	renderer := emailsvc.NewRenderer(cfg.TemplateDir)
	sender := smtpclient.NewClient(cfg)
	if err := sender.Verify(); err != nil {
		log.Panicf("SMTP verification failed: %v", err)
	}
	repo := emailsvc.NewPGRepository(db)
	handler := emailsvc.NewHandler(renderer, sender, repo, log.Default())
	consumer := kafkaworker.NewConsumer(cfg.KafkaBroker, cfg.KafkaTopic, cfg.KafkaGroupID, cfg.KafkaMinBytes, cfg.KafkaMaxBytes, cfg.KafkaMaxWait, cfg.KafkaReaderQueueDepth, handler, log.Default(), cfg.ConsumerRetryLimit)

	go func() {
		if err := consumer.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("kafka consumer stopped: %v", err)
			stop()
		}
	}()

	go func() {
		<-ctx.Done()
		_ = consumer.Close()
	}()

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		stop()
		log.Fatal("Failed to start server:", err)
	}
}
