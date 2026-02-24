-- Migration: 0013_shop_pricing_overrides
-- Creates shop_pricing_overrides for the shop pricing cascade layer.
--
-- Cascade model (lowest-to-highest precedence, higher priority wins):
--   supplier base price (fct_supplier_pricing in dbt marts)
--     → shop global markup  (scope_type='shop')
--         → brand override  (scope_type='brand')
--             → customer override (scope_type='customer')
--
-- rules JSONB structure:
--   { "markup_percent": 40 }          -- add 40% on top of base
--   { "discount_percent": 10 }        -- subtract 10% from base
--   { "fixed_price": 12.50 }          -- ignore base; set absolute price
--   Multiple keys may coexist; resolution order: fixed_price > markup_percent > discount_percent

CREATE TABLE IF NOT EXISTS shop_pricing_overrides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope: who owns this override
  scope_type   varchar(20) NOT NULL CHECK (scope_type IN ('shop', 'brand', 'customer')),
  scope_id     uuid        NOT NULL,

  -- Entity: what style/brand/category this applies to
  -- entity_type='style'    → entity_id is a catalog_styles.id UUID
  -- entity_type='brand'    → entity_id is a catalog_brands.id UUID
  -- entity_type='category' → entity_id is NULL (applies to entire category)
  entity_type  varchar(20) NOT NULL CHECK (entity_type IN ('style', 'brand', 'category')),
  entity_id    uuid,       -- nullable for category-wide rules

  -- Override rule payload
  rules        jsonb       NOT NULL DEFAULT '{}',

  -- Higher priority wins when multiple overrides match the same entity
  priority     integer     NOT NULL DEFAULT 0,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (scope_type, scope_id, entity_type, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'))
);

-- Indexes for the common read patterns
CREATE INDEX IF NOT EXISTS idx_spo_scope
  ON shop_pricing_overrides (scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_spo_entity
  ON shop_pricing_overrides (entity_type, entity_id);

-- RLS: shop members can only see/mutate their own shop's overrides.
-- Brand and customer overrides are also scoped: the scope_id must match a shop
-- that the authenticated user belongs to (enforced at application layer for now).
ALTER TABLE shop_pricing_overrides ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read any override (pricing is not sensitive at row level;
-- the application layer enforces shop scoping via verifySession).
CREATE POLICY "authenticated_read_pricing_overrides"
  ON shop_pricing_overrides
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes are restricted to service_role (admin/server actions only).
-- Row-level shop isolation is enforced in the server actions via verifySession().
CREATE POLICY "service_role_write_pricing_overrides"
  ON shop_pricing_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
