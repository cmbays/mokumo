---
title: 'Remove Legacy Pricing Columns from catalog_styles'
subtitle: 'Issue #598 — drop piece_price/dozen_price/case_price, pricing now in marts.fct_supplier_pricing'
date: 2026-02-23
phase: 2
pipelineName: 'Remove Legacy Pricing Columns'
pipelineType: bug-fix
products: []
tools: ['database', 'ci-pipeline']
stage: build
tags: [build, feature]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0223-remove-legacy-pricing-columns'
status: complete
---

## What Was Done

Removed three legacy flat pricing columns (`piece_price`, `dozen_price`, `case_price`) from the `catalog_styles` table. These columns existed from Phase 1 when pricing was inlined on the style row. After PR #597 shipped `marts.fct_supplier_pricing` (dbt gold layer), the flat columns became dead weight.

**PR**: [#603](https://github.com/cmbays/print-4ink/pull/603) — merged to main at `7878a2e`

## Files Changed

| File                                                             | Change                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/db/schema/catalog-normalized.ts`                            | Removed 3 numeric columns from `catalogStyles` table                                        |
| `src/domain/entities/catalog-style.ts`                           | Removed `piecePrice` from `normalizedGarmentCatalogSchema`                                  |
| `src/infrastructure/repositories/_providers/supabase/catalog.ts` | Removed from SQL query, row type, and `parseNormalizedCatalogRow` return                    |
| `src/infrastructure/services/catalog-sync-normalized.ts`         | Removed from `buildStyleUpsertValue` return (pricing stays in raw layer)                    |
| `src/infrastructure/services/catalog-sync.service.ts`            | Removed 3 fields from upsert `set`                                                          |
| `src/app/(dashboard)/garments/_components/GarmentCard.tsx`       | Simplified price display — normalized garments no longer show flat price                    |
| `supabase/migrations/0012_curved_wolf_cub.sql`                   | `ALTER TABLE catalog_styles DROP COLUMN` for all 3 columns                                  |
| `dbt/models/marts/pricing/fct_supplier_pricing.sql`              | Added dbt `indexes` config (btree on product_key/is_current, supplier_key, price_group_key) |

## Key Decisions

### CanonicalPricing NOT removed

`lib/suppliers/types.ts` (`CanonicalPricing`) and the adapter layer still carry `piecePrice/dozenPrice/casePrice`. These feed `raw.ss_activewear_products` via `pricing-sync.service.ts` — they're the data pipeline inputs, not duplicates of the catalog columns. The catalog columns were the duplicated output that was removed.

### Indexes in dbt config, not Drizzle migration

`fct_supplier_pricing` uses `materialized='table'` in dbt, which drops and recreates the table on every `dbt run`. Any Drizzle-migration-created indexes would be wiped on the next run. Indexes must live in the dbt model's `config()` block so dbt recreates them after each table build.

### Pricing display simplified in GarmentCard

The old code had a conditional `garment.piecePrice != null` check that showed price from the normalized model. After removal, normalized garments no longer display flat prices — they display quantity-tiered prices via the new pricing UI (sourced from `marts.fct_supplier_pricing`).

## Tests

- `buildStyleUpsertValue` test in `catalog-sync-normalized.test.ts` updated with negative assertions to pin the removal (`expect(val).not.toHaveProperty('piecePrice')`, etc.)
- `catalog.test.ts` fixtures cleaned of `piece_price` column
- `catalog-style.test.ts` entity fixture cleaned of `piecePrice: 4.25`
- All 1424+ tests pass

## Complications

### Wrong worktree (caught and corrected)

Initial work was accidentally done on `worktree-lovely-zooming-phoenix` (a Claude Code native `--worktree` session), whose branch had already been merged to main via PR #602. Recovered by saving changes as a patch, creating a fresh worktree off current `main`, applying patch, regenerating migration, and recommitting.

### dbt CI sqlfluff failures (pre-existing, deferred)

After adding the `indexes` config to `fct_supplier_pricing.sql`, the dbt CI path filter triggered sqlfluff. Pre-existing violations (CV03 trailing commas, LT02 indent, RF04, ST01/ST02) in the pricing models caused the dbt CI check to fail. These violations existed on `main` since PR #602 ungated sqlfluff. Since `dbt CI` is not a required branch protection check (only `check` is), the PR merged. Tracked in Issue #604.

## Resume Command

```bash
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```
