-- Hand-written migration: update the 4Ink shop UUID to an RFC-4122-compliant value.
-- The original UUID '00000000-0000-0000-0000-000000004e6b' has 0 as the variant nibble
-- (4th group first digit). RFC-4122 requires [89ab] at that position.
-- New UUID '00000000-0000-4000-8000-000000004e6b' is version-4, variant-1 compliant.
--
-- shop_members.shop_id is a FK to shops.id with ON DELETE CASCADE but no ON UPDATE CASCADE.
-- We use insert-migrate-delete to avoid FK violations without requiring DEFERRABLE constraints:
--   1. Insert new shop row (FK references to new UUID are now valid)
--   2. Re-point any existing shop_members rows to the new UUID
--   3. Delete old shop row (no FK references remain)

-- Step 1: Insert new shop with compliant UUID, copying metadata from the old row
INSERT INTO shops (id, name, slug, created_at, updated_at)
SELECT
  '00000000-0000-4000-8000-000000004e6b',
  name,
  slug,
  created_at,
  updated_at
FROM shops
WHERE id = '00000000-0000-0000-0000-000000004e6b'
ON CONFLICT DO NOTHING;

-- Step 2: Re-point existing shop_members to the new UUID
UPDATE shop_members
SET shop_id = '00000000-0000-4000-8000-000000004e6b'
WHERE shop_id = '00000000-0000-0000-0000-000000004e6b';

-- Step 3: Delete old shop row (FK-safe — no shop_members reference it after step 2)
DELETE FROM shops
WHERE id = '00000000-0000-0000-0000-000000004e6b';
