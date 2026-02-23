{{ config(materialized='table') }}

{#
  Supplier dimension — one row per supplier.
  Sourced from the dim_supplier_seed CSV.
  Extensible: add SanMar, alphabroder, etc. as new rows in the seed.
#}

with seed as (
    select * from {{ ref('dim_supplier_seed') }}
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['supplier_code']) }} as supplier_key,
        supplier_code,
        supplier_name,
        website,
        is_active
    from seed
)

select * from final
