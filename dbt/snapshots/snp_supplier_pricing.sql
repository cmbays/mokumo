{% snapshot snp_supplier_pricing %}

{#
  SCD Type 2 snapshot for supplier pricing.
  Tracks changes to unit_price over time per price range.

  Currently NOT actively running — will be activated when pricing
  history tracking becomes a requirement. The config is ready to go:
  just include this snapshot in `dbt snapshot` runs.

  Strategy: check-based (not timestamp) because S&S pricing updates
  are irregular and the raw table doesn't have a reliable updated_at.
#}

{{
    config(
        target_schema='snapshots',
        unique_key='price_range_key',
        strategy='check',
        check_cols=['unit_price'],
    )
}}

select * from {{ ref('int_supplier_pricing__conformed') }}

{% endsnapshot %}
