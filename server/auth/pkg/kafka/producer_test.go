package kafka

import (
	"testing"
)

func TestNewProducer(t *testing.T) {
	p := NewProducer([]string{"localhost:9092"}, "test-topic")
	if p == nil {
		t.Fatalf("expected producer instance, got nil")
	}
	if p.topic != "test-topic" {
		t.Fatalf("expected topic 'test-topic', got '%s'", p.topic)
	}

	err := p.Close()
	if err != nil {
		t.Fatalf("expected clean close, got %v", err)
	}
}
