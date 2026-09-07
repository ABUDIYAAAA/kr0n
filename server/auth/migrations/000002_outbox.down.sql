-- ==========================================
-- 000002_outbox.down.sql: Revert Outbox Table
-- ==========================================

DROP TABLE IF EXISTS outbox_events;
