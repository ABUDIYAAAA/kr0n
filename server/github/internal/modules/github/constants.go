package github

const (
	ContextKeyUserID    = "user_id"
	ContextKeySessionID = "session_id"
	ContextKeyClaims    = "jwt_claims"
)

const (
	ErrCodeUnauthorized         = "UNAUTHORIZED"
	ErrCodeInvalidRequest       = "INVALID_REQUEST"
	ErrCodeValidationFailed     = "VALIDATION_FAILED"
	ErrCodeNotFound             = "NOT_FOUND"
	ErrCodeConflict             = "CONFLICT"
	ErrCodeInternalError        = "INTERNAL_SERVER_ERROR"
	ErrCodeGitHubAPIError       = "GITHUB_API_ERROR"
	ErrCodeInstallationRequired = "GITHUB_APP_NOT_INSTALLED"
)
