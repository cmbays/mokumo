# Customer Vertical — Design Specification

**Pipeline**: `20260228-customer-vertical`
**Last updated**: 2026-03-02
**Status**: Implementation-ready. Synthesizes P1–P4 Paper sessions.

This document is the single source of truth for building the customer vertical. Artboard references are in Paper file `https://app.paper.design/file/01KJEJAKJWFM2XXMSHAW5T13RN`.

> **⚠ Post-P4 session overrides (2026-03-02)**: The Paper artboards (P1–P4) were designed before PR #731 (design system upgrade). The following rules in this spec **supersede** any artboard pixel values:
>
> 1. Lifecycle stage + health → dot indicators, not colored pills (see Lifecycle & Health section)
> 2. Customer type tags → monochrome muted pill, no status/categorical color
> 3. Activity timeline entries → direct on `bg-background`, no card background
> 4. Customer list filter visibility → 5-signal system (see Customer List section)
> 5. Customer list sort → chevron icons, not `↑`/`↓` glyphs
>    When in doubt: trust this spec over Paper artboard screenshots.

---

## Design Philosophy

**"Linear Calm + Raycast Polish + Neobrutalist Delight"**

- Information lives directly on surfaces — not boxed in cards
- Left-border accents (`border-left: 3px solid [color]`) are the primary grouping signal
- Borders and backgrounds signal affordance, not just containment
- One intense color moment is stronger than five

---

## Design Tokens (Reference)

| Role                 | CSS Variable         | Value                    | Tailwind                |
| -------------------- | -------------------- | ------------------------ | ----------------------- |
| Page background      | `--background`       | `#141515`                | `bg-background`         |
| Cards / panels       | `--elevated`         | `#1c1d1e`                | `bg-elevated`           |
| Interactive surfaces | `--surface`          | `#232425`                | `bg-surface`            |
| High-emphasis text   | `--foreground`       | `rgba(255,255,255,0.87)` | `text-foreground`       |
| Medium-emphasis text | `--muted-foreground` | `rgba(255,255,255,0.60)` | `text-muted-foreground` |
| Action / primary CTA | `--action`           | `#2ab9ff`                | `text-action`           |
| Success / green      | `--success`          | `#54ca74`                | `text-success`          |
| Error / destructive  | `--error`            | `#d23e08`                | `text-error`            |
| Warning / gold       | `--warning`          | `#ffc663`                | `text-warning`          |
| Subtle border        | `--border`           | `rgba(255,255,255,0.12)` | `border-border`         |

