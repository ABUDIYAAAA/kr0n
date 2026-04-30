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

// ReadyResponse represents readiness state for the service.
type ReadyResponse struct {
	Status      string `json:"status" example:"ready"`
	Database    string `json:"database,omitempty" example:"ok"`
	Kafka       string `json:"kafka,omitempty" example:"ok"`
	SMTP        string `json:"smtp,omitempty" example:"ok"`
	TemplateDir string `json:"template_dir,omitempty" example:"templates"`
	Environment string `json:"environment,omitempty" example:"production"`
}
