---
session: db-schema-preferences
wave: 0
pipeline: 20260226-640-color-favorites
---

# Wave 0: DB Schema Preferences — Notes

## Architecture Decisions

### Migration numbering conflict resolved
Manual migration `0017_add_color_group_name.sql` (from PR #634) was never tracked by Drizzle-kit, so Drizzle generated its next migration as `0017_red_talkback.sql`. Resolved by renaming Drizzle's migration to `0018_red_talkback.sql` and updating `meta/_journal.json` + `meta/0018_snapshot.json`.

**Rule going forward**: Any manual migration added outside `npm run db:generate` must be registered by either (a) running `npm run db:generate` immediately after to advance Drizzle's counter, or (b) manually updating `meta/_journal.json`.

### Drizzle migration tracking vs Supabase tracking
The local Supabase migration tracking table (`supabase_migrations.schema_migrations`) had 0016 and 0017 not registered, even though the tables existed in the DB. Used `npx supabase migration repair --local --status applied 0016` / `reverted` / `applied` to reconcile.

**Final state**: All migrations 0000–0018 applied and tracked locally.

### Tristate boolean columns (isEnabled, isFavorite)
All preference tables use nullable boolean columns: `NULL = unset`, `true = explicitly on`, `false = explicitly off`. This is intentional — it distinguishes "user has never expressed a preference" from "user has explicitly turned this off." The tests guard against accidental `.notNull()` being added.

### catalog_color_groups backfill
The backfill SQL runs at migration time to populate `catalog_color_groups` from existing `catalog_colors` data. `ON CONFLICT DO NOTHING` makes it idempotent. After the image sync pipeline runs for future brands, new rows will be added via the sync upsert.

## Key Implementation Tradeoffs

- **FK cascade on all preference tables**: Deleting a brand cascades to brand preferences and color group preferences. Acceptable for V1 since brands aren't deleted via the app yet.
- **No `is_enabled` on `catalog_color_group_preferences`**: Color groups can only be favorited, not enabled/disabled. Brand-level enable/disable controls which brands appear in the catalog. This keeps the data model lean.

## Drizzle Internal API Notes (for schema tests)

- Table name: `getTableName(table)` from `drizzle-orm`
- FK constraints: `table[Symbol.for('drizzle:PgInlineForeignKeys')]` → array of FK objects
- FK object structure: `{ reference: () => { foreignTable, columns }, onDelete, onUpdate }`
- Column tristate: column has `notNull: boolean` accessible via `(col as any).notNull`

## Deferred Work

- No RLS policies on the 3 new tables yet — V1 will add shop-scoped policies
- No server actions yet — Wave 1+ will add `upsertBrandPreference`, `upsertColorGroupPreference`, `upsertStylePreference`
