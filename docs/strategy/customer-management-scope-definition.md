---
title: 'Customer Management Vertical — Scope Definition'
description: "What we'll build (CORE), what we'll mock (PERIPHERAL), what we'll minimize (INTERCONNECTIONS)"
category: strategy
status: complete
phase: 1
vertical: customer-management
created: 2026-02-09
last-verified: 2026-02-09
---

# Customer Management Vertical — Scope Definition

**Purpose**: Define boundaries for Customer Management mockup in Mokumo
**Status**: Complete (finalized after competitive research + user interview)
**Depends on**: Competitive analysis (complete), industry research (complete), user interview (complete), quoting vertical (built)

---

## Design Philosophy

> "Don't build a CRM. Build a customer **view** that connects to everything else."

The customer detail page is a **dashboard, not a form**. It answers five questions in 5 seconds:

1. **Who is this customer?** (Company, contact, tag, lifecycle stage)
2. **What's our relationship?** (Lifetime orders, revenue, how long, health status)
3. **What's active right now?** (Open quotes, in-progress jobs)
4. **What did we do for them before?** (Past orders, artwork library)
5. **What do I need to know?** (Notes, preferences, tax exempt, pricing terms)

### Key Principles (from Interview)

- **One layout that breathes**: Same page structure for all customers. Content density adapts to lifecycle stage. Contract customers may warrant a view variant — evaluate during breadboarding.
- **80%+ auto-populate**: When you pick a customer, most fields inherit from their defaults. The software "knows" them.
- **Speed over features**: Adding a customer < 30 seconds. Seeing their full picture < 5 seconds.
- **Zero admin overhead**: Lifecycle transitions are automatic. Churn detection is automatic. The shop owner manages customers, not the software.
- **Record of truth**: Every feature moves toward making Mokumo the single source of truth for customer relationships.
- **Mobile-friendly from day one**: Every screen in this vertical must be responsive and usable on mobile. Shop owners take calls on the shop floor, check customer history from their phone, and need quick lookups while away from their desk. Build with mobile breakpoints from the start — not as an afterthought. Future mobile app is on the roadmap; responsive web is the Phase 1 foundation.

---

## Terminology

| Term                    | Definition                                                                                                                 | Phase                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Company**             | Top-level entity. Owns aggregate stats, loyalty tier, pricing defaults.                                                    | **Phase 1**                         |
| **Group**               | Optional subdivision within a company (e.g., Marketing Dept, Events Team). Shares artwork context.                         | **Phase 1** (simple implementation) |
| **Contact**             | Individual person. Has own order history, artwork preferences, communication records.                                      | **Phase 1**                         |
| **Lifecycle Stage**     | Structured enum: Prospect → New → Repeat → Contract. Auto-progresses based on configurable criteria.                       | **Phase 1**                         |
| **Customer Health**     | Automatic pattern detection: Active → Potentially Churning → Churned. Based on ordering frequency.                         | **Phase 1** (mock data)             |
| **Type Tags**           | Flexible classification: Retail, Sports/School, Corporate, Storefront/Merch, Wholesale. Multiple per customer. Extensible. | **Phase 1** (starter set)           |
| **Custom Tags**         | Free-form tags with optional attributes (e.g., seasonality). Shop-defined.                                                 | **Phase 2**                         |
| **Cascading Defaults**  | Settings inherit: Company → Group → Contact → Transaction. Each level can override parent.                                 | **Phase 1** (schema design)         |
| **Storefront Customer** | A customer for whom the shop manages a branded online store. Tracked as a type tag. Storefront feature is Phase 2.         | **Phase 1** (tag only)              |

---

## CORE Features (Must Build)

These workflows are critical to demonstrating a best-in-class customer management experience. Fully functional in the mockup.

### ✅ Customer List Page (`/customers`)

**Purpose**: Browse, search, filter, and discover customers with smart views

**Features**:

- [ ] DataTable display with columns: Company, Primary Contact, Type Tags, Lifecycle Stage, Health, Last Order, Lifetime Revenue
- [ ] **Global search**: Search by company name, any contact name, email, phone, or order details (URL query param)
- [ ] **Smart view tabs/chips** across the top:
  - **All Customers**: Default view, all active customers
  - **Prospects**: Lifecycle = Prospect (leads not yet converted)
  - **Top Customers**: Sorted by lifetime revenue (trailing 12 months or all-time, togglable)
  - **Needs Attention**: Health = Potentially Churning (pattern-break detected)
  - **Seasonal**: Customers with orders matching current/upcoming season (calendar-aware)
- [ ] **Filter sidebar or chips**: Filter by type tag (Retail, Sports/School, Corporate, Storefront, Wholesale), lifecycle stage, health status
- [ ] **Sort by columns**: Click header to sort by company, last order date, revenue, etc.
- [ ] Click row → navigate to `/customers/[id]`
- [ ] "Add Customer" button (primary CTA) → opens AddCustomerModal
- [ ] Empty state: "No customers yet — they'll appear here when you create your first quote"
- [ ] Quick stats bar at top: Total Customers, Active This Month, Total Revenue (YTD), Prospects
- [ ] Archived customers hidden by default, toggle to show