**Urgency semantic tokens** (add to `globals.css` — issue #712):

```css
--urgency-critical: var(--error); /* #D23E08 — overdue, blocked */
--urgency-high: var(--warning); /* #FFC663 — expiring soon, draft */
--urgency-low: rgba(255, 255, 255, 0.2); /* muted — expired, historical */
```

---

## Lifecycle & Health Badge Colors

> **Design system update (PR #731)**: Lifecycle stage and health use **dot indicators**, not colored pills. Use `dotColor()` from `@shared/lib/design-system`. The original Paper sessions showed colored pills — ignore those. Trust this spec.

### Lifecycle stage — dot + text

```tsx
import { dotColor } from '@shared/lib/design-system'
;<span className="inline-flex items-center gap-1.5">
  <span className={cn('h-2 w-2 rounded-full', dotColor('muted'))} />
  <span className="text-sm text-foreground">Prospect</span>
</span>
```

| Stage    | `dotColor()` arg | Rationale                        |
| -------- | ---------------- | -------------------------------- |
| Prospect | `'muted'`        | Not yet a customer — neutral     |
| New      | `'action'`       | Active, in-progress relationship |
| Repeat   | `'success'`      | Healthy, proven relationship     |
| VIP      | `'warning'`      | Premium — needs attention/care   |
| At-Risk  | `'error'`        | Relationship flagged             |
| Archived | `'muted'`        | Inactive — same as Prospect      |

### Health status — dot + text

| Status  | `dotColor()` arg | Text color        |
| ------- | ---------------- | ----------------- |
| Active  | `'success'`      | `text-foreground` |
| At-Risk | `'error'`        | `text-error`      |

**No border box on health.** Dot + plain text only.

### Customer type tags (School, Corporate, Wholesale, etc.)

Monochrome muted pill — `bg-muted text-muted-foreground`, `border-radius: 4px; padding: 2px 8px; font-size: 11px`. No color. Classification tags never use the status or categorical palette.

---

## Canonical Header (Customer Detail Views)

> **Reference artboard**: L (Artboard L — Activity: Invoices). This is the locked canonical. K and G will be synced to match it when Paper MCP resets.

All customer detail views (G, I, K, L, M, N) share this header structure above the tab row:

### 1. Breadcrumb row

```
Customers / [Company Name]
```

Font: 12px, `rgba(255,255,255,0.50)`. No action buttons in this row.

### 2. Company row (all on one line)

```
[Company Name]  [VIP]  [• Healthy]  [School]  [Orders typically Aug–Oct ↻]     [Archive]  [Edit Customer ↗]
```

- Company name: 22px, `font-weight: 700`
- Lifecycle badge, health indicator, type tag, smart tag — horizontal, inline
- Smart tag "Orders typically Aug–Oct": conditional chip (only show if seasonal data exists)
- `flex:1` spacer before action buttons
- `Archive`: secondary button, muted border
- `Edit Customer`: action blue, neobrutalist `4px 4px 0px` shadow

### 3. Contacts row (aligned columns)

Fixed-width column slots — every row must align vertically:

```
[star 18px] | [name fixed-width] | [role badge] | [email] | [phone]
```

- Primary contact: `★` in `#FFC663`
- Secondary contact: empty 18px spacer div (no ghost star)
- Role badge: `border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:2px 6px; font-size:11px`

### 4. Stats strip

```
$284.6K lifetime · $23.7K avg order · 12 orders · 3d last order · 3 referrals | $8,400 / $15K ▓▓░░░
```

- **Balance sits immediately after referrals** — no `flex:1` spacer. Pipe `|` separator at `rgba(255,255,255,0.15)`.
- `$` sign: `#54CA74` (green), number: `rgba(255,255,255,0.87)` — split into two `<span>` elements
- Balance: amount (`rgba(255,255,255,0.87)`) + ` / $15K` muted + gold progress bar (64px wide, 4px tall, `#FFC663` fill)
- No credit limit set: show `No credit limit` in muted text instead of bar

### 5. Tab row

`Overview` | `Activity` | `Preferences` | `Artwork`

Active tab: `color: #2AB9FF; border-bottom: 2px solid #2AB9FF`
Inactive: `color: rgba(255,255,255,0.45)`

---

## Customer List (`/customers`) — Artboards A/B/C

> **No finalized Paper mockup.** Build from this spec. Chosen direction: **Hybrid A KPIs + C Layout**.

### Page Header

```
Customers                         [+ Add Customer]
127 total · 89 active · 18 prospects · $284.6K YTD
```

- Title: `h1`, `font-size: 24px; font-weight: 700`
- KPI strip: `font-size: 13px; color: rgba(255,255,255,0.55)` — each stat separated by `·`
- KPIs have **tooltips on hover** (progressive disclosure): e.g. "Active = ordered in last 90 days"
- Add Customer: action blue, neobrutalist `4px 4px 0px` shadow

### Search + Filter Bar

Single full-width control:

```
[🔍 Search customers...     flex:1] [Lifecycle ▾] [Health ▾] [Type ▾]
```

- Border: `1px solid rgba(255,255,255,0.12); border-radius: 8px`
- Filter dropdowns embedded in the bar (not separate row)
- Active filter state: dropdown changes to `[Health: Healthy ×]` — colored chip, dismissible

### 5-Signal Filter Visibility

When a filter is active, FIVE signals appear simultaneously — each reinforces the others:

1. **Blue ring on filter dropdown button** (filter bar): `ring-1 ring-action` applied per-dimension. If Health is filtered → Health dropdown gets the ring. If Type is also filtered → Type dropdown gets its own ring. Independent per dimension.
2. **Chip label in filter bar**: `[Health: Healthy ×]` replaces the dropdown label — dismissible. Still present alongside the ring (ring wraps the chip).
3. **Filter icon on column header**: A filter icon appears next to the column header label for any filtered column, plus `ring-1 ring-action` on that header cell.
4. **Tooltip on column filter icon**: Hovering the filter icon shows a `<Tooltip>` — e.g. `"Filtered: Healthy only"`. Uses app-wide `<TooltipProvider>` — no per-component provider.
5. **Hidden-count line below table**: `Showing 1–8 of 127 customers · ` **`38 hidden (Health: Healthy)`** (gold `text-warning`). Multiple filters: `38 hidden (Health: Healthy · +1 more)`. Only visible when at least one filter is active.

> Note: Artboard C shows a stats block at the bottom of the list — **ignore this**. It is replaced by the hidden-count line above.

### Sort

- Column header click → sort toggle (asc/desc)
- Active sort column: header text turns `text-action` + **chevron** icon (not `↑`/`↓` glyphs) pointing up or down
- Inactive sortable columns: show a faint double-chevron or no indicator — just the label
- Default sort: **Revenue YTD descending**
- Sort lives exclusively in column headers — not in the filter bar

### Table Rows (48px height — medium density)

| Column      | Content                                                           |
| ----------- | ----------------------------------------------------------------- |
| Company     | Company name (primary) + primary contact email (secondary, muted) |
| Lifecycle   | Colored pill badge                                                |
| Health      | Green dot + "Healthy" OR red dot + "At-Risk" (no border box)      |
| Last Order  | Relative: "3d ago", "14d ago" — or `—` if none                    |
| Revenue YTD | Right-aligned, `$` in green                                       |
| Location    | City, ST                                                          |

Row click → navigate to customer detail (`/customers/[id]`).

### Empty States

- No customers yet: illustration + "Add your first customer" CTA
- No filter results: "No customers match your filters" + "Clear filters" link

### Loading State

Skeleton rows (48px each) — 8 rows, column widths match table layout.

---

## Customer Detail — Overview Tab

> **Reference artboard**: G (Artboard G — `1J7-0`). In good shape.

Layout: canonical header → Overview tab content in two columns:

- Left: `flex:1` — recent activity (last 3 events, mini timeline), artwork gallery (2-per-row thumbnails, format badge + job count)
- Right: `360px` rail — Quick Note (compact single-row) → Addresses → Financial → Referred By

**Activity mini-timeline** (not the full Activity tab):

- Circular icon per event: themed bg + border matching event type
- Vertical connector line between items
- Last item: no connector
- **No** "View all activity →" link — the Activity tab IS the full view

---

## Customer Detail — Activity Tab

> **Reference artboards**: K (All), L (Invoices), M (Quotes). In good shape.

### Filter Chips

```
[All] [Jobs] [Invoices] [Quotes] [Notes]
```

Pill style: `padding: 5px 14px; border-radius: 20px`

- Inactive: `border: 1px solid rgba(255,255,255,0.17); color: rgba(255,255,255,0.52)`
- Active: `border: 1px solid rgba(42,185,255,0.59); background: rgba(42,185,255,0.17); color: #2AB9FF; font-weight: 500`

### Timeline Entry Pattern

- **No card background** — entries sit directly on `#141515`
- `border-left: 3px solid [status-color]` is the only grouping signal
- `max-width: 700px` on entries — never full column width
- `padding: 12px 0 16px 16px` per entry; `margin-bottom: 24px` between

### Right-Side Metadata (universal 2-line stack)

```
Line 1: [status badge]  $[amount]      ← right-aligned
Line 2: [timestamp]                    ← 11px, rgba(255,255,255,0.26)
```

Exception: overdue invoices use `#D23E08` on line 2 (urgency signal).

### Invoice Entry (left border by status)

| Status  | Border color    |
| ------- | --------------- |
| Sent    | `#FFC663` gold  |
| Overdue | `#D23E08` red   |
| Paid    | `#54CA74` green |

- INV number: `color: #2AB9FF; text-decoration: underline` (navigates to invoice detail)
- Sub-row: linked job badge + 3px payment progress bar (`#54CA74` fill, `rgba(255,255,255,0.14)` track) + `$X / $Y paid` label

### Quote Entry (left border + status badge color)

| Status   | Color                          | Meaning                  |
| -------- | ------------------------------ | ------------------------ |
| Draft    | `#FFC663` gold                 | Incomplete, needs action |
| Sent     | `#2AB9FF` blue                 | Awaiting response        |
| Accepted | `#54CA74` green                | Deal closed              |
| Declined | `#D23E08` red                  | Deal lost                |
| Expired  | `rgba(255,255,255,0.20)` muted | Dead, historical         |

- Q number: `color: #2AB9FF; text-decoration: underline`
- Sub-row context by status: Draft → gold nudge text; Sent → expiry chip (gold clock); Accepted → "Job J-### created" badge

### Quick Note Right Rail

- `width: 360px; border-left: 1px solid rgba(255,255,255,0.14)`
- Textarea: `#1C1D1E` bg, `1px solid rgba(255,255,255,0.1)` border, `border-radius: 8px`, `min-height: 88px`
- Footer row: Link picker dropdown (flex:1) + Save button (neobrutalist shadow)

---

## Customer Detail — Preferences Tab

> **Reference artboard**: I (Artboard I — `1ZN-0`). Updated in P4 session.

### Brand Section Pattern

```
border-left: 3px solid rgba(42,185,255,0.5); padding-left: 20px
```

No card background. Section header:

```
[Brand Name]  [★ gold circle]  [3 🎨 | 2 👕]        [Edit Preferences]
```

- Brand name: `font-size: 14px; font-weight: 600`
- Star badge: `width:15px; height:15px; border-radius:50%; background:#FFC663` with dark star SVG inside
- Count line: number + palette SVG icon + `|` separator + number + shirt SVG icon. **No English words** ("colors", "styles", "favorited")
- "Edit Preferences": `font-size: 12px; color: #2AB9FF` — plain text link style

### Color Swatches

- 32×32px squares, `border-radius: 5px`
- Gold star badge: `position:absolute; top:-5px; right:-5px; width:14px; height:14px; border-radius:50%; background:#FFC663`

### Style Thumbnails

- 84×62px, `background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09)`
- Model/style name: `font-size: 9px; color: rgba(255,255,255,0.35)` — centered inside
- Same gold star badge at top-right

---

## Customer Detail — Artwork Tab

> **Reference artboard**: N (Artboard N — `3O5-0`). Built in P4 session.

Layout: canonical header → Artwork tab → `flex:1` artwork column + `360px` right rail

### Right Rail

1. **Quick Note** — same as Activity tab rail
2. **Customer Colors** — aggregated unique colors across all designs:
   - `CUSTOMER COLORS` label: 10px uppercase, `rgba(255,255,255,0.30)`
   - Color rows: 14px swatch circle + name + hex (muted) + `N designs` count right-aligned
   - Summary: `N unique colors · up to N screens per job`

### ArtworkPiece Grouping

```
border-left: 3px solid rgba(42,185,255,0.5); padding: 0 0 24px 18px; margin-bottom: 28px
```

Piece header:

```
[Piece Name]  [N designs · N uses — muted]    [flex:1]    [Add design — ghost button]
```

"Add design" ghost button: `border:1px solid rgba(255,255,255,0.18); border-radius:5px; padding:3px 10px` — explicitly a button, not plain text.

### Design Variant Thumbnails

- 158×116px, format badge (AI/PDF/PNG) bottom-left overlay
- Color swatches row: 9px circles + `N colors · N jobs` label

---

## Upload Sheet (`<ArtworkUploadSheet />`)

> **Reference artboard**: O (Artboard O — `3QJ-0`). Built in P4 session.

**DRY component**: mounts from Customer Artwork tab AND Quote builder.

```tsx
<ArtworkUploadSheet customerId={id} quoteId={quoteId?} />
```

When `quoteId` is provided, uploaded design is auto-linked to the quote.

### Sheet Layout

480px slide-over from right. Dimmed page context (opacity 0.2) visible behind.

### Form Fields — Minimalistic (no background fills)

- **Artwork Piece**: Full-border combobox when selected (`border:1px solid rgba(42,185,255,0.45)`). Creatable — typing a new piece name surfaces `+ Create "[Name]"` option. No helper text below.
- **Design Name**: `border-bottom:1px solid rgba(255,255,255,0.18)` on transparent bg
- **File**: Thumbnail preview (54×54px) + filename + file size. Accepted: AI/PDF/PNG/PSD/EPS, up to 200MB
- **Colors**: Plain rows with `1px solid rgba(255,255,255,0.06)` separator hairlines. "Add color" = `+` icon + text (no dashed border). Color count shown in section header.
- **Trash icons**: Always `#D23E08` with `rgba(210,62,8,0.12)` tinted container bg — **site-wide rule**

### Footer

```
[Cancel]  [Save Design ↗ neobrutalist shadow]
```

---

## Mobile Layout (`/customers` and customer detail)

> **Reference artboards**: D (Customer List mobile — `390×844`) and J (Customer Detail mobile — `2B2-0`, `390×844`). Both in decent shape.

### Navigation

- No sidebar — bottom tab bar: `Dashboard | Customers (active) | Jobs | Quotes | More`
- `z-index: 50`

### Customer List Mobile

- KPI strip: 4 stats horizontal row with pipe dividers (full width)
- Search input + `Filters (n)` badge button (not embedded dropdowns)
- **Active filter warning bar**: gold background row — `89 of 127 customers · 38 hidden (Health: Healthy)`
- Card list: lifecycle color bg avatar + health dot overlay + company name + contact/type row + revenue
- Lifecycle badge shown inside card

### Customer Detail Mobile (from Artboard J)

- Balance + smart tag row: sits between badges and KPI strip
  - Progress bar + `$8.4K / $15K` + smart tag chip
- Stat order: lifetime → avg order → orders → last order
- Contact scroll hint: phone number follows email on same row, parent `overflow:hidden` — phone naturally clips, signaling horizontal swipe
- Scroll content order: Quick Note → Addresses → Financial → Referred By → Recent Activity → Most Used Artwork
- Financial: only show populated fields — omit Discount row if no discount

---

## Known Inconsistencies (Resolve at Build Time)

The following artboards have headers that do NOT yet match the canonical pattern above. Sync during implementation — do not block on Paper sessions.

| Artboard          | What's inconsistent                                                     | Canonical reference |
| ----------------- | ----------------------------------------------------------------------- | ------------------- |
| G (Overview)      | Healthy badge may have border box; balance bar may have `flex:1` spacer | Artboard L          |
| K (Activity: All) | Same as G                                                               | Artboard L          |

**Implementation note**: When building `CustomerDetailHeader` component, use the canonical spec above (L pattern). The Paper artboards G/K are close but may have these two residual issues. Trust the spec, not the artboard pixel values for these two items.

---

## Artboard Status Summary

| Artboard  | Screen                               | Status                                                                |
| --------- | ------------------------------------ | --------------------------------------------------------------------- |
| A / B / C | Customer List (desktop)              | No final mockup — build from spec above                               |
| D         | Customer List (mobile)               | Decent shape — reference for mobile card list + bottom tabs           |
| E / F     | Customer Detail (early explorations) | Superseded by G                                                       |
| G         | Customer Detail — Overview           | **Good shape** — canonical reference for Overview tab content         |
| H         | (empty, unused)                      | Skip                                                                  |
| I         | Customer Detail — Preferences        | **Good shape** (updated P4) — canonical reference                     |
| J         | Customer Detail (mobile overview)    | **Good shape** — canonical reference for mobile detail                |
| K         | Customer Detail — Activity: All      | **Good shape inside** — header needs sync (see Known Inconsistencies) |
| L         | Customer Detail — Activity: Invoices | **Canonical reference** for header + invoice anatomy                  |
| M         | Customer Detail — Activity: Quotes   | **Good shape** — canonical reference for quote anatomy                |
| N         | Customer Detail — Artwork tab        | **Good shape** — canonical reference for artwork grouping             |
| O         | Upload Sheet                         | **Good shape** — canonical reference for upload sheet form pattern    |
