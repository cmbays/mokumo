# P4 Customer Detail — Artwork Tab + Upload Sheet Design Session

**Date**: 2026-03-01
**Paper file**: `Scratchpad` — `https://app.paper.design/file/01KJEJAKJWFM2XXMSHAW5T13RN`
**Pipeline**: `20260228-customer-vertical`

---

## Prototypes Built

| Artboard         | Node ID                | Size     | Core bet                                                                       |
| ---------------- | ---------------------- | -------- | ------------------------------------------------------------------------------ |
| N — Artwork Tab  | 3O5-0 (shell: 3KL-0)   | 1440×960 | ArtworkPiece grouping with blue left-border, Customer Color Palette right rail |
| O — Upload Sheet | 3QJ-0 (overlay: 3XI-0) | 1440×960 | Slide-over sheet overlaid on dimmed Artwork tab                                |

---

## Design Decisions — Locked In

### Artwork Tab Layout (Artboard N)

- Full-page shell matching G/I/K: sidebar (220px) + main content area
- Same header structure: breadcrumb → name row → contacts → stats strip → tabs
- Main content: `flex:1` artwork column + 360px right rail
- Right rail order: Quick Note (top) → Customer Color Palette (below)

### ArtworkPiece Grouping Pattern

- Same left-border accent as Activity tab: `border-left: 3px solid rgba(42,185,255,0.5)`
- No card background — pieces sit directly on `#141515`
- `padding: 0 0 24px 18px`, `margin-bottom: 28px` between pieces
- Piece header row: `[name] [subtitle: N designs · N uses] [flex:1] [Add design ghost button]`
- "Add design" button: `border: 1px solid rgba(255,255,255,0.18); border-radius: 5px; padding: 3px 10px` (ghost, not plain text)

### Design Variant Thumbnails

- Dimensions: 158×116px
- Format badge overlay (AI/PDF/PNG): bottom-left, `font-size: 9px; font-weight: 700`
- Color swatches below thumbnail: 9px circles + `N colors · N jobs` label
- Multiple variants per piece shown in a horizontal row

### Customer Color Palette (Right Rail)

- Section label: `CUSTOMER COLORS` — 10px, uppercase, `rgba(255,255,255,0.30)`
- Color rows: 14px swatch circle + name + hex in muted text + `N designs` count right-aligned
- Summary line: `N unique colors · up to N screens per job`
- Provides production context: the color count informs screen count planning

### Upload Sheet (Artboard O)

- Slide-over from right: `width: 480px`, `background: #1c1d1e`, `border-left: 1px solid rgba(255,255,255,0.14)`
- Left side (960px): Dimmed Artwork tab ghost at `opacity: 0.2` — provides page context
- Header: "Upload Artwork" (16px bold) + X close button (rounded gray)

### Upload Sheet Form — Minimalistic

All form fields use **no background fill**:

- **Artwork Piece**: Full-border combobox only when selected (border: `1px solid rgba(42,185,255,0.45)`) — no helper text, no "Create new piece" link. Combobox is a creatable select; typing a new name creates inline.
- **Design Name**: Bottom-border only (`border-bottom: 1px solid rgba(255,255,255,0.18)`) on transparent bg
- **File**: Thumbnail preview (54×54px dark bg + artwork SVG preview) + filename + file size — NOT a type badge. Trash icon is red (`#D23E08`, tinted bg `rgba(210,62,8,0.12)`)
- **Colors**: Plain rows separated by `1px solid rgba(255,255,255,0.06)` hairlines only — no box backgrounds. Color count shown in section header. "Add color" = plus icon + text (no dashed border)
- **Footer**: Cancel (ghost border) + Save Design (action blue, neobrutalist `3px 3px 0 rgba(0,0,0,0.45)` shadow)

### Mid-Fill State Shown (Mock Data)

- Artwork Piece: "WCA Mascot" selected
- Design Name: "Red Colorway"
- File: WCA-Mascot-Red.ai, 2.4 MB, Adobe Illustrator — thumbnail shows red star SVG (`#CC2233`) + white center dot
- Colors: Red `#CC2233` + White `#F5F5F5`

### Trash Icon — Site-Wide Rule

All delete/trash icons should use `#D23E08` stroke with `rgba(210,62,8,0.12)` tinted background on the icon container. Applied to Artboard O, establishes the pattern for all future trash icons.

---

## Data Model Notes

### ArtworkPiece Hierarchy

```
ArtworkPiece (customer-level, named group)
  └─ designs[] (individual colorways/versions)
       ├─ name (e.g., "Red Colorway")
       ├─ file (AI/PDF/PNG/PSD/EPS)
       ├─ colors[] (manual: swatch + name + hex)
       ├─ color_count (auto-derived from colors[])
       └─ format (from file extension)
```

### DRY Upload Component

`<ArtworkUploadSheet customerId={...} quoteId={...} />`

- `customerId` always required (design belongs to customer)
- `quoteId` optional — when present, auto-links uploaded design to the quote
- Same component mounted from Customer Artwork tab AND Quote builder
- Auto-detect colors: **deferred to Artwork Vertical** (separate build cycle)

### Artwork Vertical Separation

Customer vertical ships the Artwork tab as a **working shell** — browsable, uploadable, grouped by ArtworkPiece. The Artwork vertical will build:

- Full `ArtworkPiece → Design` schema with proper DB migrations
- Auto-detect colors from file analysis
- Integration with screen count / ink cost calculations
- After Artwork vertical ships, Customer vertical integrates

---

## Session Notes — P3 Sync Applied to Artboard I

During P4 session, Artboard I (Preferences tab) was also updated to match canonical patterns:

- **Healthy badge**: removed border box → green dot (`#54CA74`) + "Healthy" text only
- **Stats strip**: balance bar now sits inline after referrals (no `flex:1` spacer) — `referrals | $8,400 / $15K [progress bar]`
- **Preferences grouping**: replaced gray cards with `border-left: 3px solid rgba(42,185,255,0.5)` grouping
- **Count line**: updated from English words to `3 [palette-icon] | 2 [garment-icon]` — vertical pipe separator, icon-only (no "colors" or "styles" text)

---

## Pending Header Sync (Blocked — Paper MCP weekly limit reached)

Changes needed on **Artboard G** (Overview) and **Artboard K** (Activity: All) — same as applied to I:

- Healthy badge: de-box (green dot + text only)
- Stats strip: balance inline after referrals
- Smart tag already in company row on these boards

Node structure partially navigated:

- G: Artboard `1J7-0` → App Shell `1O8-0` → Sidebar `1O9-0` + Main `1OO-0`
- K: Artboard `2G1-0` → App Shell `2TI-0` → (not yet navigated — hit limit)

Resume these in the next Paper session.

---

## After Paper Sessions

- [ ] P5 Paper session: Addresses tab + Address sheet
- [ ] Complete header sync on G and K (next Paper session)
- [ ] Build A/B/C customer list — final chosen direction (Hybrid A KPIs + C Layout)
- [ ] Implement urgency semantic tokens in `app/globals.css` (issue #712)
- [ ] Build customer vertical per manifest waves
