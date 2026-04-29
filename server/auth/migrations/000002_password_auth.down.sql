-- Drop triggers
DROP TRIGGER IF EXISTS update_email_verification_tokens_updated_at ON email_verification_tokens;
DROP TRIGGER IF EXISTS update_user_passwords_updated_at ON user_passwords;

-- Drop indexes
DROP INDEX IF EXISTS uq_oauth_accounts_user_provider;
DROP INDEX IF EXISTS idx_email_verification_tokens_expires_at;
DROP INDEX IF EXISTS idx_email_verification_tokens_user_id;

-- Drop tables
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS user_passwords;

-- Restore default for email_verified
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT true;
