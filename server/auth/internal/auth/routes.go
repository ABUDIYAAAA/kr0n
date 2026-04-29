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
	GitHubWebhookSecret  string
}

func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool, cfg ModuleConfig) {
	repo := NewRepository(db)
	svc := NewService(repo, ServiceConfig{
		SessionTTL:           cfg.SessionTTL,
		EmailVerificationTTL: cfg.EmailVerificationTTL,
		EmailSender:          cfg.EmailSender,
	})

	h := NewHandler(svc, cfg.SessionCookie, cfg.GoogleOAuth, cfg.GitHubOAuth, cfg.GitHubWebhookSecret)
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
			protected.POST("/refresh", h.Refresh)
			protected.POST("/logout", h.Logout)

			// Session management
			protected.GET("/sessions", h.ListSessions)
			protected.DELETE("/sessions", h.RevokeAllSessions)
			protected.DELETE("/sessions/:id", h.RevokeSession)

			// GitHub App management
			protected.GET("/github/install", h.GitHubInstall)
			protected.GET("/github/app/callback", h.GitHubAppCallback)
			protected.GET("/github/installations", h.GitHubInstallations)
		}
	}

	// Webhook routes (public, no auth)
	webhooks := r.Group("/webhooks")
	{
		webhooks.POST("/github", h.WebhookGitHub)
	}
}
