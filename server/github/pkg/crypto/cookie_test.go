package crypto

import (
	"testing"
)

func TestSignAndVerifyValue(t *testing.T) {
	secret := "secret_key_123"
	val := "cookie_value_xyz"

	signed := SignValue(val, secret)
	verified, err := VerifySignedValue(signed, secret)
	if err != nil {
		t.Fatalf("VerifySignedValue failed: %v", err)
	}
	if verified != val {
		t.Fatalf("expected %s, got %s", val, verified)
	}

	// Tampered value
	_, err = VerifySignedValue(signed+"tampered", secret)
	if err != ErrInvalidCookieSignature {
		t.Fatalf("expected ErrInvalidCookieSignature, got %v", err)
	}
}
