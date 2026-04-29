package health

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler contains HTTP handlers for health-related endpoints.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new health handler with required dependencies.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// Health godoc
// @Summary Health check
// @Description Returns API health status
// @Tags health
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status: "ok",
	})
}

// Ready godoc
// @Summary Readiness check
// @Description Returns dependency readiness status
// @Tags health
// @Produce json
// @Success 200 {object} ReadyResponse
// @Router /ready [get]
func (h *Handler) Ready(c *gin.Context) {
	status := ReadyResponse{Status: "ready", TemplateDir: "templates"}
	if h.db != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := h.db.Ping(ctx); err != nil {
			status.Status = "degraded"
			status.Database = err.Error()
			c.JSON(http.StatusServiceUnavailable, status)
			return
		}
		status.Database = "ok"
	}
	status.SMTP = "configured"
	status.Kafka = "configured"
	c.JSON(http.StatusOK, status)
}
