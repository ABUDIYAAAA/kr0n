package github

import (
	"github.com/go-chi/chi/v5"
	"github.kron.com/internal/api/config"
	"github.kron.com/internal/api/middleware"
)

func RegisterRoutes(r chi.Router, cfg *config.Config, handler *Handler) {
	r.Route("/api/v1/github", func(r chi.Router) {
		// Public GitHub Webhook Receiver
		r.Post("/webhooks", handler.HandleWebhook)

		// Protected endpoints (requires valid JWT access token)
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth(cfg))

			r.Get("/installation-status", handler.GetInstallationStatus)
			r.Get("/installation/callback", handler.HandleInstallationCallback)
			r.Post("/installation/callback", handler.HandleInstallationCallback)

			r.Get("/repositories", handler.ListUserRepositories)
			r.Get("/repositories/contents", handler.ListRepositoryContents)
			r.Get("/repositories/tracked", handler.ListTrackedRepositories)
		})
	})
}
