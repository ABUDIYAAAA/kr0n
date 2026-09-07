package services

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"services.kron.com/internal/api/config"
	"services.kron.com/internal/api/middleware"
	"services.kron.com/pkg/response"
	"services.kron.com/pkg/validator"
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

// CreateService handles service project creation.
// POST /api/v1/services
func (h *Handler) CreateService(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	var req CreateServiceRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid request payload", fieldErrors)
		return
	}

	created, err := h.service.CreateService(r.Context(), userID, req)
	if err != nil {
		if errors.Is(err, ErrConflict) {
			response.ErrorResponse(w, http.StatusConflict, "SERVICE_NAME_TAKEN", "A service with this name already exists", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create service", nil)
		return
	}

	response.Success(w, http.StatusCreated, "Service created successfully", created)
}

// GetServiceByID returns detailed service configuration.
// GET /api/v1/services/{id}
func (h *Handler) GetServiceByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	serviceID := chi.URLParam(r, "id")
	if serviceID == "" {
		response.ErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Service ID is required", nil)
		return
	}

	svc, err := h.service.GetServiceByID(r.Context(), userID, serviceID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.ErrorResponse(w, http.StatusNotFound, "NOT_FOUND", "Service not found", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get service", nil)
		return
	}

	response.Success(w, http.StatusOK, "Service retrieved successfully", svc)
}

// ListUserServices lists user services with pagination.
// GET /api/v1/services?page=1&limit=10
func (h *Handler) ListUserServices(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 10
	}

	list, meta, err := h.service.ListUserServices(r.Context(), userID, page, limit)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list services", nil)
		return
	}

	response.PaginatedSuccess(w, http.StatusOK, "User services retrieved", list, meta)
}

// UpdateService updates service configuration.
// PATCH /api/v1/services/{id}
func (h *Handler) UpdateService(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	serviceID := chi.URLParam(r, "id")
	if serviceID == "" {
		response.ErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Service ID is required", nil)
		return
	}

	var req UpdateServiceRequest
	if fieldErrors, err := validator.DecodeAndValidate(r, &req); err != nil {
		response.ErrorResponse(w, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid request payload", fieldErrors)
		return
	}

	updated, err := h.service.UpdateService(r.Context(), userID, serviceID, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.ErrorResponse(w, http.StatusNotFound, "NOT_FOUND", "Service not found", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update service", nil)
		return
	}

	response.Success(w, http.StatusOK, "Service updated successfully", updated)
}

// DeleteService removes a service project.
// DELETE /api/v1/services/{id}
func (h *Handler) DeleteService(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	serviceID := chi.URLParam(r, "id")
	if serviceID == "" {
		response.ErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "Service ID is required", nil)
		return
	}

	if err := h.service.DeleteService(r.Context(), userID, serviceID); err != nil {
		if errors.Is(err, ErrNotFound) {
			response.ErrorResponse(w, http.StatusNotFound, "NOT_FOUND", "Service not found", nil)
			return
		}
		response.ErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete service", nil)
		return
	}

	response.Success(w, http.StatusOK, "Service deleted successfully", nil)
}

// SuggestServiceName auto-generates a unique service name based on repo name.
// GET /api/v1/services/suggest-name?repo_name=xxx
func (h *Handler) SuggestServiceName(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.ContextKeyUserID).(string)
	if !ok || userID == "" {
		response.ErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	repoName := r.URL.Query().Get("repo_name")
	if repoName == "" {
		response.ErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", "repo_name query parameter is required", nil)
		return
	}

	suggested, err := h.service.SuggestServiceName(r.Context(), userID, repoName)
	if err != nil {
		response.ErrorResponse(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to suggest service name", nil)
		return
	}

	response.Success(w, http.StatusOK, "Service name suggested", suggested)
}
