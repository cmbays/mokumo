-- Add color_group_name to catalog_colors (Wave 3, #632)
-- colorGroupName is the mid-tier canonical color name (e.g. "Navy", "Royal", "Forest Green").
-- This sits between colorFamily (hue bucket, ~15) and colorName (per-style specific, ~30k).
-- S&S API returns this as "colorGroupName". Backfilled via run-image-sync.ts after this migration.

ALTER TABLE catalog_colors ADD COLUMN IF NOT EXISTS color_group_name TEXT;
CREATE INDEX IF NOT EXISTS idx_catalog_colors_color_group_name ON catalog_colors (color_group_name);
