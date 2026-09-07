package response

import (
	"encoding/json"
	"log"
	"net/http"
)

// Response represents the standard envelope for all API responses.
type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   *Error `json:"error,omitempty"`
}

// Error represents the structured error detail block.
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

// PaginationMeta contains structural metadata for paginated collection responses.
type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalCount int64 `json:"total_count"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
}

// PaginatedResponse envelopes collection data alongside pagination metadata.
type PaginatedResponse struct {
	Success bool           `json:"success"`
	Message string         `json:"message,omitempty"`
	Data    any            `json:"data,omitempty"`
	Meta    PaginationMeta `json:"meta"`
}

// JSON sends a JSON response with the provided HTTP status code and payload.
func JSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)

	if payload == nil {
		return
	}

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("[ERROR] response: failed to encode JSON payload: %v", err)
	}
}

// Success sends a standardized 2xx success response.
func Success(w http.ResponseWriter, statusCode int, message string, data any) {
	res := Response{
		Success: true,
		Message: message,
		Data:    data,
	}
	JSON(w, statusCode, res)
}

// PaginatedSuccess sends a standardized 2xx success response with pagination metadata.
func PaginatedSuccess(w http.ResponseWriter, statusCode int, message string, data any, meta PaginationMeta) {
	res := PaginatedResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	}
	JSON(w, statusCode, res)
}

// ErrorResponse sends a standardized 4xx/5xx error response.
func ErrorResponse(w http.ResponseWriter, statusCode int, errorCode string, message string, details any) {
	res := Response{
		Success: false,
		Error: &Error{
			Code:    errorCode,
			Message: message,
			Details: details,
		},
	}
	JSON(w, statusCode, res)
}
