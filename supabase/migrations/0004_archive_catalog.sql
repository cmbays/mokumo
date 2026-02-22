-- Archive old denormalized catalog table (Approach C Wave 5)
-- All reads/writes now use the normalized catalog_* tables.
-- The catalog table is renamed (not dropped) as a rollback safety net.
-- Rollback: ALTER TABLE catalog_archived RENAME TO catalog;
ALTER TABLE catalog RENAME TO catalog_archived;
