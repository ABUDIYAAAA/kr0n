package auth

import "time"

// ContextKey is a custom typed key for HTTP request context to avoid key collisions.
type ContextKey string

const (
	// Request context keys
	ContextKeyUserID    ContextKey = "auth.user_id"
	ContextKeySessionID ContextKey = "auth.session_id"
	ContextKeyDeviceID  ContextKey = "auth.device_id"
	ContextKeyEmail     ContextKey = "auth.email"
	ContextKeyUsername  ContextKey = "auth.username"
	ContextKeyClaims    ContextKey = "auth.claims"
)

const (
	// Token Types
	TokenTypeAccess            = "access"
	TokenTypeRefresh           = "refresh"
	TokenTypeEmailVerification = "email_verification"
	TokenTypePasswordReset     = "password_reset"

	// Security Token Expirations
	EmailVerificationTokenTTL = 24 * time.Hour
	PasswordResetTokenTTL     = 1 * time.Hour

	// Permanent Device Cookie Lifetime (10 years)
	DeviceCookieMaxAge = 10 * 365 * 24 * 3600 // seconds (~10 years)

	// Redis Key Formats
	RedisKeyBlacklistToken   = "auth:blacklist:token:%s"
	RedisKeyBlacklistSession = "auth:blacklist:session:%s"
	RedisKeyBlacklistUser    = "auth:blacklist:user:%s"
	RedisKeyOAuthState       = "auth:oauth:state:%s"

	// Error Codes for Standard Error Responses
	ErrCodeInvalidRequest   = "INVALID_REQUEST"
	ErrCodeValidationFailed = "VALIDATION_FAILED"
	ErrCodeInvalidCreds     = "INVALID_CREDENTIALS"
	ErrCodeUserExists       = "USER_ALREADY_EXISTS"
	ErrCodeUsernameTaken    = "USERNAME_ALREADY_TAKEN"
	ErrCodeUserNotFound     = "USER_NOT_FOUND"
	ErrCodeUnauthorized     = "UNAUTHORIZED"
	ErrCodeForbidden        = "FORBIDDEN"
	ErrCodeTokenExpired     = "TOKEN_EXPIRED"
	ErrCodeTokenRevoked     = "TOKEN_REVOKED"
	ErrCodeInvalidToken     = "INVALID_SECURITY_TOKEN"
	ErrCodeEmailNotVerified = "EMAIL_NOT_VERIFIED"
	ErrCodeOAuthFailed      = "OAUTH_FAILED"
	ErrCodeInternalError    = "INTERNAL_SERVER_ERROR"
)
