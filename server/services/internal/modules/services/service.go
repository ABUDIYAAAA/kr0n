package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"services.kron.com/internal/api/config"
	"services.kron.com/pkg/response"
)

type CreateServiceRequest struct {
	GitHubRepoID    int64             `json:"github_repo_id" validate:"required"`
	RepoName        string            `json:"repo_name" validate:"required"`
	RepoFullName    string            `json:"repo_full_name" validate:"required"`
	RepoOwner       string            `json:"repo_owner" validate:"required"`
	Name            string            `json:"name"`
	Branch          string            `json:"branch"`
	RootDirectory   string            `json:"root_directory"`
	BuildCommand    *string           `json:"build_command"`
	InstallCommand  *string           `json:"install_command"`
	RunCommand      *string           `json:"run_command"`
	OutputDirectory *string           `json:"output_directory"`
	EnvVariables    map[string]string `json:"env_variables"`
}

type UpdateServiceRequest struct {
	Branch          string            `json:"branch"`
	RootDirectory   string            `json:"root_directory"`
	BuildCommand    *string           `json:"build_command"`
	InstallCommand  *string           `json:"install_command"`
	RunCommand      *string           `json:"run_command"`
	OutputDirectory *string           `json:"output_directory"`
	EnvVariables    map[string]string `json:"env_variables"`
}

type ServiceResponse struct {
	ID              string            `json:"id"`
	UserID          string            `json:"user_id"`
	Name            string            `json:"name"`
	GitHubRepoID    int64             `json:"github_repo_id"`
	RepoName        string            `json:"repo_name"`
	RepoFullName    string            `json:"repo_full_name"`
	RepoOwner       string            `json:"repo_owner"`
	Branch          string            `json:"branch"`
	RootDirectory   string            `json:"root_directory"`
	BuildCommand    *string           `json:"build_command,omitempty"`
	InstallCommand  *string           `json:"install_command,omitempty"`
	RunCommand      *string           `json:"run_command,omitempty"`
	OutputDirectory *string           `json:"output_directory,omitempty"`
	EnvVariables    map[string]string `json:"env_variables"`
	Status          string            `json:"status"`
	HealthStatus    string            `json:"health_status"`
	CreatedAt       string            `json:"created_at"`
	UpdatedAt       string            `json:"updated_at"`
}

type SuggestNameResponse struct {
	SuggestedName string `json:"suggested_name"`
}

type Service interface {
	CreateService(ctx context.Context, userID string, req CreateServiceRequest) (*ServiceResponse, error)
	GetServiceByID(ctx context.Context, userID, serviceID string) (*ServiceResponse, error)
	ListUserServices(ctx context.Context, userID string, page, limit int) ([]ServiceResponse, response.PaginationMeta, error)
	UpdateService(ctx context.Context, userID, serviceID string, req UpdateServiceRequest) (*ServiceResponse, error)
	DeleteService(ctx context.Context, userID, serviceID string) error
	SuggestServiceName(ctx context.Context, userID, repoName string) (*SuggestNameResponse, error)
}

type serviceImpl struct {
	repo Repository
	cfg  *config.Config
}

func NewService(repo Repository, cfg *config.Config) Service {
	return &serviceImpl{
		repo: repo,
		cfg:  cfg,
	}
}

