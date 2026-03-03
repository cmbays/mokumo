-- Seed customer_activities for development / E2E testing.
-- Adds realistic activity history for the 3 primary seeded customers.
-- Shop: 4Ink (00000000-0000-4000-8000-000000004e6b)
-- IDs use 40000000-0000-4000-8000-* prefix (deterministic, idempotent).

INSERT INTO customer_activities (
  id, customer_id, shop_id, source, direction, actor_type, actor_id,
  content, related_entity_type, related_entity_id, created_at
)
VALUES

  -- ── Austin Sports League (10000000-0000-4000-8000-000000000003) ──────────────
  -- Richest history: 10 entries covering a full spring tournament order cycle.

  (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'system', 'internal', 'system', NULL,
    'Customer record created.',
    NULL, NULL,
    NOW() - INTERVAL '180 days'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Dana called to discuss spring tournament shirt order. Needs ~200 shirts in 3 colorways. Turnaround needed by April 10. Will send artwork next week.',
    NULL, NULL,
    NOW() - INTERVAL '62 days'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'email', 'inbound', 'customer', NULL,
    'Received artwork files for spring tournament. Three AI files attached — referee uniforms, player jerseys, coaches pollos. All in CMYK. Forwarded to art department.',
    NULL, NULL,
    NOW() - INTERVAL '55 days'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Art dept flagged PMS 185 red on jersey design — current emulsion batch has adhesion issues with that ink. Called Dana to discuss switching to 032 Warm Red as substitute. She approved the change.',
    NULL, NULL,
    NOW() - INTERVAL '50 days'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'email', 'outbound', 'staff', NULL,
    'Sent proof approval request with mockups for all three designs. Requested sign-off by March 28 to hit April 10 ship date.',
    NULL, NULL,
    NOW() - INTERVAL '45 days'
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'email', 'inbound', 'customer', NULL,
    'Dana approved all three proofs. Confirmed size breakdown: XS×10, S×30, M×60, L×55, XL×30, 2XL×15. Shipping to League HQ on Research Blvd.',
    NULL, NULL,
    NOW() - INTERVAL '42 days'
  ),
  (
    '40000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'system', 'internal', 'system', NULL,
    'Job moved to production: press run scheduled.',
    NULL, NULL,
    NOW() - INTERVAL '38 days'
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Order shipped via UPS Ground. Tracking #1Z999AA10123456784. Expected delivery in 5 business days.',
    NULL, NULL,
    NOW() - INTERVAL '30 days'
  ),
  (
    '40000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'email', 'inbound', 'customer', NULL,
    'Dana confirmed order received in great condition. Coaches are happy with the polo quality. Already asking about fall season — will reach out in August.',
    NULL, NULL,
    NOW() - INTERVAL '24 days'
  ),
  (
    '40000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Left voicemail about fall order planning. Dana mentioned they may need 300+ units — championship expansion this year. Follow up end of August.',
    NULL, NULL,
    NOW() - INTERVAL '5 days'
  ),

  -- ── River City Brewing Co. (10000000-0000-4000-8000-000000000001) ────────────

  (
    '40000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000004e6b',
    'system', 'internal', 'system', NULL,
    'Customer record created.',
    NULL, NULL,
    NOW() - INTERVAL '365 days'
  ),
  (
    '40000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Marcus came in for a reorder consultation. Taproom staff shirts wearing well — wants to add a hoodie and hat option for winter merch. Suggested Comfort Colors 1467 fleece. He liked it.',
    NULL, NULL,
    NOW() - INTERVAL '45 days'
  ),
  (
    '40000000-0000-4000-8000-000000000013',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000004e6b',
    'email', 'outbound', 'staff', NULL,
    'Sent winter merch quote with 3 SKU options: Comfort Colors hoodie, S&S twill cap, and Carhartt beanie. Included setup fees and bulk pricing at 50/100/200 units.',
    NULL, NULL,
    NOW() - INTERVAL '40 days'
  ),
  (
    '40000000-0000-4000-8000-000000000014',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Marcus accepted hoodie quote, passing on caps for now. 75 hoodies in Pepper colorway. Deposit collected.',
    NULL, NULL,
    NOW() - INTERVAL '35 days'
  ),

  -- ── Riverside Academy (10000000-0000-4000-8000-000000000002) ─────────────────

  (
    '40000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000004e6b',
    'system', 'internal', 'system', NULL,
    'Customer record created.',
    NULL, NULL,
    NOW() - INTERVAL '270 days'
  ),
  (
    '40000000-0000-4000-8000-000000000016',
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000004e6b',
    'manual', 'internal', 'staff', NULL,
    'Coach Johnson confirmed 2025–26 athletic uniform order. Football, soccer, and basketball programs. Expecting ~400 total units. Sent kickoff questionnaire for art files.',
    NULL, NULL,
    NOW() - INTERVAL '14 days'
  )

ON CONFLICT DO NOTHING;
