package github

import (
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.kron.com/internal/api/config"
	"github.kron.com/pkg/response"
	"github.kron.com/pkg/validator"
)

type Handler struct {
	service Service
	cfg     *config.Config
}

func NewHandler(service Service, cfg *config.Config) *Handler {
	return &Handler{
		service: service,
		cfg:     cfg,
	}
}

// GetInstallationStatus checks if the user has installed the GitHub App.
// GET /api/v1/github/installation-status
func (h *Handler) GetInstallationStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	status, err := h.service.GetInstallationStatus(r.Context(), userID)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to check installation status", nil)
		return
	}

	response.Success(w, http.StatusOK, "Installation status retrieved", status)
}

// HandleInstallationCallback handles post-installation redirect or setup webhook.
// GET / POST /api/v1/github/installation/callback
func (h *Handler) HandleInstallationCallback(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	var req InstallationCallbackRequest
	instIDStr := r.URL.Query().Get("installation_id")
	if instIDStr != "" {
		instID, err := strconv.ParseInt(instIDStr, 10, 64)
		if err == nil {
			req.InstallationID = instID
		}
	} else {
		_, _ = validator.DecodeAndValidate(r, &req)
	}

	if req.InstallationID == 0 {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Missing installation_id parameter", nil)
		return
	}

	status, err := h.service.SaveInstallationCallback(r.Context(), userID, req)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to save installation", nil)
		return
	}

	response.Success(w, http.StatusOK, "GitHub App installed successfully", status)
}

// ListUserRepositories lists user repositories from GitHub REST API sorted by last_updated.
// GET /api/v1/github/repositories
func (h *Handler) ListUserRepositories(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	visibility := r.URL.Query().Get("visibility") // all, public, private

	repos, err := h.service.ListUserRepositories(r.Context(), userID, visibility)
	if err != nil {
		if err == ErrInstallationNotFound {
			response.ErrorResponse(w, http.StatusForbidden, ErrCodeInstallationRequired, "GitHub App must be installed to view repositories", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeGitHubAPIError, err.Error(), nil)
		return
	}

	response.Success(w, http.StatusOK, "User repositories retrieved", repos)
}

// TrackRepository adds a repository to deployment tracking.
// POST /api/v1/github/repositories/track
func (h *Handler) TrackRepository(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	var req TrackRepositoryRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, "Invalid request payload", fieldErrors)
		return
	}

	tracked, err := h.service.TrackRepository(r.Context(), userID, req)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to track repository", nil)
		return
	}

	response.Success(w, http.StatusCreated, "Repository tracked successfully for deployments", tracked)
}

// ListTrackedRepositories lists all user tracked repositories.
// GET /api/v1/github/repositories/tracked
func (h *Handler) ListTrackedRepositories(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	tracked, err := h.service.ListTrackedRepositories(r.Context(), userID)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, ErrCodeInternalError, "Failed to list tracked repositories", nil)
		return
	}

	response.Success(w, http.StatusOK, "Tracked repositories retrieved", tracked)
}

// UntrackRepository removes a repository from deployment tracking.
// DELETE /api/v1/github/repositories/track/{id}
func (h *Handler) UntrackRepository(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, ErrCodeUnauthorized, "Unauthorized", nil)
		return
	}

	repoID := chi.URLParam(r, "id")
	if repoID == "" {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidRequest, "Repository ID is required", nil)
		return
	}

	if err := h.service.UntrackRepository(r.Context(), userID, repoID); err != nil {
		response.ErrorResponse(w, http.StatusNotFound, ErrCodeNotFound, "Tracked repository not found", nil)
		return
	}

	response.Success(w, http.StatusOK, "Repository untracked successfully", nil)
}

// HandleWebhook receives and verifies GitHub Webhook events (e.g. push events).
// POST /api/v1/github/webhooks
func (h *Handler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	eventType := r.Header.Get("X-GitHub-Event")
	signatureHeader := r.Header.Get("X-Hub-Signature-256")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeInvalidRequest, "Failed to read webhook payload", nil)
		return
	}

	if err := h.service.HandleWebhookEvent(r.Context(), eventType, signatureHeader, body); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, ErrCodeValidationFailed, err.Error(), nil)
		return
	}

	response.Success(w, http.StatusOK, "Webhook event processed", nil)
}
