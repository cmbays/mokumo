# Customer Vertical — User Journey Maps

**Pipeline**: `20260228-customer-vertical`
**Stage**: Specification
**Date**: 2026-02-28
**Status**: Draft — Living Document
**Last Updated**: 2026-02-28

> End-to-end journeys through customer management. Each journey maps the user's path, system responses, and success criteria. These complement the APP_FLOW journeys by focusing specifically on customer-centric workflows.

---

## Journey 1: New Customer from Phone Call

**Goal**: Capture a new customer from an incoming inquiry with minimum friction
**Trigger**: Phone call from someone who hasn't worked with the shop before
**Persona**: Shop Owner

### Flow

1. **Receive call** — caller says "Hi, I'm Sarah from Riverside Academy, we need 200 polos for our fall sports season"
2. **Open customer list** (`/customers`) — quick search "Riverside" → no results
3. **Click "Add Customer"** → modal opens
   - Enter: company "Riverside Academy", contact "Sarah Chen", phone (from caller ID), email (asked)
   - Select type tags: `sports-school`
   - Click "Save & View"
4. **Land on customer detail** (`/customers/[id]`)
   - Lifecycle auto-set to "prospect"
   - Activity log shows: "Customer created"
5. **Quick note** — add to timeline: "Called about 200 polos for fall sports, wants Gildan 8800, navy blue. Need artwork by next Friday."
6. **Create quote** — click "New Quote" from customer detail
   - Customer auto-selected, addresses pre-filled
   - Build quote with line items

### Success State
- Customer created in <30 seconds
- Note captured with context
- Quote linked to customer
- Activity timeline shows creation + note

### Decision Points
| Moment | Options | System Support |
|--------|---------|---------------|
| Duplicate check | "Riverside" similar to existing? | Fuzzy match warning on save |
| Type tag selection | Multiple tags allowed | Sports-school auto-maps pricing template |
| Quote immediately vs later | Save & View vs Save | Both paths available |

---

## Journey 2: Returning Customer Lookup

**Goal**: Find a customer and understand their full relationship in <10 seconds
**Trigger**: Customer calls with a question about their order
**Persona**: Shop Owner

### Flow

1. **Search** (`/customers`) — type customer name or company in search bar
2. **Table filters in real-time** — see matching row with:
   - Company name, primary contact, type badges
   - Lifecycle stage (repeat), health (active)
   - Last order date, lifetime revenue
3. **Click row** → customer detail (`/customers/[id]`)
4. **Scan header** — stats bar shows: lifetime revenue, total orders, avg order value, last order, referral count
5. **Check Jobs tab** — see their active job, status, task progress
6. **Answer question** — "Your order is on press now, 6 of 8 tasks complete, should ship Thursday"
7. **Add note** — "Called to check on J-1024 status, told them Thursday ship date"

### Success State
- Customer found and full context visible in <10 seconds
- Answer provided without leaving customer detail
- Interaction logged in timeline

---

## Journey 3: Customer Lifecycle Progression

**Goal**: Track a customer from prospect through to contract
**Trigger**: Natural business relationship development over weeks/months
**Persona**: Shop Owner

### Flow

```
Prospect ──first quote accepted──→ New ──3+ completed orders──→ Repeat ──formal agreement──→ Contract
```

1. **Prospect** — Customer created from inquiry, no orders yet
   - System shows: "Prospect" badge, $0 lifetime revenue
   - Stats: 0 orders, 0 revenue
2. **First quote accepted** → system auto-progresses to "New"
   - Activity log: "Lifecycle changed to New (first order)"
   - Stats update as job completes and invoice is paid
3. **Repeat business** → after 3+ completed orders, system auto-progresses to "Repeat"
   - Activity log: "Lifecycle changed to Repeat (3rd completed order)"
   - Health score starts tracking order frequency
4. **Contract agreement** → shop owner manually sets to "Contract"
   - Sets payment terms to Net 30
   - Assigns pricing tier to "Contract"
   - Sets credit limit
   - Activity log: "Lifecycle changed to Contract by [user]"

### Auto-Progression Rules

| From | To | Trigger |
|------|----|---------|
| Prospect | New | First quote accepted or first job created |
| New | Repeat | 3+ completed orders |
| Repeat | Contract | Manual only (requires business agreement) |
| Any | Churned (health) | No order in 4x average interval or 180 days |

### Success State
- Lifecycle progresses naturally with minimal manual intervention
- Each transition logged in activity timeline
- Financial terms evolve with relationship

---

