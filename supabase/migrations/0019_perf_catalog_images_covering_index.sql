-- Performance: covering index on catalog_images for the CTE query pattern
--
-- The getNormalizedCatalog CTE pre-aggregates images per color:
--   SELECT color_id, JSON_AGG(... ORDER BY image_type) FROM catalog_images GROUP BY color_id
--
-- The existing idx_catalog_images_color_id covers the GROUP BY, but PostgreSQL must
-- still visit the heap to fetch image_type and url for each row. A covering index
-- with image_type in the key and url in INCLUDE allows PostgreSQL to answer the
-- entire CTE from the index alone (index-only scan) — 144,056 rows without heap access.
--
-- Composite key (color_id, image_type): supports GROUP BY color_id, ORDER BY image_type
-- INCLUDE (url): avoids heap access for the url column in JSON_AGG(...)
--
-- The existing idx_catalog_images_color_id is left in place; it's smaller and may be
-- preferred by the planner for other query shapes (e.g. point lookups by color_id alone).
CREATE INDEX "idx_catalog_images_color_id_image_type_url"
  ON "catalog_images"
  USING btree ("color_id", "image_type")
  INCLUDE ("url");
