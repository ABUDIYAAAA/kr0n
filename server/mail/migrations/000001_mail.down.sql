-- ==========================================
-- 000001_mail.down.sql: Revert Mail Tables
-- ==========================================

DROP TABLE IF EXISTS processed_events;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS email_templates;
