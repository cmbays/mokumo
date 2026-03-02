DROP INDEX "idx_artwork_versions_shop_id_content_hash";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_artwork_versions_shop_id_content_hash" ON "artwork_versions" USING btree ("shop_id","content_hash");--> statement-breakpoint

-- Enable Row Level Security on artwork_versions.
-- All application access uses the service-role key (bypasses RLS).
-- These policies block direct PostgREST access via anon/authenticated roles,
-- matching the RLS pattern established on every other data table in this project.
ALTER TABLE "artwork_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Service role full access" ON "artwork_versions"
  FOR ALL TO service_role USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "No direct anon access" ON "artwork_versions"
  FOR ALL TO anon USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "No direct authenticated access" ON "artwork_versions"
  FOR ALL TO authenticated USING (false) WITH CHECK (false);