**Acceptance Criteria**:

- ✅ Can search for customer by company name, contact name, email, or phone
- ✅ Smart views surface the right customers (prospects, top, needs attention, seasonal)
- ✅ Can filter by type tag and lifecycle stage
- ✅ Can sort by any column
- ✅ Clicking customer opens detail view
- ✅ "Add Customer" button is prominent
- ✅ Archived customers are hidden but accessible

**Quality Checklist**:

- [ ] Visual hierarchy: Smart view tabs most prominent, "Add Customer" is primary CTA
- [ ] Spacing: Tailwind tokens only
- [ ] Typography: Max 3-4 sizes (header, column headers, body, small stats)
- [ ] Color: Lifecycle badges (Prospect blue, New neutral, Repeat green, Contract gold), Health indicators (Active none, Churning gold pulse, Churned red)
- [ ] Interactive states: All rows have hover state, selected smart view is highlighted
- [ ] Keyboard: Tab to customer, Enter to open
- [ ] Accessibility: ARIA labels for lifecycle stages and health indicators
- [ ] **Mobile**: Table collapses to card list on small screens. Search and smart view tabs remain accessible. Quick stats bar stacks vertically. Touch targets ≥ 44px.

---

### ✅ Customer Detail Dashboard (`/customers/[id]`)

**Purpose**: Complete picture of a customer relationship — the heart of this vertical

**Layout**: One consistent framework that adapts content density based on data available.

**Header Section** (always visible):

- [ ] Company name (large, prominent)
- [ ] Primary contact name, email, phone (click to copy)
- [ ] Lifecycle stage badge (Prospect / New / Repeat / Contract)
- [ ] Health indicator (Active / Potentially Churning / Churned) — only shows if not Active
- [ ] Type tag badges (Retail, Sports/School, etc.)
- [ ] Quick stats row:
  - Lifetime Revenue ($X,XXX)
  - Total Orders (XX)
  - Average Order Value ($XXX)
  - Last Order (XX days ago)
  - Referred Customers (X) — if any
- [ ] Action buttons: "New Quote" (primary CTA, pre-fills customer), "Edit Customer", "Archive"
- [ ] Breadcrumb: Dashboard > Customers > River City Brewing Co.

**Tabbed Sections** (below header):

- [ ] **Activity** (default tab): Reverse-chronological timeline of all interactions — quotes created/sent/accepted, jobs started/completed, notes added, artwork uploaded. Timestamped.
- [ ] **Quotes**: All quotes for this customer. Columns: Quote #, Status, Total, Date. Click → `/quotes/[id]`. "Start Similar Quote" button on each row.
- [ ] **Jobs**: All jobs for this customer. Columns: Job #, Status, Due Date, Total. Click → `/jobs/[id]` (Phase 2 link).
- [ ] **Artwork**: Smart artwork gallery (see Artwork Gallery section below).
- [ ] **Contacts**: Company → Group → Contact hierarchy view (see Hierarchy section below).
- [ ] **Details**: Full profile — billing/shipping addresses, tax-exempt status, payment terms, pricing tier, referral source, all editable.
- [ ] **Notes**: All notes (customer-level + linked from quotes/artwork). Pinned notes at top. Channel-tagged (phone/email/text/social/in-person).

**Adaptive Behavior**:

- **Prospect** (sparse data): Header shows contact info + "Create First Quote" CTA. Tabs exist but sections show inviting empty states ("Quotes will appear here when you create one"). Notes tab is pre-selected (prospects need heavy note-taking).
- **New/Repeat** (moderate data): Stats populate in header. Quotes/Jobs tabs fill with history. Artwork gallery shows designs used.
- **Contract/Heavy** (rich data): Full stats, deep artwork gallery with smart sorting, pattern visibility in activity timeline.

**Acceptance Criteria**:

- ✅ Header shows complete customer context in 5 seconds
- ✅ Can navigate between tabs without page reload
- ✅ Activity timeline shows all interactions chronologically
- ✅ Can create a new quote pre-filled with this customer
- ✅ "Start Similar Quote" works from quote history
- ✅ Artwork gallery shows customer's designs with smart sorting
- ✅ Contacts tab shows hierarchy (Company → Group → Contact)
- ✅ Details tab allows editing customer profile
- ✅ Invalid customer ID shows "Customer not found" with link to customer list
- ✅ Empty states are inviting, not broken-looking

**Quality Checklist**:

- [ ] Visual hierarchy: Company name and quick stats most prominent
- [ ] Spacing: Balanced sections with clear tab separation
- [ ] Typography: Consistent with quoting views
- [ ] Color: Lifecycle/health badges meaningful, not decorative
- [ ] Interactive states: Tab hover/active states, action button states
- [ ] Empty states: Designed for each tab (not generic "no data")
- [ ] Accessibility: Tabs are keyboard navigable, ARIA labels on all badges
- [ ] **Mobile**: Header compresses (stats row wraps to 2 rows). Tabs become horizontal scroll or dropdown. Quick stats are most critical on mobile — "Who is this and what's active?" in 3 seconds on a phone screen. Action buttons stack full-width.

