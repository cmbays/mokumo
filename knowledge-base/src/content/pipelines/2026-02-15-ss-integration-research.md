---
title: 'S&S Activewear Integration Research Phase'
subtitle: '4-agent parallel research: security, standards, architecture, infrastructure'
date: 2026-02-15
phase: 2
pipelineName: meta
pipelineType: horizontal
products: []
domains: [garments]
tools: [knowledge-base]
stage: research
tags: [research, plan, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'main'
status: complete
---

## Summary

Launched 4 parallel research agents to investigate all dimensions of integrating S&S Activewear's REST API into Mokumo. This is the foundation research for Phase 2 backend work.

## Research Agents

### 1. Security Researcher

**Focus**: API proxy hardening for S&S integration

**Key findings**:

- 4 must-fix blockers before go-live:
  1. Endpoint whitelisting (no generic proxy — SSRF risk)
  2. Pricing data stripping (`customerPrice` is commercially sensitive)
  3. Distributed rate limiting (Upstash Redis — in-memory fails on Vercel serverless)
  4. S&S rate limit circuit breaker (`X-Rate-Limit-Remaining` header monitoring)
- Additional: credential isolation, response caching, error sanitization, Zod request validation

### 2. Standards Researcher

**Focus**: Industry standard formats across distributors

**Key findings**:

- **PromoStandards** is the universal industry standard (200+ members, 11 SOAP/XML services)
- All 3 major distributors (S&S, SanMar, alphabroder) implement PromoStandards Product 2.0, Media 1.1, Inventory 2.0
- S&S is unique: offers both proprietary REST API AND PromoStandards SOAP endpoints
- S&S acquired alphabroder (Oct 2024) — 2 of 3 distributors now under one company
- **GTIN (UPC)** is the single most reliable cross-reference key across distributors
- No universal color naming standard — each distributor uses proprietary names
- Competitors (Printavo, shopVOX, DecoNetwork) all build per-supplier adapters
- **PSRESTful** provides REST/JSON proxy over PromoStandards for 430+ suppliers ($99-299/mo)

### 3. Architecture Researcher

**Focus**: Multi-supplier adapter pattern design

**Key findings**:

- `SupplierAdapter` interface with 7 methods (getStyle, searchCatalog, getInventory, etc.)
- `CanonicalStyle` schema for normalized product representation
- `CacheStore` abstraction (InMemory → Upstash Redis)
- `MockAdapter` wraps existing mock-data.ts for backward compatibility
- Color registry with exact match → fuzzy match → auto-create strategy
- Migration path: MockAdapter → SSActivewearAdapter → PromoStandardsAdapter

### 4. Infrastructure Architect

**Focus**: Demo-to-production maturity path

**Key findings**:

- **DAL (Data Access Layer)** is the highest-leverage action — create `lib/dal/` with async mock passthrough, then swap internals for Supabase queries later
- Recommended stack: **Supabase** (DB + Auth + Storage + Realtime) + **Drizzle ORM** (TypeScript-native, Zod integration)
- Cost: $0 during development, ~$45/mo in production (Supabase Pro + Vercel Pro)
- Entity migration order based on dependency graph (reference data → Customer → Quote → Job → Invoice)
- 35+ files currently import directly from `mock-data` — each new feature adds more debt
- tRPC not recommended (overkill for single-user app, DAL + Zod already provides type safety)
- Estimated total migration effort: 8-12 weeks

## Decisions Made

1. **S&S REST API V2** as the primary starting point (not PromoStandards SOAP)
2. **SupplierAdapter pattern** for multi-supplier extensibility from day one
3. **DAL introduction** as the immediate next step (pre-API-key)
4. **Supabase + Drizzle** as the recommended production stack (pending user approval)

## Artifacts

- [Research Synthesis Document](https://github.com/cmbays/mokumo/blob/main/docs/research/2026-02-15-ss-integration-research-synthesis.md)

## Next Steps

Pre-API-key work (can start immediately):

1. Create `lib/dal/` with mock passthrough for all entities
2. Update 35+ files to import from DAL
3. Design SupplierAdapter interface + MockAdapter
4. Define Route Handler structure for S&S proxy
5. Set up Upstash Redis for distributed rate limiting

Post-API-key work: 6. Build SSActivewearAdapter with endpoint whitelisting 7. Wire catalog browsing to real S&S data 8. Replace mockup engine tinting with real product photos 9. Add inventory availability to garment selection 10. Build cache layer (Upstash Redis)

<div class="gary-question" data-question-id="devx-ss-q1" data-pipeline="devx" data-status="unanswered">
  <p class="gary-question-text">Do you want to use SanMar or alphabroder in addition to S&S Activewear, or is S&S sufficient for now?</p>
  <p class="gary-question-context">S&S acquired alphabroder, so APIs may converge. SanMar requires separate PromoStandards SOAP integration. This affects whether we need multi-supplier support in Phase 2 or can defer to Phase 3.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="devx-ss-q2" data-pipeline="devx" data-status="unanswered">
  <p class="gary-question-text">Is the $45/month production cost (Supabase Pro + Vercel Pro) acceptable for the production app?</p>
  <p class="gary-question-context">This covers database, authentication, file storage, real-time updates, and hosting. The alternative is $0 on free tiers during development with a pause risk after 7 days of inactivity.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
