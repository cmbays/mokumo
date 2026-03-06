---
title: 'Mokumo — Improved Quoting Journey'
description: 'Redesigned quoting workflow addressing all 10 Print Life friction points with 60-70% time reduction targets'
category: strategy
status: complete
phase: 1
created: 2026-02-08
last-verified: 2026-02-08
depends-on:
  - docs/competitive-analysis/print-life-quoting-analysis.md
  - docs/competitive-analysis/print-life-journey-quoting.md
  - docs/strategy/quoting-scope-definition.md
---

# Mokumo — Improved Quoting Journey

**Purpose**: Design the 10x better quoting workflow for Mokumo based on Print Life friction analysis and 4Ink user interview
**Input**: Playwright exploration, user interview, competitive analysis, scope definition
**Status**: Complete — ready for build phase

---

## Terminology: Internal vs External Quoting

| Term                | Definition                                                                                                                | Phase                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Internal Quote**  | Shop operator builds quote for customer using `/quotes/new`. Shop controls pricing and sends final quote.                 | **Phase 1** (building now)                         |
| **External Quote**  | Customer submits quote request via customer portal. Shop reviews, adjusts, approves.                                      | **Phase 2** (UI mockups only in Phase 1)           |
| **Hybrid Approval** | Customer self-service + shop approval gate. Customer submits → shop reviews/adjusts price → approves → customer notified. | **Phase 2** (shop-side status tracking in Phase 1) |

**Phase 1 builds**: Internal quoting (shop-side form, quote list, quote detail, email preview mockup). All "Send to Customer" flows show UI mockups but don't actually send.

**Phase 2 builds**: Customer portal, customer self-service form, hybrid approval workflow, real email/notification sending.

---

## Design Principles (From Discovery)

1. **Never block input** — all calculations happen instantly client-side, never prevent typing
2. **Eliminate friction steps** — only show steps the shop actually uses, skip the rest
3. **Non-destructive editing** — changing one option never wipes other selections
4. **Keyboard-first data entry** — tab through all fields without mouse
5. **Persistent state** — auto-save drafts, URL-based state, never lose work
6. **Hybrid approval** — customer submits → shop reviews/adjusts → approves → customer notified
7. **Reuse over rebuild** — duplicate quotes, customer history, templates

---

## Journey Overview

### Internal Quote (Shop builds for customer)

**Target**:

- Simple quote: **3-4 minutes**, **8-12 clicks** (vs Print Life 10 min, 20-30 clicks)
- Complex quote: **6-8 minutes**, **20-30 clicks** (vs Print Life 15-20 min, 40-60 clicks)

### External Quote (Customer self-service with approval gate) — PHASE 2

**Target** (aspirational, not building in Phase 1):

- Customer submits request: **5-7 minutes** (streamlined form, no mandatory unused steps)
- Shop reviews + approves: **1-2 minutes** (price override + approve button)
- Customer receives final quote via email/portal link

---

## Redesigned Flow: Internal Quote

