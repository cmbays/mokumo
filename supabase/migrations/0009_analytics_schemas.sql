-- Analytics layer schemas for dbt-core medallion architecture.
-- Drizzle owns the `public` schema; dbt owns all of these.
--
-- Layer mapping:
--   raw          → Verbatim supplier API responses (sync jobs write here)
--   staging      → dbt ephemeral by default; schema exists for dev view debugging
--   intermediate → Conformed, cleaned business logic (dbt tables)
--   marts        → Kimball snowflake schema — dims + facts (app reads via Drizzle .existing())
--   snapshots    → SCD Type 2 history tracking (dbt snapshots)

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS intermediate;
CREATE SCHEMA IF NOT EXISTS marts;
CREATE SCHEMA IF NOT EXISTS snapshots;

-- Grant usage to the default postgres role (Supabase uses this for app connections).
-- dbt connects as postgres and needs full DDL + DML access to these schemas.
GRANT ALL ON SCHEMA raw TO postgres;
GRANT ALL ON SCHEMA staging TO postgres;
GRANT ALL ON SCHEMA intermediate TO postgres;
GRANT ALL ON SCHEMA marts TO postgres;
GRANT ALL ON SCHEMA snapshots TO postgres;

-- Grant usage to authenticated role so the Next.js app can read from marts.
GRANT USAGE ON SCHEMA marts TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA marts GRANT SELECT ON TABLES TO authenticated;

-- Grant usage to anon role for marts (read-only, if public access is ever needed).
GRANT USAGE ON SCHEMA marts TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA marts GRANT SELECT ON TABLES TO anon;
