# Frame: S&S colorFamilyName Schema + Color Family Filter Upgrade

**Pipeline**: 20260226-color-families
**Issue**: #632
**Date**: 2026-02-26

---

## Problem

The garment color filter in "All Brands" mode surfaces 4,413 individual swatches in a flat grid — a number that makes filtering by color effectively impossible. The 9 hue-bucket tabs (Blues, Reds, etc.) that exist today are the right idea but the wrong granularity: "Blues" in isolation includes Navy, Royal Blue, Sky Blue, Powder Blue, and Heather Blue — colors that a screen printer picks between constantly, not interchangeably. The algorithmic hue-bucketing also misfires on borderline colors (teal classified as green, dark purple as black) and provides zero semantic alignment with how the industry talks about color.

S&S Activewear's API already provides `colorFamilyName` — a human-curated middle tier yielding roughly 60–80 distinct family names across the catalog. These map directly to how a decorator communicates with clients ("do you want Navy or Royal?") and how stock is organized at the distributor level. The data exists at the API boundary but has never been plumbed through: it is absent from the `CanonicalColor` type, absent from `catalog_colors`, and absent from the filter UI.

---

## User

The primary user is the shop owner at 4Ink during garment sourcing — typically starting from a customer color request ("we need a navy tee") and scanning the catalog to find which styles come in that color family. Today they either scroll through 4,413 swatches (slow), apply a hue-bucket filter (too coarse), or know the style number already. The color family filter serves the middle 80%: users who know the color family they want but haven't committed to a specific style yet.

Secondary: the dbt mart (`dim_color_families`) supports future analytics — how many styles have a "Navy" option, which brands have the deepest "Red" coverage — but that is analytics consumer work, not shop-operator work.

---

## Appetite

Three discrete waves, each independently shippable:

- **Wave 1** (~4–6 hours): Drizzle migration 0016 adding `color_family_name` and `color_code` to `catalog_colors`, propagated through `CanonicalColor` → sync service. No UI change — the columns exist but are unpopulated until re-sync.
- **Wave 2** (~2–3 hours): dbt `dim_color_families` mart reading from `catalog_colors`. Analytics surface only — no app query changes yet.
- **Wave 3** (~4–6 hours): `ColorFilterGrid` upgraded to family-level primary filter tabs. Replaces the 9 hue-bucket tabs with ~60–80 family tabs. URL param migrated from `?colors=` (color ID list) to `?families=` (family name list). Existing swatch grid remains within a selected family.

Total appetite: ~10–15 hours across 3 sessions. Each wave delivers value independently and does not block the others once Wave 1 is live.

---

## Rabbit Holes

**Do not attempt cross-brand color family normalization in Wave 1 or 2.** If SanMar ships tomorrow with different family names, that is a future mapping problem. Store S&S family names verbatim — do not introduce a canonical family enum or mapping table now.

**Do not replace hue-bucket tabs entirely before family data is populated.** The UI transition in Wave 3 must handle the gap state where `color_family_name IS NULL` (colors synced pre-migration). Fallback: route null-family colors into an "Other" bucket or retain hue-bucket logic as the fallback classifier.

**Do not over-engineer the dbt mart.** `dim_color_families` is a simple DISTINCT group — it does not need slowly-changing dimension (SCD) logic, surrogate keys, or family-level aggregate metrics in Wave 2. Keep it small.

**URL encoding for multi-word family names**: "Royal Blue" as a URL param is `Royal+Blue` or `Royal%20Blue`. Both decode identically. Do not invent a slug scheme — use the raw family name with standard `encodeURIComponent`.

---

## No-Gos

- No canonical family name enum across suppliers (SanMar, alphabroder normalization is out of scope)
- No color-family-level preferences table (color-level is `catalog_color_preferences`; family-level preferences are not requested)
- No customer-facing color family labels visible to end customers (internal shop tool only)
- No re-implementation of hue-bucket logic — keep it as a fallback classifier for null-family colors
- No sync of `color_family_name` retroactively to existing rows via a migration-time script (sync job handles it on next run)
- No analytics consumption in the Next.js app from `dim_color_families` until Wave 3 or later
