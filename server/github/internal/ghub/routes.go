package ghub

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ModuleConfig holds all configuration needed to wire up the ghub module.
type ModuleConfig struct {
	GitHubAppCfg   GitHubAppCfg
	WebhookSecret  string
	EventPublisher EventPublisher
}

// RegisterRoutes wires up the ghub module: repo -> service -> handler -> routes.
func RegisterRoutes(r *gin.Engine, db *pgxpool.Pool, cfg ModuleConfig) {
	repo := NewRepository(db)
	gh := NewGitHubClient(cfg.GitHubAppCfg)
	svc := NewService(repo, gh, cfg.EventPublisher)
	h := NewHandler(svc, cfg.WebhookSecret)

	RegisterRoutesWithHandler(r, h)
}

// RegisterRoutesWithHandler mounts all HTTP routes.
func RegisterRoutesWithHandler(r *gin.Engine, h *Handler) {
	// Webhook (public, signature-verified internally)
	webhooks := r.Group("/webhooks")
	{
		webhooks.POST("/github", h.WebhookGitHub)
	}

	// Gateway-facing API (routed through API gateway)
	api := r.Group("/api")
	{
		api.GET("/installations", h.ListInstallations)
		api.GET("/installations/:installation_id/repos", h.ListRepos)
		api.POST("/installations/:installation_id/repos/sync", h.SyncRepos)

		api.GET("/repos", h.ListAllRepos)

		api.POST("/repos/:repo_id/link", h.LinkRepo)
		api.DELETE("/repos/:repo_id/link", h.UnlinkRepo)

		api.GET("/links", h.GetLinkByProject)
		api.DELETE("/links/:id", h.DeleteLink)
	}

	// Internal API (for build workers / service-to-service only, not gateway-exposed)
	internal := r.Group("/internal")
	{
		internal.GET("/repos/:repo_id/archive", h.GetRepoArchive)
		internal.GET("/repos/:repo_id/clone-url", h.GetRepoCloneURL)
	}
}
