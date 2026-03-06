---
shaping: true
---

# Data Access Layer — Frame

## Source

> We should address issue 158 first, but we should also begin with doing full research to look at data access layer best practices for mature projects. Then understand if we should just build that from the beginning because we're an AI agent-driven project. We not only can build quickly, but also that mature structure and organization ends up benefiting us much more in the long run to build it first, because it prevents confusion, context rot, and other issues. Let's pick up 158 and let's prepare to do a full pipeline for it, beginning with robust research.

> I think this is actually broader than the API integration as well. We should create a data access layer epic that looks at how we move our entire project into best practices for data access layers and to provide us a secure foundation for our backend and middleware.

> Let's also have a review agent spin up and look out for security issues and security best practices when we make sure we have strong SecOps on our data access layer.

Sources: Session conversation (2026-02-16), DAL research synthesis (`docs/research/2026-02-16-dal-architecture-research.md`), codebase audit (45 import sites mapped), best practices research (Next.js, Drizzle, Supabase), AI-agent workflow analysis (Spotify, Cal.com, Payload CMS), security audit (in progress).

---

## Problem

Mokumo's data access is a monolith: one 2,429-line file (`lib/mock-data.ts`) exports 16 entity arrays, 5 config values, and 13 query functions. 45 files across all 7 verticals import directly from it. This creates four compounding problems:

1. **No abstraction boundary** — Adding Supabase in Phase 2 means rewriting 45 files simultaneously. There's no seam to swap data sources without touching every consumer.

2. **No security insertion point** — There is nowhere to add auth verification, DTO shaping, or `server-only` guards before data reaches components. When real users exist, every component would need individual security hardening.

3. **Agent-hostile architecture** — AI agents working in parallel worktrees all touch `mock-data.ts`, causing merge conflicts. A fresh agent session must parse 2,429 lines to understand any vertical's data needs (~400 lines of context when only ~50 are relevant).

4. **Business logic scattered** — Filter, join, and projection logic is duplicated across 30+ components. The 4 helper files (`garment-helpers.ts`, `screen-helpers.ts`, `color-preferences.ts`, `board-projections.ts`) are the right pattern but lack an abstraction boundary — they still import directly from mock-data.

This debt compounds daily: every new feature adds more direct imports, and Phase 2 backend work is blocked until the seam exists.

---

## Outcome

A structured Data Access Layer (`lib/dal/`) that:

1. **Is the single import path** for all data in the application — components never import from `mock-data.ts` or `db/` directly
2. **Supports zero-disruption backend swap** — changing from mock data to Supabase requires modifying only provider files, not consumers
3. **Enables per-entity incremental migration** — each domain (customers, jobs, quotes...) can be migrated independently, in separate agent sessions
4. **Acts as a security boundary** — auth, DTO shaping, and server-only guards live in one architectural layer
5. **Reduces agent context by 8-20x** per vertical — each domain file is ~50-100 lines of typed function signatures
6. **Eliminates mock-data merge conflicts** — parallel agents work on different domain files without touching shared state
7. **Is operational in Phase 1** — zero user-visible change (mock data still serves UI), purely architectural improvement
