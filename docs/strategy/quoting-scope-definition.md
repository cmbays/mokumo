---
title: 'Quoting Vertical — Scope Definition'
description: "What we'll build (CORE), what we'll mock (PERIPHERAL), what we'll minimize (INTERCONNECTIONS)"
category: strategy
status: complete
phase: 1
created: 2026-02-08
last-verified: 2026-02-08
---

# Quoting Vertical — Scope Definition

**Purpose**: Define boundaries for Quoting mockup in Mokumo
**Status**: Complete (finalized after Playwright exploration + user interview)
**Depends on**: Print Life analysis (complete), user interview (complete)

---

## Terminology: Internal vs External Quoting

| Term                | Definition                                                                                                                | Phase                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Internal Quote**  | Shop operator builds quote for customer using `/quotes/new`. Shop controls pricing and sends final quote.                 | **Phase 1** (building now)                         |
| **External Quote**  | Customer submits quote request via customer portal. Shop reviews, adjusts, approves.                                      | **Phase 2** (UI mockups only in Phase 1)           |
| **Hybrid Approval** | Customer self-service + shop approval gate. Customer submits → shop reviews/adjusts price → approves → customer notified. | **Phase 2** (shop-side status tracking in Phase 1) |

**Phase 1 scope**: Internal quoting only. "Send to Customer" shows email preview mockup but doesn't send. Customer portal link in email is non-functional. All quote statuses (Draft/Sent/Accepted/Declined/Revised) are tracked shop-side only.

---

## CORE Features (Must Build)

These workflows are critical to demonstrating 10x better UX and will be fully functional in the mockup.

### ✅ Quotes List Page (`/quotes`)

**Purpose**: Browse existing quotes, filter by status, find quotes quickly

**Features**:

- [ ] DataTable display with columns: Quote #, Customer, Status, Line Items, Total, Date
- [ ] Search by quote # or customer name (URL query param)
- [ ] Filter by status: All, Draft, Sent, Accepted, Declined, Revised (URL query param)
- [ ] Sort by columns (clickable headers)
- [ ] Click quote row → navigate to `/quotes/[id]`
- [ ] "New Quote" button (primary CTA) → `/quotes/new`
- [ ] Empty state: "No quotes yet" with link to create first quote
- [ ] Quick actions per row: Edit (Draft only), Duplicate, Send (Draft only), View
- [ ] "Duplicate Quote" creates new draft pre-filled with same line items
- [ ] Mock data: 5-6 existing quotes in various statuses (Draft, Sent, Accepted, Declined, Revised)

**Acceptance Criteria**:

- ✅ Can search for quote by customer name or quote number
- ✅ Can filter by status
- ✅ Can sort by any column
- ✅ Clicking quote opens detail view
- ✅ "New Quote" button is prominent

**Quality Checklist**:

- [ ] Visual hierarchy: "New Quote" button is primary action
- [ ] Spacing: Tailwind tokens only
- [ ] Typography: Max 3 sizes (header, body, small)
- [ ] Color: Status badges only (Draft gray, Sent blue, Accepted green, Declined red, Revised gold)
- [ ] Interactive states: All rows have hover state
- [ ] Keyboard: Tab to quote, Enter to open
- [ ] Accessibility: ARIA labels for status, sortable headers labeled

---

### ✅ Quote Detail Page (`/quotes/[id]`)

**Purpose**: View full quote breakdown, see pricing, take actions (edit, duplicate, send, convert)

**Features**:

