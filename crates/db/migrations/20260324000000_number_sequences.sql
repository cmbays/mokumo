-- Number sequences: atomic generator for human-readable display identifiers.
-- Each row defines a sequence (e.g., "customer" → C-0001, C-0002, ...).
-- current_value tracks the LAST USED value; first call returns current_value + 1.
--
-- Atomicity: UPDATE...RETURNING in a single statement — no explicit transaction needed.
-- No updated_at trigger: this is infrastructure, not a domain entity.

CREATE TABLE IF NOT EXISTS number_sequences (
    name         TEXT    PRIMARY KEY NOT NULL,
    prefix       TEXT    NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    padding      INTEGER NOT NULL DEFAULT 4
);

-- Seed the customer number sequence: C-0001, C-0002, ...
INSERT INTO number_sequences (name, prefix, current_value, padding)
VALUES ('customer', 'C', 0, 4);
