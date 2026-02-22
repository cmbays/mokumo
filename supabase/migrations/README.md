# Migration Strategy: Dual-Track

This directory contains **two types** of SQL migration files:

## Drizzle-generated (schema DDL)

Tracked in `meta/_journal.json` with corresponding snapshots in `meta/`.

| File                      | Purpose                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `0000_clever_salo.sql`    | Initial catalog table                                                                               |
| `0003_oval_gladiator.sql` | Normalized catalog tables (brands, styles, colors, sizes, images, brand_sources, style_preferences) |

Generated via `npm run db:generate` from schema definitions in `src/db/schema/`.

## Hand-written (Supabase-specific)

**Not** in `_journal.json` — this is intentional. Drizzle doesn't manage RLS policies, table renames, or other Postgres-specific operations.

| File                                     | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `0001_enable_rls_catalog.sql`            | RLS + read/write policies on `catalog` table           |
| `0002_fix_catalog_write_policy.sql`      | Switch write policy from `service_role` to `postgres`  |
| `0004_archive_catalog.sql`               | Rename old denormalized `catalog` → `catalog_archived` |
| `0005_enable_rls_normalized_catalog.sql` | RLS + read/write policies on all 7 normalized tables   |

Applied by Supabase CLI (`supabase migration up`) which reads **all** `.sql` files in order.

**Important:** `npm run db:migrate` runs Drizzle's migration runner, which only applies files tracked in `_journal.json`. Hand-written migrations (0001, 0002, 0004, 0005) are **not** in the journal and will be silently skipped by Drizzle. Always use `supabase migration up` for local dev (after `supabase start`) or `supabase db reset` to replay all migrations from scratch.

## Numbering Convention

Files are numbered sequentially (`0000`, `0001`, ...) regardless of type. Supabase CLI applies them in filename order. The Drizzle journal index may skip numbers — this is expected.