---

### ✅ Company → Group → Contact Hierarchy

**Purpose**: Support multi-contact companies with department-level organization

**Data Model**:

```
Company (River City Brewing Co.)
  ├── Group: Marketing Dept
  │     ├── Contact: Marcus Rivera (ordering, primary)
  │     └── Contact: Lisa Park (art approver)
  ├── Group: Events Team
  │     └── Contact: Dave Chen (ordering)
  └── Aggregate: All spend, all artwork, loyalty tier
```

**Features**:

- [ ] **Simple by default**: Most customers = 1 Company + 1 Contact. No groups required.
- [ ] **Expandable**: "Add Contact" button adds another person. "Add Group" appears when 2+ contacts exist (progressive disclosure).
- [ ] **Contact roles**: Each contact has a role: Ordering, Art Approver, Billing, Owner, Other
- [ ] **Primary contact**: One contact marked as primary (default for new quotes)
- [ ] **View at any level**:
  - Company view: aggregate spend, all contacts, all artwork
  - Group view: group-specific artwork, group contacts, group spend
  - Contact view: individual order history, personal artwork associations
- [ ] **Cascading defaults**: Payment terms, tax status, billing address set at Company level. Groups and Contacts inherit unless overridden.
- [ ] **Discoverability**: Subtle "Add Contact" hint on customer detail page. Tooltip explains groups when relevant.

**Acceptance Criteria**:

- ✅ Can add multiple contacts to a company
- ✅ Can assign roles to contacts
- ✅ Can designate primary contact
- ✅ Can create groups within a company
- ✅ Company-level stats aggregate all contacts' activity
- ✅ Simple case (1 contact, no groups) feels clean and unbloated

**Quality Checklist**:

- [ ] Visual: Clean hierarchy display (indented or card-based)
- [ ] Progressive disclosure: Groups don't appear until needed
- [ ] Typography: Contact names prominent, roles as subtle badges
- [ ] Interactive: Click contact to see their individual activity

---

### ✅ Customer Lifecycle (Auto-Progression)

**Purpose**: Automatically track where each customer is in their relationship lifecycle

**Lifecycle Stages** (structured enum, auto-progressing):

| Stage            | Trigger                                                                           | Display             |
| ---------------- | --------------------------------------------------------------------------------- | ------------------- |
| **Prospect**     | Created from quoting or manually added without a completed order                  | Blue badge          |
| **New Customer** | First completed and paid order                                                    | Neutral/white badge |
| **Repeat**       | 2+ completed orders OR orders spanning 2+ distinct months                         | Green badge         |
| **Contract**     | Manual promotion by shop owner (formal agreement) OR configurable spend threshold | Gold badge          |

**Features**:

- [ ] Auto-transition: Prospect → New (on first completed order), New → Repeat (on 2nd order or 2+ months of orders)
- [ ] Manual override: Shop owner can promote any customer to Contract status at any time
- [ ] Configurable thresholds (Phase 2): Settings page where shop sets "Repeat after X orders" and "Contract after $Y spent"
- [ ] Phase 1 defaults: Hardcoded sensible thresholds (1st order = New, 2+ orders = Repeat, Contract = manual only)
- [ ] Lifecycle badge visible on customer list, detail page, and quote form customer selector
- [ ] Lifecycle change logged in activity timeline

**Acceptance Criteria**:

- ✅ Prospect auto-promotes to New Customer when mock data shows a completed order
- ✅ New auto-promotes to Repeat when 2+ orders exist in mock data
- ✅ Contract can be manually set
- ✅ Badge reflects current stage everywhere it appears
- ✅ Mock data includes customers at each lifecycle stage

---

### ✅ Customer Health Detection

**Purpose**: Automatically flag customers whose ordering pattern has broken

**Health States**:

| State                    | Trigger                                                                         | Display                                               |
| ------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Active**               | Ordering within expected pattern                                                | No indicator (absence = healthy)                      |
| **Potentially Churning** | No order for 2x their average order interval                                    | Amber "Needs attention" badge                         |
| **Churned**              | No order for 4x their average order interval or 6+ months, whichever is shorter | Red "Inactive" badge                                  |
| **Archived**             | Manual action by shop owner                                                     | Hidden from default views, shown in "Archived" filter |

**Features**:

- [ ] Health status calculated from mock data order patterns
- [ ] "Needs Attention" smart view on customer list filters by Potentially Churning
- [ ] Health badge on customer detail header (only when not Active)
- [ ] Archive action on customer detail page (with confirmation dialog)
- [ ] Archived customers: hidden from default list, accessible via filter toggle
- [ ] Reactivate: archived customer can be unarchived

**Acceptance Criteria**:

