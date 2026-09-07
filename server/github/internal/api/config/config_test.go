package config

import (
	"testing"
)

func TestNewConfig(t *testing.T) {
	cfg, err := NewConfig()
	if err != nil {
		t.Fatalf("expected NewConfig to succeed, got %v", err)
	}

	if cfg.Port == "" {
		t.Errorf("expected non-empty Port")
	}
	if cfg.KafkaServiceTopic != "service.events" {
		t.Errorf("expected KafkaServiceTopic service.events, got %s", cfg.KafkaServiceTopic)
	}
	if cfg.KafkaDeploymentTopic != "deployment.events" {
		t.Errorf("expected KafkaDeploymentTopic deployment.events, got %s", cfg.KafkaDeploymentTopic)
	}
}
