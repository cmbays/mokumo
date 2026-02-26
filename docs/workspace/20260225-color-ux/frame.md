# Frame: Garment Color UX Polish

**Pipeline**: `20260225-color-ux`
**Type**: polish
**Phase**: 2
**Issues**: #623, #624, #625, #626
**Depends on**: #620 (full color system), #627 (S&S API field audit — parallel)

---

## Problem Statement

The garment catalog shipped real S&S colors (660+ canonical swatches, 30K+ per-style rows) in PR #620, but smoke testing revealed the color UX isn't right for a shop operator browsing 4,800+ styles:

1. **Too much dead space** — 6-column grid with 32px swatches and 2px gaps wastes screen real estate when displaying 660+ colors
2. **No way to find colors** — scrolling through 660+ swatches without grouping is unusable; shop operators know colors by family ("I need something in blues")
3. **Brand filter doesn't scope colors** — selecting "Gildan" still shows all 660 colors, not just Gildan's ~40
4. **Cards hide color info** — garment listing cards show only a count number, not actual swatches; forces opening every card to see what colors are available

## Appetite

**Small batch** — 1 session (this session). Four tightly scoped UI changes, no new API endpoints, no new DB tables (color_group column added to existing table).

## Solution Shape

Four coordinated changes that transform the color browsing experience:

### S1: Dense Swatch Grid (#623)
Reduce gap from 2px to 1px on `ColorFilterGrid` and `GarmentDetailDrawer` swatch grids. Keep 32px swatch size (readable names preferred). Results in ~25% more swatches per viewport.

### S2: Hue-Bucket Filter Tabs (#624)
Add horizontal tab bar above the color swatch grid. 9 tabs:
- All | Blacks & Grays | Whites & Neutrals | Blues | Reds | Greens | Yellows & Oranges | Purples & Pinks | Browns

**Data source**: `colorFamily` from S&S API → stored as `catalog_colors.color_group`. Until #627 backfills this column, use HSL-derived fallback from `hex1`.

### S3: Brand-Scoped Color Palette (#625)
When a brand filter is active, the color swatch grid shows ONLY colors available for that brand's styles. Computed by cross-referencing `catalog_colors.style_id` → `catalog_styles.brand_id` → selected brand.

### S4: GarmentCard Color Strip + Star Relocation (#626)
- Add row of **square swatches** (12px) at bottom of GarmentCard info section
- Show 8-10 swatches max, with `+N` overflow badge
- **Hue-diverse selection**: pick one representative color from each hue family, not just first N colors
- Move FavoriteStar to **top-right corner** of card, overlaying the image
- Remove the total color count number from the bottom row

## Rabbit Holes

- **Don't build color search** — tabs + brand scoping is sufficient for 660 colors
- **Don't add per-color favorites to cards** — that's a drawer-level feature
- **Don't paginate the swatch grid** — with 9 tabs, each bucket has ~30-80 colors, fits in one grid
- **Don't persist tab selection in URL** — local state is fine for filter tabs within a filter panel

## No-Gos

- No new database tables
- No new API routes
- No changes to the color inheritance system (BrandDetailDrawer)
- No changes to FavoritesColorSection internals
- No changes to how colors are synced (that's #627)
