{{ config(materialized='table') }}

{#
  Conform S&S Activewear fixed pricing tiers (piece, dozen, case) into
  universal quantity ranges: { min_qty, max_qty, unit_price, tier_name }.

  This makes S&S pricing interchangeable with PromoStandards-style quantity
  breaks, so the marts layer can consume any supplier without knowing their
  pricing structure.

  Grain: one row per (source, style_id, color_price_group, size_price_group, tier_name).
#}

with pricing as (
    select * from {{ ref('stg_ss_activewear__pricing') }}
),

{#
  Group to distinct price groups. Multiple SKUs (color+size combos) can share
  the same price group — we only need one price per group per tier.
#}
price_groups as (
    select
        source,
        style_id,
        brand_name,
        style_name,
        color_price_group,
        size_price_group,
        -- Take the first non-null value in each group (all should be identical)
        max(piece_price) as piece_price,
        max(dozen_price) as dozen_price,
        max(case_price) as case_price,
        max(case_qty) as case_qty,
    from pricing
    group by 1, 2, 3, 4, 5, 6
),

{#
  Unpivot: one row per tier with quantity range boundaries.
  - piece:  min=1, max=11 (dozen starts at 12)
  - dozen:  min=12, max=case_qty-1 (or null if no case_qty)
  - case:   min=case_qty, max=null (unbounded upper end)
#}
unpivoted as (
    -- Piece tier
    select
        source,
        style_id,
        brand_name,
        style_name,
        color_price_group,
        size_price_group,
        'piece' as tier_name,
        1 as min_qty,
        11 as max_qty,
        piece_price as unit_price,
    from price_groups
    where piece_price is not null

    union all

    -- Dozen tier (excluded when case_qty <= 12: the dozen range [12, case_qty-1]
    -- would be empty or nonsensical, so only piece and case tiers apply)
    select
        source,
        style_id,
        brand_name,
        style_name,
        color_price_group,
        size_price_group,
        'dozen' as tier_name,
        12 as min_qty,
        case
            when case_qty is not null then case_qty - 1
            else null
        end as max_qty,
        dozen_price as unit_price,
    from price_groups
    where dozen_price is not null
        and (case_qty is null or case_qty > 12)

    union all

    -- Case tier
    select
        source,
        style_id,
        brand_name,
        style_name,
        color_price_group,
        size_price_group,
        'case' as tier_name,
        case_qty as min_qty,
        cast(null as integer) as max_qty,
        case_price as unit_price,
    from price_groups
    where case_price is not null
        and case_qty is not null
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key([
            'source',
            'style_id',
            'color_price_group',
            'size_price_group',
            'tier_name',
        ]) }} as price_range_key,
        source,
        style_id,
        brand_name,
        style_name,
        color_price_group,
        size_price_group,
        tier_name,
        min_qty,
        max_qty,
        unit_price,
    from unpivoted
)

select * from final
