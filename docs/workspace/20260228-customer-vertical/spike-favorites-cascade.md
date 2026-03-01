# Spike: Favorites Cascade Refactor — Global → Shop

**Pipeline**: `20260228-customer-vertical`
**Spike ID**: C5.5
**Date**: 2026-02-28
**Status**: Complete

---

## Context

ADR-005 removes the "global" concept from the color favorites cascade and replaces it with
"shop" as the top level. The current cascade is:

```
global (isFavorite on Color entity) → brand (BrandPreference.favoriteColorIds) → customer (Customer.favoriteColors)
```

The new cascade should be:
```
shop (shop-scoped brand preferences) → brand (BrandPreference.favoriteColorIds) → customer (Customer.favoriteColors)
```

The rationale: "global" colors (colors with `isFavorite: true` on the Color domain entity) are
individual colors without brand context. Post-color-family work (PRs #634–#641), colors only
make sense within a brand context. The shop level should instead express brand-level preferences
that apply shop-wide.

---

## Goal

Identify the complete refactor surface: all files that reference the `'global'` EntityType or
use `isFavorite` on the Color entity as the source of "global" favorites.

---

## Questions

| # | Question |
| --- | --- |
| **C5-Q1** | What is the full list of files that pass `'global'` as EntityType to customer.rules.ts functions? |
| **C5-Q2** | What is the new semantic for "shop-level" favorites? Where does that data live? |
| **C5-Q3** | What is the impact on `customer.rules.ts` function signatures and logic? |
| **C5-Q4** | What is the impact on tests in `customer.rules.test.ts`? |
| **C5-Q5** | What happens to the `isFavorite` field on the Color entity and Color domain mock data? |
| **C5-Q6** | What does `SettingsColorsClient.tsx` need to change? |
| **C5-Q7** | Does `CustomerPreferencesTab.tsx` use EntityType? What changes? |

---

## Findings

### C5-Q1: Files passing `'global'` as EntityType

From grep across `src/`:
1. `src/app/(dashboard)/settings/colors/_components/SettingsColorsClient.tsx`
   - `propagateAddition('global', ...)` — line ~142
   - `getImpactPreview('global', ...)` — line ~152
   - `removeFromAll('global', ...)` — line ~174
   - `removeFromLevelOnly('global', ...)` — line ~186
   - `removeFromSelected('global', ...)` — line ~196
   - `level="global"` prop to `RemovalConfirmationDialog` — line ~344

2. `src/domain/rules/customer.rules.ts`
   - `EntityType = 'global' | 'brand' | 'customer'` — line 18
   - `case 'global':` in `resolveEffectiveFavorites` — line 30
   - `case 'global':` in `getInheritanceChain` — line 79
   - `if (level === 'global')` in `propagateAddition` — line 126
   - `if (level === 'global')` in `removeFromAll` — line 246
   - `if (level === 'global')` in `removeFromSelected` — line 302

3. `src/features/quotes/components/InheritanceDetail.tsx` — uses `'global'` in cascade display
4. `src/features/customers/components/RemovalConfirmationDialog.tsx` — `level: 'global' | 'brand'` prop type

### C5-Q2: New semantic for shop-level favorites

**Current (global)**: Shop-level = colors where `color.isFavorite === true`. This is a flat
list of individual colors across all brands, set in Settings > Colors.

**New (shop)**: Shop-level = the set of colors that the shop has marked as preferred across
all their active brands. This is already represented by `BrandPreference.favoriteColorIds`
where `inheritMode === 'customize'`. The "shop favorite" is the union of all brand-scoped
favorites at the shop level.

**Implication**: `getGlobalFavoriteIds(colors)` which reads `c.isFavorite === true` goes away.
Replaced by a new function `getShopFavoriteIds(brandPreferences)` that unions all
`brand.favoriteColorIds` across brand preferences.

**Data storage**: `isFavorite` on Color entities becomes deprecated. The Settings > Colors page
becomes the "Shop Brand Preferences" page, managing brand-level favorites rather than individual
color-level favorites.

OR — simpler alternative — keep `isFavorite` but rename the concept from "global" to "shop":
- `Color.isFavorite === true` still means "this is a shop-level favorite"
- The semantic is now "shop preference" not "global preference"
- This is the **minimal refactor**: rename EntityType strings, leave Color.isFavorite alone
- ADR-005 language is "Remove global favorites level" — this satisfies that by renaming, not restructuring

**Decision**: Take the minimal refactor path. Rename `'global'` → `'shop'` in EntityType and all
call sites. Keep `Color.isFavorite` as the storage mechanism but call it "shop preference" in UI.
The Settings > Colors page header text updates from "global favorites" to "shop favorites".
This avoids restructuring the entire data model while satisfying ADR-005's intent.

### C5-Q3: customer.rules.ts changes

```typescript
// BEFORE
type EntityType = 'global' | 'brand' | 'customer'
function getGlobalFavoriteIds(colors: Color[]): string[]
case 'global': return globalFavorites
if (level === 'global')

// AFTER
type EntityType = 'shop' | 'brand' | 'customer'
function getShopFavoriteIds(colors: Color[]): string[]  // same logic, renamed
case 'shop': return shopFavorites
if (level === 'shop')
```

All internal references to `'global'` string become `'shop'`. The `default` exhaustive check
in the switch still catches bad inputs. Function `getGlobalFavoriteIds` renamed `getShopFavoriteIds`.

### C5-Q4: Test impact

`src/domain/rules/__tests__/customer.rules.test.ts` — tests that construct `EntityType = 'global'`
must update to `'shop'`. No logic changes — same assertions, same behavior. Rename-only.

### C5-Q5: Color.isFavorite

The `isFavorite` field on Color entity stays as-is. It IS the shop-level preference flag. No
entity changes required. Only the terminology changes (from "global" to "shop").

### C5-Q6: SettingsColorsClient.tsx changes

6 string literals to update:
1. `propagateAddition('global', ...)` → `propagateAddition('shop', ...)`
2. `getImpactPreview('global', ...)` → `getImpactPreview('shop', ...)`
3. `removeFromAll('global', ...)` → `removeFromAll('shop', ...)`
4. `removeFromLevelOnly('global', ...)` → `removeFromLevelOnly('shop', ...)`
5. `removeFromSelected('global', ...)` → `removeFromSelected('shop', ...)`
6. `level="global"` on RemovalConfirmationDialog → `level="shop"`

UI text updates:
- "Automatically add new favorites to all brands and customers" stays — still accurate
- Page header: no change needed ("Colors" is already the page title)
- `applyGlobalToggle` function → rename `applyShopToggle`

### C5-Q7: CustomerPreferencesTab.tsx

File is in `src/app/(dashboard)/customers/[id]/_components/CustomerPreferencesTab.tsx`.
Uses `resolveEffectiveFavorites` with EntityType — needs `'global'` → `'shop'` rename in any
call sites. Also reads `customer.favoriteColors` directly — no change needed there.

The cascade display (showing "inheriting from shop" instead of "inheriting from global") needs
a UI label change in `InheritanceDetail.tsx`.

---

## Refactor Surface Summary

| File | Change Type | Scope |
| --- | --- | --- |
| `src/domain/rules/customer.rules.ts` | Rename `'global'` → `'shop'`, rename function | ~12 string literals, 1 function name |
| `src/domain/rules/__tests__/customer.rules.test.ts` | Update EntityType string literals | ~6 test call sites |
| `src/app/(dashboard)/settings/colors/_components/SettingsColorsClient.tsx` | Rename `'global'` → `'shop'`, rename handler | 6 literals, 1 function |
| `src/features/customers/components/RemovalConfirmationDialog.tsx` | `level: 'global' \| 'brand'` → `level: 'shop' \| 'brand'` | prop type + display string |
| `src/features/quotes/components/InheritanceDetail.tsx` | "global" → "shop" in display text | UI text only |
| `src/app/(dashboard)/customers/[id]/_components/CustomerPreferencesTab.tsx` | EntityType call sites | 1-2 call sites |

**Total scope**: Small. 6 files, primarily string literal renames. No logic changes. No data
migration needed. No Drizzle schema changes. This is a Phase 2 code cleanup that can be done
in Wave 2b (Intelligence Layer) as a single focused PR.

---

## Acceptance

Spike complete. We can describe:
- The full refactor surface (6 files, ~25 string literal changes)
- The chosen approach: minimal rename, keep `Color.isFavorite` mechanism
- No logic changes — behavior is identical, only `'global'` string becomes `'shop'`
- No data migration required
- Targeted PR scope: Wave 2b, ~30 minutes of work
