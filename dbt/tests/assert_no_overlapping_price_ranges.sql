{#
  Custom data test: verify no overlapping quantity ranges within the same
  price group. A self-join finds pairs where [min_qty_a, max_qty_a] overlaps
  [min_qty_b, max_qty_b] for the same (source, style_id, color_price_group,
  size_price_group). Returns zero rows = pass.

  Null max_qty is treated as infinity (unbounded case tier).
#}

with pricing as (
    select * from {{ ref('int_supplier_pricing__conformed') }}
),

overlaps as (
    select
        a.price_range_key as key_a,
        b.price_range_key as key_b,
        a.source,
        a.style_id,
        a.color_price_group,
        a.size_price_group,
        a.tier_name as tier_a,
        b.tier_name as tier_b,
        a.min_qty as min_qty_a,
        a.max_qty as max_qty_a,
        b.min_qty as min_qty_b,
        b.max_qty as max_qty_b,
    from pricing as a
    inner join pricing as b
        on a.source = b.source
        and a.style_id = b.style_id
        and a.color_price_group = b.color_price_group
        and a.size_price_group = b.size_price_group
        and a.price_range_key < b.price_range_key
    where
        -- Overlap condition: a.min <= b.max AND b.min <= a.max
        -- Null max_qty = unbounded, so treat as always overlapping
        a.min_qty <= coalesce(b.max_qty, a.min_qty)
        and b.min_qty <= coalesce(a.max_qty, b.min_qty)
)

select * from overlaps
