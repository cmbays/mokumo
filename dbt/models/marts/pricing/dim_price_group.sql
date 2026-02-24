{{ config(materialized='table') }}

{#
  Price group dimension — one row per (source, color_price_group, size_price_group).
  Distinct combinations from the intermediate conformed pricing model.
  Colors/sizes in the same group share identical pricing tiers.
#}

with conformed as (
    select * from {{ ref('int_supplier_pricing__conformed') }}
),

distinct_groups as (
    select distinct
        source,
        color_price_group,
        size_price_group
    from conformed
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['source', 'color_price_group', 'size_price_group']) }} as price_group_key,
        source,
        color_price_group,
        size_price_group
    from distinct_groups
)

select * from final
