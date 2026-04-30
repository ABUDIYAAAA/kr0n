package auth

import "errors"

var (
	ErrNotFound                       = errors.New("not found")
	ErrConflict                       = errors.New("conflict")
	ErrInvalidCredentials             = errors.New("invalid credentials")
	ErrEmailNotVerified               = errors.New("email not verified")
	ErrEmailDispatchFailed            = errors.New("email dispatch failed")
	ErrInvalidVerificationToken       = errors.New("invalid verification token")
	ErrProviderAlreadyConnected       = errors.New("provider already connected")
	ErrInvalidInput                   = errors.New("invalid input")
	ErrInvalidEmail                   = errors.New("invalid email")
	ErrPasswordTooShort               = errors.New("password must be at least 10 characters")
	ErrPasswordTooLong                = errors.New("password must not exceed 128 characters")
	ErrPasswordNeedsLettersAndNumbers = errors.New("password must contain both letters and numbers")
	ErrInvalidResetToken              = errors.New("invalid or expired reset token")
	ErrNoPasswordAccount              = errors.New("account does not use password authentication")
)
