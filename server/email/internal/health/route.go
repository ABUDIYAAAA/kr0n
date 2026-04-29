package health

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes mounts health and Swagger routes.
func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool) {
	h := NewHandler(db)
	// Health routes
	r.GET("/health", h.Health)
	r.GET("/ready", h.Ready)

}
