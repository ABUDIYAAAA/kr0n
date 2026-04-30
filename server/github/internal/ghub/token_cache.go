package ghub

import (
	"sync"
	"time"
)

// tokenEntry holds a cached installation access token.
type tokenEntry struct {
	Token     string
	ExpiresAt time.Time
}

// TokenCache provides thread-safe in-memory caching of GitHub installation tokens.
// Tokens are valid for ~60 minutes; we consider them stale after (expiry - margin).
type TokenCache struct {
	mu      sync.RWMutex
	entries map[int64]tokenEntry
	margin  time.Duration
}

// NewTokenCache creates a new token cache with a safety margin before expiry.
func NewTokenCache() *TokenCache {
	return &TokenCache{
		entries: make(map[int64]tokenEntry),
		margin:  10 * time.Minute,
	}
}

// Get returns a cached token and its expiry if it exists and hasn't expired (with margin).
func (c *TokenCache) Get(installationID int64) (string, time.Time, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.entries[installationID]
	if !ok {
		return "", time.Time{}, false
	}

	if time.Now().After(entry.ExpiresAt.Add(-c.margin)) {
		return "", time.Time{}, false
	}

	return entry.Token, entry.ExpiresAt, true
}

// Set stores a token in the cache.
func (c *TokenCache) Set(installationID int64, token string, expiresAt time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[installationID] = tokenEntry{
		Token:     token,
		ExpiresAt: expiresAt,
	}
}

// Evict removes a token from the cache.
func (c *TokenCache) Evict(installationID int64) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.entries, installationID)
}

// Sweep removes all expired entries from the cache. Safe to call periodically
// from a background goroutine to prevent unbounded growth.
func (c *TokenCache) Sweep() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for id, entry := range c.entries {
		if now.After(entry.ExpiresAt) {
			delete(c.entries, id)
		}
	}
}
