package ghub

import "errors"

var (
	ErrNotFound              = errors.New("not found")
	ErrConflict              = errors.New("conflict")
	ErrInvalidInput          = errors.New("invalid input")
	ErrInstallationNotFound  = errors.New("installation not found")
	ErrRepositoryNotFound    = errors.New("repository not found")
	ErrLinkNotFound          = errors.New("project link not found")
	ErrLinkAlreadyExists     = errors.New("project already linked to a repository")
	ErrWebhookSignature      = errors.New("invalid webhook signature")
	ErrTokenGenerationFailed = errors.New("failed to generate installation token")
	ErrPrivateKeyNotLoaded   = errors.New("github app private key not loaded")
)
