package auth

import "errors"

var (
	ErrNotFound                 = errors.New("not found")
	ErrConflict                 = errors.New("conflict")
	ErrInvalidCredentials       = errors.New("invalid credentials")
	ErrEmailNotVerified         = errors.New("email not verified")
	ErrEmailDispatchFailed      = errors.New("email dispatch failed")
	ErrInvalidVerificationToken = errors.New("invalid verification token")
	ErrProviderAlreadyConnected = errors.New("provider already connected")
	ErrInvalidInput             = errors.New("invalid input")
)
