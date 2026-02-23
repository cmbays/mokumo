{{ config(materialized='table') }}

{#
  Date dimension — one row per calendar day from 2024-01-01 to 2028-12-31.
  ~1,826 rows. Used for time-based analysis joins on effective_date.
  Natural key (date_key = the date itself, no surrogate needed).
#}

with date_spine as (
    {{ dbt_utils.date_spine(
        datepart="day",
        start_date="cast('2024-01-01' as date)",
        end_date="cast('2028-12-31' as date)"
    ) }}
),

final as (
    select
        cast(date_day as date) as date_key,
        extract(year from date_day) as year,
        extract(quarter from date_day) as quarter,
        extract(month from date_day) as month_number,
        to_char(date_day, 'Month') as month_name,
        extract(day from date_day) as day_of_month,
        extract(isodow from date_day) as day_of_week_number,
        to_char(date_day, 'Day') as day_of_week_name,
        extract(week from date_day) as week_of_year,
        case
            when extract(isodow from date_day) in (6, 7) then true
            else false
        end as is_weekend,
    from date_spine
)

select * from final
