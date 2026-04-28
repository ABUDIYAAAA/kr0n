package auth

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ModuleConfig struct {
	SessionTTL    time.Duration
	SessionCookie CookieConfig
	GoogleOAuth   GoogleOAuthConfig
}

func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool, cfg ModuleConfig) {
	repo := NewRepository(db)
	svc := NewService(repo, cfg.SessionTTL)

	if cfg.SessionCookie.Name == "" {
		cfg.SessionCookie.Name = "forms_session"
	}
	if cfg.SessionCookie.Path == "" {
		cfg.SessionCookie.Path = "/"
	}
	if !cfg.SessionCookie.HTTPOnly {
		cfg.SessionCookie.HTTPOnly = true
	}

	h := NewHandler(svc, cfg.SessionCookie, cfg.GoogleOAuth)
	authMiddleware := AuthMiddleware(svc, cfg.SessionCookie)

	RegisterRoutesWithHandler(r, h, authMiddleware)
}

func RegisterRoutesWithHandler(r *gin.Engine, h *Handler, authMiddleware gin.HandlerFunc) {
	auth := r.Group("/auth")
	{
		auth.GET("/google", h.GoogleLogin)
		auth.GET("/google/callback", h.GoogleCallback)

		protected := auth.Group("")
		protected.Use(authMiddleware)
		{
			protected.GET("/me", h.Me)
			protected.POST("/logout", h.Logout)

			// Session management
			protected.GET("/sessions", h.ListSessions)
			protected.DELETE("/sessions", h.RevokeAllSessions)
			protected.DELETE("/sessions/:id", h.RevokeSession)
		}
	}
}
