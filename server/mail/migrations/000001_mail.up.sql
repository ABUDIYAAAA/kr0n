-- ==========================================
-- 000001_mail.up.sql: Mail Audit, Templates & Idempotency Schema
-- ==========================================

-- Enable pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function: uuidv7 generation for Postgres (RFC 9562 compatible UUIDv7)
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
DECLARE
    v_time timestamp with time zone := clock_timestamp();
    v_unix_time bigint := FLOOR(EXTRACT(EPOCH FROM v_time) * 1000);
    v_rand bytea := gen_random_bytes(10);
    v_hex text;
BEGIN
    v_hex := LPAD(TO_HEX(v_unix_time), 12, '0') ||
             '7' || SUBSTRING(ENCODE(v_rand, 'hex') FROM 1 FOR 3) ||
             '8' || SUBSTRING(ENCODE(v_rand, 'hex') FROM 4 FOR 3) ||
             SUBSTRING(ENCODE(v_rand, 'hex') FROM 7 FOR 12);
    RETURN v_hex::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 1. Dynamic Email Templates Table
CREATE TABLE email_templates (
    id VARCHAR(100) PRIMARY KEY,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Email Logs Table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    event_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    template_id VARCHAR(100),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- 3. Processed Events Table (Idempotency Key Store)
CREATE TABLE processed_events (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255),
    event_type VARCHAR(100),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(LOWER(to_email));
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON email_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
