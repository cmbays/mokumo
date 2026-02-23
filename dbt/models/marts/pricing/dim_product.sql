{{ config(materialized='table') }}

{#
  Product dimension — one row per (source, style_id).
  Deduplicates from the staging view to style-level attributes.
  GTIN takes the first non-null value across SKUs for the style.
#}

with pricing as (
    select * from {{ ref('stg_ss_activewear__pricing') }}
),

deduplicated as (
    select
        source,
        style_id,
        style_name as product_name,
        brand_name,
        -- Take the first non-null GTIN across all SKUs for this style
        max(gtin) as gtin,
    from pricing
    group by 1, 2, 3, 4
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['source', 'style_id']) }} as product_key,
        source,
        style_id,
        product_name,
        brand_name,
        gtin,
    from deduplicated
)

select * from final
