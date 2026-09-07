package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"

	"mail.kron.com/internal/api/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {

	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalln("failed to load configuration", "error", err)
		os.Exit(1)
	}

	migrationsPath := flag.String("path", "file://migrations", "Path to migration files (must prefix with file://)")
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		fmt.Println("Usage: go run cmd/migrate/main.go [options] <command> [args]")
		fmt.Println("\nCommands:")
		fmt.Println("  up             Apply all pending migrations")
		fmt.Println("  down           Roll back all migrations")
		fmt.Println("  step <n>       Apply or rollback n migrations (e.g. step 1, step -1)")
		fmt.Println("  force <v>      Force clean dirty database migration version")
		fmt.Println("  version        Print current migration version")
		os.Exit(1)
	}

	cmd := args[0]

	m, err := migrate.New(*migrationsPath, cfg.DBConn)
	if err != nil {
		log.Fatalln("failed to initialize migrate driver", "error", err)
		os.Exit(1)
	}
	defer func() {
		srcErr, dbErr := m.Close()
		if srcErr != nil {
			log.Fatalln("migration source close error", "error", srcErr)
		}
		if dbErr != nil {
			log.Fatalln("migration database close error", "error", dbErr)
		}
	}()

	switch cmd {
	case "up":
		if err := m.Up(); err != nil {
			if errors.Is(err, migrate.ErrNoChange) {
				log.Println("no new migrations to apply")
				return
			}
			log.Fatalln("migration up failed", "error", err)
			os.Exit(1)
		}
		log.Println("migrations applied successfully (up)")

	case "down":
		if err := m.Down(); err != nil {
			if errors.Is(err, migrate.ErrNoChange) {
				log.Println("database is already at initial state")
				return
			}
			log.Fatalln("migration down failed", "error", err)
			os.Exit(1)
		}
		log.Println("migrations rolled back successfully (down)")

	case "step":
		if len(args) < 2 {
			log.Fatalln("step command requires a step count (e.g., 'step 1' or 'step -1')")
			os.Exit(1)
		}
		steps, err := strconv.Atoi(args[1])
		if err != nil {
			log.Fatalln("invalid step number", "error", err)
			os.Exit(1)
		}
		if err := m.Steps(steps); err != nil {
			if errors.Is(err, migrate.ErrNoChange) {
				log.Println("no changes applied")
				return
			}
			log.Fatalln("migration step failed", "error", err)
			os.Exit(1)
		}
		log.Println("migration steps executed successfully", "steps", steps)

	case "force":
		if len(args) < 2 {
			log.Fatalln("force command requires a target version number")
			os.Exit(1)
		}
		v, err := strconv.Atoi(args[1])
		if err != nil {
			log.Fatalln("invalid version number", "error", err)
			os.Exit(1)
		}
		if err := m.Force(v); err != nil {
			log.Fatalln("failed to force migration version", "error", err)
			os.Exit(1)
		}
		log.Println("migration version forced successfully", "version", v)

	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			if errors.Is(err, migrate.ErrNilVersion) {
				log.Println("no migrations applied yet")
				return
			}
			log.Fatalln("failed to get migration version", "error", err)
			os.Exit(1)
		}
		log.Println("current database schema version", "version", version, "dirty", dirty)

	default:
		log.Fatalln("unknown command", "command", cmd)
		os.Exit(1)
	}
}
