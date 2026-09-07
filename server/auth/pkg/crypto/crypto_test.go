package crypto

import (
	"testing"
)

func TestHashPasswordAndCompare(t *testing.T) {
	password := "SecurePassword123!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("expected no error hashing password, got %v", err)
	}

	if hash == password {
		t.Fatalf("hashed password should not equal plaintext password")
	}

	// Correct password comparison
	if !ComparePassword(hash, password) {
		t.Fatalf("expected ComparePassword to return true for matching password")
	}

	// Incorrect password comparison
	if ComparePassword(hash, "WrongPassword123!") {
		t.Fatalf("expected ComparePassword to return false for mismatched password")
	}
}

func TestGenerateRandomToken(t *testing.T) {
	token1, err := GenerateRandomToken(32)
	if err != nil {
		t.Fatalf("unexpected error generating random token: %v", err)
	}

	token2, err := GenerateRandomToken(32)
	if err != nil {
		t.Fatalf("unexpected error generating random token: %v", err)
	}

	if len(token1) != 64 { // Hex encoding doubles byte length (32 bytes = 64 hex chars)
		t.Fatalf("expected hex token length 64, got %d", len(token1))
	}

	if token1 == token2 {
		t.Fatalf("random tokens must be unique")
	}
}

func TestHashTokenSHA256(t *testing.T) {
	input := "verification_token_sample"
	hash1 := HashTokenSHA256(input)
	hash2 := HashTokenSHA256(input)

	if hash1 != hash2 {
		t.Fatalf("expected deterministic SHA256 hashes to match")
	}

	if len(hash1) != 64 {
		t.Fatalf("expected SHA256 hex string length 64, got %d", len(hash1))
	}
}
