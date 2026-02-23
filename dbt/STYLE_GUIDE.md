# dbt Style Guide — Screen Print Pro Analytics

> Canonical reference for all dbt development. Every model, test, and YAML file must follow these conventions.

---

## Model Naming Prefixes

| Prefix | Layer             | Example                               |
| ------ | ----------------- | ------------------------------------- |
| `stg_` | Staging           | `stg_ss_activewear__pricing.sql`      |
| `int_` | Intermediate      | `int_supplier_pricing__conformed.sql` |
| `dim_` | Dimension (marts) | `dim_product.sql`                     |
| `fct_` | Fact (marts)      | `fct_supplier_pricing.sql`            |
| `agg_` | Aggregate (marts) | `agg_daily_order_summary.sql`         |
| `brg_` | Bridge (marts)    | `brg_customer_product.sql`            |
| `mrt_` | Mart-level rollup | `mrt_revenue_dashboard.sql`           |

## Model File Naming

- **Staging**: `stg_[source]__[entity].sql` — double-underscore separates source from entity
- **Intermediate**: `int_[entity]__[verb].sql` — verb describes the transformation
- **Marts**: `[prefix]_[entity].sql` — plain entity name with type prefix

## Directory Structure

```
models/
  staging/
    [source_name]/
      _[source]__sources.yml      # Source definitions
      _stg_[source]__models.yml   # Model docs + tests
      stg_[source]__[entity].sql  # One model per source entity
  intermediate/
    [business_domain]/
      _int_[domain]__models.yml
      int_[entity]__[verb].sql
  marts/
    [business_domain]/
      _[domain]__models.yml
      dim_[entity].sql
      fct_[entity].sql
```

## Column Naming

| Convention             | Suffix/Prefix                | Examples                       |
| ---------------------- | ---------------------------- | ------------------------------ |
| Surrogate keys         | `_key`                       | `product_key`, `supplier_key`  |
| Natural / foreign keys | `_id`                        | `style_id`, `supplier_id`      |
| Timestamps             | `_at`                        | `created_at`, `loaded_at`      |
| Date-only              | `_date`                      | `effective_date`, `order_date` |
| Booleans               | `is_` / `has_`               | `is_current`, `has_pricing`    |
| Prices / money         | `_price`, `_cost`, `_amount` | `unit_price`, `case_cost`      |
| Counts                 | `_count`, `_qty`             | `order_count`, `case_qty`      |

## SQL Style

All SQL follows the dbt-labs convention:

- **All lowercase** — keywords, functions, types, identifiers
- **4-space indent** — consistent across all models
- **Trailing commas** — easier diffs, fewer merge conflicts
- **Explicit `as`** — always `select col as alias`, never implicit
- **CTE-first** — no nested subqueries; each CTE references one source/model
- **Ordinal `group by`** — `group by 1, 2, 3` not column names
- **`!=`** not `<>` for inequality
- **`coalesce`** over `ifnull`/`nvl`
- **One model, one source** — staging models read from exactly one source table
- **No `select *`** except as `select * from final_cte` — explicitly list columns in transform CTEs
- **`{{ config() }}` on line 1** — model config block must be the first line of every model file

### CTE Naming Convention

| Layer            | Standard CTE Names                       | Purpose                                         |
| ---------------- | ---------------------------------------- | ----------------------------------------------- |
| **Staging**      | `source` → `deduplicated` → `renamed`    | Raw read → dedup → rename/cast to conventions   |
| **Intermediate** | `pricing` → `transformed` → `final`      | Descriptive verb-based names for each transform |
| **Marts**        | `dim_*` / `fct_*` refs → joins → `final` | Join dimensions + facts → business logic        |

### Dedup Pattern (Staging)

All staging models that read from append-only raw tables must dedup:

```sql
deduplicated as (
    select
        *,
        row_number() over (
            partition by sku
            order by _loaded_at desc
        ) as _rn,
    from source
),

renamed as (
    select
        -- explicit column list with renames and casts
    from deduplicated
    where _rn = 1
)
```

