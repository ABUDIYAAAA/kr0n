package health

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "auth/docs"
)

// RegisterRoutes mounts health and Swagger routes.
func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool) {
	h := NewHandler(db)

	// Health routes
	r.GET("/health", h.Health)
	r.GET("/db-check", h.DBCheck)

	// Swagger UI route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
