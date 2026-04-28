package utils

import (
	"errors"
	"net/http"
)

type ErrorKind string

const (
	ErrKindInvalid      ErrorKind = "invalid"
	ErrKindUnauthorized ErrorKind = "unauthorized"
	ErrKindForbidden    ErrorKind = "forbidden"
	ErrKindNotFound     ErrorKind = "not_found"
	ErrKindConflict     ErrorKind = "conflict"
)

type AppError struct {
	Kind    ErrorKind
	Message string
}

func (e *AppError) Error() string {
	return e.Message
}

func ErrInvalid(message string) error {
	return &AppError{Kind: ErrKindInvalid, Message: message}
}

func ErrUnauthorized(message string) error {
	return &AppError{Kind: ErrKindUnauthorized, Message: message}
}

func ErrForbidden(message string) error {
	return &AppError{Kind: ErrKindForbidden, Message: message}
}

func ErrNotFound(message string) error {
	return &AppError{Kind: ErrKindNotFound, Message: message}
}

func ErrConflict(message string) error {
	return &AppError{Kind: ErrKindConflict, Message: message}
}

func AsAppError(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}

func StatusCodeForError(err error) int {
	appErr, ok := AsAppError(err)
	if !ok {
		return http.StatusInternalServerError
	}

	switch appErr.Kind {
	case ErrKindInvalid:
		return http.StatusBadRequest
	case ErrKindUnauthorized:
		return http.StatusUnauthorized
	case ErrKindForbidden:
		return http.StatusForbidden
	case ErrKindNotFound:
		return http.StatusNotFound
	case ErrKindConflict:
		return http.StatusConflict
	default:
		return http.StatusInternalServerError
	}
}
