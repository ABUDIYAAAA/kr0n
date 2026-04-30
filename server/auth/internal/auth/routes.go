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
	GitHubApp            GitHubAppConfig
}




func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool, cfg ModuleConfig) {
	repo := NewRepository(db)
	svc := NewService(repo, ServiceConfig{
		SessionTTL:           cfg.SessionTTL,
		EmailVerificationTTL: cfg.EmailVerificationTTL,
		EmailSender:          cfg.EmailSender,
	})

	h := NewHandler(svc, cfg.SessionCookie, cfg.GoogleOAuth, cfg.GitHubApp)

	authMiddleware := AuthMiddleware(svc, cfg.SessionCookie)
	optionalAuthMiddleware := OptionalAuthMiddleware(svc, cfg.SessionCookie)

	RegisterRoutesWithHandler(r, h, authMiddleware, optionalAuthMiddleware)
}

func RegisterRoutesWithHandler(r *gin.Engine, h *Handler, authMiddleware gin.HandlerFunc, optionalAuthMiddleware gin.HandlerFunc) {
	auth := r.Group("/auth")
	{
		auth.GET("/providers", optionalAuthMiddleware, h.Providers)
		auth.POST("/signup", h.Signup)
		auth.POST("/login", h.Login)
		auth.POST("/email/verify", h.VerifyEmail)
		auth.POST("/email/verification", h.RequestEmailVerification)

		auth.GET("/google", optionalAuthMiddleware, h.GoogleStart)
		auth.GET("/google/callback", h.GoogleCallback)


		protected := auth.Group("")
		protected.Use(authMiddleware)
		{

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

}