### NULL Handling

- **`nullif(col, '')` before type casts** — guard varchar-to-numeric/integer casts against empty strings
- **`null` means "unbounded"** for range columns (e.g. `max_qty = null` means no upper limit)
- **Never `coalesce` to a magic number** for range boundaries — filter out the row instead if the value is required for the range to be meaningful

### Union / Unpivot Style

When manually unpivoting with `union all`, comment each branch:

```sql
-- Piece tier
select ... from price_groups where piece_price is not null

union all

-- Dozen tier
select ... from price_groups where dozen_price is not null
```

### Example: Staging Model

```sql
with source as (
    select * from {{ source('ss_activewear', 'ss_activewear_products') }}
),

deduplicated as (
    select
        *,
        row_number() over (
            partition by sku
            order by _loaded_at desc
        ) as _rn,
    from source
),

renamed as (
    select
        sku,
        style_id_external as style_id,
        color_price_code_name as color_price_group,
        size_price_code_name as size_price_group,
        cast(piece_price as numeric(10, 4)) as piece_price,
        cast(nullif(case_qty, '') as integer) as case_qty,
        _loaded_at as loaded_at,
    from deduplicated
    where _rn = 1
)

select * from renamed
```

## YAML Style

- **2-space indent**
- Config files: `_[dir]__models.yml` (underscore prefix, double-underscore separator)
- Source files: `_[source]__sources.yml`
- Every model MUST have a `description` in its YAML config
- Every column in staging and mart models SHOULD have a `description`

## Materialization Strategy

| Layer        | Materialization       | Rationale                                                                                                      |
| ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Staging      | `view`                | Zero storage cost, always fresh, debuggable (`select * from staging.stg_*`)                                    |
| Intermediate | `ephemeral` (default) | Building blocks, avoid table bloat; promote to `table` when reused by 3+ models or when transform is expensive |
| Marts        | `table`               | Final consumption layer, app reads directly, needs stable schema                                               |
| Snapshots    | `snapshot`            | SCD Type 2 history tracking                                                                                    |

Override the default materialization in model config when needed:

```sql
{{ config(materialized='table') }}
```

## Testing Standards

### By Layer

| Layer             | Required Tests                                                                     | Recommended                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Sources**       | `freshness` (warn 48h, error 168h), `not_null` + `unique` on natural keys          | `accepted_values` on enums, `dbt_expectations.expect_column_values_to_be_between` on numerics |
| **Staging**       | `not_null` + `unique` on PK (post-dedup)                                           | Type casting validation, `dbt_expectations.expect_column_to_exist`                            |
| **Intermediate**  | `not_null` + `unique` on surrogate key, business rule tests                        | `relationships` to upstream, custom data tests for invariants                                 |
| **Marts (dims)**  | `not_null` + `unique` on `_key`, referential integrity to facts                    | SCD tests, `accepted_values` on type columns                                                  |
| **Marts (facts)** | `not_null` on all FK `_key` columns, `relationships` to each dim, grain uniqueness | Value range checks, `dbt_expectations` for statistical bounds                                 |

### Rule

Every model MUST have at minimum `not_null` + `unique` on its primary key. No exceptions.

## Surrogate Keys

Generate via `dbt_utils.generate_surrogate_key()` — produces deterministic MD5 hash from input columns. Always name the output column with `_key` suffix.

```sql
{{ dbt_utils.generate_surrogate_key(['source', 'style_id', 'color_price_group', 'size_price_group']) }} as price_group_key
```

## Packages

| Package                          | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `dbt-labs/dbt_utils`             | Surrogate keys, date spines, generic tests          |
| `metaplane/dbt_expectations`     | Statistical/range tests (Great Expectations-style)  |
| `dbt-labs/codegen`               | Scaffolding macros for new sources and models       |
| `dbt-labs/dbt_project_evaluator` | 27 rules across 6 categories — DAG, naming, testing |
