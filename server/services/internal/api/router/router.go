package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"services.kron.com/internal/api/config"
	"services.kron.com/internal/api/middleware"
	m "services.kron.com/internal/modules/services"
)

func NewRouter(cfg *config.Config, handler *m.Handler) http.Handler {
	r := chi.NewRouter()

	middleware.RegisterMiddlewares(r, cfg)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"healthy","service":"services"}`))
	})

	r.Route("/api/v1/services", func(api chi.Router) {
		m.RegisterRoutes(api, cfg, handler)
	})

	return r
}
