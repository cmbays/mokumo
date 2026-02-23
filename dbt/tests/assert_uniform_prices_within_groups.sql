{#
  Custom data test: verify that all SKUs within the same price group
  (source, style_id, color_price_group, size_price_group) have identical
  pricing. The intermediate model uses max() aggregation which would silently
  pick the highest value if prices differ — this test surfaces that data
  quality issue.

  Returns zero rows = pass.
#}

with pricing as (
    select * from {{ ref('stg_ss_activewear__pricing') }}
),

non_uniform as (
    select
        source,
        style_id,
        color_price_group,
        size_price_group,
        count(distinct piece_price) as distinct_piece_prices,
        count(distinct dozen_price) as distinct_dozen_prices,
        count(distinct case_price) as distinct_case_prices,
    from pricing
    where piece_price is not null
    group by 1, 2, 3, 4
    having
        count(distinct piece_price) > 1
        or count(distinct dozen_price) > 1
        or count(distinct case_price) > 1
)

select * from non_uniform
