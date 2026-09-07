package main

import (
	"log"
	"net/http"

	"auth.kron.com/internal/api/middleware"
	"github.com/go-chi/chi/v5"
)

func main() {
	r := chi.NewRouter()
	middleware.RegisterMiddlewares(r)

	log.Println("Starting server on port:", 3000)
	err := http.ListenAndServe(":3000", r)

	if err != nil {
		log.Println("Error starting server:", err)
	}
}
