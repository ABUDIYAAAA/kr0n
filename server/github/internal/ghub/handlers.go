package ghub

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handler contains all HTTP handlers for the github module.
// Handlers are intentionally thin — all logic is in the service.
type Handler struct {
	svc           *Service
	webhookSecret string
}

// NewHandler creates a new handler with the given service and webhook secret.
func NewHandler(svc *Service, webhookSecret string) *Handler {
	return &Handler{
		svc:           svc,
		webhookSecret: webhookSecret,
	}
}

// --- Webhook ---

// WebhookGitHub godoc
// @Summary Handle GitHub webhook events
// @Description Receives and processes webhook events from GitHub (push, installation, etc.)
// @Tags webhooks
// @Accept json
// @Produce json
// @Success 200 {object} MessageResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /webhooks/github [post]
func (h *Handler) WebhookGitHub(c *gin.Context) {
	payload, err := ParseAndVerifyWebhook(c.Request, h.webhookSecret)
	if err != nil {
		if errors.Is(err, ErrWebhookSignature) {
			c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "invalid signature"})
			return
		}
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.svc.HandleWebhook(c.Request.Context(), payload); err != nil {
		log.Printf("error: webhook processing failed for %s/%s: %v", payload.EventType, payload.DeliveryID, err)
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "webhook processing failed"})
		return
	}

	c.JSON(http.StatusOK, MessageResponse{Message: "ok"})
}

// --- Installations ---

// ListInstallations godoc
// @Summary List all GitHub App installations
// @Description Returns all GitHub App installations tracked by this service
// @Tags installations
// @Produce json
// @Success 200 {array} InstallationResponse
// @Router /api/installations [get]
func (h *Handler) ListInstallations(c *gin.Context) {
	installations, err := h.svc.ListInstallations(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	out := make([]InstallationResponse, len(installations))
	for i, inst := range installations {
		out[i] = InstallationResponse{
			ID:             inst.ID,
			InstallationID: inst.InstallationID,
			AccountLogin:   inst.AccountLogin,
			AccountType:    inst.AccountType,
			Suspended:      inst.Suspended,
			CreatedAt:      inst.CreatedAt,
		}
	}
	c.JSON(http.StatusOK, out)
}

// --- Repositories ---

// ListRepos godoc
// @Summary List repositories for an installation
// @Description Returns all repositories associated with a GitHub App installation
// @Tags repositories
// @Produce json
// @Param installation_id path int true "GitHub Installation ID"
// @Success 200 {array} RepositoryResponse
// @Failure 400 {object} ErrorResponse
// @Router /api/installations/{installation_id}/repos [get]
func (h *Handler) ListRepos(c *gin.Context) {
	installationID, err := strconv.ParseInt(c.Param("installation_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid installation_id"})
		return
	}

	repos, err := h.svc.ListReposByInstallation(c.Request.Context(), installationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	out := make([]RepositoryResponse, len(repos))
	for i, repo := range repos {
		out[i] = toRepoResponse(repo)
	}
	c.JSON(http.StatusOK, out)
}

// SyncRepos godoc
// @Summary Sync repositories from GitHub
// @Description Fetches the latest repos from GitHub API and upserts them
// @Tags repositories
// @Produce json
// @Param installation_id path int true "GitHub Installation ID"
// @Success 200 {array} RepositoryResponse
// @Failure 400 {object} ErrorResponse
// @Router /api/installations/{installation_id}/repos/sync [post]
func (h *Handler) SyncRepos(c *gin.Context) {
	installationID, err := strconv.ParseInt(c.Param("installation_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid installation_id"})
		return
	}

	repos, err := h.svc.SyncInstallationRepos(c.Request.Context(), installationID)
	if err != nil {
		if errors.Is(err, ErrInstallationNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "installation not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	out := make([]RepositoryResponse, len(repos))
	for i, repo := range repos {
		out[i] = toRepoResponse(repo)
	}
	c.JSON(http.StatusOK, out)
}

// --- Project Linking ---

// LinkRepo godoc
// @Summary Link a repository to a project
// @Description Binds a repository to a deployment project for auto-deploy
// @Tags project-links
// @Accept json
// @Produce json
// @Param repo_id path string true "Repository UUID"
// @Param body body LinkRepoRequest true "Link configuration"
// @Success 201 {object} ProjectRepoLinkResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Router /api/repos/{repo_id}/link [post]
func (h *Handler) LinkRepo(c *gin.Context) {
	repoID, err := uuid.Parse(c.Param("repo_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid repo_id"})
		return
	}

	var req LinkRepoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	link, err := h.svc.LinkRepoToProject(c.Request.Context(), repoID, req)
	if err != nil {
		if errors.Is(err, ErrRepositoryNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "repository not found"})
			return
		}
		if errors.Is(err, ErrLinkAlreadyExists) {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "project already linked"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":          link.ID,
		"project_id":  link.ProjectID,
		"repo_id":     link.RepoID,
		"branch":      link.Branch,
		"auto_deploy": link.AutoDeploy,
		"created_at":  link.CreatedAt,
	})
}

