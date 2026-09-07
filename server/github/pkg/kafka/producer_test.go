package kafka

import (
	"testing"
)

func TestNewProducer(t *testing.T) {
	p := NewProducer([]string{"localhost:9092"}, "deployment.events")
	if p == nil {
		t.Fatalf("expected producer instance, got nil")
	}
	if p.topic != "deployment.events" {
		t.Fatalf("expected topic 'deployment.events', got '%s'", p.topic)
	}

	err := p.Close()
	if err != nil {
		t.Fatalf("expected clean close, got %v", err)
	}
}
