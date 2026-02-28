---
shaping: true
pipeline: 20260226-640-color-favorites
issue: 640
date: 2026-02-27
stage: pre-shaping
---

# Issue #640 — Color Group Favorites: Design Session Notes

Continuation of `interview-notes.md`. Covers the mockup design session on 2026-02-27 that resolved
key open questions and produced visual artifacts. Use this + `interview-notes.md` as input to shaping.

---

## Mockup Artifacts

Two interactive mockup pages built at `src/app/(dashboard)/mockup/` (gitignored, dev-only):

| File                                                   | Route                      | Purpose                                  |
| ------------------------------------------------------ | -------------------------- | ---------------------------------------- |
| `src/app/(dashboard)/mockup/brands/page.tsx`           | `/mockup/brands`           | Summary view — cross-brand, read-only    |
| `src/app/(dashboard)/mockup/brands/configure/page.tsx` | `/mockup/brands/configure` | Configure view — single brand, full edit |

Both render inside the real dashboard shell with real design tokens.

---

## Extended Decisions (Design Session)

These supplement D1–D6 in `interview-notes.md`.

### D7: Two distinct UX modes — Summary and Configure

| Mode          | View                                                        | Access                                                  | Interactions                               |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| **Summary**   | All favorited brands, each with their saved colors + styles | Default landing for garment favorites                   | Read-only. "Configure →" link per brand.   |
| **Configure** | Single brand: Colors tab + Styles tab                       | Via "Configure →" from summary, or "Add brand" dropdown | Full write — star/unstar colors and styles |

Navigation: Summary → "Configure →" → single-brand Configure. Configure → "← Garment Favorites" → Summary.

### D8: "Add brand" flow

- Summary header has an "Add brand" button (not a pill chip row at the bottom)
- Clicking opens a dropdown listing all non-favorited brands
- Selecting a brand: navigates to Configure for that brand; brand is favorited by default on arrival
- Rationale: Dropdown is cleaner and more professional than inline pills; scales to many brands

### D9: Unfavoriting a brand — soft-delete behavior

- Unfavoriting a brand is done from the Configure page (star next to brand name)
- Unfavorited brand no longer appears in the Summary
- **The brand's saved colors and styles are NOT wiped** — preferences persist in DB
- If the brand is re-favorited later, all prior selections come back
- Rationale: Preserve user work; shop may cycle a brand in/out seasonally

### D10: Disable/enable is separate from favorite/unfavorite

- `is_enabled` on brand and garment style = hard hide from all UI surfaces and customer preferences
- `is_favorite` = ordering/prominence only
- Disabling is more drastic: hides from quote picker, customer prefs, everywhere
- Re-enabling restores all favorites and preferences intact (same soft-delete principle as D9)
- A non-favorited brand that has favorited colors/styles still surfaces those in quote picker (just not prominently)

### D11: Color favoriting requires single-brand context (single-select)

- Colors are favorited per-brand: you're setting `{brand: S&S, colorGroup: Navy}`, not Navy globally
- Configure page enforces single-brand — no multi-select confusion
- In the Summary (multi-brand view), color grid is read-only — no configuration permitted there
- Cross-brand color group taxonomy (colorGroupName) is shared; preference records are brand-scoped

### D12: Color section layout in Configure — strict separation

```
★ Favorites  [count]
[swatch] [swatch] [swatch] ...
[overflow row if many]

────────────────────

All colors
[swatch] [swatch] [swatch] ...
```

- Favorited colors: their own zone, flow into as many rows as needed
- Non-favorited colors: completely separate below the divider
- No mixing. No overflow from favorites into non-favorites row.

### D13: Star placement convention — always top-right

- Color swatches: `position: absolute; top: 0.5; right: 0.5`
- Style cards: `position: absolute; top: 1.5; right: 1.5`
- Applies everywhere — configure page, summary page, and future surfaces (quote picker, customer page)
- On hover (non-favorited items): star fades in at top-right; on favorited items: always visible

### D14: Summary page is read-only

- No inline favoriting from the summary view
- The summary shows the configured state; all changes go through Configure
- This keeps the summary's purpose clear: "see what you have" not "change what you have"
- Rationale: Simpler mental model, avoids accidental changes when scanning

### D15: Prices always shown on style cards

- No "Prices" toggle — prices display by default on all garment cards
- Rationale: Price is almost always relevant context; hiding it adds friction

### D16: Mobile responsive split

- Desktop: Panel sidebar for brand nav (Option B pattern)
- Mobile: Sticky horizontal chip row for brand nav (Option A pattern)
- Touch targets on mobile badges need ≥ 44px vertical height
- Brand chip row is sticky so it stays accessible while scrolling

