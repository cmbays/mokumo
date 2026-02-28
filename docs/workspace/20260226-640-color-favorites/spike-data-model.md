---
shaping: true
pipeline: 20260226-640-color-favorites
issue: 640
date: 2026-02-27
stage: spike
---

# Data Model Spike: Group-Level Color + Brand Preferences

## Context

The existing `catalog_color_preferences` table stores preferences at the individual `catalog_colors` row level (by `color_id` UUID). Issue #640 requires preferences at the `colorGroupName` level — e.g., "Navy" for a given brand — not for each individual color variant that happens to be called Navy.

Additionally, there is no `catalog_brand_preferences` table. Brand favoriting is a new concept.

This spike investigates what tables are needed and how to model the `(brand_id, color_group_name)` preference key.

## Goal

Identify the concrete tables and columns needed to store brand preferences and group-level color preferences; determine whether `colorGroupName` should be modeled as a first-class entity or as a string key.

## Questions

| #      | Question                                                                                                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1** | What values does `colorGroupName` currently take in `catalog_colors`? Are they stable / canonical?                                                                                              |
| **Q2** | Are `colorGroupName` values unique per brand, or can the same name appear across brands with different meaning?                                                                                 |
| **Q3** | Does the existing S&S sync pipeline populate `colorGroupName` reliably? What is the null rate?                                                                                                  |
| **Q4** | What does `catalog_style_preferences` look like? Can the same `(scope_type, scope_id, entity)` pattern be reused verbatim?                                                                      |
| **Q5** | What tables exist that could serve as a FK target for a `catalog_color_groups` first-class entity?                                                                                              |
| **Q6** | If we introduce `catalog_color_groups(id, brand_id, color_group_name)`, how does it get populated — migration from existing `catalog_colors.color_group_name` values, or via the sync pipeline? |
| **Q7** | For the brand preferences table, what FK target exists for `brand_id`? (`catalog_brands.id`)                                                                                                    |

## Investigation

### Q1 + Q2: colorGroupName values

