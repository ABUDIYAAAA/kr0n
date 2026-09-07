package middleware

import (
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func RegisterMiddlewares(r *chi.Mux) {

	r.Use(middleware.CleanPath)

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(middleware.Compress(5))
	r.Use(middleware.Timeout(10 * time.Second))
	r.Use(middleware.Throttle(500))
}
