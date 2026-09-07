package router

import (
	"net/http"

	"auth.kron.com/internal/api/config"
	"auth.kron.com/internal/api/middleware"
	"auth.kron.com/internal/modules/auth"
	"auth.kron.com/pkg/response"
	"github.com/go-chi/chi/v5"
)

// NewRouter constructs and configures the main HTTP multiplexer.
func NewRouter(cfg *config.Config, repo auth.Repository, authHandler *auth.Handler) *chi.Mux {
	r := chi.NewRouter()

	// 1. Global Middlewares
	middleware.RegisterMiddlewares(r, cfg)
	r.Use(middleware.DeviceTrackingMiddleware(cfg))

	// 2. Health check route
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, http.StatusOK, "Auth service healthy", map[string]string{
			"status": "up",
		})
	})

	// 3. Auth API routes
	authMiddlewareWrapper := func(subRouter chi.Router) chi.Router {
		subRouter.Use(middleware.RequireAuth(cfg, repo))
		return subRouter
	}

	// Mount on /api/v1/auth
	r.Route("/api/v1/auth", func(api chi.Router) {
		auth.RegisterRoutes(api, authHandler, authMiddlewareWrapper)
	})

	// Also mount directly on /auth for convenience
	r.Route("/auth", func(api chi.Router) {
		auth.RegisterRoutes(api, authHandler, authMiddlewareWrapper)
	})

	return r
}