```
START: Customer calls/emails requesting 50 black tees with front print
  ↓
SINGLE PAGE: New Quote Form (/quotes/new)
  ┌─────────────────────────────────────────────────────┐
  │ SECTION 1: Customer                                  │
  │  • Searchable combobox (type-ahead)                  │
  │  • Shows name + company                              │
  │  • "Add New Customer" inline link → simple modal     │
  │  • 🔗 Links to customer history (past quotes)        │
  │  ⏱ Time: ~10 seconds                                │
  ├─────────────────────────────────────────────────────┤
  │ SECTION 2: Line Items (repeatable)                   │
  │  ┌─────────────────────────────────────────────────┐ │
  │  │ GARMENT: Searchable dropdown (SKU + Style)      │ │
  │  │ COLOR: S&S-style dense swatch grid              │ │
  │  │   • Swatches packed tight, no wasted space      │ │
  │  │   • Color name in white text over swatch        │ │
  │  │   • Search/filter bar above swatches            │ │
  │  │   • Favorites section (starred colors)          │ │
  │  │ QTY/SIZES: Inline grid (S M L XL 2XL...)       │ │
  │  │   • Tab between fields — INSTANT calculation    │ │
  │  │   • Total qty auto-summed                       │ │
  │  │   • Never blocks input                          │ │
  │  │ PRINT LOCATIONS: Checkbox group                 │ │
  │  │   • Front, Back, L Sleeve, R Sleeve, Neck Label │ │
  │  │   • Click to toggle, no forced sub-steps        │ │
  │  │ COLOR COUNT: Number input per location          │ │
  │  │ ARTWORK: Optional drag-drop zone (collapsed)    │ │
  │  │                                                 │ │
  │  │ LINE PRICE: Auto-calculated, shown inline       │ │
  │  └─────────────────────────────────────────────────┘ │
  │  [+ Add Another Line Item]                           │
  │  ⏱ Time: ~2-3 minutes (simple), ~4-6 min (complex) │
  ├─────────────────────────────────────────────────────┤
  │ SECTION 3: Pricing Summary                           │
  │  • Subtotal (auto-calculated from line items)        │
  │  • Setup Fees (editable number field)                │
  │  • Grand Total (auto-calculated)                     │
  │  • Price override: Edit grand total directly         │
  │  ⏱ Time: ~15 seconds                               │
  ├─────────────────────────────────────────────────────┤
  │ SECTION 4: Notes (optional, collapsed)               │
  │  • Internal notes (shop-only)                        │
  │  • Customer-facing notes (shown on quote)            │
  │  ⏱ Time: ~15 seconds if used                       │
  ├─────────────────────────────────────────────────────┤
  │ ACTIONS:                                             │
  │  [Save as Draft]  [Save & Send to Customer]          │
  │  ⏱ Time: ~5 seconds                                │
  └─────────────────────────────────────────────────────┘
  ↓
RESULT: Quote saved → appears in Quotes List with status
  • "Save as Draft" → status: Draft (editable)
  • "Save & Send" → status: Sent (email/link sent to customer)
  ↓
POST-FLOW: Quote Tracking Dashboard (/quotes)
  • Filter: Draft | Sent | Accepted | Declined
  • Quick actions: Edit, Duplicate, Send, Convert to Invoice
  • Customer can view quote → Accept or Request Changes
  • Shop gets notification → reviews → approves/adjusts
```

**Total: ~3-4 minutes (simple), ~6-8 minutes (complex)**

---

## Key Differences from Print Life

| Aspect              | Print Life (6 Steps)                          | Mokumo (1 Page)                           |
| ------------------- | --------------------------------------------- | ----------------------------------------- |
| **Flow**            | 6 mandatory sequential steps                  | Single scrollable form with sections      |
| **Steps**           | Can't skip unused steps                       | Only show what's needed                   |
| **Qty entry**       | Blocks on recalculation                       | Instant client-side calculation           |
| **Color picker**    | 103 tiny swatches, no search                  | S&S-style dense grid + search + favorites |
| **Art upload**      | Forced color swatches, resets on style change | Optional drag-drop, non-destructive       |
| **Navigation**      | Mouse-only BACK/NEXT                          | Keyboard-first (Tab, Enter, shortcuts)    |
| **State**           | Session-based, lost on navigate               | Auto-save draft, URL state, persistent    |
| **Quote lifecycle** | None (immediately becomes invoice)            | Draft → Sent → Accepted → Declined        |
| **Reuse**           | Rebuild from scratch                          | Duplicate quote, customer history         |
| **Customer comm**   | Phone call                                    | Email/portal link with approval gate      |
| **Price control**   | Auto-calculated only                          | Auto-calculated + manual override         |

---

## Detailed Section Design

### Section 1: Customer Selection

**UI Elements**:

- Combobox with type-ahead search
- Dropdown shows: Customer Name — Company Name
- "Add New Customer" link at bottom of dropdown → opens simple modal (Name, Email, Company)
- After selecting customer, show compact info card: Name, Company, Email, "View History" link
- If customer has past quotes, show count badge: "3 previous quotes"

**Keyboard**: Tab to focus, type to search, Arrow keys to navigate, Enter to select

**Friction Points Addressed**: None directly (Print Life has customer selection too), but ours is faster with type-ahead

