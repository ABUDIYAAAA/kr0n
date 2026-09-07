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

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/api/database"
	"auth.kron.com/internal/api/router"
	"auth.kron.com/internal/modules/auth"
	"auth.kron.com/internal/modules/auth/oauth"
	"auth.kron.com/pkg/email"
)

func main() {
	// 1. Load runtime configuration
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("[FATAL] failed to load configuration: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 2. Connect to PostgreSQL database pool
	dbPool, err := database.NewPool(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("[FATAL] database initialization failed: %v", err)
	}
	defer dbPool.Close()

	// 3. Connect to Redis cache / session store
	redisClient, err := database.NewRedisClient(ctx, cfg.RedisConn)
	if err != nil {
		log.Fatalf("[FATAL] redis initialization failed: %v", err)
	}
	defer redisClient.Close()

	// 4. Initialize OAuth Provider Registry
	oauthRegistry := oauth.NewRegistry()

	googleProvider := oauth.NewGoogleProvider(cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleCallbackUrl)
	oauthRegistry.Register(googleProvider)
	log.Println("[INFO] Registered Google OAuth provider")

	githubProvider := oauth.NewGitHubProvider(cfg.GithubClientID, cfg.GithubClientSecret, cfg.GithubCallbackUrl)
	oauthRegistry.Register(githubProvider)
	log.Println("[INFO] Registered GitHub OAuth provider")

	// 5. Initialize Email Service
	emailService := email.NewLogEmailService()

	// 6. Initialize Module Layers (Repository -> Service -> Handler)
	authRepo := auth.NewRepository(dbPool, redisClient)
	authService := auth.NewService(authRepo, cfg, emailService, oauthRegistry)
	authHandler := auth.NewHandler(authService, cfg)

	// 7. Initialize Root Router
	r := router.NewRouter(cfg, authRepo, authHandler)

	// 8. Start HTTP Server with Graceful Shutdown
	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server runner channel
	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("[INFO] Kr0n Auth Service listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	// Signal listener for graceful shutdown
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
		log.Println("[INFO] Server stopped cleanly")
	}
}
