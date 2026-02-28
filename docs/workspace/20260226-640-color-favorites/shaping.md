---
shaping: true
pipeline: 20260226-640-color-favorites
issue: 640
date: 2026-02-27
stage: shaping
---

# Issue #640 — Color Group Favorites: Shaping

---

## Requirements (R)

| ID   | Requirement                                                                                                                                          | Status                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| R0   | At every garment selection surface (catalog browser, quote picker), favorited items surface above non-favorited items for the active scope           | Core goal                                       |
| R1   | Shop configures three-tier preferences: brand favorites, style favorites (per brand), color group favorites (per brand)                              | Must-have                                       |
| R1.1 | Brand favorites — shop marks which supplier brands are preferred; non-favorited brands remain accessible (ordering, not hiding)                      | Must-have                                       |
| R1.2 | Style favorites per brand — shop marks preferred styles within a brand                                                                               | Must-have                                       |
| R1.3 | Color group favorites per brand — favorites at colorGroupName level (e.g., "Navy"), not individual catalog_colors rows                               | Must-have                                       |
| R2   | Customer preferences override shop defaults when customer context is active (priority: customer > shop > all)                                        | Out (V1 cut)                                    |
| R3   | Shop owner can view all saved favorites across all favorited brands in a single cross-brand overview (read-only)                                     | Must-have                                       |
| R4   | Color and style preference editing requires explicit single-brand context — no cross-brand editing from a shared view                                | Must-have                                       |
| R5   | Unfavoriting or disabling never erases saved selections; re-favoriting/re-enabling restores prior state (soft-delete principle)                      | Must-have                                       |
| R6   | Color preferences stored at colorGroupName level, brand-scoped — the unit of preference is (brand_id, color_group_name), not a catalog_colors row    | Must-have                                       |
| R7   | Preference data model queryable by quote picker: given (scope, brand_id), return ordered favorites list (foundation for Wave 5 quote garment picker) | Must-have (data model only; query interface V2) |
| R8   | Feature has a clear, bookmarkable home in the app nav; URL structure is stable and matches the two-page UX model                                     | Must-have                                       |

---

## Codebase Constraints (confirmed)

