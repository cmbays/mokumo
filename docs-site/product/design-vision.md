---
title: Design Vision
description: Architectural decision records and design philosophy for Mokumo.
---

# Design Vision

> Living ADR (Architectural Decision Record) log. Each entry captures a significant design choice with context, decision, and consequences.

## Design Philosophy

**"Linear Calm + Raycast Polish + Neobrutalist Delight"**

Mokumo draws from three design lineages:

- **Linear's calm**: Dark, focused, information-dense interfaces that respect the user's attention
- **Raycast's polish**: Keyboard-navigable, responsive, feels fast even when doing heavy work
- **Neobrutalist delight**: Bold shadows on CTAs, strong type hierarchy, personality without clutter

The result: a tool that feels like it was built by someone who runs a print shop, not someone who designs SaaS marketing pages.

---

## Decision Records

### ADR-001: Universal Lanes Over Production-Specific Columns

**Context**: Phase 1 originally used 6 production-specific board columns (Design, Film, Burn, Press, QC, Ship). This broke for non-screen-printing services.

**Decision**: Replace with 5 universal lanes (Ready, In Progress, Review, Blocked, Done) + service-specific task checklists within each lane.

**Consequences**: Same board works for all service types. Production steps tracked via task checkboxes, not column position. Trade-off: less visual granularity on the board, more detail in job detail view.

---

### ADR-002: Zod-First Type System

**Context**: Need consistent data validation across client, server, and database layers.

**Decision**: Define Zod schemas as the single source of truth. Derive TypeScript types via `z.infer<>`. No separate interfaces.

**Consequences**: One schema validates forms, API payloads, and database rows. Adding a field means updating one schema. Trade-off: Zod runtime overhead (negligible for our scale).

---

### ADR-003: Drizzle Over Prisma

**Context**: Need an ORM for Supabase PostgreSQL with TypeScript type safety.

**Decision**: Drizzle ORM — TypeScript-native, no binary engine, Zod integration via `drizzle-zod`, full SQL control.

**Consequences**: Schema-as-code in TypeScript. Migrations via `drizzle-kit`. Composable queries. Trade-off: less ecosystem tooling than Prisma, steeper learning curve for complex joins.

---

### ADR-004: Supabase All-in-One Over Multi-Vendor

**Context**: Need database + auth + file storage + realtime. Options: Supabase, Vercel Postgres + Clerk + Vercel Blob, PlanetScale + NextAuth.

**Decision**: Supabase — $0 dev, ~$25/mo prod. One SDK, one dashboard, native RLS.

**Consequences**: Auth, storage, and realtime share one connection. RLS provides row-level security without application-layer guards. Trade-off: vendor lock-in on auth (mitigated by standard SQL + portable schema).

---

### ADR-005: URL State Over Global State Libraries

**Context**: Filters, search terms, pagination, and view preferences need to persist across navigation.

**Decision**: URL query params for all UI state. No Redux, Zustand, Jotai, or Recoil.

**Consequences**: State is shareable (copy URL), bookmarkable, and survives page reloads. Server components can read state from the URL. Trade-off: URL can get long with many filters (mitigated by sensible defaults and optional params).

---

### ADR-006: Service-Type Polymorphism via Task Templates

**Context**: Screen printing, DTF, and DTF press have different production steps but share the same lifecycle (quote → job → invoice).

**Decision**: Service type determines which task template auto-populates when a job is created. Shared entity model with service-type-specific behavior via canonical task lists.

**Consequences**: One `jobs` table, one board, one set of components. Service type is a property, not a separate codepath. Trade-off: custom production steps require template configuration, not code changes.

---

_New ADRs added as significant decisions are made._

## Related Documents

- [Product Design](/product/product-design) — scope and constraints
- [Tech Stack](/engineering/architecture/tech-stack) — tool choices and rationale
- [Architecture](/engineering/architecture/system-architecture) — layer structure

> **Org-level foundations**: Mokumo's design ADRs implement principles from our organization-wide [Design Philosophy](https://breezy-bays-labs.mintlify.app/breezy-bays-labs/design) and [Engineering Standards](https://breezy-bays-labs.mintlify.app/breezy-bays-labs/engineering).
