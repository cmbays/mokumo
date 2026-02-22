-- Fix catalog write policy to allow the postgres role (used by Drizzle ORM direct connections)
-- In newer Supabase projects, the postgres user does not automatically bypass RLS.
-- The sync endpoint authenticates via x-admin-secret at the API layer, so RLS write
-- restriction to service_role only adds friction without additional security.

DROP POLICY IF EXISTS "catalog_write_service_role" ON catalog;

CREATE POLICY "catalog_write_postgres" ON catalog
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);