| Constraint                                                                                    | Impact on Shaping                                                                                                        |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `catalogColorPreferences` stores by `color_id` (individual rows)                              | Cannot reuse for group-level prefs — new table needed                                                                    |
| `catalogStylePreferences(scope_type, scope_id, style_id)` — scope pattern already established | Style preferences can reuse existing table; just needs server actions                                                    |
| `catalog_brand_preferences` — no table exists                                                 | New table needed                                                                                                         |
| `catalogColors` has `colorGroupName`, `colorFamilyName` columns (added PR #634)               | Group name is a string column, not a FK to a separate entity                                                             |
| No `customers` table in DB schema                                                             | Customer-scope preferences (R2) blocked in V1 — tables can be designed for it, but customer preference entry cannot ship |
| `/settings/colors` — existing nav entry for Phase 1 color settings                            | This feature supersedes it; navigation decision (R8) must account for it                                                 |

---

## Spike: Data Model for Group-Level Preferences

Before shapes can be detailed, one flagged unknown must be resolved. The question is how to store the unit `(brand_id, color_group_name)` as a preference key.

See `spike-data-model.md` for full investigation.

### The two options in brief

| Approach | Description                                                                                                                                          | Key trade-off                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **DM-A** | `catalog_color_group_preferences(scope_type, scope_id, brand_id, color_group_name varchar)` — string key                                             | Simpler, no new entity; brittle if group names change                                     |
| **DM-B** | New `catalog_color_groups(id, brand_id, color_group_name)` entity + FK-based `catalog_color_group_preferences(scope_type, scope_id, color_group_id)` | Proper FK integrity; requires populating the new entity from existing catalog_colors data |

DM-B aligns with the project's extensibility principle and mirrors how `catalog_brands` is a first-class entity. DM-A is a shortcut. Spike will confirm which is feasible given the existing sync pipeline.

---

## Navigation Shapes (R8)

Three options for where "Garment Favorites" lives in the app. These are mutually exclusive navigation placements.

### Shape A: Sub-page under Garments

```
Sidebar:
  Garments           /garments
                     ├── /garments  (catalog)
                     └── /garments/favorites  (★ new)

Summary:   /garments/favorites
Configure: /garments/favorites/configure?brand=[id]
```

- "Garments" sidebar item gets a nested dropdown or sub-nav on hover/active
- Breadcrumbs: `Dashboard > Garments > Garment Favorites > [Brand Name]`
- Garments and Favorites feel like one feature area

### Shape B: Standalone sidebar entry (replaces Color Settings)

```
Sidebar:
  Garments           /garments
  Garment Favorites  /garments/favorites  (★ new, replaces Color Settings)

Summary:   /garments/favorites
Configure: /garments/favorites/configure?brand=[id]
```

- "Garment Favorites" is a peer of "Garments" in the sidebar
- Removes existing "Color Settings" entry (this feature supersedes it)
- Cleaner affordance — the shop uses this daily; it deserves its own nav entry
- URL still under `/garments/` namespace (logically related)

### Shape C: Settings placement

```
Sidebar:
  Settings:
    Pricing            /settings/pricing
    Color Settings  →  /settings/garment-preferences  (replaces + expands)

Summary:   /settings/garment-preferences
Configure: /settings/garment-preferences/configure?brand=[id]
```

- Treated as a shop configuration area alongside Pricing Settings
- Replaces existing `/settings/colors` entry
- Signals "this is setup work, not daily operational work"
- Misaligns with the feature's operational nature (used when making quotes, not just during setup)

---

## Fit Check — Navigation

| Req  | Requirement                                                                                                                                       | Status                                          | A   | B   | C   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --- | --- | --- |
| R0   | At every garment selection surface (catalog browser, quote picker), favorited items surface above non-favorited items for the active scope        | Core goal                                       | ✅  | ✅  | ✅  |
| R1   | Shop configures three-tier preferences: brand favorites, style favorites (per brand), color group favorites (per brand)                           | Must-have                                       | ✅  | ✅  | ✅  |
| R1.1 | Brand favorites — shop marks which supplier brands are preferred; non-favorited brands remain accessible (ordering, not hiding)                   | Must-have                                       | ✅  | ✅  | ✅  |
| R1.2 | Style favorites per brand — shop marks preferred styles within a brand                                                                            | Must-have                                       | ✅  | ✅  | ✅  |
| R1.3 | Color group favorites per brand — favorites at colorGroupName level (e.g., "Navy"), not individual catalog_colors rows                            | Must-have                                       | ✅  | ✅  | ✅  |
| R2   | Customer preferences override shop defaults when customer context is active (priority: customer > shop > all)                                     | Out (V1 cut)                                    | ✅  | ✅  | ✅  |
| R3   | Shop owner can view all saved favorites across all favorited brands in a single cross-brand overview (read-only)                                  | Must-have                                       | ✅  | ✅  | ✅  |
| R4   | Color and style preference editing requires explicit single-brand context — no cross-brand editing from a shared view                             | Must-have                                       | ✅  | ✅  | ✅  |
| R5   | Unfavoriting or disabling never erases saved selections; re-favoriting/re-enabling restores prior state (soft-delete principle)                   | Must-have                                       | ✅  | ✅  | ✅  |
| R6   | Color preferences stored at colorGroupName level, brand-scoped — the unit of preference is (brand_id, color_group_name), not a catalog_colors row | Must-have                                       | ✅  | ✅  | ✅  |
| R7   | Preference data model queryable by quote picker: given (scope, brand_id), return ordered favorites list                                           | Must-have (data model only; query interface V2) | ✅  | ✅  | ✅  |
| R8   | Feature has a clear, bookmarkable home in the app nav; URL structure is stable and matches the two-page UX model                                  | Must-have                                       | ✅  | ✅  | ❌  |

**Notes:**

- C fails R8: `/settings/garment-preferences` misrepresents the feature as setup-only config. The feature is used operationally when making quotes — surfacing it under Settings buries it. Daily-use features belong in the main nav, not Settings.
- A and B both satisfy R8. The difference is prominence and sidebar structure (sub-item vs peer nav entry).
- A vs B is a judgment call, not a requirements failure. See Decision Points Log.

---

## Decision Points Log

| #   | Decision                                | Options                                        | Status                              | Notes                                                                                                                                                                                           |
| --- | --------------------------------------- | ---------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DP1 | Navigation placement (R8)               | A (sub-page) vs B (standalone)                 | **Resolved: B**                     | Shape B selected. Feature is daily-use operational work (not setup-only); standalone nav entry gives it proper prominence. Replaces `/settings/colors`. URL namespace stays under `/garments/`. |
| DP2 | Data model for group-level prefs (R6)   | DM-A (string key) vs DM-B (first-class entity) | **Resolved: DM-B**                  | First-class `catalog_color_groups` entity. Three new tables: `catalog_color_groups`, `catalog_color_group_preferences`, `catalog_brand_preferences`. See `spike-data-model.md`.                 |
| DP3 | Customer scope in V1 (R2)               | V1 (blocked by no customers table) vs V2       | **Resolved: V2**                    | No `customers` table in DB schema. Tables designed multi-scope from day 1; customer entry deferred.                                                                                             |
| DP4 | Quote Builder data model readiness (R7) | Include in V1 data model vs defer              | **Resolved: Yes (data model only)** | The data model for R7 is the same tables as R1 — no extra work. Tables ship in V1; query interface for quote picker is V2.                                                                      |

---

## Selected Shape: B — Standalone "Garment Favorites" nav entry

```
Sidebar:
  Garments           /garments
  Garment Favorites  /garments/favorites  (★ new, replaces Color Settings)

Summary:   /garments/favorites
Configure: /garments/favorites/configure?brand=[id]
```

| Part   | Mechanism                                                                                                                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B1** | **Navigation entry**                                                                                                                                                                                       |
| B1.1   | Add "Garment Favorites" as standalone sidebar peer to "Garments" at `/garments/favorites`                                                                                                                  |
| B1.2   | Remove existing `/settings/colors` sidebar entry (superseded by this feature)                                                                                                                              |
| **B2** | **Summary page — `/garments/favorites` (read-only)**                                                                                                                                                       |
| B2.1   | Brand list: all brands where any preference record exists (`is_favorite` or `is_enabled` set)                                                                                                              |
| B2.2   | Per-brand summary row: favorited style count, favorited color group count, brand-level favorite status                                                                                                     |
| B2.3   | "Configure →" link per brand → B3                                                                                                                                                                          |
| **B3** | **Configure page — `/garments/favorites/configure?brand=[id]` (single-brand write)**                                                                                                                       |
| B3.1   | Brand toggle: star + enable toggle → upsert `catalog_brand_preferences(scope_type='shop', scope_id, brand_id, is_favorite, is_enabled)`                                                                    |
| B3.2   | Style favorites: style grid with star per row → upsert `catalog_style_preferences(scope_type='shop', scope_id, style_id, is_favorite)` (table exists; new server actions only)                             |
| B3.3   | Color group favorites: swatch grid of `colorGroupName`s for this brand, star per group → upsert `catalog_color_group_preferences(scope_type='shop', scope_id, color_group_id, is_favorite)`; depends on B4 |
| **B4** | **`catalog_color_groups` entity + sync pipeline** (required by B3.3)                                                                                                                                       |
| B4.1   | New Drizzle table: `catalog_color_groups(id, brand_id, color_group_name)` UNIQUE(brand_id, color_group_name); FK → `catalog_brands.id`                                                                     |
| B4.2   | Migration: backfill from `DISTINCT (brand_id, color_group_name)` in `catalog_colors JOIN catalog_styles WHERE color_group_name IS NOT NULL`                                                                |
| B4.3   | Sync pipeline upsert: after writing `catalog_colors` rows, upsert into `catalog_color_groups`                                                                                                              |
| **B5** | **Favorites surfacing (R0)**                                                                                                                                                                               |
| B5.1   | Server query: given `(scope_type, scope_id, brand_id)` → return `{ isBrandFavorite, favoritedStyleIds, favoritedColorGroupNames }`                                                                         |
| B5.2   | Catalog browser: favorited `colorGroupName` chips sort first in `ColorFilterGrid`; non-favorited follow                                                                                                    |
| B5.3   | Style list: favorited styles surface above non-favorited within active brand filter                                                                                                                        |
