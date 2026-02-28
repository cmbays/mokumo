---
title: Issue #640 — Color Group Favorites — Implementation Plan
pipeline-id: 20260226-640-color-favorites
issue: 640
status: ready-to-build
created: 2026-02-27
---

# Issue #640 — Color Group Favorites: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Add three-tier garment preferences (brand, style, color group) with a standalone "Garment Favorites" nav entry, a read-only summary page, a single-brand configure page, and surfacing of favorites at the garments browse page.

**Architecture:** Shape B selected (see `shaping.md`). New `/garments/favorites` sidebar entry replaces `/settings/colors`. Two new routes: Summary (pure RSC, read-only) and Configure (RSC loader + client component with optimistic updates). Three new DB tables (`catalog_brand_preferences`, `catalog_color_groups`, `catalog_color_group_preferences`). Pre-sort strategy for `ColorFilterGrid` — parent pre-sorts the array by `isFavorited` before passing; no prop change to the component.

**Tech Stack:** Next.js App Router, Drizzle ORM, Supabase, React Server Components, Server Actions, Tailwind CSS, shadcn/ui.

---

## Wave Summary

| Wave | Sessions | Mode | Slice | Deliverable |
|------|---------|------|-------|-------------|
| 0 | 1 | serial | foundation | 3 new DB tables + migration + backfill |
| 1 | 1 | serial | V1 | Nav + Summary page + Configure brand controls |
| 2 | 1 | serial | V2 | Style grid on Configure page |
| 3 | 2 | **parallel** | V3 | Color group grid (3A) + sync pipeline upsert (3B) |
| 4 | 1 | serial | V4 | Garments page surfacing (ColorFilterGrid pre-sort + style split) |

---

## Wave 0: Database Foundation (serial)

### Task 0.1: Drizzle schema + migration + backfill

**Files:**
- `src/db/schema/catalog-normalized.ts` — add 3 new Drizzle table definitions
- Generated migration file in `supabase/migrations/`

**Steps:**

1. Open `src/db/schema/catalog-normalized.ts`. Study the existing `catalogStylePreferences` table — all new tables follow this exact pattern.

2. Add `catalogColorGroups`:
   ```ts
   export const catalogColorGroups = pgTable(
     'catalog_color_groups',
     {
       id: uuid('id').primaryKey().defaultRandom(),
       brandId: uuid('brand_id').notNull().references(() => catalogBrands.id, { onDelete: 'cascade' }),
       colorGroupName: varchar('color_group_name', { length: 100 }).notNull(),
       createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
       updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
     },
     (t) => [
       uniqueIndex('catalog_color_groups_brand_id_name_key').on(t.brandId, t.colorGroupName),
       index('idx_catalog_color_groups_brand_id').on(t.brandId),
     ]
   )
   ```

3. Add `catalogColorGroupPreferences`:
   ```ts
   export const catalogColorGroupPreferences = pgTable(
     'catalog_color_group_preferences',
     {
       id: uuid('id').primaryKey().defaultRandom(),
       scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
       scopeId: uuid('scope_id').notNull(),
       colorGroupId: uuid('color_group_id').notNull()
         .references(() => catalogColorGroups.id, { onDelete: 'cascade' }),
       isFavorite: boolean('is_favorite'),
       createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
       updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
     },
     (t) => [
       uniqueIndex('catalog_color_group_prefs_scope_group_key').on(t.scopeType, t.scopeId, t.colorGroupId),
       index('idx_catalog_color_group_prefs_scope').on(t.scopeType, t.scopeId),
     ]
   )
   ```

4. Add `catalogBrandPreferences`:
   ```ts
   export const catalogBrandPreferences = pgTable(
     'catalog_brand_preferences',
     {
       id: uuid('id').primaryKey().defaultRandom(),
       scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
       scopeId: uuid('scope_id').notNull(),
       brandId: uuid('brand_id').notNull()
         .references(() => catalogBrands.id, { onDelete: 'cascade' }),
       isEnabled: boolean('is_enabled'),
       isFavorite: boolean('is_favorite'),
       createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
       updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
     },
     (t) => [
       uniqueIndex('catalog_brand_prefs_scope_brand_key').on(t.scopeType, t.scopeId, t.brandId),
       index('idx_catalog_brand_prefs_scope').on(t.scopeType, t.scopeId),
     ]
   )
   ```

5. Run `npm run db:generate` — this produces the migration SQL.

