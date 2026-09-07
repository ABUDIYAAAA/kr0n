CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    github_repo_id BIGINT NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    repo_full_name VARCHAR(255) NOT NULL,
    repo_owner VARCHAR(255) NOT NULL,
    branch VARCHAR(128) NOT NULL DEFAULT 'main',
    root_directory VARCHAR(512) NOT NULL DEFAULT './',
    build_command VARCHAR(512),
    install_command VARCHAR(512),
    run_command VARCHAR(512),
    output_directory VARCHAR(512),
    env_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
    health_status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_services_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_github_repo_id ON services(github_repo_id);

CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    payload BYTEA NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_created ON outbox_events(status, created_at);
