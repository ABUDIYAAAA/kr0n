CREATE TABLE IF NOT EXISTS project_repo_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL,
    repo_id     UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    branch      TEXT NOT NULL DEFAULT 'main',
    auto_deploy BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_project_link UNIQUE(project_id)
);

CREATE INDEX idx_project_repo_links_repo_id ON project_repo_links(repo_id);
