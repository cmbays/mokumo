---
title: 'H2 File Upload Pipeline — Wave 2: Artwork Library Page + E2E Tests'
subtitle: 'Schema revised to piece/variant hierarchy, upload sheet two-step flow, responsive library page, and Playwright E2E journey tests — H2 fully closed'
date: 2026-03-02
phase: 2
pipelineName: 'H2 File Upload Pipeline'
pipelineType: horizontal
products: []
domains: ['artwork', 'devx']
tools: []
stage: build
tags: ['build', 'schema', 'testing']
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0302-h2-w2a-artwork-library'
status: complete
---

## Summary

Wave 2 of the H2 File Upload Pipeline — the final wave, closing H2. Built the global `/artwork` library page and its E2E test suite, but the session began with a significant schema revision driven by Paper design sessions and a user data-model objection.

**PRs**: #765 (W2A — artwork library page) · #766 (W2B — E2E tests)

---

## Schema Revision: Flat → Three-Level Hierarchy

The original W1A schema stored uploaded files in a flat `artwork_versions` table. Paper design sessions (artboards N and O) revealed the need for a richer structure: a named concept that groups multiple colorways, each of which can have multiple uploaded files.

**Revised hierarchy:**

- `artwork_pieces` — named concept (`"Front Logo"`) scoped to shop or customer
- `artwork_variants` — specific colorway/treatment (`"Navy on White"`) with `color_count` and `internal_status` lifecycle
- `artwork_versions` — content-addressed file store (SHA-256 dedup), now FK'd to `artwork_variants.id`

**Migrations:**

- `0027` — added `artwork_pieces`, `artwork_variants`, `artwork_versions.variant_id` FK
- `0028` — added explicit `scope` discriminator column + biconditional CHECK constraint

---

## Key Decision: Explicit Scope vs Nullable FK as Discriminator

**The objection**: The original design used `customer_id IS NULL` to mean "shop-owned" — a nullable FK doing double duty as a discriminator.

> "I'm not a big fan of the strategy of a null meaning it's the shops. That's not really good data practice."

**The fix** (migration 0028):

```sql
ALTER TABLE "artwork_pieces" ADD COLUMN "scope" text DEFAULT 'shop' NOT NULL;
ALTER TABLE "artwork_pieces" ADD CONSTRAINT "artwork_pieces_scope_check"
  CHECK (
    (scope = 'shop'     AND customer_id IS NULL) OR
    (scope = 'customer' AND customer_id IS NOT NULL)
  );
```

The biconditional CHECK enforces the invariant at the DB level — scope and customer_id are always consistent. The FK was also changed from `ON DELETE SET NULL` to `ON DELETE RESTRICT` because silent nulling would violate the constraint (leaving `scope='customer'` with `customer_id=NULL`).

**Takeaway**: When a nullable FK encodes two distinct states (has customer / no customer), make the discrimination explicit with an enum column and enforce the biconditional at the schema level.

---

## Upload UX: Two-Step Sheet

The upload interaction was revised from a centered Dialog (one step: file drop immediately) to a right-side Sheet with two steps:

- **Step 1**: Piece Name (required) + Design Name (required) + Colors (optional, 1–16)
  - Fires `createArtworkPieceAndVariant` server action atomically before any file is involved
  - Returns `variantId` which is pre-wired into step 2
- **Step 2**: File drop zone — `useFileUpload` hook with `variantId` injected into `onInitiate`
  - `artwork_version` row is created pre-linked to its variant on INSERT (no subsequent UPDATE)

This eliminates orphaned version rows and aligns the data model: you know the piece/variant names before you pay the storage cost.

---

## CI Build Fix: Deferred DB Import

The `/artwork` page initially had `db` as a top-level import. Even with `export const dynamic = 'force-dynamic'`, the build crashed with `DATABASE_URL is not set`:

**Root cause**: Next.js evaluates the page module to _read_ the `dynamic` export. If the module throws during evaluation (because `db.ts` throws synchronously when `DATABASE_URL` is absent), `force-dynamic` is never reached.

**Fix**: Move `db`, `artworkPieces`, and `drizzle-orm` imports inside the async function body using `await import()`. The throw is deferred to request time when `DATABASE_URL` is guaranteed present. This is the established pattern in `garments/page.tsx` (with an explanatory comment).

```typescript
export const dynamic = 'force-dynamic'

export default async function ArtworkPage() {
  // Dynamic import: db.ts throws at module-evaluation time when DATABASE_URL absent
  const { db } = await import('@shared/lib/supabase/db')
  const { artworkPieces } = await import('@db/schema/artworks')
  const { eq, and, desc } = await import('drizzle-orm')
  // ...
}
```

---

## Responsive Library Page

`ArtworkLibraryClient` renders the piece grid and upload trigger:

- **Grid**: `grid-cols-2 gap-3` mobile → `md:grid-cols-3 md:gap-4` → `lg:grid-cols-4`
- **Header**: stacked on mobile, inline on desktop (`flex-col → md:flex-row`)
- **Upload button**: `w-full min-h-(--mobile-touch-target)` on mobile, `md:w-auto` on desktop
- **PieceCard**: `aspect-ratio: 1/1` thumbnail area, `hover:border-action/30`, `isFavorite` star in `fill-warning`
- **EmptyState**: surface-direct (no card box), no duplicate CTA — text only with muted icon

**Design principle applied**: "Content lives directly on surfaces, not boxed in cards." The empty state had a `bg-elevated border border-border` wrapper which the user flagged; removing it was the right call.

---

## E2E Test Suite (W2B)

Three journey slices, all adapted for the two-step Sheet flow:

| Journey         | What's tested                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **V1**          | Upload button visible, sheet opens with metadata form, submit disabled until both fields filled, step 2 idle drop zone renders correctly |
| **V2**          | `.txt` file → "Unsupported file type" error + error border; retry with PNG clears error                                                  |
| **V3**          | >50 MB file → "File exceeds 50 MB limit" error + error border; retry clears error                                                        |
| **V1 extended** | Valid PNG transitions state machine away from idle; full success card test (skips gracefully if no live Supabase)                        |

Key pattern: `advanceToFileStep()` fills and submits the metadata form before any file input interaction. Tests that can't reach step 2 (server action unavailable in CI) skip rather than error — clean CI dashboards.

---

## Session Resume

```
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```

## Artifact Links

- PR #765 — W2A: artwork library page (squash merged to main `a56b657`)
- PR #766 — W2B: E2E tests (squash merged to main `393dc74`)
- Prior wave: `2026-03-02-h2-storage-foundation.md` (W0 + W1)
