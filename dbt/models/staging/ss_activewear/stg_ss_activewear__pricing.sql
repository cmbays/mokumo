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
        style_name,
        brand_name,
        color_name,
        color_code,
        color_price_code_name as color_price_group,
        size_name,
        size_code,
        size_price_code_name as size_price_group,
        cast(piece_price as numeric(10, 4)) as piece_price,
        cast(dozen_price as numeric(10, 4)) as dozen_price,
        cast(case_price as numeric(10, 4)) as case_price,
        cast(case_qty as integer) as case_qty,
        cast(customer_price as numeric(10, 4)) as customer_price,
        cast(map_price as numeric(10, 4)) as map_price,
        cast(sale_price as numeric(10, 4)) as sale_price,
        sale_expiration,
        gtin,
        _loaded_at as loaded_at,
        _source as source,
    from deduplicated
    where _rn = 1
)

select * from renamed
