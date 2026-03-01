# Customer Vertical — Competitive Research Report

**Pipeline**: `20260228-customer-vertical`
**Stage**: Research
**Date**: 2026-02-28
**Status**: Complete

---

## Executive Summary

Analysis of 7 print shop management competitors plus SaaS CRM patterns reveals that customer management in the screen printing industry is broadly underserved. Most tools treat CRM as an afterthought — a flat contact list attached to orders. The opportunity for Screen Print Pro is to build a customer vertical that combines enterprise CRM patterns (HubSpot-style activity timelines, company-contact hierarchies) with print-industry-specific intelligence (garment preferences, seasonal detection, per-state tax compliance) that no competitor offers.

---

## Competitors Analyzed

| Tool | Market Segment | Customer Management Quality | Key Strength |
|------|---------------|----------------------------|--------------|
| **Printavo** | Mid-market ($100K–$2M shops) | Basic | Payment terms, automation rules |
| **YoPrint** | Mid-market | Good | Best-in-class customer portal |
| **The Print Life** | Small shops | Minimal | Reorder from history |
| **ShopWorks/OnSite** | Enterprise ($100K–$50M) | Enterprise CRM | Lead scoring, sales funnels, activity auto-logging |
| **DecoNetwork** | All-in-one + eCommerce | Strong | Credit limits, custom fields, company-contact hierarchy |
| **InkSoft** | eCommerce-first | Secondary | Online stores per customer |
| **shopVOX** | CRM-oriented | Good | Pipelines, lead source tracking, calendar integration |

---

## Competitor Deep Dives

### Printavo

**Data Model** (from GraphQL API v2):
- `CustomerCreateInput`: `primaryContact` (required), `companyName`, `billingAddress`, `shippingAddress`, `contacts[]`, `defaultPaymentTerm`, `resaleNumber`, `salesTax`, `taxExempt`, `internalNote`, `owner`
- 5 separate address types (Address, BillingAddress, CustomerAddress, CustomAddress, MerchAddress) — indicates organic complexity growth
- Contact has `id`, `fullName`, `email` (array — multiple emails per contact)

**Strengths**:
- Simple customer creation (only primaryContact required)
- Good automation (auto-email/text, auto-payment requests, auto-status changes)
- Flexible freeform tags for categorization
- Payment terms with auto-population on orders
- GraphQL API v2 is well-structured

**Weaknesses**:
- No permission system (critical pain point at 20+ people)
- Customer import creates duplicates (no merge capability)
- Editing customer address does NOT update existing invoice addresses (silent divergence)
- No structured customer types — only freeform tags
- No credit limits or account balance tracking
- Scaling ceiling at 20-30 people

### YoPrint

**Data Model**:
- Customer: name (required), website, internal notes, tax exempt (required boolean), resale number, SMS opt-in
- Contacts: first/last name, email, phone, country code, primary designation
- Addresses: labeled ("Shopfront", "Warehouse"), billing/shipping, primary per type
- Payment terms: configurable presets with auto-deposit calculation

**Strengths**:
- Best-in-class customer portal: granular per-artwork approval, live shipping tracking (UPS/FedEx), in-portal payments (Stripe/Square/PayPal), complete white-labeling with custom domain
- Labeled/named addresses (superior to just "billing/shipping")
- SMS opt-in capability
- Payment term auto-calculation

**Weaknesses**:
- No custom fields
- No customer types/tiers
- No credit limits
- Flat customer model (no company-contact hierarchy)
- Limited documentation

### The Print Life

**Strengths**:
- Reorder from history (customers replicate past orders from portal — excellent for recurring B2B)
- Approval gating (production blocked until customer approves)
- Mistake prevention (catches common quoting errors)

**Weaknesses**:
- Very limited documentation
- No visible CRM features (no tags, types, payment terms, credit limits)
- No public API
- Small market presence

### ShopWorks / OnSite (Enterprise)

