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

	"github.kron.com/internal/api/config"
	"github.kron.com/internal/api/database"
	"github.kron.com/internal/api/router"
	"github.kron.com/internal/modules/github"
	pkgh "github.kron.com/pkg/github"
)

func main() {
	// 1. Load configuration
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("[FATAL] failed to load configuration: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 2. Connect to Database pool & Redis
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

	// 3. Initialize GitHub API Client & Webhook Verifier
	ghClient := pkgh.NewClient(cfg.GitHubAppID, cfg.GitHubPrivateKey, cfg.GitHubWebhookSecret)

	// 4. Initialize GitHub Module Layers
	repo := github.NewRepository(dbPool, redisClient)
	service := github.NewService(repo, cfg, ghClient)
	handler := github.NewHandler(service, cfg)

	// 5. Initialize Router & Server
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
		log.Printf("[INFO] Kr0n GitHub Microservice listening on %s", addr)
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
		log.Println("[INFO] GitHub Microservice stopped cleanly")
	}
}
