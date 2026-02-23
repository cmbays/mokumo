CREATE INDEX "idx_raw_ss_products_sku" ON "raw"."ss_activewear_products" USING btree ("sku");

-- Defense-in-depth: enable RLS with zero policies so commercially sensitive
-- pricing data (customerPrice, mapPrice, salePrice) is inaccessible via
-- PostgREST even if a future migration accidentally grants schema access.
ALTER TABLE "raw"."ss_activewear_products" ENABLE ROW LEVEL SECURITY;