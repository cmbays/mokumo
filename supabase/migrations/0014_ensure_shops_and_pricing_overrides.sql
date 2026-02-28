-- Migration: 0014_ensure_shops_and_pricing_overrides
-- Idempotent catch-up for preview environments where 0006 and 0013 were never
-- executed (only tracked). Creates the missing tables required for smoke tests.

-- ─── user_role enum ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM ('owner', 'operator');
  END IF;
END $$;

-- ─── shops ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL,
  slug       varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shops_slug_unique UNIQUE (slug)
);

-- ─── shop_members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  shop_id    uuid        NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  role       public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shop_members_user_id_shop_id_key
  ON shop_members (user_id, shop_id);

CREATE INDEX IF NOT EXISTS idx_shop_members_user_id
  ON shop_members (user_id);

-- ─── shop_pricing_overrides ──────────────────────────────────────────────────
-- Mirrors 0013 but uses IF NOT EXISTS so it is safe to apply even if 0013 ran.

CREATE TABLE IF NOT EXISTS shop_pricing_overrides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  scope_type   varchar(20) NOT NULL CHECK (scope_type IN ('shop', 'brand', 'customer')),
  scope_id     uuid        NOT NULL,

  entity_type  varchar(20) NOT NULL CHECK (entity_type IN ('style', 'brand', 'category')),
  entity_id    uuid,

  CONSTRAINT chk_spo_entity_id_consistency CHECK (
    (entity_type = 'category' AND entity_id IS NULL) OR
    (entity_type IN ('style', 'brand') AND entity_id IS NOT NULL)
  ),

  rules        jsonb       NOT NULL,
  priority     integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_spo_unique_with_entity
  ON shop_pricing_overrides (scope_type, scope_id, entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_spo_unique_category
  ON shop_pricing_overrides (scope_type, scope_id, entity_type)
  WHERE entity_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_spo_scope
  ON shop_pricing_overrides (scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_spo_entity
  ON shop_pricing_overrides (entity_type, entity_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE shops             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_pricing_overrides ENABLE ROW LEVEL SECURITY;

-- shops: service_role only (no direct client reads needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shops' AND policyname = 'service_role_manage_shops'
  ) THEN
    CREATE POLICY "service_role_manage_shops"
      ON shops FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- shop_members: users see their own memberships; service_role manages all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shop_members' AND policyname = 'read_own_shop_membership'
  ) THEN
    CREATE POLICY "read_own_shop_membership"
      ON shop_members FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shop_members' AND policyname = 'service_role_manage_shop_members'
  ) THEN
    CREATE POLICY "service_role_manage_shop_members"
      ON shop_members FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- shop_pricing_overrides: same policies as defined in 0013
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shop_pricing_overrides' AND policyname = 'read_own_shop_pricing_overrides'
  ) THEN
    CREATE POLICY "read_own_shop_pricing_overrides"
      ON shop_pricing_overrides FOR SELECT TO authenticated
      USING (
        scope_id IN (
          SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shop_pricing_overrides' AND policyname = 'service_role_write_pricing_overrides'
  ) THEN
    CREATE POLICY "service_role_write_pricing_overrides"
      ON shop_pricing_overrides FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;
