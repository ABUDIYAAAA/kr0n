-- ==========================================
-- 000001_auth.up.sql: Authentication & Sessions Schema
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

-- 1. Core Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. OAuth Providers (Extensible for Google, GitHub, Apple, etc.)
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    raw_claims JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

-- 3. Security Tokens (Email Verification, Password Reset)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_token_type') THEN
        CREATE TYPE security_token_type AS ENUM ('email_verification', 'password_reset');
    END IF;
END$$;

CREATE TABLE security_tokens (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    type security_token_type NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Sessions (Active sessions & Device Tracking)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(64) NOT NULL UNIQUE,
    device_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for Query Performance & Optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_tokens_lookup ON security_tokens(token_hash, type) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup ON user_sessions(session_token_hash) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_revoked, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(user_id, device_id);