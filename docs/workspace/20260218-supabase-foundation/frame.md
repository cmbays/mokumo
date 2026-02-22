---
shaping: true
pipeline: 20260218-supabase-foundation
epic: '#529'
stage: shaping
---

# Supabase Foundation — Frame

## Source

> "Do we already have an epic for getting Supabase set up? I think we're gonna have to do all of that work in order to enable the basic backend and kickoff."
>
> "I think that we should really go through the whole design system thinking for bringing in Supabase. Let's create an epic for it specifically."
>
> "Make sure those questions are logged on the epic and we're actually gonna start with a research."
>
> — Christopher Bays, 2026-02-18

> **From ROADMAP.md Phase 2 key bets:**
> "Backend horizontal: Supabase setup, auth, data model, API patterns (#84)"

---

## Problem

Phase 1 is complete — all 7 verticals built with mock data, Gary demo on Feb 21. The app runs entirely on in-memory mock data with no persistence, no auth, and no real API connections.

To begin Phase 2 (real data, real users), we need a backend foundation before any vertical can connect to production data. Concretely:

1. **No persistence** — every server restart loses state. Quotes, jobs, invoices, customers all live in `MockAdapter` memory.
2. **No real auth** — only the demo access code (`4Ink-demo`). No user sessions, no token management.
3. **No catalog sync** — garment/product data comes from S&S API via adapter, but we have no local cache layer and no way to query/filter it at rest.
4. **Duplicate schema definitions** — domain entities in `src/domain/entities/` are defined independently from any DB model. When the DB arrives, these will drift unless we establish a single source of truth.
5. **No migration history** — no tooling to manage schema evolution. Phase 2 changes will be irreversible without it.

Without this foundation, we can't connect any vertical to real data, can't give Gary a real account, and can't sync the S&S catalog.

---

## Outcome

A backend foundation that enables:

1. **Gary can log in** with email + password and his session is persisted across browser restarts.
2. **Any vertical can read/write real data** by replacing its `MockAdapter` with a Supabase-backed repository — without changing the call sites.
3. **Garment catalog is populated** from S&S API and queryable at rest (not fetched on every request).
4. **Schema has a migration history** — every change tracked, reversible, and CI-gated.
5. **No code duplication** between Zod domain schemas and DB schema definitions.

This is horizontal infrastructure. No vertical is "done" by this epic — it just makes all verticals connectable.
