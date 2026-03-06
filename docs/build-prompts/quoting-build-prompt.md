# Quoting Vertical Build Prompt

> Copy everything below the line into a fresh Claude Code session.

---

## Build the Quoting Vertical for Mokumo

You're building the **Quoting vertical** — the first complete workflow for Mokumo, a production management app for a screen-printing shop (4Ink). Discovery is done. All specs, acceptance criteria, and design decisions are documented. Your job is to execute the build using a **team of parallel agents**.

### Context Loading (Read These First)

Read these files in order before doing anything:

1. `CLAUDE.md` — Project rules, design system tokens, coding standards, quality checklist
2. `docs/strategy/quoting-scope-definition.md` — **The BUILD spec.** CORE features, acceptance criteria, quality checklists per component. This is your primary reference.
3. `docs/strategy/mokumo-journey-quoting.md` — The improved journey design. Explains WHY each design decision was made and what friction points from Print Life we're solving.
4. `docs/reference/ss-activewear-api-reference.md` — S&S Activewear API field shapes. Our mock data MUST mirror these field names and structures so Phase 2 integration is a data source swap, not a refactor.
5. `PROGRESS.md` — Current state, what's already built (dashboard, sidebar, schemas, mock data)
6. `lib/schemas/` — Existing Zod schemas (quote.ts, garment.ts, customer.ts) that need updating
7. `lib/mock-data.ts` — Existing mock data that needs expanding
8. `app/globals.css` — Design tokens (`@theme inline` block)

### What to Build

Build the complete Quoting workflow: 3 pages + 3 reusable components + expanded mock data.

**Pages:**

- `/quotes` — Quotes List (DataTable, status filters, search, quick actions, duplicate)
- `/quotes/new` — New Quote Form (single-page, instant pricing, S&S color swatch, line items)
- `/quotes/[id]` — Quote Detail (read-only view, action buttons, breadcrumbs)

**Reusable Components:**

