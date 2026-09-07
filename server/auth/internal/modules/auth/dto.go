package auth

import "time"

// ==========================================
// Request DTOs
// ==========================================

// SignupRequest payload for standard email/password registration.
type SignupRequest struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Username string `json:"username" validate:"required,alphanum,min=3,max=30"`
	Password string `json:"password" validate:"required,min=8,max=100"`
}

// LoginRequest payload for authenticating with email or username and password.
type LoginRequest struct {
	Login    string `json:"login" validate:"required,min=3,max=255"` // Email or Username
	Password string `json:"password" validate:"required,min=8,max=100"`
}

// RefreshTokenRequest payload for manually refreshing token when not using cookies.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"omitempty"`
}

// UpdateUsernameRequest payload for changing an account username.
type UpdateUsernameRequest struct {
	Username string `json:"username" validate:"required,alphanum,min=3,max=30"`
}

// VerifyEmailRequest payload for confirming email with verification token.
type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required,min=32,max=128"`
}

// ResendVerificationRequest payload for triggering a new email verification token.
type ResendVerificationRequest struct {
	Email string `json:"email" validate:"required,email,max=255"`
}

// ForgotPasswordRequest payload for requesting password reset link via email.
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email,max=255"`
}

// ResetPasswordRequest payload for completing password reset with token.
type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required,min=32,max=128"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=100"`
}

// OAuthCallbackRequest payload for finalizing OAuth code exchange.
type OAuthCallbackRequest struct {
	Code  string `json:"code" validate:"required"`
	State string `json:"state" validate:"required"`
}

// ==========================================
// Response DTOs
// ==========================================

// UserResponse represents the public user data model returned in API responses.
type UserResponse struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	Username        string     `json:"username"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// AuthResponse represents successful authentication containing tokens and user data.
type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token,omitempty"`
	TokenType    string       `json:"token_type"`
	ExpiresIn    int64        `json:"expires_in"` // Access token TTL in seconds
}

// SessionResponse represents a user active session info.
type SessionResponse struct {
	ID           string    `json:"id"`
	DeviceID     string    `json:"device_id"`
	IPAddress    string    `json:"ip_address,omitempty"`
	UserAgent    string    `json:"user_agent,omitempty"`
	IsCurrent    bool      `json:"is_current"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// OAuthURLResponse contains generated provider authorization URL.
type OAuthURLResponse struct {
	URL   string `json:"url"`
	State string `json:"state"`
}
