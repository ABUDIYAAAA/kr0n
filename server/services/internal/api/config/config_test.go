package config

import (
	"testing"
)

func TestNewConfig(t *testing.T) {
	cfg, err := NewConfig()
	if err != nil {
		t.Fatalf("expected NewConfig to succeed, got %v", err)
	}

	if cfg.Port != "8083" {
		t.Errorf("expected default Port 8083, got %s", cfg.Port)
	}
	if cfg.KafkaServiceTopic != "service.events" {
		t.Errorf("expected default KafkaServiceTopic service.events, got %s", cfg.KafkaServiceTopic)
	}
}
