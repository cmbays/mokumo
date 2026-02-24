---
title: 'sqlfluff Violations Fix — dbt Pricing Models'
subtitle: 'Resolving pre-existing linter violations unmasked by CI ungating in PR #602'
date: 2026-02-23
phase: 2
pipelineName: 'sqlfluff Violations Fix'
pipelineType: bug-fix
products: []
tools: [database, ci-pipeline]
stage: wrap-up
tags: [build]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0223-sqlfluff-fix'
status: complete
---

## Problem Statement

PR #602 ungated sqlfluff in CI, immediately failing on 5 pre-existing violations in the dbt pricing models. Issue #604 tracked the fix. The violations were latent from the original model authoring — the linter was disabled at the time.

## What Was Fixed

### sqlfluff Violations (5 rules across 5 models)

| Rule | Description                                              | Files Affected                                                    |
| ---- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| CV03 | Trailing comma after last SELECT item                    | All 5 models                                                      |
| ST01 | Redundant `else null` in CASE WHEN                       | `int_supplier_pricing__conformed.sql`                             |
| ST02 | Boolean CASE WHEN → direct expression                    | `dim_date.sql`                                                    |
| RF04 | SQL reserved words as column aliases (`year`, `quarter`) | `dim_date.sql`                                                    |
| LT02 | Multi-condition WHERE/ON indentation                     | `int_supplier_pricing__conformed.sql`, `fct_supplier_pricing.sql` |

### RF04 Rename Cascade

Renaming `year` → `year_number` and `quarter` → `quarter_number` in `dim_date.sql` required syncing `_pricing__models.yml` (the dbt YAML test config). Missing this sync would have caused `dbt test` column-not-found errors on the `not_null` tests for those columns. The YAML sync was caught during the CodeRabbit review pass.

### Migration Idempotency (0012_curved_wolf_cub.sql)

The migration had `CREATE SCHEMA "marts"` (without `IF NOT EXISTS`), which caused `supabase start` to fail on every fresh local startup because migration `0009` already creates the `marts` schema. Fixed in two stages:

1. Initial: `CREATE SCHEMA IF NOT EXISTS "marts"` — fixes the schema collision
2. CodeRabbit nitpick applied: Extended `IF NOT EXISTS` to all 4 `CREATE TABLE` statements — makes the entire migration hermetic from any starting state

**Root cause**: Drizzle-kit generates bare `CREATE SCHEMA` without `IF NOT EXISTS` when a schema-qualified table is added to the schema. The `IF NOT EXISTS` pattern must always be applied manually to schema/table creation in Supabase migrations.

## Key Engineering Learnings

### 1. sqlfluff Needs a Live DB for dbt Templater

`sqlfluff lint --templater raw` cannot parse Jinja syntax (`{{ ref(...) }}`, `{{ dbt_utils.generate_surrogate_key(...) }}`). The dbt templater must compile models against a live database. Local workflow:

1. `npx supabase start`
2. Create `dbt/profiles/profiles.yml` from `profiles.yml.example` (gitignored — delete after use)
3. `cd dbt && uv run dbt deps` (needed first time or after clean)
4. `uv run sqlfluff lint models/ --format human`

### 2. `sqlfluff fix --rules LT02` is Safe for Indentation

LT02 (multi-condition WHERE/ON clause indentation) has a consistent fix: keyword on its own line, conditions at deeper indent. The auto-fix produces exactly the right output — no manual intervention needed. For other rules (ST01, ST02, RF04, CV03), manual fixes are safer since they involve semantic understanding.

### 3. Drizzle-kit Schema Creation Anti-Pattern

When Drizzle-kit generates migrations for tables in non-public schemas, it emits bare `CREATE SCHEMA "schema_name"` — never `IF NOT EXISTS`. If any earlier migration already owns that schema (via an explicit `CREATE SCHEMA IF NOT EXISTS`), the generated migration will fail on every non-first run. **Always audit generated migrations** for bare `CREATE SCHEMA` statements before committing.

### 4. Review Orchestration Domain Gap

`dbt/` and `supabase/migrations/` have no glob→domain mapping in `tools/orchestration/config/review-domains.json`. Analytics and migration PRs classify as 0 domains, triggering only the universal `build-reviewer`. Issue #609 tracks adding:

- `dbt/**` → `analytics` domain
- `supabase/migrations/**` → `infrastructure` domain

### 5. Pre-existing CI Failures Can Block New PRs

PR #607 (rate limiting) introduced Prettier violations in `sync-pricing/route.ts` and `sync/route.ts` that weren't caught before merge. These caused our PR's `check` CI job to fail even though our changes were unrelated. Fixed the Prettier violations in this PR to restore green CI on main. **Lesson**: Prettier violations in merged PRs create CI debt that the next PR must absorb.

## PR Details

- **PR**: #608
- **Closes**: #604
- **Files changed**: 9 (5 dbt SQL, 1 dbt YAML, 1 migration, 2 TypeScript)
- **Net delta**: +39/-33 lines

## Review Summary

- **Orchestration gate**: PASS (after 1 iteration fixing migration idempotency)
- **CodeRabbit**: 1 nitpick — `CREATE TABLE IF NOT EXISTS` for full migration idempotency. Applied.
- **Deferred issues**: #609 (review orchestration domain gap)

## Resume Command

```bash
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```
