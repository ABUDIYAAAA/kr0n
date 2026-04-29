package auth

import (
	"time"

	"github.com/google/uuid"
)

type Base struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
	Base

	Email         string  `json:"email"`
	Name          *string `json:"name,omitempty"`
	AvatarURL     *string `json:"avatar_url,omitempty"`
	EmailVerified bool    `json:"email_verified"`

	OAuthAccounts []OAuthAccount `json:"-"`
	Sessions      []Session      `json:"-"`
	Settings      *UserSettings  `json:"settings,omitempty"`
}

type OAuthAccount struct {
	Base

	UserID         uuid.UUID `json:"user_id"`
	Provider       string    `json:"provider"`
	ProviderUserID string    `json:"provider_user_id"`

	AccessToken  *string    `json:"-"`
	RefreshToken *string    `json:"-"`
	IDToken      *string    `json:"-"`
	TokenType    string     `json:"token_type"`
	Scope        *string    `json:"scope,omitempty"`
	TokenExpiry  *time.Time `json:"token_expiry,omitempty"`

	User User `json:"-"`
}

type OAuthTokens struct {
	AccessToken  string
	RefreshToken *string
	IDToken      *string
	TokenType    string
	Scope        *string
	TokenExpiry  *time.Time
}

type Session struct {
	Base

	UserID    uuid.UUID `json:"user_id"`
	Token     string    `json:"-"`
	UserAgent *string   `json:"user_agent,omitempty"`
	IPAddress *string   `json:"ip_address,omitempty"`
	ExpiresAt time.Time `json:"expires_at"`

	User User `json:"-"`
}

type UserSettings struct {
	UserID uuid.UUID `json:"user_id"`

	Settings map[string]any `json:"settings"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User User `json:"-"`
}

type UserPassword struct {
	UserID uuid.UUID `json:"user_id"`
	Hash   string    `json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type EmailVerificationToken struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	TokenHash string     `json:"-"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
