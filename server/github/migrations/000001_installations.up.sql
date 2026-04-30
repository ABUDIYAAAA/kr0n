CREATE TABLE IF NOT EXISTS installations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id BIGINT NOT NULL UNIQUE,
    account_login   TEXT NOT NULL,
    account_type    TEXT NOT NULL DEFAULT 'User',
    account_id      BIGINT NOT NULL,
    app_id          BIGINT NOT NULL,
    suspended       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installations_account_login ON installations(account_login);
CREATE INDEX idx_installations_account_id ON installations(account_id);
