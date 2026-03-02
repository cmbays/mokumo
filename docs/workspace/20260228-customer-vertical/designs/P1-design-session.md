# P1 Customer List — Design Session

**Date**: 2026-02-28
**Paper file**: `Scratchpad` — `https://app.paper.design/file/01KJEJAKJWFM2XXMSHAW5T13RN`
**Pipeline**: `20260228-customer-vertical`

---

## Prototypes Built

All 4 artboards are on the Paper canvas, positioned left to right:

| Artboard | x position | Core bet |
|---|---|---|
| A — Data Forward | 0 | Inline KPI strip, persistent chips, compact rows (40px) |
| B — Dashboard First | 1480 | Stats cards, filter sidebar panel, comfortable rows (56px) |
| C — Raycast Minimal | 2960 | Hidden stats button, unified search/filter bar, medium rows (48px) |
| D — Mobile List | 4440 | 390×844, card list, bottom tabs, filter badge + gold warning |

---

## Chosen Direction: Hybrid (A KPIs + C Layout)

After review, the agreed direction for implementation:

### Stats
- **Inline KPI strip** from A — `127 total · 89 active · 18 prospects · $284.6K YTD`
- Shown near the page title, zero wasted card space
- **Tooltips on hover** for each stat (progressive disclosure): e.g. "Ordered in the last 90 days"
- No hidden "Stats" button (reject C's approach)

### Search + Filter Bar
- **Unified bar** from C — single full-width control
- Search input on left (flex:1)
- Filter dropdowns embedded: `[Lifecycle ▾] [Health ▾] [Type ▾]`
- Sort removed from bar — lives in **column headers** instead
- Active filter state: token chip changes to `[Health: Healthy ×]` (colored, dismissible)

### Filter Visibility System (safety-critical)
Three layers — all must be implemented:

1. **Active token in bar** — chip shows what's filtered (`[Health: Healthy ×]`)
2. **Column header indicator** — filtered column header turns action blue + small `⊘` icon appears. Tooltip on icon: `"Filtered: Healthy only"`
3. **Count line warning** — pagination/results line changes:
   - No filters: `Showing 1–8 of 127 customers`
   - Active filters: `Showing 1–8 of 89 customers · ` **`38 hidden (Health: Healthy)`** (gold text)
   - Truncates if multiple: `38 hidden (Health: Healthy · +1 more)`

### Sort
- Column header click → sort toggle (asc/desc)
- Active sort column: header text turns action blue + `↑` or `↓` chevron
- Default sort: Revenue YTD descending

### Density
- Medium (48px rows) — from C

### Mobile
- No sidebar nav — bottom tab bar (Dashboard | Customers | Jobs | Quotes | More)
- KPI strip: 4 stats in a horizontal row with dividers (full width)
- Search input + `Filters (n)` badge button
- Card list: avatar (lifecycle color bg + health dot overlay) + company + contact/type + revenue + lifecycle badge
- Gold warning bar when filters active: `89 of 127 customers · 38 hidden (Health: Healthy)`

---

## Mock Data Used

8 customers across all prototypes:

| Company | Contact | Type | Lifecycle | Health | Last Order | Revenue YTD |
|---|---|---|---|---|---|---|
| Westside Cheer Academy | Tom Davies | School | VIP | Healthy | 3d ago | $67,200 |
| Pioneer High School | Mark Johnson | School | VIP | Healthy | 7d ago | $41,500 |
| River City Athletics | Sarah Mitchell | Wholesale | Repeat | Healthy | 14d ago | $24,800 |
| Blue Ridge Crossfit | Ryan Chen | Corporate | Repeat | Healthy | 21d ago | $15,300 |
| Central Youth Soccer | Kim Park | Club | Repeat | At-Risk | 45d ago | $8,900 |
| Lakefront Brewing Co. | Alex Torres | Corporate | New | Healthy | 1d ago | $2,100 |
| Sunset Elementary PTA | Amy White | School | New | — | — | $890 |
| Metro Print & Sign | Dana Lee | Wholesale | Prospect | — | — | $0 |

Stats bar: 127 total, 89 active (last 90d), 18 prospects, $284.6K YTD

---

## Lifecycle Badge Colors

| Stage | Color |
|---|---|
| Prospect | Gray (`rgba(255,255,255,0.30)`) |
| New | Action blue (`#2ab9ff`) |
| Repeat | Success green (`#54ca74`) |
| VIP | Warning gold (`#ffc663`) |

**Health** (separate dimension, not lifecycle):
| Status | Color |
|---|---|
| Healthy | Green dot (`#54ca74`) |
| At-Risk | Red dot + red text (`#d23e08`) |

Note: "At-Risk" is a health signal, not a lifecycle stage.

---

## Next Steps

- [ ] Build desktop implementation per manifest wave (V1 slice: `N1–N8, U1–U11`)
- [ ] P2 Paper session: Customer Detail header + tabs
