package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
	"syscall"

	"mail.kron.com/internal/api/config"
	"mail.kron.com/internal/api/database"
	"mail.kron.com/internal/modules/mail"
	pkf "mail.kron.com/pkg/kafka"
)

func main() {
	// 1. Load runtime configuration
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("[FATAL] failed to load configuration: %v", err)
	}

	log.Printf("[INFO] Starting %s (Internal Background Mail Microservice)...", cfg.ServiceName)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 2. Connect to PostgreSQL database pool
	dbPool, err := database.NewPool(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("[FATAL] database initialization failed: %v", err)
	}
	defer dbPool.Close()

	// 3. Connect to Redis cache
	redisClient, err := database.NewRedisClient(ctx, cfg.RedisConn)
	if err != nil {
		log.Fatalf("[FATAL] redis initialization failed: %v", err)
	}
	defer redisClient.Close()

	// 4. Initialize Mail Module (Repository & Service with Template Engine, Multi-SMTP & Bounded WorkerPool)
	mailRepo := mail.NewRepository(dbPool, redisClient)
	mailService := mail.NewService(mailRepo, cfg)
	defer mailService.Stop()

	// 5. Initialize Kafka Receiver Consumer
	kafkaReceiver := pkf.NewReceiver(cfg.KafkaBrokers, cfg.KafkaEmailTopic, cfg.KafkaGroupID)
	defer kafkaReceiver.Close()

	eventReceiver := mail.NewEventReceiver(kafkaReceiver, mailService)

	// 6. Start Kafka Receiver worker in background context
	receiverCtx, cancelReceiver := context.WithCancel(context.Background())
	defer cancelReceiver()

	go func() {
		if err := eventReceiver.Start(receiverCtx); err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("[ERROR] Kafka Receiver stopped with error: %v", err)
		}
	}()

	log.Println("[INFO] Mail Microservice worker pool & Kafka consumer initialized cleanly. Waiting for events...")

	// 7. Signal listener for graceful shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	sig := <-shutdown
	log.Printf("[INFO] Shutdown signal received (%v), stopping Mail Microservice cleanly...", sig)

	// Draining phase: cancel receiver context & stop worker pool
	cancelReceiver()
	mailService.Stop()

	log.Println("[INFO] Mail Microservice stopped cleanly")
}
