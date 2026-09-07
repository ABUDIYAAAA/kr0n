-- ==========================================
-- 000001_auth.down.sql: Revert Auth Schema
-- ==========================================

-- 1. Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS security_tokens CASCADE;
DROP TABLE IF EXISTS oauth_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop custom ENUM types
DROP TYPE IF EXISTS security_token_type;

-- 3. Drop helper functions
DROP FUNCTION IF EXISTS uuidv7();
