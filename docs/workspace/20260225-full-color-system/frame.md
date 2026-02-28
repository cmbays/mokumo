# Frame: Full Color System (Issue #618)

## Problem

The garment catalog has a functioning color filter UI and a brand-level color preference drawer, but both are wired entirely to mock data that cannot survive a page refresh. Three separate breakdowns compound each other:

**1. Fake color data in the filter.**
`ColorFilterGrid` calls `getColorsMutable()` at module initialization time — a Phase 1 mock that returns 41 hardcoded colors with slug IDs like `clr-black`. The real catalog has 30,614 rows in `catalog_colors`, each keyed by a UUID assigned at sync time. The filter grid shows the wrong colors, the wrong count, and can never match against real garments.

**2. Color filter state triggers unnecessary server round-trips.**
`useColorFilter` stores the active color selection in URL search params via `router.replace`. Every toggle causes the Next.js router to re-run server components, killing perceived responsiveness. The `showDisabled` toggle already uses local `useState` and is instant; color filter should match that pattern.

**3. Color favorites are not persisted.**
`FavoritesColorSection` mutations in the garment catalog operate on the in-memory `colors` array returned by `getColorsMutable()`. A `favoriteVersion` counter is incremented to force a re-render — a documented hack (`// Phase 3 replaces with API fetch`). `BrandDetailDrawer` does the same thing with its own `version` counter. Both patterns lose all favorite selections on reload. No `catalog_color_preferences` table exists in the database, so there is no place to write them even if we wanted to.

The net result: the shop owner cannot rely on the color filter (wrong swatches, wrong matches), cannot bookmark which colors matter to them (data gone on refresh), and cannot configure brand-specific color defaults that stick. The garment catalog looks complete on screen but the data layer beneath it is hollow.

## User

The primary user is the shop owner (4Ink). They use the garment catalog to:

- Browse and quote garments by filtering to their commonly-stocked color families (e.g., "show me everything available in black, white, and navy").
- Mark preferred colors as favorites so those colors float to the top of the filter grid and act as defaults when quoting a brand's garments.
- Configure brand-level color defaults so that, for example, Gildan jobs default to "Black, White, Sports Grey" without setting it every time.

All three workflows are currently broken or transient.

## Current State

| Area                            | Current implementation                                                          | Status                                      |
| ------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| Color filter grid               | 41 mock colors from `getColorsMutable()`, hardcoded at module load              | Broken — wrong data                         |
| Color filter state              | URL search params → `router.replace` in `useColorFilter`                        | Works but slow                              |
| Filter matching                 | `g.availableColors.some(id => colorFilterSet.has(id))` — compares mock slug IDs | Broken — IDs never match real catalog UUIDs |
| Color favorites (catalog)       | In-memory mutation + `favoriteVersion` counter                                  | Lost on reload                              |
| Color favorites (brand drawer)  | In-memory mutation + `version` counter                                          | Lost on reload                              |
| DB: `catalog_color_preferences` | Does not exist                                                                  | Missing                                     |
| DB: `catalog_inventory`         | Does not exist                                                                  | Missing                                     |
| Real color data                 | 30,614 rows in `catalog_colors` (UUID PKs, name, hex1, hex2)                    | Exists but unused by UI                     |

The normalized catalog query in `catalog.ts` already aggregates colors per style as `{ id, name, hex1, hex2 }`. This data reaches `GarmentCatalogClient` via the `normalizedCatalog` prop but is currently only used for images, not for powering the color filter.

## Desired Outcome

1. The color filter grid shows real colors from `catalog_colors` — deduplicated by name across all styles, ordered with favorites first. Toggling a color filters garments by color name match (until IDs are unified across the color preference and garment-color systems).

2. Toggling a color filter swatch is instant with no network round-trip. State lives in `useState`.

3. Shop-level color favorites persist across reloads. Toggling a swatch in the favorites section writes to `catalog_color_preferences` via a server action.

4. Brand-level color favorites also persist. The `BrandDetailDrawer` writes brand-scoped rows to `catalog_color_preferences` (scope_type='brand') via server actions, replacing the in-memory mutation.

5. `catalog_color_preferences` exists in the database and mirrors the `catalog_style_preferences` pattern (scope_type, scope_id, color_id, is_favorite).

6. `catalog_inventory` schema is in the database (schema-only — no data sync logic this session), ready for future stock-level sync.

## Appetite

Medium-complexity session. No new UX paradigms — all patterns exist (server actions, upsert, optimistic update with rollback) and are already proven in `toggleStyleEnabled` / `toggleStyleFavorite`. The risk surface is the ID mismatch between `catalog_colors.id` (UUID) and the existing `GarmentCatalog.availableColors` (slug strings). This must be resolved at the filter-matching layer without breaking existing tests.

No redesign of the color preference inheritance system (`resolveEffectiveFavorites`, `propagateAddition`, etc.) — that system stays as-is. Only the persistence layer changes: in-memory arrays out, server actions in.
