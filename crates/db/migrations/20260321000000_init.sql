-- Initial schema. Domain tables added in M1+.
-- This migration exists to verify SQLx migrate!() works.

CREATE TABLE IF NOT EXISTS _schema_version (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    initialized_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO _schema_version (id) VALUES (1);
