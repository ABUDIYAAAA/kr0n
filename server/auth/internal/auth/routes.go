package auth

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ModuleConfig struct {
	SessionTTL           time.Duration
	EmailVerificationTTL time.Duration
	EmailSender          EmailSender
	SessionCookie        CookieConfig
	GoogleOAuth          GoogleOAuthConfig
	GitHubOAuth          GitHubOAuthConfig
}

func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool, cfg ModuleConfig) {
	repo := NewRepository(db)
	svc := NewService(repo, ServiceConfig{
		SessionTTL:           cfg.SessionTTL,
		EmailVerificationTTL: cfg.EmailVerificationTTL,
		EmailSender:          cfg.EmailSender,
	})

	if cfg.SessionCookie.Name == "" {
		cfg.SessionCookie.Name = "forms_session"
	}
	if cfg.SessionCookie.Path == "" {
		cfg.SessionCookie.Path = "/"
	}
	if !cfg.SessionCookie.HTTPOnly {
		cfg.SessionCookie.HTTPOnly = true
	}

	h := NewHandler(svc, cfg.SessionCookie, cfg.GoogleOAuth, cfg.GitHubOAuth)
	authMiddleware := AuthMiddleware(svc, cfg.SessionCookie)

	RegisterRoutesWithHandler(r, h, authMiddleware)
}

func RegisterRoutesWithHandler(r *gin.Engine, h *Handler, authMiddleware gin.HandlerFunc) {
	auth := r.Group("/auth")
	{
		auth.GET("/providers", h.Providers)
		auth.POST("/signup", h.Signup)
		auth.POST("/login", h.Login)
		auth.POST("/email/verify", h.VerifyEmail)
		auth.POST("/email/verification", h.RequestEmailVerification)

		auth.GET("/google", h.GoogleLogin)
		auth.GET("/google/callback", h.GoogleCallback)
		auth.GET("/github", h.GitHubLogin)
		auth.GET("/github/callback", h.GitHubCallback)

		protected := auth.Group("")
		protected.Use(authMiddleware)
		{
			protected.GET("/google/connect", h.GoogleConnect)
			protected.GET("/github/connect", h.GitHubConnect)

			protected.GET("/me", h.Me)
			protected.POST("/logout", h.Logout)

			// Session management
			protected.GET("/sessions", h.ListSessions)
			protected.DELETE("/sessions", h.RevokeAllSessions)
			protected.DELETE("/sessions/:id", h.RevokeSession)
		}
	}
}
