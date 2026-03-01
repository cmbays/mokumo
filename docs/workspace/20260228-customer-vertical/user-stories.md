# Customer Vertical — User Stories

**Pipeline**: `20260228-customer-vertical`
**Stage**: Specification
**Date**: 2026-02-28
**Status**: Draft — Living Document
**Last Updated**: 2026-02-28

> Organized by feature area. Each story follows: "As a [persona], I want to [action] so that [benefit]." Acceptance criteria define done.

---

## Personas

| Persona              | Description                                                                          |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Shop Owner**       | Gary — runs 4Ink, manages all customer relationships, creates quotes, tracks jobs    |
| **Customer Contact** | Person at the customer's organization (buyer, art director, AP) — future portal user |

---

## A. Customer CRUD

### A1. Create a New Customer

**As a** shop owner, **I want to** create a new customer record with company name and at least one contact, **so that** I can start quoting and tracking work for them.

**Acceptance Criteria**:

- Required: company name, primary contact name, at least one contact method (email OR phone)
- Optional at creation: type tags, payment terms, billing address, shipping address, notes
- Lifecycle stage auto-set to "prospect" (or "new" if creating from a quote context)
- Duplicate detection: warn if company name closely matches existing customer
- After save: navigate to customer detail page
- Toast confirmation: "Customer [company] created"

### A2. Edit Customer Details

**As a** shop owner, **I want to** update customer information (company name, type tags, financial terms), **so that** records stay current.

**Acceptance Criteria**:

- Inline editing or edit sheet on customer detail page
- All fields editable except ID and createdAt
- Validation: company name required, email format, discount 0-100%
- Save triggers activity log entry: "Customer updated by [user]"
- Optimistic UI with rollback on error

### A3. Archive a Customer

**As a** shop owner, **I want to** archive a customer I no longer work with, **so that** they don't clutter my active list but history is preserved.

**Acceptance Criteria**:

- Confirmation dialog with customer name and linked entity count
- Archived customers hidden from default list view (toggle to show)
- All linked quotes, jobs, invoices preserved (read-only links)
- Activity log entry: "Customer archived"
- Reversible: "Unarchive" action available

### A4. Search and Filter Customers

**As a** shop owner, **I want to** quickly find customers by name, company, type, or lifecycle stage, **so that** I don't waste time scrolling.

**Acceptance Criteria**:

- Real-time search across company name, contact names, email
- Filter by: lifecycle stage, health status, type tags, archived
- Sort by: company name, last order date, lifetime revenue, created date
- URL state: filters persist in query params
- Pagination: server-side, configurable page size
- Results show: company, primary contact, type badges, lifecycle badge, health indicator, last order, lifetime revenue

---

## B. Contact Management

### B1. Add a Contact

**As a** shop owner, **I want to** add contacts to a customer with specific roles (ordering, billing, art-approver), **so that** I know who to reach for each purpose.

**Acceptance Criteria**:

- Slide-out sheet from customer detail Contacts tab
- Fields: first name, last name (required), email, phone, title/position, role (enum), is_primary
- Multiple roles allowed per contact
- First contact auto-marked as primary
- Warning if no ordering contact exists

### B2. Edit/Remove a Contact

**As a** shop owner, **I want to** update contact information or remove a contact, **so that** records stay accurate.

**Acceptance Criteria**:

- Edit inline or via sheet
- Cannot remove the last contact (validation error)
- Removing primary contact prompts: "Select new primary contact"
- Activity log: "Contact [name] updated/removed"

### B3. Contact Role Visibility

**As a** shop owner, **I want to** see at a glance which contact handles ordering, billing, and art approval, **so that** I reach the right person immediately.

**Acceptance Criteria**:

- Role badges displayed next to contact names
- Primary contact highlighted (star or "Primary" badge)
- On customer detail header: primary contact name + email + phone (quick copy)
- On quote/invoice forms: auto-fill appropriate contact based on role (billing contact for invoices, ordering contact for quotes)

---

## C. Address Management

### C1. Add a Labeled Address

**As a** shop owner, **I want to** add multiple addresses with labels (e.g., "Main Office", "Warehouse"), **so that** I can ship to the right location.

**Acceptance Criteria**:

- Slide-out sheet from Addresses tab
- Fields: label (required), type (billing/shipping/both), street 1, street 2, city, state, zip, country, attention_to
- Primary designation per type (one primary billing, one primary shipping)
- Label is freeform text (not enum)

### C2. Address Auto-Population

**As a** shop owner, **I want** the customer's primary addresses to auto-populate on new quotes and invoices, **so that** I don't re-enter them every time.

**Acceptance Criteria**:

- New quote: pre-fills primary shipping address
- New invoice: pre-fills primary billing address
- User can override with different address from customer's address list
- User can enter one-time custom address
- Selected address is **snapshotted** into the order/invoice (not FK reference)

