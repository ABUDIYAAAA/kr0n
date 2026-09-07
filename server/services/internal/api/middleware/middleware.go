package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"services.kron.com/internal/api/config"
)

func RegisterMiddlewares(r *chi.Mux, cfg *config.Config) {
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.CleanPath)

	allowedOrigins := []string{"http://localhost:3000", "http://localhost:8083"}
	if cfg != nil && cfg.FrontendURL != "" {
		allowedOrigins = append(allowedOrigins, cfg.FrontendURL)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Device-ID"},
		ExposedHeaders:   []string{"Link", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(chimiddleware.Compress(5))
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(chimiddleware.Throttle(1000))
	r.Use(MaxBodySizeMiddleware(1 * 1024 * 1024))
}

func MaxBodySizeMiddleware(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}
