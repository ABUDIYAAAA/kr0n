package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.kron.com/internal/api/config"
	"github.kron.com/internal/api/database"
)

func main() {
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("[FATAL] failed to load configuration: %v", err)
	}

	ctx := context.Background()
	dbPool, err := database.NewPool(ctx, cfg.DBConn)
	if err != nil || dbPool == nil {
		log.Fatalf("[FATAL] migration database connection failed: %v", err)
	}
	defer dbPool.Close()

	if len(os.Args) < 2 {
		fmt.Println("Usage: go run ./cmd/migrate [up|down]")
		os.Exit(1)
	}

	direction := os.Args[1]
	switch direction {
	case "up":
		log.Println("[MIGRATE] Running database migrations UP...")
		sqlBytes, err := os.ReadFile("migrations/000001_create_github_tables.up.sql")
		if err != nil {
			log.Fatalf("[FATAL] failed to read migration UP script: %v", err)
		}
		if _, err := dbPool.Exec(ctx, string(sqlBytes)); err != nil {
			log.Fatalf("[FATAL] migration UP failed: %v", err)
		}
		log.Println("[MIGRATE] Migration UP completed successfully!")

	case "down":
		log.Println("[MIGRATE] Running database migrations DOWN...")
		sqlBytes, err := os.ReadFile("migrations/000001_create_github_tables.down.sql")
		if err != nil {
			log.Fatalf("[FATAL] failed to read migration DOWN script: %v", err)
		}
		if _, err := dbPool.Exec(ctx, string(sqlBytes)); err != nil {
			log.Fatalf("[FATAL] migration DOWN failed: %v", err)
		}
		log.Println("[MIGRATE] Migration DOWN completed successfully!")

	default:
		log.Fatalf("Unknown migration command '%s'. Use 'up' or 'down'", direction)
	}
}