**Strengths**:
- Full CRM: lead scoring, sales funnel management, campaign tracking
- Activity auto-logging from system emails
- ManageOrders portal: configurable customer-facing views, 2-year order history, mobile payments
- ProofStuff integration for online proofing
- Proven at $50M+ revenue shops

**Weaknesses**:
- FileMaker Pro dependency (dated platform)
- High complexity and cost
- ManageOrders and ProofStuff are separate products
- Dated UX

### DecoNetwork

**Data Model**:
- Customer fields: company, full_name, firstname, lastname, salutation, email, phone_number
- Full billing + shipping address sets
- Commerce: store, store_url, order_count, balance, total_order_value
- Companies List: separate entity with contacts, outstanding amounts, **credit limit**, total order value
- Custom Customer Fields: admin-configurable

**Strengths**:
- **Only competitor with credit limits + balance tracking per company**
- Custom fields (extensible customer data model)
- Company-contact hierarchy (two-tier)
- Contract Price Levels: multiple pricing tiers per customer/store
- Per-customer branded online storefronts
- Supplier catalog integration (S&S, SanMar)

**Weaknesses**:
- Batch production extremely lacking (must process individually)
- Complex store setup
- Slow feature development
- Limited customization once templates modified

### InkSoft

**Data Model**:
- Two-tier CRM: Companies and Contacts
- Contacts: name, email, phone, multiple addresses, notes, comments (with author tracking), order summary, tags
- Tags managed via Tag Manager

**Strengths**:
- Online stores as CRM feature (each customer gets branded storefront)
- Store Performance Dashboard (customer-accessible analytics)
- Mobile CRM entry (field sales reps)
- Auto-contact creation from store shoppers

**Weaknesses**:
- CRM is secondary to eCommerce
- No payment terms, credit limits, or tax exemption fields
- Basic reporting
- Pricing opacity

### shopVOX

**Strengths**:
- Multiple customizable sales pipelines
- Client profiles with Notes, Tasks, Assets (measurements, designs, photographs)
- Calendar integration with per-client scheduling
- Lead source tracking
- Automated emails at key production points

---

## S&S Activewear — Dealer Account Model

Relevant because Screen Print Pro customers are S&S dealers/buyers.

**Key patterns**:
- Single free account tier with live wholesale pricing
- Case pricing vs. piece pricing (volume-based)
- Real-time inventory by warehouse (18 distribution centers)
- $200 free freight threshold
- **Per-state resale certificates**: Upload in portal, state-specific, multi-state requires manual request
- AutoPay model: automatic weekly payment of outstanding invoices
- Inventory reservation without purchasing

**Relevance to Screen Print Pro**:
- Per-state tax exemption model → our customers may need this too
- AutoPay pattern → interesting for recurring customers
- Address management (multiple ship-to addresses) → mirrors our labeled address approach

---

## SaaS CRM Patterns (HubSpot / Salesforce)

**HubSpot data architecture** (gold standard for B2B):
1. **Objects** (tables): Contacts, Companies, Deals, Tickets, Leads, Line Items, Quotes
2. **Records** (instances): Individual rows
3. **Properties** (fields): Default + custom per object
4. **Associations** (relationships): N:N between any objects with "primary" designation

**Key patterns applicable to Screen Print Pro**:
- Contact-Company N:N association (contact can belong to multiple companies)
- Activities as first-class objects (calls, emails, meetings, tasks, notes)
- Engagement auto-tracking
- Custom objects (enterprise extensibility)

---

## Cross-Competitor Feature Matrix

