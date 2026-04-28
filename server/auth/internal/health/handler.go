package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler contains HTTP handlers for health-related endpoints.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new health handler with required dependencies.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		db: db,
	}
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

// DBCheck godoc
// @Summary Database connectivity check
// @Description Pings the database and returns connectivity status
// @Tags health
// @Produce json
// @Success 200 {object} DBCheckResponse
// @Failure 500 {object} DBCheckResponse
// @Router /db-check [get]
func (h *Handler) DBCheck(c *gin.Context) {
	if err := h.db.Ping(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, DBCheckResponse{
			Status: "db down",
			Error:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, DBCheckResponse{
		Status: "db ok",
	})
}
