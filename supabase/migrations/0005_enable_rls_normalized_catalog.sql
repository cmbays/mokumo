-- Enable Row Level Security on all normalized catalog tables
-- Mirrors the policy pattern from 0001/0002: public read + postgres-role write.
--
-- These tables were created in 0003_oval_gladiator without RLS.
-- Without RLS, any Supabase client with the anon key can write directly.

-- catalog_brands
ALTER TABLE catalog_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_brands_read_public" ON catalog_brands
FOR SELECT USING (true);

CREATE POLICY "catalog_brands_write_postgres" ON catalog_brands
FOR ALL TO postgres
USING (true) WITH CHECK (true);

-- catalog_styles
ALTER TABLE catalog_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_styles_read_public" ON catalog_styles
FOR SELECT USING (true);

CREATE POLICY "catalog_styles_write_postgres" ON catalog_styles
FOR ALL TO postgres
USING (true) WITH CHECK (true);

-- catalog_colors
ALTER TABLE catalog_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_colors_read_public" ON catalog_colors
FOR SELECT USING (true);

CREATE POLICY "catalog_colors_write_postgres" ON catalog_colors
FOR ALL TO postgres
USING (true) WITH CHECK (true);

-- catalog_sizes
ALTER TABLE catalog_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_sizes_read_public" ON catalog_sizes
FOR SELECT USING (true);

CREATE POLICY "catalog_sizes_write_postgres" ON catalog_sizes
FOR ALL TO postgres
USING (true) WITH CHECK (true);

-- catalog_images
ALTER TABLE catalog_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_images_read_public" ON catalog_images
FOR SELECT USING (true);

CREATE POLICY "catalog_images_write_postgres" ON catalog_images
FOR ALL TO postgres
USING (true) WITH CHECK (true);

-- catalog_brand_sources
ALTER TABLE catalog_brand_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_brand_sources_read_public" ON catalog_brand_sources
FOR SELECT USING (true);

CREATE POLICY "catalog_brand_sources_write_postgres" ON catalog_brand_sources
FOR ALL TO postgres
USING (true) WITH CHECK (true);

-- catalog_style_preferences (tenant-scoped — stricter than public catalog tables)
-- Phase 2b will add JWT-based scope_id filtering when shop_members table exists.
-- For now: restrict reads to authenticated users only (not anon).
ALTER TABLE catalog_style_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_style_preferences_read_authenticated" ON catalog_style_preferences
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "catalog_style_preferences_write_postgres" ON catalog_style_preferences
FOR ALL TO postgres
USING (true) WITH CHECK (true);
