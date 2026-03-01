with source as (
    select * from {{ source('ss_activewear', 'ss_activewear_inventory') }}
),

deduplicated as (
    select
        *,
        row_number() over (
            partition by sku
            order by _loaded_at desc
        ) as _rn
    from source
),

latest as (
    select * from deduplicated
    where _rn = 1
),

expanded as (
    select
        sku,
        sku_id_master,
        style_id_external,
        _loaded_at,
        _source,
        warehouse
    from latest,
    lateral jsonb_array_elements(warehouses) as warehouse
),

renamed as (
    select
        sku,
        sku_id_master,
        style_id_external                                   as style_id,
        (warehouse ->> 'warehouseAbbr')                     as warehouse_abbr,
        cast((warehouse ->> 'skuID') as bigint)             as warehouse_sku_id,
        cast((warehouse ->> 'qty') as integer)              as qty,
        sum(cast((warehouse ->> 'qty') as integer)) over (
            partition by sku
        )                                                   as total_qty,
        _loaded_at                                          as loaded_at,
        _source                                             as source
    from expanded
)

select * from renamed