func (s *serviceImpl) CreateService(ctx context.Context, userID string, req CreateServiceRequest) (*ServiceResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name != "" {
		name = sanitizeName(name)
	}
	if name == "" {
		suggested, err := s.SuggestServiceName(ctx, userID, req.RepoName)
		if err != nil {
			return nil, err
		}
		name = suggested.SuggestedName
	}

	branch := strings.TrimSpace(req.Branch)
	if branch == "" {
		branch = "main"
	}

	rootDir := strings.TrimSpace(req.RootDirectory)
	if rootDir == "" {
		rootDir = "./"
	}

	if req.EnvVariables == nil {
		req.EnvVariables = make(map[string]string)
	}

	entity := &ServiceEntity{
		UserID:          userID,
		Name:            name,
		GitHubRepoID:    req.GitHubRepoID,
		RepoName:        req.RepoName,
		RepoFullName:    req.RepoFullName,
		RepoOwner:       req.RepoOwner,
		Branch:          branch,
		RootDirectory:   rootDir,
		BuildCommand:    req.BuildCommand,
		InstallCommand:  req.InstallCommand,
		RunCommand:      req.RunCommand,
		OutputDirectory: req.OutputDirectory,
		EnvVariables:    req.EnvVariables,
		Status:          "CREATED",
		HealthStatus:    "UNKNOWN",
		Config:          make(map[string]any),
	}

	var createdEntity *ServiceEntity
	err := s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		if err := s.repo.CreateServiceTx(ctx, tx, entity); err != nil {
			return err
		}
		createdEntity = entity

		// Create Outbox Event to setup watch in GitHub service
		payloadMap := map[string]any{
			"event_id":       uuid.NewString(),
			"event_type":     "SERVICE_CREATED",
			"service_id":     entity.ID,
			"user_id":        entity.UserID,
			"github_repo_id": entity.GitHubRepoID,
			"repo_name":      entity.RepoName,
			"repo_full_name": entity.RepoFullName,
			"owner_login":    entity.RepoOwner,
			"branch":         entity.Branch,
		}
		payloadBytes, _ := json.Marshal(payloadMap)

		outboxEvt := &OutboxEvent{
			EventType:      "SERVICE_CREATED",
			Payload:        payloadBytes,
			IdempotencyKey: fmt.Sprintf("service_created:%s", entity.ID),
		}

		return s.repo.InsertOutboxEventTx(ctx, tx, outboxEvt)
	})

	if err != nil {
		return nil, err
	}

	return toServiceResponse(createdEntity), nil
}

func (s *serviceImpl) GetServiceByID(ctx context.Context, userID, serviceID string) (*ServiceResponse, error) {
	svc, err := s.repo.GetServiceByID(ctx, serviceID)
	if err != nil {
		return nil, err
	}

	if svc.UserID != userID {
		return nil, ErrNotFound
	}

	return toServiceResponse(svc), nil
}

func (s *serviceImpl) ListUserServices(ctx context.Context, userID string, page, limit int) ([]ServiceResponse, response.PaginationMeta, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	list, totalCount, err := s.repo.ListServicesByUserID(ctx, userID, page, limit)
	if err != nil {
		return nil, response.PaginationMeta{}, err
	}

	result := make([]ServiceResponse, 0, len(list))
	for _, item := range list {
		result = append(result, *toServiceResponse(&item))
	}

	totalPages := 0
	if limit > 0 {
		totalPages = int((totalCount + int64(limit) - 1) / int64(limit))
	}
	meta := response.PaginationMeta{
		Page:       page,
		Limit:      limit,
		TotalCount: totalCount,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
	}

	return result, meta, nil
}

