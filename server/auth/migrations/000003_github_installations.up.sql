CREATE TABLE IF NOT EXISTS github_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    app_id BIGINT NOT NULL,
    installation_id BIGINT NOT NULL,
    repository_name TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_installation UNIQUE(user_id, installation_id, repository_name)
);

CREATE INDEX idx_github_installations_user_id ON github_installations(user_id);
CREATE INDEX idx_github_installations_installation_id ON github_installations(installation_id);