## Journey 4: Seasonal Customer Proactive Outreach

**Goal**: Recognize seasonal ordering patterns and reach out before the customer's typical window
**Trigger**: Approaching the customer's seasonal order window
**Persona**: Shop Owner

### Flow

1. **Dashboard notification** — "3 seasonal customers approaching their order window"
   - Riverside Academy (fall sports, Aug-Sep)
   - Downtown Brewery (summer events, May-Jun)
   - Holiday Gift Co (holiday season, Oct-Nov)
2. **Click to view** → filtered customer list showing seasonal customers
3. **Open Riverside Academy** → detail page shows:
   - Seasonal indicator: "Orders typically in Aug-Sep (3 years consistent)"
   - Last order: Sep 2025 — "200 Gildan 8800 Navy Polos"
   - Pattern strength: Strong (3 consecutive years)
4. **Proactive outreach** — Shop owner calls Sarah: "Hey Sarah, fall season coming up — want to get those polo orders in? Same as last year?"
5. **Log interaction** — add note: "Proactive seasonal outreach — Sarah confirmed same order, sending quote Monday"
6. **Create quote** — click "New Quote", customer auto-selected, can reference previous order details

### Success State
- Shop owner reaches out BEFORE customer contacts them
- Previous order context available for quick reordering
- Revenue captured that might have been lost to a competitor

---

## Journey 5: Financial Review — Credit and Collections

**Goal**: Review customers with outstanding balances, approaching credit limits, or overdue invoices
**Trigger**: Weekly financial review or when creating a new invoice
**Persona**: Shop Owner

### Flow

1. **Open customer list** — sort by "Balance Due" descending
2. **Scan for issues**:
   - River City Brewing: $4,200 balance / $5,000 limit (84% — red)
   - Lonestar Lacrosse: $1,800 balance / no limit — 45 days outstanding
3. **Open River City** → detail page
   - Account balance bar: $4,200 / $5,000 (red zone)
   - Invoices tab: 2 unpaid invoices (one 30 days, one 15 days)
   - Activity timeline shows: payment reminder sent 7 days ago
4. **Action**: send another reminder or call
   - Click invoice → send reminder
   - Log note: "Called Marcus, says payment processing this week"
5. **Check before new invoice**: trying to create a new invoice for River City
   - System warns: "This invoice ($1,200) would exceed credit limit ($5,000). Current balance: $4,200."
   - Options: proceed anyway, or hold until payment received

### Success State
- Credit risk visible at a glance
- System prevents exceeding credit limits (with override option)
- Collection activity tracked in timeline

---

## Journey 6: Multi-State Tax Compliance

**Goal**: Correctly handle tax exemption for a customer shipping to multiple states
**Trigger**: Creating an invoice for a customer with shipments to different states
**Persona**: Shop Owner

### Flow

1. **Customer setup**: Lonestar Lacrosse League
   - Tax exempt: Yes
   - Certificates on file: Texas (valid through Dec 2026), Oklahoma (valid through Mar 2026)
   - No certificate for: Louisiana
2. **Create invoice for Texas shipment**
   - System checks: Texas certificate valid → no tax applied
   - Invoice shows: "Tax Exempt (TX certificate on file)"
3. **Create invoice for Louisiana shipment**
   - System checks: no Louisiana certificate → tax applies
   - System shows: "Tax exempt in TX, OK. No certificate for LA — tax applied."
   - Option to upload LA certificate
4. **Certificate expiry alert**
   - Dashboard: "1 tax certificate expiring in 30 days"
   - Customer detail: Oklahoma certificate highlighted yellow
   - Activity: "Oklahoma tax certificate expires Mar 2026 — request renewal"
5. **Renewal**: customer sends new certificate
   - Upload PDF, update expiry date, mark verified
   - Activity logged: "Oklahoma certificate renewed through Mar 2028"

### Success State
- Tax correctly applied per shipping destination state
- Expiring certificates flagged proactively
- Certificate documents stored and accessible

---

## Journey 7: Customer Preferences in Quoting

**Goal**: Use customer garment and color preferences to speed up quoting
**Trigger**: Creating a quote for a repeat/contract customer
**Persona**: Shop Owner

### Flow

1. **Open "New Quote"** → select customer "River City Brewing"
2. **Add line item** → open garment selector
   - System shows: "River City Brewing favorites" section at top
   - Favorites: Bella+Canvas 3001 (ordered 5x), Next Level 6210 (ordered 3x)
   - Full catalog available below
