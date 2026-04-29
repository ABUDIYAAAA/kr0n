package auth

import (
	"time"

	"github.com/google/uuid"
)

type UserResponse struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	Name          *string   `json:"name,omitempty"`
	AvatarURL     *string   `json:"avatar_url,omitempty"`
	EmailVerified bool      `json:"email_verified"`
	CreatedAt     time.Time `json:"created_at"`
}

type ProviderStatus struct {
	Configured bool     `json:"configured"`
	Scopes     []string `json:"scopes,omitempty"`
}

type ProvidersResponse struct {
	Providers map[string]ProviderStatus `json:"providers"`
}

type SignupRequest struct {
	Email    string  `json:"email" binding:"required,email"`
	Password string  `json:"password" binding:"required"`
	Name     *string `json:"name,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type OAuthCallbackRequest struct {
	ProviderUserID string `json:"provider_user_id" binding:"required"`
	Email          string `json:"email" binding:"required,email"`
	EmailVerified  bool   `json:"email_verified"`
	Name           string `json:"name,omitempty"`
	AvatarURL      string `json:"avatar_url,omitempty"`
}

type CreateSessionRequest struct {
	UserID    uuid.UUID `json:"user_id"`
	Token     string    `json:"token"`
	UserAgent string    `json:"user_agent,omitempty"`
	IPAddress string    `json:"ip_address,omitempty"`
	ExpiresAt time.Time `json:"expires_at"`
}

type SessionResponse struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	UserAgent *string   `json:"user_agent,omitempty"`
	IPAddress *string   `json:"ip_address,omitempty"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UpdateUserSettingsRequest struct {
	Settings map[string]any `json:"settings" binding:"required"`
}

type UserSettingsResponse struct {
	UserID   uuid.UUID      `json:"user_id"`
	Settings map[string]any `json:"settings"`
}

type LoginResponse struct {
	User    UserResponse    `json:"user"`
	Session SessionResponse `json:"session"`
}

type SessionListResponse struct {
	Sessions []SessionResponse `json:"sessions"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

type MessageResponse struct {
	Message string `json:"message" example:"success message"`
}