func (s *serviceImpl) UpdateService(ctx context.Context, userID, serviceID string, req UpdateServiceRequest) (*ServiceResponse, error) {
	svc, err := s.repo.GetServiceByID(ctx, serviceID)
	if err != nil {
		return nil, err
	}

	if svc.UserID != userID {
		return nil, ErrNotFound
	}

	if req.Branch != "" {
		svc.Branch = strings.TrimSpace(req.Branch)
	}
	if req.RootDirectory != "" {
		svc.RootDirectory = strings.TrimSpace(req.RootDirectory)
	}
	if req.BuildCommand != nil {
		svc.BuildCommand = req.BuildCommand
	}
	if req.InstallCommand != nil {
		svc.InstallCommand = req.InstallCommand
	}
	if req.RunCommand != nil {
		svc.RunCommand = req.RunCommand
	}
	if req.OutputDirectory != nil {
		svc.OutputDirectory = req.OutputDirectory
	}
	if req.EnvVariables != nil {
		svc.EnvVariables = req.EnvVariables
	}

	err = s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		if err := s.repo.UpdateService(ctx, svc); err != nil {
			return err
		}

		payloadMap := map[string]any{
			"event_id":       uuid.NewString(),
			"event_type":     "SERVICE_UPDATED",
			"service_id":     svc.ID,
			"user_id":        svc.UserID,
			"github_repo_id": svc.GitHubRepoID,
			"branch":         svc.Branch,
		}
		payloadBytes, _ := json.Marshal(payloadMap)

		outboxEvt := &OutboxEvent{
			EventType:      "SERVICE_UPDATED",
			Payload:        payloadBytes,
			IdempotencyKey: fmt.Sprintf("service_updated:%s:%d", svc.ID, svc.UpdatedAt.UnixNano()),
		}

		return s.repo.InsertOutboxEventTx(ctx, tx, outboxEvt)
	})

	if err != nil {
		return nil, err
	}

	return toServiceResponse(svc), nil
}

func (s *serviceImpl) DeleteService(ctx context.Context, userID, serviceID string) error {
	svc, err := s.repo.GetServiceByID(ctx, serviceID)
	if err != nil {
		return err
	}

	if svc.UserID != userID {
		return ErrNotFound
	}

	return s.repo.WithTx(ctx, func(tx pgx.Tx) error {
		if err := s.repo.DeleteService(ctx, serviceID, userID); err != nil {
			return err
		}

		payloadMap := map[string]any{
			"event_id":       uuid.NewString(),
			"event_type":     "SERVICE_DELETED",
			"service_id":     svc.ID,
			"user_id":        svc.UserID,
			"github_repo_id": svc.GitHubRepoID,
		}
		payloadBytes, _ := json.Marshal(payloadMap)

		outboxEvt := &OutboxEvent{
			EventType:      "SERVICE_DELETED",
			Payload:        payloadBytes,
			IdempotencyKey: fmt.Sprintf("service_deleted:%s", svc.ID),
		}

		return s.repo.InsertOutboxEventTx(ctx, tx, outboxEvt)
	})
}

func (s *serviceImpl) SuggestServiceName(ctx context.Context, userID, repoName string) (*SuggestNameResponse, error) {
	baseName := sanitizeName(repoName)
	if baseName == "" {
		baseName = "app"
	}

	candidate := baseName
	existing, err := s.repo.GetServiceByUserIDAndName(ctx, userID, candidate)
	if err != nil && err != ErrNotFound {
		return nil, err
	}

	if existing == nil {
		return &SuggestNameResponse{SuggestedName: candidate}, nil
	}

	// Collision detected - append random 4-char suffix
	randomSuffix := generateRandomHex(2)
	candidate = fmt.Sprintf("%s-%s", baseName, randomSuffix)

	return &SuggestNameResponse{SuggestedName: candidate}, nil
}

func sanitizeName(name string) string {
	name = strings.ToLower(strings.TrimSpace(name))
	re := regexp.MustCompile(`[^a-z0-9\-]+`)
	name = re.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-")
	return name
}

func generateRandomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func toServiceResponse(e *ServiceEntity) *ServiceResponse {
	if e == nil {
		return nil
	}

	return &ServiceResponse{
		ID:              e.ID,
		UserID:          e.UserID,
		Name:            e.Name,
		GitHubRepoID:    e.GitHubRepoID,
		RepoName:        e.RepoName,
		RepoFullName:    e.RepoFullName,
		RepoOwner:       e.RepoOwner,
		Branch:          e.Branch,
		RootDirectory:   e.RootDirectory,
		BuildCommand:    e.BuildCommand,
		InstallCommand:  e.InstallCommand,
		RunCommand:      e.RunCommand,
		OutputDirectory: e.OutputDirectory,
		EnvVariables:    e.EnvVariables,
		Status:          e.Status,
		HealthStatus:    e.HealthStatus,
		CreatedAt:       e.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:       e.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