3. **Select Bella+Canvas 3001** → color selector opens
   - Customer's preferred colors shown first: Black, Navy, Heather Gray
   - Brand's full color palette available below
4. **Sizes auto-suggested** — based on previous order distribution:
   - "Previous order: S:10, M:50, L:80, XL:40, 2XL:20"
   - User can accept or modify
5. **Pricing auto-applied** — River City has "preferred" tier
   - Template: Preferred pricing matrix (lower rates than standard)
   - Additional 5% discount (customer-level)
   - No tax (Texas certificate on file)

### Success State
- Quote built in <2 minutes using customer context
- Correct pricing automatically applied
- Previous order patterns surface as suggestions, not requirements

---

## Journey 8: Activity Timeline Deep Dive

**Goal**: Review complete interaction history before a customer meeting
**Trigger**: Preparing for a quarterly review with a contract customer
**Persona**: Shop Owner

### Flow

1. **Open customer detail** → Activity tab
2. **Scroll timeline** — most recent first:
   ```
   Feb 25 [System] Invoice INV-1089 paid ($3,450)
   Feb 20 [Manual] "Discussed spring catalog order, wants to see new Bella+Canvas colors"
   Feb 15 [System] Job J-1087 completed (200 hoodies)
   Feb 10 [System] Job J-1087 moved to In Progress
   Feb 8  [System] Quote Q-2055 accepted ($3,450)
   Feb 5  [Manual] "Sent quote for spring hoodies, Marcus reviewing"
   Feb 1  [System] Quote Q-2055 created ($3,450)
   Jan 28 [Manual] "Marcus called about spring order, wants similar to fall but hoodies"
   ...
   ```
3. **Filter by type** — show only "Manual" notes for conversation context
4. **Click linked entities** — Invoice INV-1089 → see payment details
5. **Prepare talking points** — from timeline:
   - Last 6 months: 4 orders, $12,800 total
   - Preferred garments: Bella+Canvas 3001, Bella+Canvas 3739
   - Always 2-3 color prints, front + back
   - Consistently orders around seasonal transitions (fall, spring)

### Success State
- Complete relationship history in one scrollable view
- Linked entities for drill-down
- Pattern recognition for meeting preparation

---

## Journey 9: Customer Portal Foundation (Future — Schema Validation)

**Goal**: Validate that our schema design supports the future customer portal
**Trigger**: Architecture review during customer vertical build
**Persona**: Development team

### Data Flow (Future State)

```
Customer Portal Login
  ↓
Contact auth (separate from shop owner auth)
  ↓
Scoped data: only this customer's records
  ├── Orders/Jobs: status, task progress, expected dates
  ├── Quotes: view, approve, reject (with comments)
  ├── Invoices: view, make payment
  ├── Proofs: approve/reject per-artwork (with comments)
  ├── Shipments: tracking info
  └── Messages: per-order threads with shop
```

### Schema Requirements (Build NOW)

| Requirement | Schema Element | Status |
|-------------|---------------|--------|
| Contact-level auth | `contacts.portal_access: boolean` | To be added |
| Contact login | `contacts.portal_email`, `contacts.portal_password_hash` | To be added |
| Scoped queries | All queries filterable by `customer_id` | Built into repository pattern |
| Approval workflow | `proof_approvals` table with status, comments, contact_id | To be designed |
| Payment recording | `payments` table with external_ref for Stripe/PayPal | Exists in invoice schema |
| Message threads | `messages` table with order context | To be designed |

### Validation Criteria
- Every entity that a customer might view has a `customer_id` FK
- Contact-level permission flags exist (can_approve_proofs, can_place_orders, etc.)
- No schema decision blocks portal implementation later

---

## Journey Map Summary

| # | Journey | Primary Action | Key Feature Areas |
|---|---------|---------------|-------------------|
| 1 | New customer from phone call | Create + note + quote | CRUD, Activity, Quoting |
| 2 | Returning customer lookup | Search + review | Search, Detail, Timeline |
| 3 | Lifecycle progression | Auto/manual stage changes | Lifecycle, Health |
| 4 | Seasonal proactive outreach | Pattern detection + outreach | Seasonality, Analytics |
| 5 | Financial review | Balance/credit check | Financial, Credit |
| 6 | Multi-state tax compliance | Per-state exemption | Tax, Compliance |
| 7 | Preferences in quoting | Favorites surface in forms | Preferences, Garments |
| 8 | Timeline deep dive | Interaction history review | Activity Timeline |
| 9 | Portal foundation | Schema validation | Portal, Auth |