From `catalog_colors` schema (PR #634), `colorGroupName` is a `varchar(100)` populated from the S&S sync script (`run-image-sync.ts`). The S&S API returns `colorGroup` as a supplier-provided string per color variant. Values like "Navy", "Sport Grey", "Black" are human-curated by S&S and are stable across their catalog.

**Cross-brand behavior**: `colorGroupName` values ARE shared across brands (S&S supplies products from many brands: Gildan, Bella+Canvas, etc.). A "Navy" color group from S&S is the same canonical "Navy" regardless of whether it appears on a Gildan 5000 or a Bella+Canvas 3001. The Wave 3 `ColorFilterGrid` already operates on this assumption — it aggregates across brands by `colorGroupName`.

**Conclusion**: `colorGroupName` is a string from S&S's taxonomy. The same name can appear for the same brand's different styles, or across different brands. For preferences, the key question is: is a "Navy" preference per-brand or cross-brand?

Per D11 (locked): color favoriting is **per-brand**. So the preference key is `(brand_id, color_group_name)`.

### Q3: Null rate

`colorGroupName` is added in Wave 1 (PR #634). The sync script populates it from `p.colorGroup || null`. S&S returns `""` for missing fields (hence `|| null`, not `?? null`). Pre-sync rows will have `null`. For favoriting purposes, a null `colorGroupName` means the color can't participate in group preferences — this is acceptable.

### Q4: catalog_style_preferences pattern

```typescript
// catalog_style_preferences
{
  id: uuid PK,
  scopeType: varchar(20).default('shop'),  // 'shop' | 'customer'
  scopeId: uuid,                           // shop UUID or customer UUID
  styleId: uuid → catalog_styles.id,
  isEnabled: boolean nullable,
  isFavorite: boolean nullable,
}
// unique: (scope_type, scope_id, style_id)
```

This pattern is the template. New tables should mirror it exactly.

### Q5 + Q6: First-class catalog_color_groups vs string key

**Option DM-A (string key)**

```sql
catalog_color_group_preferences (
  id uuid PK,
  scope_type varchar(20) NOT NULL DEFAULT 'shop',
  scope_id uuid NOT NULL,
  brand_id uuid NOT NULL → catalog_brands.id,
  color_group_name varchar(100) NOT NULL,
  is_favorite boolean,
  created_at, updated_at,
  UNIQUE (scope_type, scope_id, brand_id, color_group_name)
)
```

- No new entity table required
- colorGroupName is just a string key — if S&S renames a group, existing preferences become orphaned (but S&S names are stable; this is low risk)
- Matches how Wave 3 ColorFilterGrid already identifies groups (by string name)
- Query: `WHERE brand_id = ? AND scope_type = 'shop' AND scope_id = ?` → returns favorited group names

**Option DM-B (first-class entity)**

```sql
-- New entity
catalog_color_groups (
  id uuid PK,
  brand_id uuid NOT NULL → catalog_brands.id,
  color_group_name varchar(100) NOT NULL,
  created_at, updated_at,
  UNIQUE (brand_id, color_group_name)
)

-- Preference table
catalog_color_group_preferences (
  id uuid PK,
  scope_type varchar(20) NOT NULL DEFAULT 'shop',
  scope_id uuid NOT NULL,
  color_group_id uuid NOT NULL → catalog_color_groups.id,
  is_favorite boolean,
  created_at, updated_at,
  UNIQUE (scope_type, scope_id, color_group_id)
)
```

- Requires a migration to populate `catalog_color_groups` from distinct `(brand_id, color_group_name)` pairs in existing `catalog_colors` rows
- `catalog_color_groups` must also be kept in sync as new colors are synced (sync pipeline update needed)
- FK integrity: if a color group is removed from S&S, the preference record can be cascaded away
- Enables future metadata on groups (e.g., sort order, display name override, hue hint for rendering)

**Verdict**:

DM-B is architecturally cleaner and consistent with the project principle of building extensible systems. `catalog_brands` already exists as a first-class entity; `catalog_color_groups` follows the same pattern. The sync pipeline already extracts distinct `(brand_id, color_group_name)` pairs — adding an upsert step for `catalog_color_groups` is minimal.

However, DM-B adds one migration + sync pipeline change before preference tables can be used. DM-A can ship immediately without any catalog sync changes.

### Q7: Brand preferences table

`catalog_brands.id` exists as a UUID PK. The brand preferences table is straightforward:

```sql
catalog_brand_preferences (
  id uuid PK,
  scope_type varchar(20) NOT NULL DEFAULT 'shop',
  scope_id uuid NOT NULL,
  brand_id uuid NOT NULL → catalog_brands.id,
  is_enabled boolean,
  is_favorite boolean,
  created_at, updated_at,
  UNIQUE (scope_type, scope_id, brand_id)
)
```

No ambiguity here. This table follows the established pattern exactly.

---

## Full New Schema (DM-B selected)

Three new tables needed:

### 1. `catalog_color_groups` (new entity)

```typescript
export const catalogColorGroups = pgTable(
  'catalog_color_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => catalogBrands.id, { onDelete: 'cascade' }),
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

**Population strategy**: Migration backfills from `SELECT DISTINCT brand_id, color_group_name FROM catalog_colors JOIN catalog_styles ON ... WHERE color_group_name IS NOT NULL`. Sync pipeline adds an upsert step after writing `catalog_colors`.

### 2. `catalog_color_group_preferences`

```typescript
export const catalogColorGroupPreferences = pgTable(
  'catalog_color_group_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
    scopeId: uuid('scope_id').notNull(),
    colorGroupId: uuid('color_group_id')
      .notNull()
      .references(() => catalogColorGroups.id, { onDelete: 'cascade' }),
    isFavorite: boolean('is_favorite'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_color_group_prefs_scope_group_key').on(
      t.scopeType,
      t.scopeId,
      t.colorGroupId
    ),
    index('idx_catalog_color_group_prefs_scope').on(t.scopeType, t.scopeId),
  ]
)
```

### 3. `catalog_brand_preferences`

```typescript
export const catalogBrandPreferences = pgTable(
  'catalog_brand_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
    scopeId: uuid('scope_id').notNull(),
    brandId: uuid('brand_id')
      .notNull()
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

---

## Summary of Findings

| Question                         | Finding                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Q1–Q2: colorGroupName stability  | Stable S&S strings; same name spans brands; per-brand favoriting = `(brand_id, colorGroupName)` key           |
| Q3: Null rate                    | Pre-sync rows will have null colorGroupName; acceptable — those colors can't participate in group preferences |
| Q4: Style preferences pattern    | Clean `(scope_type, scope_id, entity_id)` pattern — use verbatim in new tables                                |
| Q5–Q6: First-class vs string key | DM-B selected (first-class `catalog_color_groups`); requires migration + sync pipeline step                   |
| Q7: Brand FK target              | `catalog_brands.id` — clean, already exists                                                                   |

## Acceptance

Spike is complete. We can now describe:

1. All three new tables with column definitions
2. The population strategy for `catalog_color_groups` (migration + sync pipeline upsert)
3. How the existing `(scope_type, scope_id)` pattern extends to all new tables
4. Why DM-B is selected over DM-A