| Feature | Printavo | YoPrint | Print Life | ShopWorks | DecoNetwork | InkSoft | shopVOX | **Screen Print Pro (Planned)** |
|---|---|---|---|---|---|---|---|---|
| Company-Contact hierarchy | Weak | Weak | None | Yes | **Yes** | **Yes** | Partial | **Yes** |
| Multiple contacts + roles | Yes | Yes | ? | Yes | Yes | Yes | Yes | **Yes (role-based)** |
| Labeled addresses | No | **Yes** | Basic | Yes | Yes | Yes | Yes | **Yes** |
| Payment terms | **Yes** | **Yes** | ? | Yes | Yes | No | ? | **Yes** |
| Credit limits | No | No | No | ? | **Yes** | No | No | **Yes** |
| Per-state tax exemption | No | No | No | ? | Partial | No | No | **Yes** |
| Custom fields | No | No | No | Yes | **Yes** | No | No | **Yes (JSONB)** |
| Tags/categories | **Yes** | No | No | Yes | Limited | **Yes** | **Yes** | **Yes** |
| Pricing tiers per customer | No | No | No | Yes | **Yes** | Limited | Yes | **Yes** |
| Customer portal | Yes | **Best** | Yes | Yes | Yes | Via stores | No | **Planned** |
| Activity timeline | No | Limited | No | **Yes** | Limited | No | Yes | **Yes (auto-logged)** |
| Garment preferences | No | No | No | No | No | No | No | **Yes (unique)** |
| Seasonal detection | No | No | No | No | No | No | No | **Yes (unique)** |
| Referral system | No | No | No | No | No | No | No | **Yes** |
| Reorder from history | No | No | **Yes** | No | No | Via store | No | **Planned** |
| Communication integration | Basic | Good | Basic | **Good** | Basic | Basic | Good | **Planned (email/SMS/VM)** |

---

## Anti-Patterns to Avoid

1. **Flat customer model** — No company-contact hierarchy leads to lost relationships when contacts change jobs. Model Company > Contact always.
2. **Import-creates-duplicates** — Customer CSV import without merge/dedup capability. Build idempotent upsert from day one.
3. **Invoice-address divergence** — Editing customer address silently doesn't update existing invoices. Solution: snapshot addresses at order/invoice creation time. Historical invoices preserve billing-time address (legally correct). New orders pick up current address.
4. **Single tax exemption field** — `taxExempt` boolean + one `resaleNumber` fails multi-state compliance. Model per-state with certificate storage and expiration tracking.
5. **No credit limits** — B2B print shops need guardrails on customer debt. Track credit limit + outstanding balance.
6. **CRM as afterthought** — When CRM only exists to support eCommerce, basic management (payment terms, tax tracking, communication history) gets neglected.
7. **No activity timeline** — Without auto-logged communication history, customer context lives in people's heads. Build activity log as core infrastructure.
8. **Pricing-update tedium** — Updating prices one-item-at-a-time. Use tag-based template assignment for mass repricing.
9. **Separate portal products** — Portal should be built-in, not a separate purchase.
10. **Template lock-in** — Custom edits void template support. Use component-based approach.

---

## Our Competitive Advantages (Unique to Screen Print Pro)

These features are not found in any analyzed competitor:

1. **Garment preferences per customer** — Customer X always orders Bella+Canvas 3001, surfaced during quoting
2. **Seasonal customer detection** — dbt-inferred ordering patterns with proactive outreach reminders
3. **3-level color preference cascade** — Shop → Brand → Customer with inheritance/override semantics
4. **Per-state tax exemption** — Certificate storage, expiration tracking, state-specific compliance
5. **Referral system with promotional credit** — Referral attribution + credit issuance on spend threshold
6. **Activity timeline with multi-channel integration** — Email, SMS, voicemail → unified customer timeline
7. **Role-based contact permissions** — Granular: who can approve proofs, who receives invoices, who places orders

---

## Technology & Architecture Considerations

### Read vs Write Patterns