6. Open the generated migration file. Add the backfill statement after the `CREATE TABLE catalog_color_groups` DDL:
   ```sql
   INSERT INTO catalog_color_groups (id, brand_id, color_group_name)
   SELECT gen_random_uuid(), cs.brand_id, cc.color_group_name
   FROM catalog_colors cc
   JOIN catalog_styles cs ON cc.style_id = cs.id
   WHERE cc.color_group_name IS NOT NULL
   GROUP BY cs.brand_id, cc.color_group_name
   ON CONFLICT (brand_id, color_group_name) DO NOTHING;
   ```

7. Run `npm run db:migrate`.

8. Write Vitest tests: verify all 3 tables exist, UNIQUE constraints enforce correctly.

**Demo:** `npm run db:studio` — `catalog_color_groups` table populated with brand/group pairs from existing `catalog_colors` data.

---

## Wave 1: Nav + Summary + Configure Brand (serial)

### Task 1.1: Sidebar + Summary page + Configure page with brand controls

**Dependencies:** Wave 0 merged

**Files:**
- `src/shared/navigation/sidebar.tsx` (or constants file — find via `grep -r SIDEBAR_MAIN` or `grep -r garments` in the sidebar)
- `src/app/(dashboard)/garments/favorites/page.tsx` — RSC summary page
- `src/app/(dashboard)/garments/favorites/_components/BrandSummaryRow.tsx`
- `src/app/(dashboard)/garments/favorites/configure/page.tsx` — RSC configure loader
- `src/app/(dashboard)/garments/favorites/configure/_components/FavoritesConfigureClient.tsx` — brand controls only
- `src/app/(dashboard)/garments/favorites/actions.ts` — new server actions file

**Steps:**

1. **Sidebar:** Add `{ label: 'Garment Favorites', href: '/garments/favorites', icon: Star }` to the main nav order, adjacent to `Garments`. Remove the existing `/settings/colors` (Color Settings) entry.

2. **`getBrandPreferencesSummary(shopId)`:**
   - Query `catalog_brands` LEFT JOIN `catalog_brand_preferences ON (scope_type='shop', scope_id=shopId, brand_id=b.id)`
   - For each brand that has any preference record: include `isBrandFavorite`, `favoritedStyleCount` (subquery on `catalog_style_preferences`), `favoritedColorGroupCount` (subquery on `catalog_color_group_preferences JOIN catalog_color_groups`)
   - Return only brands that have at least one preference record (any non-null field)

3. **`BrandSummaryRow`:** brand name, filled Star icon (`text-action`) if `isBrandFavorite`, "X favorited styles", "X color groups", `Configure →` link to `/garments/favorites/configure?brand=[id]`. Use `text-muted-foreground` for zero counts.

4. **Summary page RSC:** Call `getBrandPreferencesSummary`, render `BrandSummaryRow[]`. Empty state: "No favorites configured yet." with a "Browse Catalog →" CTA.

5. **`getBrandConfigureData(shopId, brandId)`:**
   - Query `catalog_brands WHERE id = brandId`
   - LEFT JOIN `catalog_brand_preferences` to get `isBrandFavorite`, `isBrandEnabled`
   - Stub: return `styles: []`, `colorGroups: []` (filled in Wave 2 + 3)

6. **Configure page RSC:** Read `brand` query param. Call `getBrandConfigureData`. Pass to `FavoritesConfigureClient`.

7. **`FavoritesConfigureClient`:**
   - State: `configureState: ConfigureData` initialized from RSC props
   - Brand section: Star button (`isBrandFavorite`) + Eye/Switch toggle (`isBrandEnabled`)
   - Style section: `<div>Style preferences coming soon...</div>` (stub)
   - Color group section: `<div>Color group preferences coming soon...</div>` (stub)
   - Optimistic pattern: read ref → optimistic setState → await server action → rollback on error + toast

8. **Server actions:** `toggleBrandFavorite(brandId, value)` + `toggleBrandEnabled(brandId, value)` — upsert `catalog_brand_preferences`. Use `getUser()` not `getSession()`.

9. Breadcrumbs: Use `buildBreadcrumbs()`. Summary page: `[{ label: 'Garment Favorites', href: '/garments/favorites' }]`. Configure page: same + `{ label: brandName, href: current }`.

**Demo:** "Garment Favorites in sidebar (Color Settings removed). Click → summary. Click Configure for Gildan → toggle brand star → back → Gildan shows ★."

---

## Wave 2: Style Configure (serial)

### Task 2.1: Style grid on the Configure page

**Dependencies:** Wave 1 merged

