package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"services.kron.com/internal/api/config"
	"services.kron.com/internal/api/database"
	"services.kron.com/internal/api/router"
	m "services.kron.com/internal/modules/services"
	pkf "services.kron.com/pkg/kafka"
)

func main() {
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("[FATAL] failed to load configuration: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dbPool, err := database.NewPool(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("[FATAL] database initialization failed: %v", err)
	}
	if dbPool != nil {
		defer dbPool.Close()
	}

	redisClient, err := database.NewRedisClient(ctx, cfg.RedisConn)
	if err != nil {
		log.Fatalf("[FATAL] redis initialization failed: %v", err)
	}
	if redisClient != nil {
		defer redisClient.Close()
	}

	kafkaProducer := pkf.NewProducer(cfg.KafkaBrokers, cfg.KafkaServiceTopic)
	defer kafkaProducer.Close()

	repo := m.NewRepository(dbPool, redisClient)
	svc := m.NewService(repo, cfg)
	handler := m.NewHandler(svc, cfg)

	outboxWorker := m.NewOutboxWorker(repo, kafkaProducer, cfg.OutboxBatchSize, cfg.OutboxPollInterval)
	outboxCtx, cancelOutbox := context.WithCancel(context.Background())
	defer cancelOutbox()

	go func() {
		if err := outboxWorker.Start(outboxCtx); err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("[ERROR] Outbox worker exited with error: %v", err)
		}
	}()

	r := router.NewRouter(cfg, handler)

	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("[INFO] Kr0n Services Microservice listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("[FATAL] error starting server: %v", err)

	case sig := <-shutdown:
		log.Printf("[INFO] shutdown signal received (%v), shutting down gracefully...", sig)

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("[ERROR] graceful shutdown failed, forcing close: %v", err)
			_ = srv.Close()
		}
		log.Println("[INFO] Services Microservice stopped cleanly")
	}
}