---

## D. Financial Management

### D1. Set Payment Terms

**As a** shop owner, **I want to** assign default payment terms per customer, **so that** new invoices automatically reflect their agreement.

**Acceptance Criteria**:

- Dropdown on customer detail: COD, Upfront, Net 15, Net 30, Net 60
- Auto-populates on new invoices for this customer
- Overridable per-invoice

### D2. Assign Pricing Tier

**As a** shop owner, **I want to** assign a pricing tier to a customer, **so that** their quotes use the correct pricing template.

**Acceptance Criteria**:

- Dropdown: Standard, Preferred, Contract, Wholesale
- Pricing tier drives tag-template mapping for quote pricing
- DTF tier discounts applied automatically
- Changing tier affects future quotes only (not existing)

### D3. Set Customer Discount

**As a** shop owner, **I want to** set a flat percentage discount for a customer, **so that** their pricing reflects our agreement.

**Acceptance Criteria**:

- Percentage field (0-100%) on customer detail
- Applied on top of template pricing in quotes
- Visible on quote detail as line item discount
- Uses big.js arithmetic

### D4. Track Tax Exemption

**As a** shop owner, **I want to** mark a customer as tax-exempt with certificate expiry tracking, **so that** I don't charge tax incorrectly and certificates stay current.

**Acceptance Criteria**:

- Basic: tax exempt toggle + expiry date
- Warning indicator when cert expires within 30 days
- Expired cert: visual alert on customer detail, invoicing shows warning
- Auto-applies to new invoices (no tax line item)

### D5. Track Per-State Tax Exemption

**As a** shop owner, **I want to** track tax exemption certificates per state, **so that** multi-state shipments are taxed correctly.

**Acceptance Criteria**:

- Separate table: state, certificate number, document URL, expiry, verified flag
- Customer exempt in State A but not State B
- Invoice tax calculation considers shipping destination state
- Upload certificate document (PDF)
- Dashboard alert: "3 certificates expiring this month"

### D6. Set Credit Limit

**As a** shop owner, **I want to** set a credit limit for customers with payment terms, **so that** I don't extend too much credit.

**Acceptance Criteria**:

- Numeric field on customer detail (nullable — no limit if blank)
- Account balance computed from unpaid invoices
- Warning when new invoice would exceed limit
- Visual: balance / limit displayed, color-coded (green < 50%, yellow 50-80%, red > 80%)

### D7. View Account Balance

**As a** shop owner, **I want to** see a customer's outstanding balance at a glance, **so that** I know their financial position.

**Acceptance Criteria**:

- Computed from: sum of unpaid/partial invoices
- Displayed on: customer detail header, customer list (column), customer combobox
- Updated when payments recorded or invoices created

---

## E. Lifecycle & Health

### E1. View Lifecycle Stage

**As a** shop owner, **I want to** see where each customer is in their lifecycle (prospect, new, repeat, contract), **so that** I can manage my pipeline.

**Acceptance Criteria**:

- Badge on customer list and detail page
- Color-coded per stage (from domain constants)
- Manual assignment via dropdown
- Rules for auto-progression (e.g., first completed order → "new", 3+ orders → "repeat")
- Stats bar on list page: count per lifecycle stage

### E2. Health Score

**As a** shop owner, **I want to** see a health indicator showing which customers need attention, **so that** I don't lose relationships.

**Acceptance Criteria**:

- Three states: Active, Potentially Churning, Churned
- Computed from: days since last order, order frequency trend, revenue trend
- "Potentially Churning": no order in 2x their average order interval
- "Churned": no order in 4x their average interval or 180 days (whichever is shorter)
- Visual: health badge on list and detail, filterable
- Future: configurable thresholds per customer type

### E3. Seasonal Customer Detection

**As a** shop owner, **I want to** know which customers order seasonally and when their season approaches, **so that** I can proactively reach out.

**Acceptance Criteria**:

- Inferred from order history: month concentration, year-over-year patterns
- Indicator on customer detail: "Seasonal: orders typically in [Mar-Apr]" with pattern strength
- Optional manual override: "Mark as seasonal" with month selection
- List page filter: "Seasonal customers approaching"
- Minimum data: 2 years of order history for inference, manual assignment always available

---

## F. Activity Timeline

### F1. View Activity Timeline

**As a** shop owner, **I want to** see a chronological history of all interactions with a customer, **so that** I have full context for any conversation.

**Acceptance Criteria**:

