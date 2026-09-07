-- GitHub App Installations Table
CREATE TABLE IF NOT EXISTS github_installations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    installation_id BIGINT NOT NULL UNIQUE,
    account_login VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'User',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_github_installations_user_id ON github_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_github_installations_inst_id ON github_installations(installation_id);

-- User Tracked GitHub Repositories Table
CREATE TABLE IF NOT EXISTS github_tracked_repos (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    github_repo_id BIGINT NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    owner_login VARCHAR(255) NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    default_branch VARCHAR(255) NOT NULL DEFAULT 'main',
    html_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_repo UNIQUE (user_id, github_repo_id)
);

CREATE INDEX IF NOT EXISTS idx_github_tracked_repos_user_id ON github_tracked_repos(user_id);
CREATE INDEX IF NOT EXISTS idx_github_tracked_repos_repo_id ON github_tracked_repos(github_repo_id);
CREATE INDEX IF NOT EXISTS idx_github_tracked_repos_full_name ON github_tracked_repos(full_name);