---

### Section 2: Line Items

This is the heart of the form and where most time savings come from.

#### Garment Selection

**UI Elements**:

- Searchable dropdown/combobox
- Shows: Brand + SKU + Style Name (e.g., "Bella+Canvas 3001 — Unisex Short Sleeve")
- Type to filter (searches brand, SKU, style name)
- Recently used garments at top of list

**Keyboard**: Tab to focus, type to search, Arrow keys, Enter to select

**Friction Points Addressed**: #4 (overwhelming catalog) — search replaces scrolling through grid

#### Color Selection (S&S-Style Dense Swatch Grid)

**UI Elements** (per 4Ink owner request):

- Dense grid of color swatches packed tightly together (minimal gap between swatches)
- Each swatch is a square (~32-40px) with the actual color as background
- Color name displayed in **white text overlaid** on the swatch (small font, ~10-11px)
- For very light colors (white, cream): dark text overlay instead
- Search/filter bar above the grid: type "Black" to filter to matching colors
- Selected color has a visible checkmark overlay and/or border highlight
- "Favorites" row at top: starred colors appear first (persisted per user)
- Swatch grid scrollable if many colors, but visible area shows ~40-60 colors at once

**Example Layout**:

```
[Search colors...]

★ Favorites: [Black] [White] [Navy] [Red]

┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│Black │White │Navy  │Red   │Royal │Kelly │Gold  │Orange│
│      │      │      │      │      │Green │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│Charc.│Hthr  │Maize │Maroon│Purple│Hthr  │Sand  │Berry │
│      │Grey  │      │      │      │Navy  │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│...   │...   │...   │...   │...   │...   │...   │...   │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

**Keyboard**: Tab to grid, Arrow keys to navigate swatches, Enter/Space to select

**Friction Points Addressed**: #4 (103 tiny swatches, no search) — dense but searchable grid with favorites

#### Quantity / Size Breakdown

**UI Elements**:

- Inline size grid: `XS | S | M | L | XL | 2XL | 3XL | 4XL | 5XL`
- Number input per size
- Total qty auto-calculated and displayed at end of row
- **All calculations are instant and client-side** — never block input
- Tab between size fields seamlessly
- Unit price and line total update in real-time as quantities change
- Optional: Show stock levels per size (from vendor API in Phase 2)

**Keyboard**: Tab through S → M → L → XL → 2XL etc. without any delay

**Friction Points Addressed**: #1 (CRITICAL — recalculation blocks input) — 100% eliminated

#### Print Locations

**UI Elements**:

- Checkbox group: ☐ Front ☐ Back ☐ Left Sleeve ☐ Right Sleeve ☐ Neck Label
- Click to toggle, no sub-steps or forced selections
- Optional: Color count per location (number input, defaults to 1)
- No forced art color swatch selection (addresses friction #5)
- No ink style or finishing sub-steps (addresses friction #2)

**Keyboard**: Tab to checkboxes, Space to toggle

**Friction Points Addressed**: #2 (mandatory unused steps), #3 (art style reset), #5 (forced art swatches)

#### Artwork (Optional, Collapsed)

**UI Elements**:

- Collapsed by default: "Artwork (Optional)" accordion
- Expand to show drag-and-drop zone per selected print location
- Accept .jpg, .png, .pdf, .ai, .eps
- Thumbnail preview after upload
- **Non-destructive**: Changing print locations or garment never clears uploaded artwork
- Phase 1: Show UI, don't process files

**Friction Points Addressed**: #3 (changing style resets art) — non-destructive editing

#### Line Item Pricing (Inline)

**UI Elements**:

- Right-aligned on the line item row:
  ```
  Unit: $8.50  ×  Qty: 50  =  Line Total: $425.00
  ```
- Auto-calculated from: garment base + (colors × upcharge) + (locations × upcharge)
- Updates instantly as any field changes
- Tooltip/info icon shows pricing breakdown

---

### Section 3: Pricing Summary

**UI Elements**:

```
Subtotal:    $425.00   (sum of all line items, read-only)
Setup Fees:  $50.00    (editable number field)
─────────────────────
Grand Total: $475.00   (auto-calculated, BUT editable for override)
```

- Grand Total is editable — shop can override the calculated price
- If overridden, show subtle indicator: "Price adjusted from $475.00"
- Override is the price the customer sees

**Friction Points Addressed**: Price override capability (requested in interview)

---

### Section 4: Notes (Optional, Collapsed)

**UI Elements**:

- Two text areas in a collapsed accordion:
  - "Internal Notes" — visible only to shop (e.g., "Rush order, customer is VIP")
  - "Customer Notes" — visible on sent quote (e.g., "Delivery in 2 weeks")

---

### Actions

**UI Elements**:

- **"Save as Draft"** — secondary button, saves quote with Draft status
- **"Save & Send to Customer"** — primary CTA (action blue, neobrutalist shadow), saves + opens send confirmation
- **"Cancel"** — text link, confirms before discarding

**Send Flow**:

1. Click "Save & Send" → modal with email preview
2. Shows: recipient email, subject, quote summary, portal link
3. Shop can edit before sending
4. "Send Quote" → status changes to Sent → email/notification sent to customer
5. Toast: "Quote Q-1024 sent to customer@email.com"

---

## Post-Flow: Quotes List Dashboard

### Quotes List (`/quotes`)

**Columns**: Quote # | Customer | Status | Items | Total | Date | Actions

**Status Badges**:

- Draft (gray) — editable, not sent
- Sent (blue) — sent to customer, awaiting response
- Accepted (green) — customer accepted
- Declined (red) — customer declined or expired
- Revised (amber) — customer requested changes

**Quick Actions** (per row):

- Edit (Draft only)
- Duplicate → creates new draft with same line items
- Send (Draft → Sent)
- View (opens detail)

**Filters**: Status dropdown, search by customer/quote #, date range

**Friction Points Addressed**: #6 (no quote reuse), #7 (no quote tracking)

---

## Post-Flow: Quote Detail (`/quotes/[id]`)

**Header**: Quote # + Status badge + Date + Customer (clickable link)

**Body**: Read-only version of the quote form (line items, pricing, notes)

**Actions**:

- "Edit Quote" (if Draft)
- "Duplicate Quote" → `/quotes/new` pre-filled
- "Send to Customer" (if Draft) → send flow
- "Convert to Invoice" (if Accepted) → Phase 2
- "Download PDF" → Phase 2

**Friction Points Addressed**: #6 (duplicate for reuse), #7 (status tracking), #8 (customer self-service)

---

## Hybrid Approval Workflow

This is our key differentiator — no competitor does this well.

```
CUSTOMER FLOW:
  Customer receives email/link → views quote on portal
    ↓
  Option A: "Accept Quote" → status changes to Accepted → shop notified
  Option B: "Request Changes" → adds comment → status changes to Revised → shop notified
  Option C: No action → quote expires after configurable period

