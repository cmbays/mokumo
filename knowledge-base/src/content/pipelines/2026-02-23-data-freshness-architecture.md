---
title: 'Data Freshness Architecture — Tiered Serving Strategy'
subtitle: 'Six serving patterns for OLTP, analytics, and hybrid data in Screen Print Pro'
date: 2026-02-23
phase: 2
pipelineName: 'Data Freshness Architecture'
pipelineType: horizontal
products: []
tools: [dbt, supabase, drizzle, redis]
stage: shape
tags: [architecture, analytics]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0223-dbt-gold'
status: complete
---

## Context

As the analytics pipeline matured from raw sync (#589) through staging/intermediate (#590) to gold/marts (#591), a key design question emerged: **how does the app choose which serving pattern to use for each type of data?**

Not all data has the same freshness requirements. Transactional data (quotes, jobs) must be instant. Supplier reference pricing can be daily. Dashboard aggregations can tolerate hours of staleness. A one-size-fits-all approach either over-provisions (expensive real-time for everything) or under-provisions (stale data where freshness matters).

## Decision

Adopted a **six-pattern tiered serving strategy** documented in `dbt/ARCHITECTURE.md`. Each data category maps to a specific pattern based on who writes it, whether it needs transforms, and how fresh it must be.

## Rationale

### Why Tiered (Not One-Size-Fits-All)

- **Cost efficiency**: Real-time reads (Pattern 1) are free but can't do complex transforms. dbt tables (Pattern 5) handle complex transforms but are batch. Matching pattern to need avoids paying for unnecessary freshness.
- **Operational simplicity**: PostgreSQL as unified OLTP+OLAP engine (no Snowflake, no BigQuery) keeps the stack simple for a single-operator screen printing shop.
- **Escape hatch**: Staging views (Pattern 2) provide always-fresh reads of supplier data without waiting for `dbt run`. If a customer calls about pricing mid-day, the staging view has the latest sync data.

### Why PostgreSQL as Unified Engine

- Screen printing SaaS workloads are modest: ~100K SKUs, ~10K quotes/year, single-digit concurrent users initially.
- PostgreSQL handles both OLTP and OLAP at this scale without read replicas.
- Supabase's managed PostgreSQL provides backups, connection pooling, and auth with zero ops burden.
- Scale path is clear: RLS for multi-tenancy (Phase 2), read replicas for query offloading (Phase 3).

### Why Staging Views as Escape Hatch

- Staging models are materialized as `view` (not table), so they always reflect the latest raw data.
- The app can query `staging.stg_ss_activewear__pricing` directly for near-real-time pricing.
- This avoids the need for real-time dbt runs or stream processing.

## Canonical Reference

The full architecture document lives at `dbt/ARCHITECTURE.md` and covers:

- Six serving patterns with freshness/use-case mapping
- Data category classification (A–E)
- Decision framework flowchart
- Multi-tenancy scale path
- Caching layer stack (Next.js + Redis + Materialized Views)
- Schema ownership boundaries (Drizzle vs dbt)
- Medallion layer flow diagram

## Related

- Issue #589: dbt project setup + PostgreSQL schema foundation
- Issue #590: raw-to-intermediate pricing pipeline
- Issue #591: Gold dimensional models + app pricing read path
- `memory/analytics-architecture.md`: Running decisions log
