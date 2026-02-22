-- Enable Row Level Security on the catalog table
-- Prevents unauthorized access to product catalog data

ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;

-- Public read policy: allow all roles to read the catalog
CREATE POLICY "catalog_read_public" ON catalog
FOR SELECT
USING (true);

-- Write policy: only service_role (server-side) can modify the catalog
-- This is used by the catalog sync endpoint which runs on the server
CREATE POLICY "catalog_write_service_role" ON catalog
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
