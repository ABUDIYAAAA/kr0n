package health

// HealthResponse represents API liveness.
type HealthResponse struct {
	Status string `json:"status" example:"ok"`
}

// DBCheckResponse represents database connectivity status.
type DBCheckResponse struct {
	Status string `json:"status" example:"db ok"`
	Error  string `json:"error,omitempty" example:"dial tcp 127.0.0.1:5432: connect: connection refused"`
}
