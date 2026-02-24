-- Migration: 0013_shop_pricing_overrides
-- Creates shop_pricing_overrides for the shop pricing cascade layer.
--
-- Cascade model (lowest-to-highest precedence, later tier wins):
--   supplier base price (fct_supplier_pricing in dbt marts)
--     → scope_type='shop'     (global shop markup)
--         → scope_type='brand'    (brand-level override)
--             → scope_type='customer' (customer-specific pricing)
--
-- rules JSONB structure:
--   { "markup_percent": 40 }          -- add 40% on top of base
--   { "discount_percent": 10 }        -- subtract 10% from base
--   { "fixed_price": "12.50" }        -- ignore base; set absolute price (string for precision)
--   Resolution order: fixed_price > markup_percent > discount_percent

CREATE TABLE IF NOT EXISTS shop_pricing_overrides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope: who owns this override
  scope_type   varchar(20) NOT NULL CHECK (scope_type IN ('shop', 'brand', 'customer')),
  scope_id     uuid        NOT NULL,

  -- Entity: what style/brand/category this applies to
  -- entity_type='style'    → entity_id = catalog_styles.id UUID (NOT NULL)
  -- entity_type='brand'    → entity_id = catalog_brands.id UUID (NOT NULL)
  -- entity_type='category' → entity_id = NULL (applies to entire category)
  entity_type  varchar(20) NOT NULL CHECK (entity_type IN ('style', 'brand', 'category')),
  entity_id    uuid,       -- nullable only when entity_type = 'category'

  -- Enforce entityId/entityType consistency at the database level
  CONSTRAINT chk_spo_entity_id_consistency CHECK (
    (entity_type = 'category' AND entity_id IS NULL) OR
    (entity_type IN ('style', 'brand') AND entity_id IS NOT NULL)
  ),

  -- Override rule payload (must have at least one key — enforced by app layer)
  rules        jsonb       NOT NULL,

  -- Higher priority wins when multiple overrides match the same scope tier
  priority     integer     NOT NULL DEFAULT 0,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Uniqueness for style/brand overrides (entity_id IS NOT NULL)
-- One override per (scope_type, scope_id, entity_type, entity_id) combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_spo_unique_with_entity
  ON shop_pricing_overrides (scope_type, scope_id, entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

-- Uniqueness for category overrides (entity_id IS NULL)
-- One category override per (scope_type, scope_id, entity_type) — entity_type='category' only
CREATE UNIQUE INDEX IF NOT EXISTS idx_spo_unique_category
  ON shop_pricing_overrides (scope_type, scope_id, entity_type)
  WHERE entity_id IS NULL;

-- Indexes for the common read patterns
CREATE INDEX IF NOT EXISTS idx_spo_scope
  ON shop_pricing_overrides (scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_spo_entity
  ON shop_pricing_overrides (entity_type, entity_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE shop_pricing_overrides ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read overrides only for shops they are members of.
-- scope_id must be present in shop_members for the current auth.uid().
CREATE POLICY "read_own_shop_pricing_overrides"
  ON shop_pricing_overrides
  FOR SELECT
  TO authenticated
  USING (
    scope_id IN (
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );

-- Writes are restricted to service_role (server actions via Supabase service key).
-- Row-level shop isolation is enforced in server actions via verifySession().
CREATE POLICY "service_role_write_pricing_overrides"
  ON shop_pricing_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
