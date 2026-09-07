package main

import (
	"context"
	"flag"
	"log"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5"
	"services.kron.com/internal/api/config"
)

func main() {
	direction := flag.String("direction", "up", "Migration direction: 'up' or 'down'")
	flag.Parse()

	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("[FATAL] failed to load config: %v", err)
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("[FATAL] failed to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	filename := "000001_create_services_tables.up.sql"
	if *direction == "down" {
		filename = "000001_create_services_tables.down.sql"
	}

	migrationPath := filepath.Join("migrations", filename)
	sqlContent, err := os.ReadFile(migrationPath)
	if err != nil {
		log.Fatalf("[FATAL] failed to read migration file %s: %v", migrationPath, err)
	}

	log.Printf("[MIGRATE] Running %s migration...", *direction)
	if _, err := conn.Exec(ctx, string(sqlContent)); err != nil {
		log.Fatalf("[FATAL] migration failed: %v", err)
	}

	log.Printf("[MIGRATE] Migration %s completed successfully", *direction)
}
