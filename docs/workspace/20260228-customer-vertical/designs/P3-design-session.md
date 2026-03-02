# P3 Customer Detail — Activity Tab Design Session

**Date**: 2026-03-01
**Paper file**: `Scratchpad` — `https://app.paper.design/file/01KJEJAKJWFM2XXMSHAW5T13RN`
**Pipeline**: `20260228-customer-vertical`

---

## Prototypes Built

| Artboard | Node ID | Size | Core bet |
|---|---|---|---|
| K — Activity: All | 2G1-0 (shell: 2TI-0) | 1440×960 | Full page shell — baseline filter state with 3 job entries |
| L — Activity: Invoices | 30Q-0 (shell: 30R-0) | 1440×960 | Invoice filter state — 3 invoice states (Sent/Overdue/Paid) |
| M — Activity: Quotes | 36N-0 (shell: 36O-0) | 1440×960 | Quotes filter state — 3 quote states (Draft/Sent/Accepted) |

Notes filter state deemed unnecessary — straightforward enough to implement without a mockup.

---

## Design Decisions — Locked In

### Page Shell

- Full-page layout: sidebar (220px) + main content area
- Same header structure as G and I: breadcrumb → name row → contacts → stats strip → tabs
- Content area: `flex:1` timeline column + 360px Quick Note right rail
- **No horizontal divider lines** between header rows — cleaner than G's border-top approach

### Badge Styles (canonical from G, reconfirmed)

- **VIP**: `background:#FFC6632E; border:1px solid #FFC66359; border-radius:4px; padding:2px 8px; color:#FFC663`
- **Healthy**: green dot (`#54CA74`, 6px circle) + "Healthy" text — no border box (K's simpler style preferred over G's box)
- **School**: `border:1px solid #FFFFFF1F; border-radius:4px; padding:2px 8px; color:#FFFFFF6B`

### Stats Strip (balance fix — canonical from L onward)

Balance sits **immediately after referrals** — no `flex:1` spacer pushing it to the right edge. Referrals and Balance are visually adjacent in the stats strip.

Previous approach (G): right-aligned balance with spacer
Revised (L+): balance flows inline after referrals

### Timeline Entry Pattern

- **No card background** — entries sit directly on `#141515`
- `border-left: 3px solid [color]` is the only visual grouping signal
- `max-width: 700px` on entries — keeps content from spanning the full column width
- `padding: 12px 0 16px 16px` per entry, `margin-bottom: 24px` between entries
- **No `border-bottom` dividers** between entries

### Right-Side Metadata (two-line stack — universal)

Line 1: `[status badge]  $[amount]` — side by side, right-aligned
Line 2: `[timestamp or date]` — 11px, `rgba(255,255,255,0.26)` (muted)

Exception: overdue invoices use `#D23E08` on line 2 instead of muted white (urgency signal).

### Quick Note Right Rail

- `width: 360px`, `border-left: 1px solid #FFFFFF14`
- Textarea: `#1C1D1E` bg, `1px solid #FFFFFF1A` border, `border-radius: 8px`, `min-height: 88px`
- Footer row: Link picker dropdown (flex:1) + Save button (neobrutalist `3px 3px 0 #00000073` shadow)
- Link picker: SVG link icon + "No link" placeholder + chevron-down

### Filter Chips

Pill style: `padding: 5px 14px; border-radius: 20px`
- Inactive: `border: 1px solid #FFFFFF17; color: #FFFFFF52`
- Active: `border: 1px solid #2AB9FF59; background: #2AB9FF17; color: #2AB9FF; font-weight: 500`

### Invoice Card Anatomy (Artboard L)

Left border color by status:
| Status | Color |
|---|---|
| Sent | `#FFC663` (gold) |
| Overdue | `#D23E08` (red) |
| Paid | `#54CA74` (green) |

- INV number: `color: #2AB9FF; text-decoration: underline` — navigates to invoice detail
- Icon circle: 26px, `border-radius: 50%`, tinted bg + border matching status color
- Sub-row: linked job badge + 3px payment progress bar (`background: #54CA74` fill, `#FFFFFF14` track)
- Progress label: `$X / $Y paid` in 11px muted

### Quote Card Anatomy (Artboard M)

Left border and status badge color by status:
| Status | Left border | Semantic |
|---|---|---|
| Draft | `#FFC663` (gold) | Incomplete, needs action |
| Sent | `#2AB9FF` (blue) | Awaiting response |
| Accepted | `#54CA74` (green) | Deal closed |
| Declined | `#D23E08` (red) | Deal lost |
| Expired | `rgba(255,255,255,0.20)` (muted) | Dead, historical |

- Q number: `color: #2AB9FF; text-decoration: underline` — navigates to quote detail
- Sub-row: item count badge + contextual second badge:
  - Draft: "Not yet sent — finish and send" nudge in gold text
  - Sent: expiry chip with clock SVG (`#FFC663` — urgency signal independent of Sent blue)
  - Accepted: "Job J-### created" badge (checkmark icon) — surfaces quote→job lifecycle
- No payment progress bar (quotes don't have partial payments)

---

## Design System Note — Urgency Semantic Tokens

Identified during P3: urgency-signaling colors should be **semantic tokens** separate from raw color tokens.

Proposed token layer:
```
--urgency-critical  → currently maps to --error   (#D23E08)
--urgency-high      → currently maps to --warning  (#FFC663)
--urgency-low       → currently maps to rgba(255,255,255,0.20) muted
```

Rationale: the expiry chip on a Sent quote uses gold for urgency, not because the quote is in a "warning" state. Keeping urgency tokens separate means the urgency color can be tuned globally without touching warning state colors. This applies anywhere time-sensitivity is surfaced (expiry dates, overdue signals, approaching deadlines).

**Action**: Add these tokens to `app/globals.css` when implementing the Activity tab.

---

## Mock Data Used

**Job entries (Artboard K — All filter)**:
- J-1048 · Fall Showcase Fan Shirts — BLOCKED (red) · $4,800 · Started 7d ago
- J-1043 · Spring Cheer Showcase Hoodies — IN PROGRESS (blue) · $9,600 · Due in 4d
- J-1039 · Regional Competition Warmups — DONE (green) · $14,200 · Shipped Oct 3

**Invoice entries (Artboard L — Invoices filter)**:
- INV-1042 · Fall Showcase Fan Shirts — Sent (gold) · $67,200 · 0% paid · Due in 14 days
- INV-1035 · Spring Cheer Camp Jerseys — Overdue (red) · $8,200 · 50% paid · 12 days overdue
- INV-1029 · Summer Invitational Team Uniforms — Paid (green) · $23,400 · 100% paid · Paid Aug 3

**Quote entries (Artboard M — Quotes filter)**:
- Q-1058 · Fall Showcase Fan Shirts — Draft (gold) · $12,400 · 5 items · Saved 2d ago
- Q-1051 · Winter Tournament Uniforms — Sent (blue) · $41,500 · 3 items · Expires in 7 days
- Q-1044 · Summer Invitational Team Uniforms — Accepted (green) · $67,200 · 8 items · Accepted Dec 12 · Job J-1044 created

---

## Next Steps

- [ ] P4 Paper session: Customer Detail Artwork tab
- [ ] Add urgency semantic tokens to `app/globals.css` during Activity tab implementation
- [ ] Build desktop + mobile implementation per manifest waves
