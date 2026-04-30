CREATE TABLE IF NOT EXISTS repositories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id BIGINT NOT NULL REFERENCES installations(installation_id) ON DELETE CASCADE,
    github_repo_id  BIGINT NOT NULL UNIQUE,
    owner           TEXT NOT NULL,
    name            TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    default_branch  TEXT NOT NULL DEFAULT 'main',
    private         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_repositories_installation_id ON repositories(installation_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