// UnlinkRepo godoc
// @Summary Unlink a repository from its project
// @Description Removes the deployment binding for a repository
// @Tags project-links
// @Produce json
// @Param repo_id path string true "Repository UUID"
// @Success 200 {object} MessageResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/repos/{repo_id}/link [delete]
func (h *Handler) UnlinkRepo(c *gin.Context) {
	repoID, err := uuid.Parse(c.Param("repo_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid repo_id"})
		return
	}

	if err := h.svc.UnlinkRepo(c.Request.Context(), repoID); err != nil {
		if errors.Is(err, ErrLinkNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, MessageResponse{Message: "unlinked"})
}

// --- Repo Access (for Build Workers) ---

// GetRepoArchive godoc
// @Summary Get authenticated archive URL for a repository
// @Description Returns a signed archive URL and token for build workers
// @Tags repo-access
// @Produce json
// @Param repo_id path string true "Repository UUID"
// @Success 200 {object} RepoAccessResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/repos/{repo_id}/archive [get]
func (h *Handler) GetRepoArchive(c *gin.Context) {
	repoID, err := uuid.Parse(c.Param("repo_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid repo_id"})
		return
	}

	access, err := h.svc.GetRepoArchiveAccess(c.Request.Context(), repoID)
	if err != nil {
		if errors.Is(err, ErrRepositoryNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "repository not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, access)
}

// GetRepoCloneURL godoc
// @Summary Get authenticated clone URL for a repository
// @Description Returns an authenticated clone URL and token for build workers
// @Tags repo-access
// @Produce json
// @Param repo_id path string true "Repository UUID"
// @Success 200 {object} RepoAccessResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/repos/{repo_id}/clone-url [get]
func (h *Handler) GetRepoCloneURL(c *gin.Context) {
	repoID, err := uuid.Parse(c.Param("repo_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid repo_id"})
		return
	}

	access, err := h.svc.GetRepoCloneAccess(c.Request.Context(), repoID)
	if err != nil {
		if errors.Is(err, ErrRepositoryNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "repository not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, access)
}

// --- Links ---

// GetLinkByProject godoc
// @Summary Get the repository link for a project
// @Description Returns the repository link configuration for a given project ID
// @Tags project-links
// @Produce json
// @Param project_id query string true "Project UUID"
// @Success 200 {object} ProjectRepoLinkResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/links [get]
func (h *Handler) GetLinkByProject(c *gin.Context) {
	projectIDStr := c.Query("project_id")
	if projectIDStr == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "project_id query parameter required"})
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid project_id"})
		return
	}

	link, err := h.svc.GetLinkByProjectID(c.Request.Context(), projectID)
	if err != nil {
		if errors.Is(err, ErrLinkNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	repo, err := h.svc.repo.GetRepoByID(c.Request.Context(), link.RepoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ProjectRepoLinkResponse{
		ID:         link.ID,
		ProjectID:  link.ProjectID,
		Branch:     link.Branch,
		AutoDeploy: link.AutoDeploy,
		Repo:       toRepoResponse(*repo),
		CreatedAt:  link.CreatedAt,
	})
}

// DeleteLink godoc
// @Summary Delete a project-repo link by ID
// @Description Removes a specific project-repo link
// @Tags project-links
// @Produce json
// @Param id path string true "Link UUID"
// @Success 200 {object} MessageResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/links/{id} [delete]
func (h *Handler) DeleteLink(c *gin.Context) {
	linkID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid link id"})
		return
	}

	if err := h.svc.DeleteLinkByID(c.Request.Context(), linkID); err != nil {
		if errors.Is(err, ErrLinkNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, MessageResponse{Message: "link deleted"})
}

// --- Repos (top-level) ---

// ListAllRepos godoc
// @Summary List all repositories
// @Description Returns all tracked repositories, optionally filtered by installation_id
// @Tags repositories
// @Produce json
// @Param installation_id query int false "Filter by installation ID"
// @Success 200 {array} RepositoryResponse
// @Router /api/repos [get]
func (h *Handler) ListAllRepos(c *gin.Context) {
	var installationID *int64

	if idStr := c.Query("installation_id"); idStr != "" {
		parsed, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid installation_id"})
			return
		}
		installationID = &parsed
	}

	repos, err := h.svc.ListAllRepos(c.Request.Context(), installationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	out := make([]RepositoryResponse, len(repos))
	for i, repo := range repos {
		out[i] = toRepoResponse(repo)
	}
	c.JSON(http.StatusOK, out)
}

// --- Mappers ---

func toRepoResponse(repo Repo) RepositoryResponse {
	return RepositoryResponse{
		ID:             repo.ID,
		InstallationID: repo.InstallationID,
		GitHubRepoID:   repo.GitHubRepoID,
		Owner:          repo.Owner,
		Name:           repo.Name,
		FullName:       repo.FullName,
		DefaultBranch:  repo.DefaultBranch,
		Private:        repo.Private,
		CreatedAt:      repo.CreatedAt,
	}
}