- `ColorSwatchPicker` — S&S-style dense color grid (white text overlay via `swatchTextColor`, search, favorites)
- `CustomerCombobox` — Type-ahead with "Add New Customer" modal
- `EmailPreviewModal` — "Send to Customer" mockup (doesn't actually send)

**Data Layer:**

- Update Zod schemas to mirror S&S API field shapes (see API reference doc)
- Expand mock data: 6 quotes (all statuses), 30-50 colors with hex + swatchTextColor, 5 garments with sizes/prices

### Team Structure (Use TeamCreate)

Create a team called `quoting-build`. Follow the orchestration patterns in `docs/AGENTS.md` (Linear / Pre-Build / Checkpoint). Phase A tasks are independent and can run in parallel inside a Pre-Build step. Phase B depends on Phase A outputs and follows as a Linear Chain.

**Phase A — Independent Work (run in parallel):**

1. **`schema-agent`** (general-purpose agent):
   - Update `lib/schemas/quote.ts` — Add line items with S&S-aligned color/garment references, notes (internal + customer), price override, revised status
   - Update `lib/schemas/garment.ts` — Add color fields (`hex`, `hex2`, `swatchTextColor`, `family`), size fields (`order`, `priceAdjustment`), `basePrice`
   - Create `lib/schemas/color.ts` — New schema mirroring S&S color structure
   - Expand `lib/mock-data.ts` — 6 quotes, 30-50 colors, 5 garments with realistic data
   - Run `npm test` to verify all schema tests pass, add new tests for new schemas

2. **`swatch-agent`** (general-purpose agent):
   - Build `components/features/ColorSwatchPicker.tsx`
   - Dense grid (~32-40px squares), minimal gap, packed tight
   - Color name in text overlaid on swatch (use `swatchTextColor` field for white vs dark text)
   - Search/filter bar above grid
   - Favorites row at top (starred colors)
   - Selected state: checkmark + border
   - Keyboard navigable (arrow keys + Enter/Space)
   - Use temporary inline mock color data (will be swapped for shared mock data later)
   - Follow design system: `globals.css` tokens, `cn()` utility, Lucide icons only

3. **`combobox-agent`** (general-purpose agent):
   - Build `components/features/CustomerCombobox.tsx` — searchable dropdown from mock customers
   - Build `components/features/AddCustomerModal.tsx` — simple modal (Name, Email, Company)
   - Type-ahead search, shows "Name — Company" format
   - "Add New Customer" option at bottom of dropdown
   - Use shadcn/ui Popover + Command pattern
   - Use temporary inline mock customer data

4. **`list-agent`** (general-purpose agent):
   - Build `app/(dashboard)/quotes/page.tsx` — Quotes List page
   - DataTable with columns: Quote #, Customer, Status, Items, Total, Date
   - Status filter tabs: All / Draft / Sent / Accepted / Declined / Revised (URL query params)
   - Search by quote # or customer name (URL query params)
   - Sortable columns
   - Quick actions per row: Edit (Draft only), Duplicate, Send (Draft only), View
   - "New Quote" primary CTA button
   - Empty state
   - Use temporary inline mock quote data
   - Add route to sidebar navigation

**Phase B — Dependent Work (after Phase A merges):**

5. **`form-agent`** (general-purpose agent):
   - Build `app/(dashboard)/quotes/new/page.tsx` — New Quote Form
   - Integrate: ColorSwatchPicker, CustomerCombobox (from Phase A)
   - Use shared mock data from lib/mock-data.ts (from Phase A)
   - Single-page form with sections: Customer, Line Items, Pricing, Notes, Actions
   - Line items: garment selector, color swatch picker, size breakdown grid, print locations (checkboxes), color count
   - Real-time client-side pricing (NEVER blocks input)
   - Price override: editable grand total with "Price adjusted from $X" indicator
   - Notes: internal (shop-only) + customer-facing (collapsed accordion)
   - Actions: "Save as Draft" (secondary), "Save & Send" (primary CTA with neobrutalist shadow)
   - Form validation with Zod schema
   - Keyboard optimized: tab through all fields

6. **`detail-agent`** (general-purpose agent):
   - Build `app/(dashboard)/quotes/[id]/page.tsx` — Quote Detail
   - Build `components/features/EmailPreviewModal.tsx`
   - Quote header: number, status badge, date, customer link
   - Line items table with totals
   - Action buttons: Edit (→ /quotes/[id]/edit), Duplicate (→ /quotes/new pre-filled), Send (→ email modal), Convert to Invoice (disabled, "Phase 2"), Download PDF (disabled, "Phase 2")
   - Breadcrumb: Dashboard > Quotes > Q-1024
   - Invalid ID → "Quote not found" error state
   - Email preview modal: To, Subject, Body template, non-functional "Send" button with toast

### Quality Standards

Every component must pass the quality checklist in `CLAUDE.md`:

- Visual hierarchy clear — primary action most prominent
- Spacing uses Tailwind tokens only (no hardcoded px)
- Colors use semantic tokens (`text-action`, `bg-action`, `shadow-action`) — never palette colors
- Status colors: Draft gray, Sent blue, Accepted green, Declined red, Revised gold
- All interactive elements: hover, focus-visible, active, disabled states
- Icons: Lucide only, consistent sizes (16/20/24px)
- Empty, loading, and error states designed
- Keyboard navigable, ARIA labels, 4.5:1 contrast minimum
- Neobrutalist shadow (`4px 4px 0px`) on primary CTAs only

### Technical Rules

- **Zod-first types**: Define schema → derive type via `z.infer<>`. No separate interfaces.
- **Server components default**: Only add `"use client"` when using hooks/events/browser APIs.
- **Phase 1 = mock data only**: No API calls, no backend. All data from `lib/mock-data.ts`.
- **URL state**: Filters, search, pagination in URL query params. No global state libraries.
- **Semantic tokens**: Use `text-action`, `bg-elevated`, `shadow-action` — never raw Tailwind palette colors.
- **`cn()` utility**: For all className merging. Never concatenate strings.
- **Existing components**: Always check `components/ui/` before building from scratch.

### After All Agents Complete

1. Run `npx tsc --noEmit` — must have zero type errors
2. Run `npm run lint` — must pass
3. Run `npm test` — all schema tests pass
4. Run `npm run build` — production build succeeds
5. Run quality-gate audit on each page
6. Create a single PR with all changes to `main`
7. Update `PROGRESS.md` with build completion
8. Create `for_human/2026-02-XX-quoting-build.html` session summary