- ✅ Mock data includes at least 1 customer in each health state
- ✅ "Needs Attention" view shows only potentially churning customers
- ✅ Can archive and unarchive a customer
- ✅ Archived customers don't clutter the main view

---

### ✅ Customer Type Tags

**Purpose**: Classify customers by business type for filtering and segmentation

**Starter Set**:

- Retail (general retail customers)
- Sports/School (leagues, teams, schools)
- Corporate (company-branded apparel)
- Storefront/Merch (influencers, content creators — has a storefront, Phase 2 feature)
- Wholesale (other print shops, decorators, brokers)

**Features**:

- [ ] Multiple tags per customer (a school can also be a storefront customer)
- [ ] Tags displayed as colored badges on customer list and detail page
- [ ] Filter customer list by type tag
- [ ] Tags selectable from starter set during customer creation/editing
- [ ] Phase 1: Starter set only. Phase 2: Custom tags with shop-defined names and optional attributes (e.g., seasonality).

**Acceptance Criteria**:

- ✅ Can assign multiple type tags to a customer
- ✅ Can filter customer list by type tag
- ✅ Tags display consistently across list and detail views
- ✅ Mock data uses variety of tags

---

### ✅ Quick Add Customer (Enhanced Modal)

**Purpose**: Create new customers quickly from anywhere — customer list, quote form, or future invoicing

**Fields**:

