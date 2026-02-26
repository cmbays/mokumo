{{ config(materialized='table') }}

{#
  Color family dimension — one row per distinct color_family_name.
  Grain: color_family_name (surrogate key: family_key).
  Source: public.catalog_colors (OLTP read — acceptable at 30k rows; re-evaluate at 500k).
  Populated after migration 0016 + sync run (color_family_name IS NOT NULL).
#}

with colors as (
    select *
    from {{ source('catalog', 'catalog_colors') }}
    where color_family_name is not null
),

families as (
    select
        color_family_name,
        count(distinct style_id)    as style_count,
        count(*)                    as swatch_count,
        -- Representative hex: most common hex1 in this family.
        -- Null hex1 values are ignored by mode(). Families with all-null hex1
        -- produce representative_hex = NULL — acceptable.
        mode() within group (order by hex1) as representative_hex
    from colors
    group by color_family_name
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['color_family_name']) }} as family_key,
        color_family_name,
        style_count,
        swatch_count,
        representative_hex,
        'catalog' as source
    from families
)

select * from final
