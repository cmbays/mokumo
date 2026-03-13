-- Enforce consistency between actor_type and actor_id:
--   - 'system' actors must have actor_id = NULL (no human identity)
--   - 'staff' and 'customer' actors must have actor_id set (known identity)
ALTER TABLE "public"."activity_events"
  ADD CONSTRAINT activity_events_actor_consistency_ck
  CHECK (
    (actor_type = 'system' AND actor_id IS NULL)
    OR
    (actor_type <> 'system' AND actor_id IS NOT NULL)
  );