---

## User Journeys (Final — Three Journeys)

### Journey 1: Brand deep-dive (single-brand configure)

**Goal**: Configure one brand's color and style favorites.

1. Land on Summary page (`/garments/favorites` or similar)
2. Find the brand → click "Configure →"
3. On Configure page: pick Colors tab
   - Favorites section shows current saved colors
   - All colors section below — click star on any swatch → immediately moves to Favorites
4. Pick Styles tab
   - Same two-section pattern — favorite styles at top, all styles below
   - Click star on a card → immediately moves to Favorites
5. Brand star in header: toggle brand favoriting (soft-delete behavior)
6. Back to summary via breadcrumb

**Key constraint**: Colors are configured one brand at a time. No cross-brand color editing.

### Journey 2: Cross-brand favorites overview (read-only)

**Goal**: See a summary of all favorited brands, their colors, and their styles.

1. Land on Summary page
2. Three sections visible (S&S, Gildan, Bella+Canvas etc.)
3. Each section shows: saved color swatches (with stars) + saved style cards (with stars)
4. From here → "Configure →" to edit a specific brand
5. "Add brand" button → dropdown → select → go to Configure for new brand

**Key property**: Read-only. No changes possible from this view.

### Journey 3: Brand exploration (adding a new brand)

**Goal**: Discover a brand not yet favorited, decide to add it.

1. On Summary → "Add brand" button
2. Dropdown lists all non-favorited brands
3. Select a brand → navigate to Configure for that brand
4. Brand is favorited by default on arrival
5. Set up colors and styles
6. Return to Summary — new brand section now visible

---

## Open Questions — Resolved in Design Session

| #   | Question                                      | Resolution                                                                                                           |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| OQ1 | UI treatment for favorites                    | Two-page model (Summary + Configure). Summary shows saved items; Configure has two-section layout (favorites / all). |
| OQ5 | Favoriting = ordering/filtering or hard-hide? | Ordering/prominence only. Non-favorited brands still accessible via "Add brand".                                     |

---

## Open Questions — Still Open for Shaping

| #   | Question                                                                                            | Priority                        |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------- |
| OQ2 | How to set customer preferences from Garments page — where is customer context activated?           | High — needed for breadboarding |
| OQ3 | Multi-brand summary view + customer context — does a selected customer filter/override the summary? | High                            |
| OQ4 | No customer preferences set → fall through to shop favorites entirely?                              | Medium                          |
| OQ6 | URL structure: `/garments/favorites` vs `/garments?view=favorites` vs new nav entry?                | Medium                          |
| OQ7 | "Garment Favorites" — where does it live in the sidebar nav? New item, or under Garments dropdown?  | Medium                          |
| OQ8 | Empty state: first-time user with no brands favorited — what does the Summary page show?            | Low                             |

---

## Data Model Constraints (confirmed from interview + codebase)

| Constraint                                                           | Source           |
| -------------------------------------------------------------------- | ---------------- |
| `catalogColorPreferences` stores by `color_id` — not colorGroupName  | Codebase finding |
| New abstraction needed: group-level color preferences (brand-scoped) | D4 + D11         |
| `catalogStylePreferences` already has brand-scope — may be reusable  | Codebase finding |
| No `catalogBrandPreferences` table yet                               | Codebase finding |
| Customer-scoped preferences: no table yet                            | OQ2-4 deferred   |
| Wave 3 `ColorFilterGrid` operates at colorGroupName — must align     | D4               |
| Unfavorite/disable never wipes data (soft-delete principle)          | D9 + D10         |

---

## UX Conventions Established

These carry forward to all garment-related surfaces (quote picker, customer page):

1. **Star = always top-right** on cards and swatches
2. **Two-section layout**: Favorites (with count) → divider → All [items]
3. **No mixing** of favorited and non-favorited items in the same row
4. **Immediate action**: star click = instant favorite toggle, no confirmation
5. **Read-only summary, write-only configure**: clear mode separation
6. **"Add brand" pattern**: dropdown → configure → favorited by default

---

## Input for Shaping Session

The shaping session should use:

1. `interview-notes.md` — source quotes + D1–D6
2. This file (`design-session-notes.md`) — D7–D16, user journeys, open questions
3. Mockup at `http://localhost:3001/mockup/brands` (dev server) as visual reference

Key shape questions to resolve in shaping:

- Data model: what tables/columns are needed for brand + color group + style preferences?
- Customer scope: how does OQ2/OQ3 get solved (customer selector on Garments page)?
- Navigation: does this become a new page, a sub-view of Garments, or a settings area?
- Waves: what ships in V1 vs later? (Brand + color + style for shop scope is likely V1; customer scope may be V2)
