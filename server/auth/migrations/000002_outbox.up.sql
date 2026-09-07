-- ==========================================
-- 000002_outbox.up.sql: Transactional Outbox Pattern Schema
-- ==========================================

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Index for background outbox worker polling
CREATE INDEX IF NOT EXISTS idx_outbox_events_pending ON outbox_events(status, created_at) WHERE status = 'PENDING';
