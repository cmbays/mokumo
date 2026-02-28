{{ config(materialized='table') }}

{#
  Color group dimension — one row per distinct color_group_name.
  Grain: color_group_name (surrogate key: color_group_key).
  Source: public.catalog_colors (OLTP read — acceptable at 30k rows; re-evaluate at 500k).
  Populated after migration sync run (color_group_name IS NOT NULL).

  Note: color_group_name is more specific than color_family_name — it represents
  S&S's more granular color grouping (e.g. 'Navy', 'Royal Blue', 'Sky Blue') vs
  color_family_name's broader buckets. Both fields coexist in catalog_colors.
  This mart supports analytics on color group distribution and popularity.
  The catalog filter UI reads color groups directly from catalog_colors (OLTP)
  for real-time freshness — this mart is for reporting and analytics only.
#}

with colors as (
    select *
    from {{ source('catalog', 'catalog_colors') }}
    where color_group_name is not null
),

groups as (
    select
        color_group_name,
        count(distinct style_id) as style_count,
        count(*) as swatch_count,
        -- Representative hex: most common hex1 in this group.
        -- Null hex1 values are ignored by mode(). Groups with all-null hex1
        -- produce representative_hex = NULL — acceptable.
        mode() within group (order by hex1) as representative_hex
    from colors
    group by color_group_name
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['color_group_name']) }} as color_group_key,
        color_group_name,
        style_count,
        swatch_count,
        representative_hex,
        'catalog' as source
    from groups
)

select * from final
