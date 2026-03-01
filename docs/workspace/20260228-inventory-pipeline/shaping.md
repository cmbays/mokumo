---
shaping: true
pipeline: 20260228-inventory-pipeline
---

# Inventory Visibility — Shaping

## Selected Shape: A

**Shape A selected** — append-only raw table + dbt staging view + Vercel cron.

Spike findings:
- **Spike 1 (buffer threshold)**: No industry standard exists. Decision: configurable `shop_inventory_buffer_multiplier` shop setting, default `1.5×` order quantity. Resolves R4 and R8.
- **Spike 2 (quote finalization)**: Quote backend does not exist — `EmailPreviewModal` fires a toast only. R6 (quote snapshot) is **deferred** pending quote persistence work. `catalog_inventory` table already exists in Drizzle schema (Issue #618 pre-built it) — this becomes our app-serving layer.

**Architecture split (two distinct layers):**
- **App-serving layer**: `catalog_inventory` (public schema, Drizzle-managed) — upserted hourly, read by domain repository. Keyed on `(colorId, sizeId)`. Already has `lastSyncedAt` column.
- **Analytics layer**: `raw.ss_activewear_inventory` (raw schema, append-only) — dbt reads for trend analysis. Keyed on `sku + _loaded_at`.

**Sync design**: Inventory sync calls `/v2/inventory/` (190k SKUs, ~40MB). To map `sku → (colorId, sizeId)`, the script loads a lookup from `raw.ss_activewear_products` (has `sku + colorName + sizeName`) + catalog tables at startup. This decouples inventory sync (hourly) from pricing sync (daily) — no double-API-call needed.

---

## Requirements (R)

| ID   | Requirement                                                                                                | Status                |
| ---- | ---------------------------------------------------------------------------------------------------------- | --------------------- |
| R0   | Inventory risk is visible to Gary when selecting garments for a quote                                      | Core goal             |
| R1   | Inventory data refreshes hourly without manual intervention                                                | Must-have             |
| R2   | Per-SKU granularity: size × color stock levels are individually queryable                                  | Must-have             |
| R3   | Warehouse-level data is captured to support future delivery lead time estimation                           | Must-have             |
| R4   | Low stock triggers a dismissible warning with override — not a hard block                                  | Must-have             |
| R5   | Garment catalog has a "show in-stock only" toggle                                                          | Must-have             |
| R6   | At quote finalization: on-demand inventory check runs and a point-in-time snapshot is recorded before send | 🟡 Deferred — blocked by quote persistence (no backend yet) |
| R7   | Backend pipeline enables future inventory analytics (trend reports, lead time modeling)                    | Nice-to-have          |
| R8   | Industry-standard stock buffer threshold — research before hardcoding a number                             | 🟡 Resolved — no industry standard; use configurable 1.5× default |

---

## Shape A: Append-only raw table + dbt staging view + Vercel cron

Mirrors the pricing pipeline pattern (issue #597). New `raw.ss_activewear_inventory` table, append-only with a 48h retention window to control volume. Hourly Vercel cron pulls bulk inventory. dbt staging view dedups and computes `total_qty`. App reads from staging view (Pattern #2 — SQL view, always-fresh).

| Part   | Mechanism                                                                                                             | Flag |
| ------ | --------------------------------------------------------------------------------------------------------------------- | :--: |
| **A1** | **Raw table** — `raw.ss_activewear_inventory`: `(sku, sku_id_master, style_id_external, warehouses JSONB, _loaded_at, _source)`. Append-only. Drizzle migration. |      |
| **A2** | **Retention policy** — scheduled deletion of rows older than 48h (cron job in sync script or Vercel cron) to prevent unbounded growth (190k rows/hr × 24 = 4.5M rows/day without pruning) |  ⚠️  |
| **A3** | **Bulk sync script** — `scripts/run-inventory-sync.ts`: calls `/v2/inventory/` (no params — returns all 190,224 SKUs), batch inserts into raw table, applies ss-client auth + rate limit pattern |      |
| **A4** | **Vercel cron** — `vercel.json` cron entry calling `POST /api/catalog/sync-inventory` hourly; admin-secret auth                                                |      |
| **A5** | **dbt staging view** — `stg_ss_activewear__inventory`: dedup via `ROW_NUMBER() PARTITION BY sku ORDER BY _loaded_at DESC`, expand JSONB warehouses to rows, compute `total_qty` as SUM of per-warehouse qty |      |
| **A6** | **dbt source YAML** — extend `_ss_activewear__sources.yml` with `ss_activewear_inventory` table, freshness check warn after 2h / error after 4h                |      |
| **A7** | **Domain entity** — `InventoryLevel { sku, styleIdExternal, warehouseAbbr, qty, totalQty, loadedAt }`. Port: `IInventoryRepository { getForStyle(styleId): Promise<InventoryLevel[]>, getForSkus(skus: string[]): Promise<InventoryLevel[]> }` |      |
| **A8** | **Supabase repository** — `SupabaseInventoryRepository` queries `staging.stg_ss_activewear__inventory` via Drizzle `.existing()` (read-only, no Drizzle schema ownership)  |      |
| **A9** | **On-demand endpoint** — `POST /api/catalog/sync-inventory` (shared with cron trigger) + `GET /api/supplier/inventory?style=X` for style-scoped refresh at quote-time |      |
| **A10** | **Quote snapshot** — DEFERRED. Blocked by quote persistence work (no `quotes` or `quote_line_items` DB tables exist yet). Tracked separately. |      |
| **A11** | **UI — catalog filter** — "Show in-stock only" toggle reads from inventory repository; filters `catalog_styles` by styles with `total_qty > 0`                          |      |
| **A12** | **UI — size selector badges** — `GarmentDetailDrawer` size grid shows per-SKU stock indicators (in-stock / low / out); data from `getForStyle()` fetched on drawer open |      |
| **A13** | **UI — low stock warning** — Dismissible warning when any line-item size has `available < orderQty × shop_inventory_buffer_multiplier` (default 1.5×). Does not block. Threshold configurable in shop settings. |      |

---

## Shape B: Upsert raw table + materialized view + pg_cron

Same raw table concept but **upsert** on `sku` (replace-latest semantics, no append). Materialized view refreshed by pg_cron hourly instead of always-fresh SQL view.

| Part   | Mechanism                                                                                                             | Flag |
| ------ | --------------------------------------------------------------------------------------------------------------------- | :--: |
| **B1** | **Raw table** — same schema as A1 but with unique constraint on `sku` and `ON CONFLICT (sku) DO UPDATE` in sync script. No retention needed. |      |
| **B2** | **pg_cron job** — Supabase `pg_cron` extension, hourly `REFRESH MATERIALIZED VIEW CONCURRENTLY staging.inventory_levels`. Requires Supabase Team plan or Edge Function setup. |  ⚠️  |
| **B3** | **Materialized view** — `staging.inventory_levels`: pre-aggregated `total_qty`, warehouse breakdown, `in_stock` boolean. Fast reads for catalog. |      |
| B4–B10 | Same as A7–A13                                                                                                        |      |

---

## Shape C: Reactive per-style fetch + Redis cache (no raw table)

No raw table, no dbt. All inventory fetched on-demand when Gary opens a garment. Redis caches per-style for 5 minutes.

| Part   | Mechanism                                                                                                             | Flag |
| ------ | --------------------------------------------------------------------------------------------------------------------- | :--: |
| **C1** | **SSActivewearAdapter.getInventoryForStyle()** — calls `?style=<numericStyleID>` on demand; reuses ss-client auth     |      |
| **C2** | **Redis cache** — Upstash key `inventory:style:{styleId}`, 5-min TTL. Falls back to API on miss.                     |      |
| **C3** | **No raw table, no dbt pipeline** — inventory not persisted to DB                                                    |      |
| **C4** | **UI — size selector badges** — driven by C1/C2, loaded when drawer opens                                            |      |
| **C5** | **Catalog "in-stock" filter** — NOT supported: filtering catalog requires style-level totals across all styles, which would require fetching all 4,808 styles — 4,808 API calls |  ⚠️  |

---

## Fit Check

| Req | Requirement                                                                                                | Status                        | A   | B   | C   |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------- | --- | --- | --- |
| R0  | Inventory risk is visible to Gary when selecting garments for a quote                                      | Core goal                     | ✅  | ✅  | ✅  |
| R1  | Inventory data refreshes hourly without manual intervention                                                | Must-have                     | ✅  | ✅  | ❌  |
| R2  | Per-SKU granularity: size × color stock levels are individually queryable                                  | Must-have                     | ✅  | ✅  | ✅  |
| R3  | Warehouse-level data is captured to support future delivery lead time estimation                           | Must-have                     | ✅  | ✅  | ❌  |
| R4  | Low stock triggers a dismissible warning with override — not a hard block                                  | Must-have                     | 🟡 ✅ | ❌  | ❌  |
| R5  | Garment catalog has a "show in-stock only" toggle                                                          | Must-have                     | ✅  | ✅  | ❌  |
| R6  | At quote finalization: on-demand inventory check runs and point-in-time snapshot recorded before send      | 🟡 Deferred                   | n/a | n/a | n/a |
| R7  | Backend pipeline enables future inventory analytics (trend reports, lead time modeling)                    | Nice-to-have                  | ✅  | ❌  | ❌  |
| R8  | Industry-standard stock buffer threshold — research before hardcoding                                      | 🟡 Resolved                   | 🟡 ✅ | —   | —   |

**Notes:**

- R4 now ✅ for Shape A: Spike 1 resolved — no industry standard found; decision is configurable `shop_inventory_buffer_multiplier` (default 1.5×). A13 flag lifted.
- R6 deferred for all shapes: Spike 2 found the quote backend doesn't exist (UI-only toasts). Snapshot is blocked by quote persistence work — separate issue needed.
- R8 resolved: Spike 1 complete. Configurable threshold approach adopted; documents rationale.
- B fails R4: upsert semantics mean no historical data for trend-based threshold tuning.
- B fails R7: upsert destroys historical inventory data — no trend analysis possible.
- C fails R1: no hourly background sync — only refreshes when a drawer is opened.
- C fails R3: warehouses fetched but not persisted — no lead time modeling foundation.
- C fails R5: catalog-level "in-stock only" filter requires 4,808 simultaneous API calls — infeasible.

---

## Decision Points Log

| # | Decision | Options Considered | Choice | Rationale |
|---|---|---|---|---|
| 1 | Append-only vs upsert for raw table | Append-only + 48h retention (A) vs upsert replace-latest (B) | **Append-only + retention** | Preserves historical inventory data for analytics (R7). Retention window controls volume at ~190k × 48 = 9.1M rows max. Consistent with pricing pipeline pattern. |
| 2 | Serving pattern | SQL view (A, Pattern #2) vs materialized view + pg_cron (B, Pattern #4) | **SQL view (Pattern #2)** | Always-fresh reads; avoids pg_cron infra. 190k rows with index on `(sku, _loaded_at)` keeps per-style queries fast. pg_cron would require Supabase Team plan. |
| 3 | Sync trigger | Vercel cron vs pg_cron vs manual admin endpoint | **Vercel cron (hourly)** | Reuses existing infra; no new Supabase config. Admin endpoint dual-purpose: cron target + on-demand trigger at quote time. |
| 4 | Warehouse storage | JSONB array on raw row vs expanded one-row-per-warehouse | **JSONB on raw row** | Expanded = ~2M rows/run × 24 = 48M/day (too much). JSONB keeps 190k rows/run. dbt staging expands JSONB for analytics queries. |
| 5 | App-serving layer | Read dbt staging view vs read `catalog_inventory` directly | **`catalog_inventory` (public schema, Drizzle)** | Table already exists (Issue #618 pre-built it). App repositories read public schema via Drizzle — consistent with all other domain data. dbt reads raw schema for analytics only. |
| 6 | Sync API endpoint | `/v2/inventory/` vs `/v2/products/` | **`/v2/inventory/`** | Lighter payload (no pricing fields). Requires sku→catalogIds lookup built from `raw.ss_activewear_products` at sync start. Keeps inventory and pricing syncs independent (hourly vs daily). |
| 7 | Quote snapshot (R6) | Include in this pipeline vs defer to quote persistence work | **Deferred** | No `quotes` or `quote_line_items` DB tables exist. Snapshot requires quote persistence as prerequisite. Separate issue to track. |

---

## Resolved Spikes

### ✅ Spike 1: Industry-Standard Inventory Buffer (R8) — RESOLVED

**Finding:** No published industry standard exists. Each distributor calculates buffers using demand forecasting + lead time analysis. S&S doesn't expose availability calculation logic. PromoStandards defines real-time qty endpoints but not "low stock" status codes.

**Decision:** Configurable `shop_inventory_buffer_multiplier` shop setting (default `1.5`). If `available_qty < order_qty × multiplier`, show low-stock warning. Gary can tune the multiplier in shop settings.

---

### ✅ Spike 2: Quote Finalization Snapshot (R6) — RESOLVED (deferred)

**Finding:** No quote backend exists. `EmailPreviewModal.tsx:handleSend()` fires a toast and nothing else. No `quotes` or `quote_line_items` DB tables exist. `catalog_inventory` table exists in Drizzle schema (pre-built by Issue #618) and is the natural serving layer.

**Decision:** R6 (quote snapshot) deferred to a future issue, blocked by quote persistence work. This pipeline (#600) scopes to raw table + dbt + sync + UI indicators only. A separate issue will track snapshot at send-time.

| S2 Question | Answer |
|---|---|
| S2-Q1 — Send action location | `EmailPreviewModal.tsx` + `QuoteReviewSheet.tsx` — UI-only toasts, no server action |
| S2-Q2 — JSONB column available | No. No `quote_line_items` table exists yet |
| S2-Q3 — Snapshot contents | Per-SKU + per-size: `{ capturedAt, lineItems: [{ garmentId, colorId, bySize: { size: { requested, availableAtCapture } } }] }` |
| S2-Q4 — API unavailability | Read from `catalog_inventory` (potentially stale but acceptable). Email fire-and-forget. Pattern from `session.ts` + `pricing/actions.ts` |