**Files:**
- `src/app/(dashboard)/garments/favorites/configure/_components/FavoritesConfigureClient.tsx` — extend with StyleGrid
- `src/app/(dashboard)/garments/favorites/configure/_components/StyleGrid.tsx` — new component
- `src/app/(dashboard)/garments/favorites/actions.ts` — extend `getBrandConfigureData`

**Steps:**

1. **Extend `getBrandConfigureData`:** Add styles query — `catalog_styles WHERE brand_id = ?` LEFT JOIN `catalog_style_preferences ON (scope_type='shop', scope_id=shopId, style_id=s.id)`. Return `styles: { id, name, number, thumbnailUrl, isFavorite: boolean }[]`.

2. **`StyleGrid` component:** Responsive grid of style cards. Each card: thumbnail image (use `<Image>` with existing CDN URL pattern), style name + number, Lucide `Star` icon top-right (filled + `text-action` when `isFavorite`). Match visual density to existing GarmentCard but simplified — no price, no color strip needed.

3. **`handleToggleStyleFavorite(styleId)`:** Add to `FavoritesConfigureClient`. Calls **existing** `toggleStyleFavorite()` from `src/app/(dashboard)/garments/actions.ts` — no new server action. Optimistic: update `configureState.styles[idx].isFavorite`.

4. **Extend `ConfigureData` type:** `styles: { id, name, number, thumbnailUrl, isFavorite }[]` (previously `[]` stub).

5. Replace the "Style preferences coming soon..." stub with `<StyleGrid styles={configureState.styles} onToggle={handleToggleStyleFavorite} />`.

6. Summary `favoritedStyleCount` is derived from `catalog_style_preferences` — verify it updates correctly after star toggle + page navigation.

**Demo:** "Configure Gildan → style grid shows all Gildan styles → star PC61 → back → Summary shows '1 favorited style' for Gildan."

---

## Wave 3: Color Group Configure + Sync Pipeline (parallel)

### Task 3.1: Color group swatch grid on Configure page (Session A)

**Dependencies:** Wave 2 merged

**Files:**
- `src/app/(dashboard)/garments/favorites/configure/_components/FavoritesConfigureClient.tsx`
- `src/app/(dashboard)/garments/favorites/configure/_components/ColorGroupGrid.tsx` — new component
- `src/app/(dashboard)/garments/favorites/actions.ts` — extend `getBrandConfigureData` + add `toggleColorGroupFavorite`

**Steps:**

1. **Extend `getBrandConfigureData`:** Add color groups query — `catalog_color_groups WHERE brand_id = ?` LEFT JOIN `catalog_color_group_preferences ON (scope_type='shop', scope_id, color_group_id)`. Return `colorGroups: { id, colorGroupName, isFavorite: boolean }[]`.

2. **`ColorGroupGrid` component:** Grid of swatch chips (flex-wrap, gap-2). Each chip matches `ColorFilterGrid` chip visual style — colored circle + group name label. Add Lucide `Star` overlay top-right (filled + `text-action` when `isFavorite`). For hex color: derive from colorGroupName if possible (a small lookup map for common names — Navy → `#1a2a5e`, Black → `#1a1a1a`, etc.), otherwise use `bg-muted` fallback.

3. **`handleToggleColorGroupFavorite(colorGroupId)`:** Add to `FavoritesConfigureClient`. Calls new `toggleColorGroupFavorite` server action. Optimistic: update `configureState.colorGroups[idx].isFavorite`.

4. **`toggleColorGroupFavorite(colorGroupId, value)`:** New server action. Upsert `catalog_color_group_preferences`.

5. **Extend `getBrandPreferencesSummary`:** Include `favoritedColorGroupCount` by counting `catalog_color_group_preferences JOIN catalog_color_groups WHERE brand_id = ?`.

6. Replace "Color group preferences coming soon..." stub with `<ColorGroupGrid colorGroups={configureState.colorGroups} onToggle={handleToggleColorGroupFavorite} />`.

### Task 3.2: Sync pipeline — upsertColorGroups (Session B — parallel with 3.1)

**Dependencies:** Wave 0 merged (catalog_color_groups table exists)

**Files:**
- `scripts/run-image-sync.ts` (or `src/scripts/run-image-sync.ts` — find via glob)

**Steps:**

1. Find the step in `run-image-sync.ts` that writes `catalog_colors` rows (look for the batch insert/upsert).