- Chronological feed on customer detail Activity tab
- Entry types: note, system event, email, SMS, voicemail (future), portal action (future)
- Each entry shows: timestamp, type icon, actor (staff/system/customer), content, direction (inbound/outbound)
- Linked entities clickable (quote #, job #, invoice #)
- Paginated (newest first, load more)

### F2. Add Manual Note

**As a** shop owner, **I want to** add notes to a customer's timeline, **so that** I capture context from phone calls and walk-ins.

**Acceptance Criteria**:

- Quick-add input at top of timeline
- Source auto-tagged as "manual"
- Optional: link to a specific quote/job/invoice
- Rich text not required (plain text with line breaks)

### F3. System Events Auto-Logged

**As a** shop owner, **I want** the system to automatically log key events (quote sent, job created, payment received), **so that** the timeline is complete without manual entry.

**Acceptance Criteria**:

- Events logged automatically:
  - Quote created, sent, accepted, rejected
  - Job created, lane changed, completed
  - Invoice created, sent, payment recorded, overdue
  - Customer updated (field changes)
  - Contact added/removed
- Each event includes: what changed, by whom, relevant entity link
- System events visually distinct from manual notes

---

## G. Preferences & Garment Integration

### G1. Brand Preferences (Shop → Customer)

**As a** shop owner, **I want** my shop's brand preferences to cascade to customers with the option to override, **so that** the garment catalog shows relevant products.

**Acceptance Criteria**:

- Shop level: select preferred brands (Bella+Canvas, Gildan, etc.)
- Customer level: inherit from shop or customize
- Garment catalog filters to show preferred brands first
- Cascade: shop → brand → customer (no "global" individual color level)

### G2. Garment Favorites Per Customer

**As a** shop owner, **I want to** mark garment styles as favorites for a specific customer, **so that** I can quickly find what they usually order.

**Acceptance Criteria**:

- Customer Preferences tab: add/remove garment favorites
- Garment catalog: filter to "Customer favorites" when customer context is active
- Quote form: garment selector shows customer favorites first
- Stored as garment style IDs on customer record

### G3. Color Preferences Per Customer

**As a** shop owner, **I want to** track color preferences per customer (brand-scoped), **so that** I know their standard colors.

**Acceptance Criteria**:

- Customer Preferences tab: manage color favorites per brand
- Inherits from shop brand preferences, customer can override
- Visible on customer detail
- Surfaces in quoting when selecting colors

---

## H. Referrals

### H1. Track Referral Source

**As a** shop owner, **I want to** record which customer referred a new customer, **so that** I can track my referral network.

**Acceptance Criteria**:

- Optional field on customer creation: "Referred by" customer combobox
- Customer detail shows: "Referred by [Company]" (linked)
- Referring customer detail shows: referral count + list of referred customers

### H2. Referral Analytics

**As a** shop owner, **I want to** see which customers generate the most referrals and their total value, **so that** I can reward my best advocates.

**Acceptance Criteria**:

- dbt model: referral chain value (sum of referred customers' lifetime revenue)
- Customer detail: referral count + referred revenue
- Future: promotional credit mechanics (separate vertical)

---

## I. Cross-Vertical Integration

### I1. Customer on Quotes

**As a** shop owner, **I want** quotes to link to real customer records with auto-populated addresses and payment terms, **so that** quoting is fast and accurate.

**Acceptance Criteria**:

- Customer combobox on quote form searches real Supabase data
- Selecting customer auto-fills: billing address, shipping address, payment terms
- Quote detail page links back to customer detail
- Customer detail Quotes tab shows real quotes

### I2. Customer on Jobs

**As a** shop owner, **I want** jobs to inherit customer information from their source quote, **so that** production has full customer context.

**Acceptance Criteria**:

- Job inherits customer FK from quote
- Job detail shows customer name (linked), contact info, addresses
- Customer detail Jobs tab shows real jobs

### I3. Customer on Invoices

**As a** shop owner, **I want** invoices to link to customers with snapshotted billing addresses, **so that** financial records are accurate.

**Acceptance Criteria**:

- Invoice creation pre-fills from customer: billing address (snapshotted), payment terms, tax exemption
- Invoice detail links to customer
- Customer detail Invoices tab shows real invoices with balance due

---

## J. Analytics

### J1. Customer KPIs on List Page

**As a** shop owner, **I want to** see summary KPIs at the top of the customer list, **so that** I understand my customer base at a glance.

**Acceptance Criteria**:

- Stats bar: Total Customers, Active Customers, Revenue YTD, Prospects
- Counts update with filter selection

### J2. Customer Detail Stats

**As a** shop owner, **I want to** see key metrics on the customer detail page, **so that** I know this customer's value.

**Acceptance Criteria**:

- Header stats: lifetime revenue, total orders, average order value, last order date, referral count
- Health indicator + lifecycle badge
- Account balance (if applicable)
- Seasonal indicator (if detected)

### J3. Seasonality Dashboard

**As a** shop owner, **I want to** see which seasonal customers are approaching their typical order window, **so that** I can reach out proactively.

**Acceptance Criteria**:

- Dashboard widget or customer list filter: "Approaching season"
- Shows customers whose seasonal window is within 30 days
- Sorted by pattern confidence (strongest patterns first)