| Entity | Read Frequency | Write Frequency | Strategy |
|--------|---------------|-----------------|----------|
| Customer | Very high (every quote/job/invoice) | Low (create once, update occasionally) | Redis cache, 15-min TTL, invalidate on mutation |
| Contact | High (displayed on many screens) | Low | Cache with parent customer |
| Address | Medium (order creation, invoicing) | Low | Snapshot at order creation |
| Activity | Medium (timeline view) | High (every system event) | Append-only, paginated reads, no cache |
| Preferences | Medium (garment catalog filtering) | Low-medium | Redis cache per customer, 5-min TTL |
| Tax Exemptions | Low (invoicing only) | Very low | No caching needed |

### Database Design Principles

- **Address snapshotting**: Orders/invoices store address copy at creation time (JSONB)
- **Composite keys**: `(shop_id, source, external_id)` pattern for multi-source support
- **Per-state tax**: Separate `customer_tax_exemptions` table
- **Activity as event log**: Polymorphic `related_entity_type + related_entity_id`
- **JSONB metadata**: Extensible custom fields without schema changes
- **Seasonal analysis**: Computed in dbt mart, not stored in operational DB

### Customer Portal Foundation

Schema decisions that must be made NOW to support future portal:
- Contact-level `portal_access` boolean
- Contact-level auth (separate from shop owner auth)
- Scoped read permissions (customer sees only their data)
- Order/proof approval workflow states
- Message thread model (per-order or per-customer)

### Communication Integration Architecture

Universal `customer_activities` table with:
- `source` enum: `manual | system | email | sms | voicemail | portal`
- `direction`: `inbound | outbound`
- `external_ref`: Provider-specific ID (email message ID, Twilio SID, etc.)
- Each integration becomes another writer to the same table
- Timeline UI built once against universal schema

---

## References

### Printavo
- [Printavo Features](https://www.printavo.com/features/)
- [Printavo API v2](https://www.printavo.com/docs/api/v2)
- [Printavo CustomerCreateInput](https://www.printavo.com/docs/api/v2/input_object/customercreateinput/)
- [Printavo Tags](https://support.printavo.com/hc/en-us/articles/360003517754-Using-Tags)
- [Printavo Payment Terms](https://updates.printavo.com/invoice-date-payment-due-date-and-terms-154253)

### YoPrint
- [YoPrint Customer Portal](https://www.yoprint.com/customer-self-service-portal-for-print-shops)
- [YoPrint Customer Addresses](https://support.yoprint.com/article/40-manage-customer-address)
- [YoPrint Customer Contacts](https://support.yoprint.com/article/133-customer-contacts)
- [YoPrint Payment Terms](https://support.yoprint.com/article/64-payment-terms)

### DecoNetwork
- [DecoNetwork Customer Fields](https://help.deconetwork.com/hc/en-us/articles/235251588-Customer-Fields)
- [DecoNetwork Companies List](https://help.deconetwork.com/hc/en-us/articles/25404174558107-Companies-List)
- [DecoNetwork Contract Price Levels](https://help.deconetwork.com/hc/en-us/articles/360045936254-Contract-Price-Levels)

### InkSoft
- [InkSoft CRM](https://help.inksoft.com/hc/en-us/articles/9161041181211-Customer-Relationship-Management-CRM)
- [InkSoft Contact Details](https://help.inksoft.com/hc/en-us/articles/9161160874139-Contact-Details)
- [InkSoft Online Stores](https://www.inksoft.com/e-commerce-stores-and-web-to-print-sites/)

### ShopWorks
- [ShopWorks OnSite](https://www.shopworx.com/onsite-business-management-software/)
- [ManageOrders Portal](https://www.shopworx.com/manageorders/)

### S&S Activewear
- [S&S Help Center](https://www.ssactivewear.com/helpcenter/)
- [S&S Business Forms](https://www.ssactivewear.com/download/businessforms)

### HubSpot
- [HubSpot CRM Data Model](https://knowledge.hubspot.com/get-started/manage-your-crm-database)
- [HubSpot Associations](https://knowledge.hubspot.com/records/associate-records)