- [ ] Quote header: Quote #, Status badge, Date, Customer name (click → `/customers/[id]`)
- [ ] Line items table: Description/Garment, Qty, Colors, Print Locations, Unit Price, Line Total
- [ ] Totals section: Subtotal, Setup Fees, Grand Total
- [ ] Action buttons:
  - "Edit Quote" → navigates to `/quotes/[id]/edit` (pre-filled form, Draft status only)
  - "Duplicate Quote" → creates new draft at `/quotes/new` pre-filled with same line items
  - "Send to Customer" → opens email preview modal (mockup, doesn't send)
  - "Convert to Invoice" (non-functional, shows "Coming in Phase 2")
  - "Download PDF" (non-functional, shows "Coming in Phase 2")
- [ ] Breadcrumb: Dashboard > Quotes > Q-1024
- [ ] Back link to `/quotes`
- [ ] Handle invalid quote ID (show "Quote not found" with link to quotes list)

**Acceptance Criteria**:

- ✅ Shows complete quote information
- ✅ Totals are accurate (sum of line items + setup fees)
- ✅ Customer link works
- ✅ Action buttons present (even if some non-functional)
- ✅ Invalid quote ID shows error state

**Quality Checklist**:

- [ ] Visual hierarchy: Quote # and total most prominent
- [ ] Spacing: Balanced sections with clear separators
- [ ] Typography: Consistent with list view
- [ ] Color: Status badge meaningful (Draft/Sent/Accepted/Declined)
- [ ] Interactive states: Links underlined on hover
- [ ] Empty states: None (detail assumes quote exists)

---

### ✅ New Quote Form (`/quotes/new`)

**Purpose**: Create new quotes with dynamic line items and real-time pricing

**Features**:

- [ ] Customer selector:
  - Searchable dropdown/combobox populated from mock customer data
  - Shows customer name + company
  - Required field
  - If customer doesn't exist: "Add New Customer" link opens simple modal (name + email only)
- [ ] Line items section:
  - Start with 1 empty row
  - Per-line fields:
    - Garment (searchable combobox: shows Brand + SKU + Style Name)
    - **Color selection: S&S-style dense swatch grid** (per 4Ink owner request)
      - Swatches packed tight (~32-40px), color name in white text overlaid on swatch
      - Search/filter bar above swatches
      - Favorites row at top (starred colors)
      - Dark text for very light colors (white, cream)
    - Size breakdown (inline grid: XS, S, M, L, XL, 2XL, 3XL with qty per size)
    - Print locations (checkbox group: Front, Back, L Sleeve, R Sleeve, Neck Label)
    - Color count per location (number input, defaults to 1)
  - "Add Another Line Item" button adds new row
  - "Remove" button per row (if multiple rows exist)
  - **Real-time pricing calculation**: Instant client-side — NEVER blocks input (addresses #1 friction point)
    - Formula (simplified): Unit Price = (Base Garment Price) + (Colors × Color Upcharge) + (Locations × Location Upcharge)
    - Line Total = Unit Price × sum of size breakdown quantities
- [ ] Setup fees field (number, optional, default $0)
- [ ] Totals section:
  - Subtotal = sum of all line items (read-only)
  - Setup Fees = user-entered value
  - Grand Total = Subtotal + Setup Fees (**editable for price override** — shop can adjust before customer sees)
  - If overridden, show indicator: "Price adjusted from $X"
- [ ] Notes section (collapsed accordion):
  - Internal Notes (shop-only, not visible to customer)
  - Customer Notes (visible on sent quote)
- [ ] Action buttons:
  - "Save as Draft" (secondary, validates form, saves with Draft status)
  - "Save & Send to Customer" (primary CTA, saves + opens email preview modal)
  - "Cancel" (text link, navigates to `/quotes`)
- [ ] Form validation (Zod schema):
  - Customer: required
  - At least 1 line item: required
  - Per line: Garment, Quantity, Locations required; Colors optional (default 1)
  - Setup fees: optional, non-negative
  - Show error messages inline (red text under field)
- [ ] Keyboard optimization:
  - Tab through customer → line items → setup fees → buttons
  - Enter to add new line item
  - Shift+Tab to go back

**Acceptance Criteria**:

- ✅ Can select customer from dropdown (type-ahead search)
- ✅ Can add multiple line items
- ✅ Can specify garment, color (S&S-style swatch grid), size breakdown, print locations
- ✅ Pricing calculates in real-time — **never blocks input**
- ✅ Totals update automatically, grand total is overridable
- ✅ Can save as draft (adds to mock quotes list)
- ✅ Can save & send (opens email preview modal)
- ✅ Validation prevents incomplete quotes
- ✅ Keyboard navigable — tab through all fields without mouse
- ✅ Color swatch grid uses S&S-style dense layout with white text overlay

**Quality Checklist**:

- [ ] Visual hierarchy: "Save & Send" is primary action (action blue, neobrutalist shadow), "Save as Draft" is secondary
- [ ] Spacing: Clear section breaks, 8px base scale
- [ ] Typography: Field labels clear, helper text for price formula
- [ ] Color: Error messages red, success green, calculation feedback blue
- [ ] Interactive states: Required field indicators (\*), hover states on inputs
- [ ] Empty state: One blank line item ready to fill
- [ ] Loading: N/A (instant client-side calculations)
- [ ] Error handling: Validation messages inline, prevent submission if invalid
- [ ] Color swatch grid: Dense layout, white text overlay, search bar, favorites row

---

### ✅ S&S-Style Color Swatch Component (Reusable)

**Purpose**: Dense color picker matching S&S Activewear UI, requested by 4Ink owner

**Features**:

- [ ] Dense grid of color swatches (~32-40px squares) packed tight with minimal gap
- [ ] Color name displayed in **white text overlaid** on the swatch
- [ ] Dark text for very light colors (white, cream, light yellow)
- [ ] Search/filter bar above grid: type to filter colors by name
- [ ] Favorites row at top: starred colors shown first (initially pre-populated with common colors)
- [ ] Selected state: checkmark overlay + border highlight
- [ ] Multi-select mode (for future use) vs single-select mode
- [ ] Reusable component in `components/features/ColorSwatchPicker.tsx`
- [ ] Mock color data: ~30-50 common garment colors with hex values

**Acceptance Criteria**:

- ✅ Swatches are tightly packed with color name visible on each swatch
- ✅ Can search/filter colors by name
- ✅ Favorites appear at top of grid
- ✅ Selected color is visually distinct
- ✅ Keyboard navigable (Arrow keys to move, Enter/Space to select)

**Quality Checklist**:

- [ ] Visual: Matches S&S Activewear color grid aesthetic (dense, no wasted space)
- [ ] Typography: Color name small but legible (10-11px), white text with subtle shadow for readability
- [ ] Interactive: Hover shows enlarged swatch or tooltip with full color name
- [ ] Accessibility: ARIA labels for color names, keyboard navigation

---

## PERIPHERAL Features (Show in UI, Simplified or Non-Functional)

These features are nice-to-have but won't block the demo. Show them in UI so the journey feels complete, but don't build full functionality.

### 🟡 Customer Creation Modal (within Quote Form)

**Purpose**: Let user quickly add new customer if not in list

**Implementation**:

- [ ] Simple modal with 2 fields: Name, Email
- [ ] "Save Customer" button adds to mock data
- [ ] Modal closes, customer auto-selected in form
- [ ] No company/address/phone fields (keep it minimal)

---

### 🟡 Artwork Upload Area (expandable section)

**Purpose**: Show where artwork would attach in future

**Implementation**:

- [ ] Expandable "Artwork (Optional)" section at bottom of form
- [ ] Drag-and-drop placeholder: "Drag files here or click to upload"
- [ ] Accept .jpg, .png, .pdf (show message, don't actually upload)
- [ ] Placeholder image display (don't process files)
- [ ] Completely optional (not in quote creation MVP)

---

### 🟡 Quote PDF Preview (non-functional button)

**Purpose**: Show customer that PDF export will be available

**Implementation**:

- [ ] "Download PDF" button on Quote Detail
- [ ] Clicking shows toast: "PDF generation coming in Phase 2"
- [ ] Don't build actual PDF generation

---

### 🟡 "Send to Customer" Email Preview (mockup)

**Purpose**: Demonstrate quote submission flow to customer
**Phase note**: This is a **shop-side mockup only**. No email is sent. The portal link in the preview is non-functional. Full email sending and customer portal are Phase 2 (External Quoting).

**Implementation**:

- [ ] "Send to Customer" button on Quote Detail
- [ ] Clicking opens modal with email preview:

  ```
  To: [customer email]
  Subject: Your quote from 4Ink — [Quote #]

  Hi [Customer Name],

  Here's your quote for [order description].
  Please review the details and let us know if you have questions.

  [View Quote Button: https://app.4ink.com/quotes/[id]/view]

  Total: $[total]
  ```

- [ ] "Send Email" button shows toast: "Email sent to [customer]"
- [ ] Don't actually send email (Phase 2)

---

## INTERCONNECTIONS (Minimal Representation)

These features touch other verticals but won't be fully built yet. Show them in UI to complete the journey, but keep them simple.

### → Customer Management: Customer Selection

**Current Approach**: Dropdown selecting from mock customer data
**Minimal Representation**:

- [ ] Customer combobox in New Quote form (searchable)
- [ ] Shows customer name + company in dropdown
- [ ] Link to customer detail page on Quote Detail page
- [ ] **Don't build**: Full customer CRUD, customer editing, contact management
- **Phase 2**: Full Customer Management vertical will replace this simple dropdown

### → Pricing Matrix: Auto-Calculated Pricing

**Current Approach**: Hard-coded formula in quote form
**Minimal Representation**:

```javascript
// Simplified formula (to be confirmed with Chris)
const unitPrice =
  garment.basePrice + // e.g., $3.50
  colors * 0.5 + // +$0.50 per additional color
  locations * 0.25 // +$0.25 per additional location
const lineTotal = unitPrice * quantity
```

- [ ] Display pricing breakdown in quote form (maybe in tooltip?)
- [ ] Real-time updates as user changes quantity/colors/locations
- [ ] **Don't build**: Configurable pricing matrix, admin UI, bulk pricing rules
- **Phase 2**: Pricing Matrix vertical will replace this hard-coded formula

### → Invoicing: "Convert to Invoice" Button (Non-Functional)

**Current Approach**: Button present, non-functional
**What user sees**:

- [ ] "Convert to Invoice" button on Quote Detail
- [ ] Clicking shows modal: "Invoice generation coming in Phase 2"
- [ ] Link to Invoicing documentation (Phase 2 roadmap)
- [ ] **Don't build**: Actual invoice creation, invoice form, invoice list
- **Phase 2**: Invoicing vertical will implement this

### → Reporting: Quote Totals for Revenue Dashboard

**Current Approach**: Data captured but not displayed
**Minimal Representation**:

- [ ] Quote totals stored in mock data with dates
- [ ] Will feed into Phase 2 Reporting dashboard
- [ ] **Don't build**: Reports, dashboards, trends, conversion metrics
- **Phase 2**: Reporting vertical will display this data

### → Customer Portal: Public Quote View (Non-Functional URL)

**Current Approach**: Mock email shows public link, no actual page
**Minimal Representation**:

- [ ] "Send to Customer" email preview shows link like:
  ```
  https://app.4ink.com/quotes/q-1024/view?token=abc123
  ```
- [ ] Link is not functional (no actual customer portal page)
- [ ] Show in email so user understands customer journey
- [ ] **Don't build**: Customer portal, authentication, customer login
- **Phase 2**: Customer Portal will implement this

---

## What We're Explicitly NOT Building

### ❌ Customer Portal Page (`/quotes/[id]/view`)

**Why**: Customer-facing page requires auth, login, acceptance workflow — defer to Phase 2

### ❌ Invoice Generation

**Why**: Separate vertical, depends on Quoting completion

### ❌ Pricing Matrix Admin UI

**Why**: Separate vertical, depends on quoting and pricing validation

### ❌ Real PDF Generation

**Why**: Requires library (pdfkit, react-pdf), not critical for demo

### ❌ Email Sending

**Why**: Requires backend, SMTP config, email service

### ❌ Advanced Pricing Features

- Bulk discounts (buy 100+ save 5%)
- Customer-specific pricing
- Seasonal pricing adjustments
- Margin calculations

### ❌ Quote Templates

**Why**: Can be Phase 2 feature ("Duplicate Quote" hint at this)

### ❌ Multi-Garment Batching

**Why**: Each line item is independent for now (batch operations are Phase 2)

---

## Scope Summary

| Component                   | Scope                  | Status                                                      |
| --------------------------- | ---------------------- | ----------------------------------------------------------- |
| Quotes List                 | CORE                   | Build fully (filters, search, quick actions, duplicate)     |
| Quote Detail                | CORE                   | Build fully (actions: edit, duplicate, send, view)          |
| New Quote Form              | CORE                   | Build fully (most complex — single-page, instant calc)      |
| S&S Color Swatch Grid       | CORE                   | Build as reusable component (dense grid, search, favorites) |
| Customer combobox           | CORE + INTERCONNECTION | Build simple combobox with type-ahead                       |
| Customer modal              | PERIPHERAL             | Build simple modal (Name, Email, Company)                   |
| Artwork upload              | PERIPHERAL             | Show placeholder, don't process                             |
| PDF download                | PERIPHERAL             | Show button, mock response                                  |
| Email preview               | PERIPHERAL             | Show modal mockup, don't send                               |
| Price override              | CORE                   | Editable grand total on quote form                          |
| Quote notes                 | CORE                   | Internal + customer-facing notes                            |
| Pricing formula             | INTERCONNECTION        | Hard-code formula, instant client-side                      |
| "Convert to Invoice" button | INTERCONNECTION        | Non-functional, show message                                |
| Customer portal             | ❌ NOT BUILDING        | Defer to Phase 2                                            |
| Invoice generation          | ❌ NOT BUILDING        | Defer to Invoicing vertical                                 |
| Pricing Matrix admin        | ❌ NOT BUILDING        | Defer to Pricing vertical                                   |

---

## Mock Data Requirements

**Quotes (5-6 examples covering all statuses)**:

```javascript
;[
  { id: 'q-1024', number: 'Q-1024', status: 'draft', customer: 'Downtown Brewery', total: 475.0 },
  { id: 'q-1025', number: 'Q-1025', status: 'sent', customer: 'Riverside Church', total: 890.0 },
  {
    id: 'q-1026',
    number: 'Q-1026',
    status: 'accepted',
    customer: 'Metro Youth Soccer',
    total: 1250.0,
  },
  { id: 'q-1027', number: 'Q-1027', status: 'declined', customer: 'Sunset 5K Run', total: 340.0 },
  { id: 'q-1028', number: 'Q-1028', status: 'revised', customer: 'Downtown Brewery', total: 520.0 },
  { id: 'q-1029', number: 'Q-1029', status: 'draft', customer: 'Lakeside Festival', total: 2100.0 },
]
```

Each quote includes:

- `lineItems[]` with garment, color, sizes (size breakdown), locations, colorCount, unitPrice, lineTotal
- `setupFees`, `subtotal`, `total`, `priceOverride` (optional)
- `internalNotes`, `customerNotes` (optional)
- `createdAt`, `updatedAt`, `sentAt` (optional)

**Customers** (linked to quotes):

- Pull from existing `lib/mock-data.ts`
- 4-5 customers sufficient for demo

**Garments** (for dropdown):

- Pull from existing mock garment data
- Show Brand + SKU + Style Name in dropdown (e.g., "Bella+Canvas 3001 — Unisex Short Sleeve")

**Colors** (for swatch grid):

- ~30-50 common garment colors with name + hex value
- Include: Black, White, Navy, Red, Royal, Kelly Green, Gold, Orange, Charcoal, Heather Grey, Maroon, Purple, Sand, Berry, etc.
- Pre-populated favorites: Black, White, Navy, Red, Royal

---

## Related Documents

- `docs/competitive-analysis/print-life-quoting-analysis.md` (Print Life features)
- `docs/competitive-analysis/print-life-journey-quoting.md` (Print Life workflows)
- `docs/strategy/mokumo-journey-quoting.md` (improved workflow design)
- `.claude/plans/vertical-by-vertical-strategy.md` (overall strategy)
- `CLAUDE.md` (quality checklist, design system)
