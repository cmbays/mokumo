# dbt Architecture — Data Freshness & Serving Strategy

> Canonical reference for how Mokumo serves data from multiple freshness tiers. See `STYLE_GUIDE.md` for SQL/YAML conventions.

---

## Six Data Serving Patterns

| #   | Pattern                     | Freshness                    | Best For                                           |
| --- | --------------------------- | ---------------------------- | -------------------------------------------------- |
| 1   | Direct Table Read           | Real-time                    | Transactional data (quotes, jobs, preferences)     |
| 2   | SQL View                    | Real-time (computed on read) | Simple joins/transforms needing always-fresh data  |
| 3   | Application Cache (Redis)   | Configurable TTL             | Expensive queries that don't change often          |
| 4   | Materialized View (pg_cron) | Scheduled (minutes–hours)    | Dashboard aggregations needing sub-daily freshness |
| 5   | dbt Table (batch)           | Scheduled (daily–hourly)     | Complex multi-step transforms, dimensional models  |
| 6   | dbt Incremental Model       | Scheduled but fast refresh   | Large append-only fact tables                      |

---

## Data Category Mapping

| Category                   | Data Types                               | Pattern                             | Freshness |
| -------------------------- | ---------------------------------------- | ----------------------------------- | --------- |
| **A: Transactional**       | Quotes, jobs, invoices, shop settings    | #1 Direct OLTP                      | Instant   |
| **B: Preferences**         | Favorites, enable/disable, display prefs | #1 Direct OLTP + optimistic UI      | Instant   |
| **C: Supplier Reference**  | Base pricing tiers, product dimensions   | #5 dbt Table                        | Daily     |
| **D: Volatile External**   | Inventory, sale prices (future)          | #2 View or #4 Materialized View     | Hourly    |
| **E: Dashboard Analytics** | Simple counts/sums                       | #2 SQL View                         | Real-time |
| **E: Dashboard Analytics** | Complex margins/trends                   | #4 Materialized View + #5 dbt Table | 2–4 hours |

---

## Key Architectural Decisions

1. **Transactional data never flows through dbt.** App reads/writes directly from `public.*` tables managed by Drizzle.
2. **Preferences stay in OLTP.** dbt reads them as a source for analytics; the app never reads preferences from dbt output.
3. **Staging views are the near-real-time escape hatch.** Always-fresh reads without waiting for `dbt run`. The staging layer is materialized as `view` by default.
4. **Supplier base pricing is daily-batch.** S&S Activewear pricing changes infrequently — daily `dbt run` is sufficient.
5. **Dashboard freshness is hybrid.** Simple counts via SQL views (real-time), complex analytics via materialized views (2–4h) or dbt tables (daily+).

---

## Decision Framework

When adding a new data use case, follow this tree:

```
User writes this data? ──YES──→ Pattern 1 (Direct OLTP in public.*)
         │
         NO
         │
         ▼
  Needs transforms? ──NO──→ Pattern 1 or 2 (direct read / simple view)
         │
        YES
         │
         ▼
     How fresh?
         │
    Real-time ──→ Pattern 2 (SQL View in staging)
    Hourly    ──→ Pattern 4 (Materialized View via pg_cron)
    Daily     ──→ Pattern 5 (dbt Table in marts)
```

---

## Multi-Tenancy & Scale Path

| Phase             | Strategy                       | Trigger                                                         |
| ----------------- | ------------------------------ | --------------------------------------------------------------- |
| **Phase 1 (now)** | Single database, single tenant | Current state                                                   |
| **Phase 2**       | Shared DB + RLS                | Multiple shops (already schema-ready with `shop_id`/`scope_id`) |
| **Phase 3**       | Read replicas                  | Dashboard query offloading (Supabase Team/Enterprise tier)      |

PostgreSQL handles screen printing SaaS scale comfortably through Phase 3. No exotic infra needed.

---

## Caching Layers

| Layer  | Technology                    | TTL Strategy                 | Use Case                                          |
| ------ | ----------------------------- | ---------------------------- | ------------------------------------------------- |
| **L1** | Next.js Route/Data Cache      | `revalidatePath()` on writes | Page-level caching, ISR                           |
| **L2** | Upstash Redis                 | TTL-based, cache-aside       | Expensive queries (e.g. supplier pricing lookups) |
| **L3** | PostgreSQL Materialized Views | pg_cron scheduled refresh    | Dashboard aggregations                            |

**Cache invalidation**: Writes trigger `revalidatePath()` (L1). Redis keys expire via TTL (L2). Materialized views refresh on cron (L3). dbt tables rebuild on `dbt run` (batch).

---

## Schema Ownership

| Schema         | Owner   | Managed By             | App Access                         |
| -------------- | ------- | ---------------------- | ---------------------------------- |
| `public`       | Drizzle | Drizzle Kit migrations | Read/Write                         |
| `raw`          | Drizzle | Drizzle Kit migrations | Write (sync), Read (admin)         |
| `staging`      | dbt     | `dbt run` (views)      | Read-only (escape hatch)           |
| `intermediate` | dbt     | `dbt run` (tables)     | Not accessed by app                |
| `marts`        | dbt     | `dbt run` (tables)     | Read-only (primary analytics path) |
| `snapshots`    | dbt     | `dbt snapshot`         | Not accessed by app                |

The `schemaFilter` in `drizzle.config.ts` only includes `['public', 'raw']` — Drizzle Kit never generates migrations for dbt-managed schemas.

---

## Medallion Layer Flow

```
raw.ss_activewear_products          ← Sync writes (append-only)
        │
        ▼
staging.stg_ss_activewear__pricing  ← dbt view (dedup, rename, cast)
        │
        ▼
intermediate.int_supplier_pricing   ← dbt table (conform tiers to ranges)
   __conformed
        │
        ▼
marts.dim_product                   ← dbt table (style-level attributes)
marts.dim_supplier                  ← dbt table (from seed)
marts.dim_price_group               ← dbt table (color/size price groups)
marts.dim_date                      ← dbt table (date spine)
marts.fct_supplier_pricing          ← dbt table (pricing facts)
        │
        ▼
App reads via Drizzle .existing()   ← Repository + Redis cache (15min TTL)
```
