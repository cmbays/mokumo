# P2 Customer Detail — Design Session

**Date**: 2026-03-01
**Paper file**: `Scratchpad` — `https://app.paper.design/file/01KJEJAKJWFM2XXMSHAW5T13RN`
**Pipeline**: `20260228-customer-vertical`

---

## Prototypes Built

All artboards on the Paper canvas (Page 1), positioned after P1's A–D:

| Artboard                   | Node ID            | Size     | Core bet                                                               |
| -------------------------- | ------------------ | -------- | ---------------------------------------------------------------------- |
| E — Overview (compact)     | 1BQ-0              | 1440×900 | P1-aligned header, horizontal tabs, compact stats strip                |
| F — Activity (prominent)   | 1F5-0              | 1440×900 | Large stats card, sidebar nav, F-style timeline                        |
| G — Revised Overview (WCA) | App Shell in 1J7-0 | 1440×900 | Synthesized from E/F feedback — chosen desktop direction               |
| H — (empty)                | 1UA-0              | 1440×900 | Created for Lakefront Brewing second customer; unused, user redirected |
| I — Preferences Tab (WCA)  | 1ZN-0              | 1440×900 | Per-brand favorited colors + styles                                    |
| J — Mobile Overview (WCA)  | 2B2-0              | 390×844  | Mobile-first layout with balance row + scroll hints                    |

---

## Chosen Direction

**Desktop**: Artboard G (Overview) + Artboard I (Preferences) define the pattern.
**Mobile**: Artboard J.

---

## Design Decisions — Locked In

### Header / Company Row

- Company name (22px bold) + lifecycle/health/type badges + `Archive` + `Edit Customer` all on the **same row**, right-aligned with a `flex:1` spacer
- Breadcrumb row above (`Customers / Westside Cheer Academy`) holds no action buttons
- `Edit Customer` gets the neobrutalist `4px 4px 0px` shadow in action blue

### Stats Strip (desktop)

Order: `$284.6K lifetime · $23.7K avg order · 12 orders · 3d last order · 3 referrals`

- **$ sign**: `#54ca74` (green), **numbers**: `rgba(255,255,255,0.87)` (white) — split into two `<span>` elements
- **Balance**: `$8,400` with `/ $15K` in muted text + gold progress bar (56% fill = 8400/15000)
- **Smart tag**: `Orders typically Aug–Oct` — conditional, not shown for every customer

### Contacts (inline in header — no Contacts tab)

- Displayed in **aligned columns**: star-slot (fixed `18px`) | name (fixed width) | role badge | email | phone
- **Primary contact only** gets `★` in gold — secondary contact has an empty spacer div (same width), no ghost/unfilled star
- Rationale: ghost star implies interactivity (clickable toggle); remove it entirely

### Tabs (4 only)

`Overview` | `Activity` | `Preferences` | `Artwork`

No Contacts tab — contacts live in the header.

### Activity Timeline

- Circular icon per event: `border-radius:50%`, themed background + border matching event type color
- Vertical connector line between items: `width:1px; flex:1; min-height:8px` in the icon column (`align-self:stretch`)
- Last item: no connector div
- **No** `border-bottom` dividers between items
- **No** "View all activity →" link (the Activity tab is the full view)

### Quick Note

Compact single row: placeholder text (`flex:1`) inline with `Save` button — no multiline textarea appearance.

### Right Rail Order (desktop Overview)

1. Quick Note
2. Addresses
3. Financial
4. Referred By (at bottom)

### Artwork Gallery

- 2-per-row thumbnails (~112×90px)
- Each thumbnail: format badge (AI / PDF / PNG) + job count label
- Clicking thumbnail → Artwork detail (not mocked in P2)

### Preferences Tab

- Per-brand sections, each with a `★` star badge on the brand name
- **Color grid**: 2 columns, column-first fill, max 2 swatches per column; gold star badge (15px circle, `position:absolute top:-5px right:-5px`) on each swatch
- **Style cards**: same gold star badge at top-right of each thumbnail
- **Count line**: `n [palette-icon] · n [shirt-icon]` — **number first, icon only, no English words**
- **CTA**: `Edit Preferences` button, right-aligned in section header
- **Wording**: "favorited" (not "saved")

### Mobile-Specific

- **Balance + smart tag row**: sits between badges and KPI strip; progress bar + `$8.4K / $15K` + smart tag chip
- **Stat order**: lifetime → avg order → orders → last order
- **Contact scroll hint**: phone number follows email on the same row, parent `overflow:hidden` — phone is naturally clipped at right edge, signaling horizontal swipe to reveal
- **Scroll content order**: Quick Note → Addresses → Financial → Referred By → Recent Activity → Most Used Artwork (2-per-row, below fold)
- **Bottom tab bar**: Dashboard | Customers (active) | Jobs | Quotes | More
- **Financial**: only show populated fields — omit Discount row if no discount

---

## Open Research Flags

Before implementing the header, resolve:

1. **Balance per contact vs company-level?** Current mockup shows balance at the company level (stats strip + mobile balance row). Does the platform distinguish balances by contact person, or is it one account balance per company?
2. **Contact vs company data model**: what fields live at the contact level (email, phone, role) vs company level (address, net terms, tax status, balance, credit limit)?

---

## Mock Data Used (Westside Cheer Academy)

**Contacts**:
| Name | Role | Email | Phone | Primary |
|---|---|---|---|---|
| Tom Davies | Purchasing Manager | tom@westsidecheer.com | (555) 234-5678 | ★ |
| Sarah Chen | Billing Contact | sarah@westsidecheer.com | (555) 234-5679 | — |

**Stats**: $284.6K lifetime · $23.7K avg order · 12 orders · 3d last order · 3 referrals

**Financial**: Balance $8,400 / $15K limit · Net 30 · Tax exempt · No discount

**Address**: 1200 Pioneer Blvd, Suite 4, Los Angeles, CA 90025 (Billing)

**Referred by**: River City Athletics

**Smart tag**: Orders typically Aug–Oct

**Favorited brands (Preferences tab)**:

| Brand          | Colors                               | Styles                                                   |
| -------------- | ------------------------------------ | -------------------------------------------------------- |
| Gildan         | Black, White, Red (3)                | G500 Classic T-Shirt, G18500 Heavy Blend Hoodie (2)      |
| Port Authority | Navy, Black (2)                      | K500 Silk Touch Polo (1)                                 |
| Bella+Canvas   | Black, Navy, White, Ath. Heather (4) | 3001C Unisex Jersey Tee, 2719 Sponge Fleece Pullover (2) |

---

## Refinements Noted (Not Yet Applied in Mockup)

| Item                   | Current                                           | Target                                                     |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Preferences count line | `[palette] 3 colors · [shirt] 2 styles favorited` | `3 [palette] · 2 [shirt]` — number first, no English words |

---

## Next Steps

- [ ] P3 Paper session: Customer Detail Activity tab
- [ ] P4 Paper session: Customer Detail Artwork tab
- [ ] Research: resolve contact vs company data model before implementation
- [ ] Build desktop + mobile implementation per manifest waves