- [ ] Company Name (required)
- [ ] Contact Name (required)
- [ ] Email OR Phone (at least one required — don't force both)
- [ ] Type Tag (optional, multi-select from starter set)
- [ ] Lifecycle Stage: auto-set to "Prospect" when created from quoting, "New" when created from customer management
- [ ] All other fields (address, tax status, payment terms, notes) are optional — can be enriched later

**Features**:

- [ ] Reuses existing `AddCustomerModal` component (expanded)
- [ ] Creates a full customer record (single source of truth)
- [ ] Auto-selects the new customer in the quote form if triggered from there
- [ ] "Needs Details" visual indicator on customer list for records with minimal data
- [ ] < 30 seconds to complete

**Acceptance Criteria**:

- ✅ Can create customer with just company + contact name + email
- ✅ New customer appears immediately in customer list and quote form
- ✅ Auto-tagged as Prospect when created from quoting
- ✅ Minimal fields are truly minimal — no forced data entry

---

### ✅ Customer Notes (Contextual Notes Web)

**Purpose**: Capture institutional knowledge that lives in the shop owner's head

**Note Types**:

| Type              | Lives On                      | Surfaces In                                          |
| ----------------- | ----------------------------- | ---------------------------------------------------- |
| **Customer note** | Customer record               | Detail page Notes tab, pinned at top if flagged      |
| **Quote note**    | Quote record (already exists) | Quote detail, customer Activity timeline             |
| **Artwork note**  | Artwork record                | Artwork gallery tooltip, quote form artwork selector |

**Features**:

- [ ] **Freeform + timestamped**: Each note has content, createdAt, createdBy
- [ ] **Pinnable**: Important notes can be pinned to top ("Always charge rush fee", "Picky about Pantone matching")
- [ ] **Channel-tagged** (optional): Phone, Email, Text, Social, In-Person — helps reconstruct communication history
- [ ] **Smart prompts**: If a note is tagged as "Phone" but customer has no phone number, prompt to add it
- [ ] **Quick add**: Single-line input at top of Notes tab for fast note entry
- [ ] **Surfacing**: Artwork notes appear as tooltips in the gallery. Quote notes appear in the customer activity timeline.
- [ ] **Prospect-focused**: Notes tab is the default tab for Prospects (heavy back-and-forth during lead conversion)

**Acceptance Criteria**:

- ✅ Can add, pin, and view notes on customer record
- ✅ Notes are timestamped and attributed
- ✅ Pinned notes stay at top
- ✅ Channel tags are optional but available
- ✅ Artwork notes surface in gallery tooltips
- ✅ Notes tab is default for Prospect lifecycle stage

**Quality Checklist**:

- [ ] Visual: Clean note list, timestamps subtle, pinned notes visually distinct
- [ ] Interactive: Quick-add input always visible, pin toggle easy to tap
- [ ] Typography: Note content readable, metadata (date, channel) secondary
- [ ] Accessibility: Notes list is screen-reader friendly

---

### ✅ Smart Artwork Gallery

**Purpose**: Visual, volume-prioritized, season-aware artwork display per customer

**Features**:

- [ ] **Thumbnail grid**: Artwork displayed as visual thumbnails (not a text list)
- [ ] **Smart sort order**:
  1. Volume outliers first — artwork that drives disproportionate sales gets prime position
  2. Seasonal relevance — designs matching current/upcoming season surface higher
  3. Customer-specific seasonality — designs ordered annually around this time of year surface
  4. Recent usage — most recently ordered artwork next
  5. Alphabetical as fallback
- [ ] **Per-artwork metadata**: Color count, last used date, total orders, linked jobs
- [ ] **Artwork notes**: Notes attached to artwork show as tooltips on hover
- [ ] **Visual importance cues**: Subtle size variation or badges ("Top seller", "In season") — NOT treemap distortion
- [ ] **Full library browsable**: Smart sort is default, but can switch to alphabetical/chronological
- [ ] **Link to quotes**: Click artwork thumbnail to see which quotes/jobs used it
- [ ] **"Use in New Quote" action**: Select artwork directly from gallery to start a new quote

**Acceptance Criteria**:

- ✅ Artwork displays as visual thumbnails
- ✅ Highest-volume artwork appears first
- ✅ Seasonal artwork surfaces when relevant (mock: based on mock dates)
- ✅ Artwork notes show on hover
- ✅ Can navigate from artwork to its linked quotes

**Quality Checklist**:

- [ ] Visual: This is the aesthetic showpiece — beautiful grid, consistent thumbnails
- [ ] Spacing: Tight but breathable grid (similar to S&S color swatch density)
- [ ] Interactive: Hover shows metadata tooltip with notes, click opens detail
- [ ] Responsive: Grid adapts to screen width
- [ ] Empty state: "No artwork yet — artwork will appear here from quotes" (inviting, not broken)

---

### ✅ Referral Tracking (Basic)

**Purpose**: Track which customers refer new business — word of mouth is 4Ink's primary growth channel

**Features**:

- [ ] **"Referred by" field** on customer record — dropdown of existing customers or free text
- [ ] **Referral stats on referrer's profile**: "Marcus has referred 4 customers" with names listed
- [ ] **Referred revenue**: Total revenue from referred customers visible on referrer's detail page
- [ ] **Referral visible in customer list**: Referral count as a column or badge

**Phase 2 (not building now)**:

- Referral incentive programs (discount triggers based on referral volume)
- Referral chain visualization
- Lead source attribution reporting

**Acceptance Criteria**:

- ✅ Can set "Referred by" on a customer record
- ✅ Referrer's profile shows referral count and referred revenue
- ✅ Mock data includes at least 2 referral relationships

---

## PERIPHERAL Features (Show in UI, Simplified or Non-Functional)

These features are valuable but won't block the demo. Show them in UI so the journey feels complete.

### 🟡 Tax Exempt Certificate Tracking

**Purpose**: Legal requirement for schools, nonprofits, and reseller accounts

**Implementation**:

- [ ] Tax-exempt toggle (boolean) on customer Details tab
- [ ] Certificate status: Exempt / Not Exempt / Expired
- [ ] Expiration date field (with visual warning when approaching/past expiry)
- [ ] "Upload Certificate" area (mock — shows placeholder, doesn't store files)
- [ ] Tax status visible on customer list as a subtle icon/badge
- [ ] Tax status inherits to quotes (auto-applied when customer is selected)

---

### 🟡 Multiple Shipping Addresses

**Purpose**: Customers with multiple locations (HQ, warehouse, event venues)

**Implementation**:

- [ ] Billing address (single, on Details tab)
- [ ] Shipping addresses (multiple, named): "HQ", "Warehouse", "Event Venue"
- [ ] Default shipping address flag (used on new quotes)
- [ ] Add/edit/remove addresses
- [ ] Address inherits to quotes when customer is selected (default shipping address)
- [ ] **Phase 2 (backend)**: Google Maps-style address autocomplete — as user types, suggest matching addresses. Phase 1 is manual entry only.

---

### 🟡 Customer Statistics Panel

**Purpose**: At-a-glance metrics for customer value assessment

**Implementation**:

- [ ] Lifetime revenue (sum of all completed orders)
- [ ] Total orders (count)
- [ ] Average order value
- [ ] Last order date (with "X days ago" relative display)
- [ ] Quote-to-order conversion rate
- [ ] Referred customers count + referred revenue
- [ ] "Member since" date
- [ ] Stats displayed in customer detail header and available on customer list as columns

---

### 🟡 Reorder from Customer Detail (Leverages Existing "Copy as New")

**Purpose**: Reduce reorder friction — the #1 revenue killer identified in research

**Implementation**:

- [ ] Quote rows in customer detail Quotes tab include "Copy as New" action (already built in quoting vertical)
- [ ] This reuses the existing "Duplicate Quote" / "Copy as New" functionality from the quoting vertical
- [ ] No new functionality needed — just surface the existing action within the customer detail context
- [ ] **Already built**: "Copy as New" on quotes list and quote detail page

---

### 🟡 Payment Terms (Customer-Level Defaults)

**Purpose**: Different customers have different payment expectations

**Implementation**:

- [ ] Payment terms field on customer Details tab
- [ ] Options: COD (Cash on Delivery), Payment Upfront, Net 15, Net 30, Net 60
- [ ] Default for new customers: Payment Upfront (matches 4Ink's current direction)
- [ ] Contract customers: typically Net 30
- [ ] Inherits to invoices (Phase 2 invoicing vertical reads this field)
- [ ] Payment terms visible on customer detail header (subtle, not prominent)

---

### 🟡 Pricing Tier / Default Discount

**Purpose**: Replace hardcoded 7% contract discount with customer-level pricing

**Implementation**:

- [ ] Pricing tier selector: Standard, Preferred (5%), Contract (configurable %)
- [ ] Custom discount percentage field (overrides tier default)
- [ ] Discount auto-applied when customer is selected in quote form
- [ ] Replaces current hardcoded `customerTag === "contract" → 7%` logic
- [ ] Cascading: Company tier is default, Group/Contact can override

---

## INTERCONNECTIONS (Minimal Representation)

These features touch other verticals but won't be fully built yet. Show them in UI to complete the journey.

### → Quoting: Customer Selection (Enhanced)

**Current State**: CustomerCombobox selects from mock data, AddCustomerModal creates inline
**Enhancement**:

- [ ] Customer combobox shows lifecycle stage badge next to each name
- [ ] Selecting customer auto-loads: artwork library, pricing tier/discount, tax status, shipping address
- [ ] "View Customer" link on quote form opens customer detail in new tab
- [ ] Quote form customer section shows enriched info (contact role, company, tags)
- [ ] Customer created from quote form auto-tagged as Prospect
- [ ] **Don't build**: Customer editing from within quote form
- **Already built**: CustomerCombobox, AddCustomerModal, customer display in QuoteDetailView

### → Invoicing: Cascading Defaults (Schema Ready)

**Current State**: No invoicing exists yet
**Preparation**:

- [ ] Customer schema includes: paymentTerms, billingAddress, taxExempt, pricingTier, discountPercentage
- [ ] These fields are designed for invoice inheritance: invoice reads customer defaults, allows per-transaction override
- [ ] Cascading model: Company → Group → Contact → Transaction (each level can override parent)
- [ ] **Don't build**: Invoice creation, invoice list, payment tracking
- **Phase 2**: Invoicing vertical will inherit customer defaults seamlessly

### → Artwork Management: Customer Artwork Library

**Current State**: Artwork linked to customers via customerId FK, displayed in quote form
**Enhancement**:

- [ ] Artwork gallery on customer detail page (smart sorted)
- [ ] Artwork notes surface as tooltips in gallery and quote form
- [ ] "Use in New Quote" action from artwork gallery
- [ ] **Don't build**: Artwork upload/management CRUD (beyond mock display)
- **Phase 2**: Full artwork management may become its own feature

### → Reporting: Customer Value Metrics

**Current State**: No reporting exists
**Preparation**:

- [ ] Customer stats (revenue, orders, conversion rate) computed from mock data
- [ ] Customer list sortable by revenue (feeds "Top Customers" view)
- [ ] Health detection (churn patterns) computed from mock order dates
- [ ] **Don't build**: Reporting dashboards, trend charts, export
- **Phase 2**: Reporting vertical will aggregate customer metrics

### → Storefront: Customer Type Tag (Placeholder)

**Current State**: 4Ink uses separate software for storefronts
**Preparation**:

- [ ] "Storefront/Merch" type tag available for customers
- [ ] No storefront functionality built
- [ ] Customer schema flexible enough to add storefront-related fields later
- [ ] **Don't build**: Storefront creation, management, or customer-facing stores
- **Phase 2**: Storefront vertical will build on customer records tagged as Storefront

### → Customer Portal: Shared Data Model

**Current State**: Customer Portal will be a separate Phase 1 vertical (external-facing)
**Preparation**:

- [ ] Customer schema designed to support both internal (this vertical) and external (portal) access
- [ ] Contact records include email for portal login credentials (future)
- [ ] Quote/job data linkable to portal views
- [ ] **Don't build**: Any portal UI in this vertical
- **Separate vertical**: Customer Portal will have its own scope definition and discovery

---

## What We're Explicitly NOT Building

### ❌ Customer Portal / Self-Service (Separate Vertical)

**Why**: The Customer Portal is a distinct vertical — the external-facing view that a shop's customers experience. It will be built as a Phase 1 mock demo, but under its own scope definition and discovery process.
**Relationship**: Customer Management (this vertical) = internal shop-side tool. Customer Portal = external customer-facing tool. They share the same customer data model and will have significant overlap, but are scoped and built separately.
**What we do in this vertical**: Design the customer schema and data model to support portal access. The portal vertical will read from the same customer records.

### ❌ Communication Auto-Import

**Why**: Email forwarding, SMS integration, social DM aggregation requires backend infrastructure
**What we do instead**: Channel-tagged notes (manual but structured)
**Vision**: Phase 2+ — explore email import, Twilio integration, LLM-assisted communication aggregation

### ❌ Custom Tags with Attributes

**Why**: Shop-defined tags with properties (e.g., "this tag has seasonality") adds significant complexity
**What we do instead**: Starter set of type tags. Custom free-text tags (simple) in Phase 2.
**Vision**: Phase 3 — custom tag attributes that the system leverages for smart surfacing

### ❌ Referral Incentive Programs

**Why**: Discount triggers based on referral volume requires pricing engine integration
**What we do instead**: Basic "Referred by" tracking + referral stats display

### ❌ Credit Limit Management

**Why**: Requires invoicing integration and balance tracking
**What we do instead**: Payment terms field on customer record

### ❌ Sales Pipeline / Lead Management

**Why**: 4Ink knows all prospects by name. Pipeline stages are overkill for small shops.
**What we do instead**: Prospect lifecycle stage + "Needs Attention" view

### ❌ CSV Import/Export

**Why**: Phase 2 feature — important for migration but not critical for demo
**What we do instead**: Mock data seeded in code

### ❌ Configurable Lifecycle Thresholds

**Why**: Phase 2 settings page feature
**What we do instead**: Hardcoded sensible defaults (1st order = New, 2+ orders = Repeat, Contract = manual)

### ❌ Calendar/Seasonal Smart View (Full Implementation)

**Why**: Requires order date analysis and seasonality detection algorithms
**What we do instead**: Mock the "Seasonal" tab on customer list with pre-tagged mock data. Full seasonal intelligence is Phase 2.

---

## Scope Summary

| Component                   | Scope                | Status                                                   |
| --------------------------- | -------------------- | -------------------------------------------------------- |
| Customer List Page          | CORE                 | Build fully (smart views, search, filters, stats bar)    |
| Customer Detail Dashboard   | CORE                 | Build fully (header + tabbed sections, adaptive density) |
| Company → Group → Contact   | CORE                 | Build hierarchy (simple default, expandable)             |
| Customer Lifecycle          | CORE                 | Auto-progression with hardcoded thresholds               |
| Customer Health Detection   | CORE                 | Mock-based churn detection, "Needs Attention" view       |
| Customer Type Tags          | CORE                 | Starter set, multi-tag, filter support                   |
| Quick Add Customer          | CORE                 | Enhanced modal, < 30 seconds, minimal required fields    |
| Customer Notes              | CORE                 | Freeform, pinnable, channel-tagged, contextual surfacing |
| Smart Artwork Gallery       | CORE                 | Volume-prioritized, season-aware, thumbnails with notes  |
| Referral Tracking           | CORE                 | "Referred by" field + referral stats display             |
| Tax Exempt Tracking         | PERIPHERAL           | Toggle + status + expiry + mock upload area              |
| Multiple Shipping Addresses | PERIPHERAL           | Named addresses with default flag                        |
| Customer Statistics         | PERIPHERAL           | Computed metrics in header and list                      |
| Reorder from detail         | PERIPHERAL           | Surface existing "Copy as New" in customer context       |
| Payment Terms               | PERIPHERAL           | Customer-level default, cascading to invoices            |
| Pricing Tier / Discount     | PERIPHERAL           | Customer-level, replaces hardcoded contract discount     |
| Quoting integration         | INTERCONNECTION      | Enhanced combobox, auto-load customer context            |
| Invoicing preparation       | INTERCONNECTION      | Schema fields ready for cascading defaults               |
| Artwork library             | INTERCONNECTION      | Gallery on detail page, notes surfacing                  |
| Reporting preparation       | INTERCONNECTION      | Stats computed, list sortable by revenue                 |
| Storefront placeholder      | INTERCONNECTION      | Type tag only, no storefront functionality               |
| Customer Portal             | ❌ SEPARATE VERTICAL | Phase 1 mock demo, scoped independently                  |
| Communication auto-import   | ❌ NOT BUILDING      | Phase 2+                                                 |
| Custom tags with attributes | ❌ NOT BUILDING      | Phase 2-3                                                |
| CSV import/export           | ❌ NOT BUILDING      | Phase 2                                                  |
| Sales pipeline              | ❌ NOT BUILDING      | Not planned                                              |

---

## Schema Expansion

### Current Schema (7 fields)

```typescript
// lib/schemas/customer.ts (existing)
export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // Contact name → becomes primaryContact.name
  company: z.string().min(1), // Company name
  email: z.string().email(), // → becomes primaryContact.email
  phone: z.string(), // → becomes primaryContact.phone
  address: z.string(), // → becomes billingAddress
  tag: customerTagEnum.default('new'), // → splits into lifecycleStage + typeTags
})
```

### New Schemas to Create

**Contact Schema** (`lib/schemas/contact.ts`):

```
contactSchema = {
  id: uuid
  name: string (required)
  email: string (optional)
  phone: string (optional)
  role: "ordering" | "art-approver" | "billing" | "owner" | "other"
  isPrimary: boolean
  notes: string (optional)
  groupId: uuid (optional — links to group within company)
}
```

**Address Schema** (`lib/schemas/address.ts`):

```
addressSchema = {
  id: uuid
  label: string         // "HQ", "Warehouse", "Main"
  street: string
  street2: string (optional)
  city: string
  state: string
  zip: string
  country: string       // default "US"
  isDefault: boolean
  type: "billing" | "shipping"
}
```

**Group Schema** (`lib/schemas/group.ts`):

```
groupSchema = {
  id: uuid
  name: string          // "Marketing Dept", "Events Team"
  customerId: uuid      // parent company
}
```

**Note Schema** (`lib/schemas/note.ts`):

```
noteSchema = {
  id: uuid
  content: string
  createdAt: date
  createdBy: string     // staff name or "system"
  isPinned: boolean
  channel: "phone" | "email" | "text" | "social" | "in-person" | null
  entityType: "customer" | "quote" | "artwork" | "job"
  entityId: uuid        // links to the parent object
}
```

### Expanded Customer Schema

```
customerSchema = {
  id: uuid
  company: string (required)

  // Lifecycle & Classification
  lifecycleStage: "prospect" | "new" | "repeat" | "contract"
  healthStatus: "active" | "potentially-churning" | "churned"
  isArchived: boolean (default false)
  typeTags: string[] (from starter set)

  // Contacts (replaces flat name/email/phone)
  contacts: Contact[]
  groups: Group[]

  // Addresses (replaces flat address)
  billingAddress: Address (optional)
  shippingAddresses: Address[] (optional)

  // Financial
  paymentTerms: "cod" | "upfront" | "net-15" | "net-30" | "net-60" (default "upfront")
  pricingTier: "standard" | "preferred" | "contract" | "wholesale"
  discountPercentage: number (optional, 0-100)
  taxExempt: boolean (default false)
  taxExemptCertExpiry: date (optional)

  // Referral
  referredByCustomerId: uuid (optional)

  // Metadata
  createdAt: date
  updatedAt: date

  // Computed (from linked data, not stored)
  // lifetimeRevenue, totalOrders, avgOrderValue, lastOrderDate,
  // referralCount, referredRevenue
}
```

---

## Mock Data Requirements

**Customers (8-10 covering all lifecycle stages, health states, and type tags)**:

| Customer                     | Lifecycle | Health               | Type Tags                | Contacts                                           | Special                                     |
| ---------------------------- | --------- | -------------------- | ------------------------ | -------------------------------------------------- | ------------------------------------------- |
| River City Brewing Co.       | Repeat    | Active               | Retail                   | Marcus Rivera (primary), Lisa Park (art)           | 2 referrals, high volume                    |
| Lonestar Lacrosse League     | Contract  | Active               | Sports/School            | Sarah Chen (primary, ordering + billing)           | Tax exempt, Net 30                          |
| Thompson Family Reunion 2026 | New       | Active               | Retail                   | Jake Thompson (primary)                            | One-off, referred by Marcus                 |
| Sunset 5K Run                | Prospect  | Active               | Retail                   | Maria Gonzalez (primary)                           | Has quote, no order yet                     |
| Lakeside Music Festival      | Repeat    | Potentially Churning | Corporate                | Chris Patel (primary), Amy Wong (billing)          | Last order 4 months ago                     |
| Metro Youth Soccer           | Contract  | Active               | Sports/School            | Coach Williams (ordering), Janet Lee (billing, AP) | Tax exempt, seasonal (spring + fall)        |
| TikTok Merch Co.             | Repeat    | Active               | Storefront/Merch, Retail | Alex Kim (primary)                                 | Storefront customer, mentoring relationship |
| Riverside Church             | New       | Active               | Retail                   | Pastor James (primary)                             | Referred by Lonestar                        |
| CrossTown Printing           | Contract  | Active               | Wholesale                | Mike Davis (primary)                               | Other print shop, contract pricing          |
| Mountain View HS             | Prospect  | Active               | Sports/School            | Athletic Director (primary)                        | Tax exempt, quoted but no order             |

Each customer includes:

- Contacts with roles and primary designation
- At least one address
- Lifecycle stage and health status
- Type tags (1-2 per customer)
- Referral relationships (at least 2 chains)
- Linked quotes (from existing mock data, expanded)
- Linked artwork (from existing mock data, expanded)
- Notes (at least 2 per customer: 1 pinned, 1 regular)

---

## Open Questions (For Gary / Future Interview)

These items were flagged during the interview as needing Gary's direct input:

1. **Contract pricing thresholds**: What spend level triggers contract pricing at 4Ink? Is it cumulative or per-order?
2. **Communication preferences**: How does Gary prefer to communicate with different customer types?
3. **Multiple contacts**: How often does Gary deal with multiple contacts at one company? Is the Group concept overkill?
4. **Payment terms specifics**: What payment terms does 4Ink currently offer? Has moving to upfront payment been successful?
5. **Storefront software**: What software does Gary use for storefronts? What does he dislike about it?
6. **Seasonal patterns**: Which customers have strong seasonal ordering patterns? Can we get specific examples?

---

## Related Documents

- `docs/competitive-analysis/customer-management-competitive-analysis.md` (9-competitor analysis)
- `docs/research/customer-management-research.md` (industry needs analysis)
- `docs/strategy/quoting-scope-definition.md` (quoting scope — shows interconnections)
- `docs/strategy/mokumo-journey-quoting.md` (quoting journey design)
- `.claude/plans/vertical-by-vertical-strategy.md` (overall strategy)
- `CLAUDE.md` (quality checklist, design system)
