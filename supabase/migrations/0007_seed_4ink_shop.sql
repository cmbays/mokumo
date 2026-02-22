-- Hand-written migration: seed the 4Ink shop and configure RLS for shop_members.
-- Not tracked in Drizzle's _journal.json — applied by Supabase CLI in filename order.

-- Enable RLS on shops and shop_members
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only read their own memberships
CREATE POLICY "users_own_memberships" ON shop_members
  FOR SELECT USING (user_id = auth.uid());

-- Seed the 4Ink shop
INSERT INTO shops (id, name, slug, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000004e6b',
  '4Ink Screen Printing',
  '4ink',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- NOTE: After deployment, add the owner's shop_members row using their
-- Supabase Auth UUID from the dashboard (Authentication → Users):
--
--   INSERT INTO shop_members (user_id, shop_id, role, created_at)
--   VALUES (
--     '<owner-supabase-auth-uuid>',
--     '00000000-0000-0000-0000-000000004e6b',
--     'owner',
--     NOW()
--   );
