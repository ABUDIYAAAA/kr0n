package response

import (
	"encoding/json"
	"log"
	"net/http"
)

type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   *Error `json:"error,omitempty"`
}

type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalCount int64 `json:"total_count"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
}

type PaginatedResponse struct {
	Success bool           `json:"success"`
	Message string         `json:"message,omitempty"`
	Data    any            `json:"data,omitempty"`
	Meta    PaginationMeta `json:"meta"`
}

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

func Success(w http.ResponseWriter, statusCode int, message string, data any) {
	res := Response{
		Success: true,
		Message: message,
		Data:    data,
	}
	JSON(w, statusCode, res)
}

func PaginatedSuccess(w http.ResponseWriter, statusCode int, message string, data any, meta PaginationMeta) {
	res := PaginatedResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	}
	JSON(w, statusCode, res)
}

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
