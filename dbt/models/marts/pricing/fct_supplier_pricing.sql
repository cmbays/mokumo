{{
    config(
        materialized='table',
        indexes=[
            {'columns': ['product_key', 'is_current', 'effective_date'], 'type': 'btree'},
            {'columns': ['supplier_key'], 'type': 'btree'},
            {'columns': ['price_group_key'], 'type': 'btree'},
        ]
    )
}}

{#
  Supplier pricing fact table.
  Grain: one row per product x supplier x price_group x tier x effective_date.

  Joins the conformed intermediate model to all three business dimensions
  via natural key matching. effective_date is a degenerate dimension (stored
  on the fact, not FK to dim_date). dim_date is available for enrichment
  joins but not referentially constrained.

  SCD fields (effective_date, is_current) are schema-ready for when the
  snapshot activates — currently all rows are is_current = true.
#}

with conformed as (
    select * from {{ ref('int_supplier_pricing__conformed') }}
),

dim_product as (
    select * from {{ ref('dim_product') }}
),

dim_supplier as (
    select * from {{ ref('dim_supplier') }}
),

dim_price_group as (
    select * from {{ ref('dim_price_group') }}
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key([
            'c.source',
            'c.style_id',
            'c.color_price_group',
            'c.size_price_group',
            'c.tier_name',
        ]) }} as pricing_fact_key,

        -- Dimension foreign keys
        dp.product_key,
        ds.supplier_key,
        dpg.price_group_key,

        -- Degenerate dimensions
        c.tier_name,
        current_date as effective_date,
        true as is_current,

        -- Measures
        c.min_qty,
        c.max_qty,
        c.unit_price,
    from conformed as c

    inner join dim_product as dp
        on c.source = dp.source
        and c.style_id = dp.style_id

    inner join dim_supplier as ds
        on c.source = ds.supplier_code

    inner join dim_price_group as dpg
        on c.source = dpg.source
        and c.color_price_group = dpg.color_price_group
        and c.size_price_group = dpg.size_price_group
)

select * from final