2. Add `upsertColorGroups(db, colorRows)` immediately after:
   - Extract distinct `(brand_id, color_group_name)` pairs from the colors batch (requires joining with style data to get `brand_id` — the colors batch should have `styleId` which maps to `brand_id` via `catalog_styles`)
   - Filter out nulls: `color_group_name IS NOT NULL AND color_group_name !== ''`
   - Batch insert: `INSERT INTO catalog_color_groups (id, brand_id, color_group_name) VALUES ... ON CONFLICT (brand_id, color_group_name) DO NOTHING`
   - Log: `logger.info({ domain: 'sync', newColorGroups: insertedCount }, 'upserted color groups')`

3. Write unit test with mock data: 5 colors across 2 brands, 3 unique color groups — verify correct count returned, no duplicates on re-run.

**Demo (combined V3):** "Configure Gildan → color group swatches (Navy, Royal, Black, Sport Grey...) → star Navy + Black → Back → Gildan shows '2 favorited color groups'."

---

## Wave 4: Garments Page Surfacing (serial)

### Task 4.1: Pre-sort ColorFilterGrid + split style sections

**Dependencies:** Wave 3 merged (both sessions)

**Files:**
- `src/app/(dashboard)/garments/page.tsx` — add `getColorGroupFavorites` call
- `src/app/(dashboard)/garments/_components/GarmentCatalogClient.tsx` — add useMemos + split render
- `src/app/(dashboard)/garments/favorites/actions.ts` — implement `getColorGroupFavorites`
- `src/features/garments/utils/favorites-sort.ts` — extracted pure sort functions (for testability)

**Steps:**

1. **`getColorGroupFavorites(shopId)`:**
   - Query `catalog_color_group_preferences JOIN catalog_color_groups WHERE scope_type='shop' AND scope_id=shopId AND is_favorite=true`
   - Return `string[]` of `colorGroupName` values

2. **`garments/page.tsx`:** Add `getColorGroupFavorites(shopId)` alongside existing fetches. Pass `initialFavoriteColorGroupNames: string[]` to `GarmentCatalogClient`.

3. **`GarmentCatalogClient.tsx` — three additions:**

   **a. State (S1):**
   ```ts
   const [favoriteColorGroupNames] = useState(
     () => new Set(props.initialFavoriteColorGroupNames ?? [])
   )
   ```

   **b. `sortColorGroups` useMemo (N3) — extract to `favorites-sort.ts` for testing:**
   ```ts
   // favorites-sort.ts
   export function sortColorGroupsByFavorites(
     colorGroups: FilterColorGroup[],
     favoriteNames: Set<string>
   ): FilterColorGroup[] {
     return [...colorGroups].sort((a, b) => {
       const aFav = favoriteNames.has(a.colorGroupName ?? '')
       const bFav = favoriteNames.has(b.colorGroupName ?? '')
       return Number(bFav) - Number(aFav) // favorites first, preserve relative order
     })
   }
   ```
   Pass `sortColorGroupsByFavorites(colorGroups, favoriteColorGroupNames)` to `ColorFilterGrid` instead of `colorGroups`.

   **c. `sortCatalogByFavorites` useMemo (N4) — also extract to `favorites-sort.ts`:**
   ```ts
   export function partitionByFavorite<T extends { isFavorite?: boolean }>(
     items: T[]
   ): { favorites: T[]; others: T[] } {
     return items.reduce(
       (acc, item) => {
         if (item.isFavorite) acc.favorites.push(item)
         else acc.others.push(item)
         return acc
       },
       { favorites: [] as T[], others: [] as T[] }
     )
   }
   ```
   Partition `filteredCatalog` styles. Render:
   - If `favorites.length > 0`: `<p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Your Favorites</p>` + favorites grid
   - Then: others grid (no label, or omit if favorites are empty — preserve existing single-list rendering)

4. **Tests (`favorites-sort.test.ts`):** Unit test both pure functions — `sortColorGroupsByFavorites` with Navy favorited should put Navy first; `partitionByFavorite` with mixed isFavorite flags should split correctly.

**Demo:** "Shop has starred Navy + Black for Gildan (via V3), starred PC61 (via V2). Browse /garments → Navy + Black swatches appear first in ColorFilterGrid. PC61 appears in 'Your Favorites' section above the full style list."

---

## Workspace Documentation

Each session writes notes to `docs/workspace/20260226-640-color-favorites/` with a unique filename:

| Session | Notes file |
|---------|-----------|
| 0.1 | `db-schema-notes.md` |
| 1.1 | `v1-brand-notes.md` |
| 2.1 | `v2-style-notes.md` |
| 3.1 | `v3a-color-group-notes.md` |
| 3.2 | `v3b-sync-notes.md` |
| 4.1 | `v4-surfacing-notes.md` |
