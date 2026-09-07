package services

import (
	"github.com/go-chi/chi/v5"
	"services.kron.com/internal/api/config"
	"services.kron.com/internal/api/middleware"
)

func RegisterRoutes(r chi.Router, cfg *config.Config, handler *Handler) {
	r.Group(func(protected chi.Router) {
		protected.Use(middleware.RequireAuth(cfg))

		protected.Post("/", handler.CreateService)
		protected.Get("/", handler.ListUserServices)
		protected.Get("/suggest-name", handler.SuggestServiceName)
		protected.Get("/{id}", handler.GetServiceByID)
		protected.Patch("/{id}", handler.UpdateService)
		protected.Delete("/{id}", handler.DeleteService)
	})
}
