{% macro generate_schema_name(custom_schema_name, node) -%}
    {#
        Override dbt's default schema naming.

        By default dbt concatenates: <target_schema>_<custom_schema>
        (e.g., "public_marts"). We want clean schema names that match
        our PostgreSQL schemas exactly: staging, intermediate, marts, snapshots.

        If a custom schema is set (via +schema in dbt_project.yml),
        use it directly. Otherwise fall back to the target schema.
    #}
    {%- if custom_schema_name is none -%}
        {{ target.schema }}
    {%- else -%}
        {{ custom_schema_name | trim }}
    {%- endif -%}
{%- endmacro %}