SHOP FLOW:
  Shop receives notification (in-app + email)
    ↓
  Reviews quote in dashboard → can adjust price before customer sees it
    ↓
  "Approve & Send" → customer gets final quote
    ↓
  Tracks all quotes: Draft → Sent → Accepted/Declined/Revised
```

**Phase 1 Scope**: Build the shop-side UI (quotes list with statuses, send flow mockup). Customer portal is Phase 2.

---

## Time Distribution (Target)

### Simple Quote (3-4 minutes)

| Activity                              | Time         | %   | Print Life  |
| ------------------------------------- | ------------ | --- | ----------- |
| Customer selection                    | ~10 sec      | 4%  | Same        |
| Garment search + select               | ~30 sec      | 12% | 1-2 min     |
| Color selection (dense grid + search) | ~10 sec      | 4%  | 30 sec      |
| Qty/size entry (instant calc)         | ~30 sec      | 12% | 2-3 min     |
| Print locations (checkboxes)          | ~10 sec      | 4%  | 1-2 min     |
| Skip unused steps                     | 0 sec        | 0%  | 1 min       |
| Review pricing                        | ~15 sec      | 6%  | N/A         |
| Save/Send                             | ~5 sec       | 2%  | 1-2 min     |
| Wait for recalculations               | 0 sec        | 0%  | 1-2 min     |
| **Total**                             | **~3-4 min** |     | **~10 min** |

### Complex Quote — 3 Garments (6-8 minutes)

| Activity                                        | Time         | Notes                       |
| ----------------------------------------------- | ------------ | --------------------------- |
| Customer selection                              | ~10 sec      | Same as simple              |
| Line item 1 (garment + color + qty + locations) | ~2-3 min     | Includes all fields         |
| Line item 2                                     | ~1.5-2 min   | Faster (familiar with form) |
| Line item 3                                     | ~1.5-2 min   | Faster (familiar with form) |
| Review pricing + adjust                         | ~30 sec      | Review all items            |
| Save/Send                                       | ~10 sec      |                             |
| **Total**                                       | **~6-8 min** | vs Print Life 15-20 min     |

---

## Friction Point Resolution Summary

| #   | Print Life Friction                    | Our Solution                                         | Status                  |
| --- | -------------------------------------- | ---------------------------------------------------- | ----------------------- |
| 1   | Qty fields block on recalculation      | Instant client-side calculation, never block input   | CORE                    |
| 2   | Mandatory steps can't be skipped       | Single-page form, no steps to skip                   | CORE                    |
| 3   | Art style change resets all selections | Non-destructive editing, artwork persists            | CORE                    |
| 4   | Color swatch grid overwhelming         | S&S-style dense grid + search + favorites            | CORE                    |
| 5   | Forced art color swatch selection      | Optional artwork section, no forced sub-steps        | CORE                    |
| 6   | No quote reuse/duplication             | "Duplicate Quote" button on detail + list            | CORE                    |
| 7   | No quote tracking                      | Full status dashboard (Draft/Sent/Accepted/Declined) | CORE                    |
| 8   | No approval workflow                   | Hybrid: customer submits → shop reviews → approves   | PHASE 2 (UI in Phase 1) |
| 9   | No keyboard navigation                 | Tab through all fields, keyboard shortcuts           | CORE                    |
| 10  | Session state lost on navigation       | Auto-save draft, URL state, persistent form          | CORE                    |

---

## Success Metrics

| Metric                 | Print Life (Actual)      | Target                   | Improvement     |
| ---------------------- | ------------------------ | ------------------------ | --------------- |
| Simple quote time      | 10 min                   | 3-4 min                  | 60-70% faster   |
| Complex quote time     | 15-20 min                | 6-8 min                  | 50-60% faster   |
| Simple quote clicks    | 20-30                    | 8-12                     | 60% fewer       |
| Complex quote clicks   | 40-60                    | 20-30                    | 50% fewer       |
| Mandatory unused steps | 2                        | 0                        | Eliminated      |
| Recalculation blocking | Every field              | Never                    | 100% eliminated |
| Quote reuse            | Not possible             | 1-click duplicate        | New capability  |
| Quote tracking         | None                     | Full dashboard           | New capability  |
| Customer self-service  | No approval gate         | Hybrid with approval     | Differentiator  |
| Color picker UX        | Tiny swatches, no search | Dense S&S-style + search | Major upgrade   |

---

## Build Order (Phase 1)

1. **Quotes List page** (`/quotes`) — DataTable with mock quotes, status filters, search
2. **New Quote Form** (`/quotes/new`) — Single-page form with all sections, instant pricing
3. **Quote Detail page** (`/quotes/[id]`) — Read-only view with action buttons
4. **Color Swatch Component** — S&S-style dense grid (reusable across app)
5. **Customer Combobox** — Type-ahead search with "Add New" modal
6. **Email Preview Modal** — "Send to Customer" mockup

---

## Related Documents

- `docs/competitive-analysis/print-life-quoting-analysis.md` (Print Life features)
- `docs/competitive-analysis/print-life-journey-quoting.md` (Print Life journey + friction)
- `docs/strategy/quoting-scope-definition.md` (scope boundaries)
- `.claude/plans/vertical-by-vertical-strategy.md` (overall strategy)
- `CLAUDE.md` (quality checklist, design system)
