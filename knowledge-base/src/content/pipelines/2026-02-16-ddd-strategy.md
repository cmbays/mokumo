---
title: 'DDD Architecture Strategy'
subtitle: 'Domain-Driven Design as the architectural lens for project classification'
date: 2026-02-16
phase: 2
pipelineName: 'Infrastructure'
pipelineType: horizontal
products: []
tools: []
stage: research
tags: [research, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0216-ddd-strategy-doc'
status: complete
---

## Summary

Established Domain-Driven Design (DDD) as the architectural lens for classifying, organizing, and building Mokumo. Created `docs/DDD_STRATEGY.md` as a living blueprint answering all 9 research questions from issue #316.

## Research Questions Answered

1. **Industry best practices** - DDD strategic design (bounded contexts, context maps) and tactical design (entities, value objects, aggregates). Strategic decisions matter more than tactical patterns.
2. **Entity mapping** - Mapped all 24 Zod schemas to DDD concepts: entities vs. value objects, aggregate roots and boundaries, bounded contexts (Quoting, Production, Billing, CRM, Shared Kernel).
3. **Classification definitions** - Product (things users DO), Domain (things products USE), Tool (how we BUILD). Each with litmus tests, examples, and DDD layer mappings.
4. **Data architecture** - One table per aggregate root, cross-aggregate references by ID only, domain event table for async context communication, Supabase-specific patterns.
5. **PM tooling** - Label migration from flat `vertical/*` to structured `product/*` / `domain/*` / `tool/*` / `pipeline/*`. Issue template and project board field updates.
6. **Work orchestrator** - Pipeline type inference rules from labels. Product features get vertical pipelines, domain/tool features get horizontal pipelines.
7. **Best practices per classification** - Routing patterns (products get top-level routes, domains get settings sub-pages), state management, API design per bounded context.
8. **New entity classification** - Decision flowchart with 4 worked examples (embroidery, customer portal, tax rates, Shopify integration) plus a quick reference card.
9. **Domain admin vs product UX** - Two distinct UX patterns with side-by-side comparison. Products optimize for speed/flow, domains optimize for accuracy/safety.

## Key Decisions

- **Monolith, not microservices** — bounded contexts map to logical modules, not physical services. Correct for solo-dev + AI team.
- **Shared Kernel for domains** — garments, pricing, colors, artwork are shared across bounded contexts rather than duplicated.
- **Dashboard as read-only projection** — Operations context reads events from all other contexts, never writes them.
- **Core domain = Quoting + Production** — these are the business differentiators. Billing and CRM are supporting domains.

## Bounded Context Map

Five bounded contexts identified:

- **Quoting Context** - Quote aggregate (root + line items + discounts)
- **Production Context** - Job aggregate (root + tasks + notes + history + screens)
- **Billing Context** - Invoice aggregate (root + line items + payments + audit log)
- **CRM Context** - Customer aggregate (root + contacts + addresses + groups)
- **Shared Kernel** - Garment Catalog, Pricing Engine, Color Config, Artwork Library

## Artifacts

- `docs/DDD_STRATEGY.md` — canonical strategy document (all 9 research questions)
- This KB session doc

## Related Issues

- #316 — [Research] DDD architecture strategy (this issue)
- #315 — [Tracking] Domain-Driven Design Enablement (parent)
- #317 — Create domains.json + 22 new GitHub labels (parallel, next)

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```
