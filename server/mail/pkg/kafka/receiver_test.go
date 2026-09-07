package kafka

import (
	"testing"
)

func TestNewReceiver(t *testing.T) {
	r := NewReceiver([]string{"localhost:9092"}, "mail-events", "mail-group")
	if r == nil {
		t.Fatalf("expected non-nil Receiver")
	}
	if r.topic != "mail-events" || r.groupID != "mail-group" {
		t.Fatalf("unexpected receiver topic or groupID: topic=%s group=%s", r.topic, r.groupID)
	}

	// Close clean check
	_ = r.Close()
}
