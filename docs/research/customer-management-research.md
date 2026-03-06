# Customer Management Research — Print Shop Industry Analysis

**Purpose**: Understand what print shop owners and operators actually NEED from a customer management system
**Status**: Complete
**Date**: 2026-02-09
**Context**: Pre-discovery research for the Customer Management vertical in Mokumo

---

## Table of Contents

1. [How Print Shops Manage Customer Relationships Today](#1-how-print-shops-manage-customer-relationships-today)
2. [Customer Types & Lifecycle](#2-customer-types--lifecycle)
3. [Pain Points & Frustrations](#3-pain-points--frustrations)
4. [Critical Customer Data for Print Shops](#4-critical-customer-data-for-print-shops)
5. [Communication Patterns](#5-communication-patterns)
6. [Small Shop vs Large Shop Needs](#6-small-shop-vs-large-shop-needs)
7. [Industry Trends (2025-2026)](#7-industry-trends-2025-2026)
8. [Competitive Landscape: What Existing Tools Offer](#8-competitive-landscape-what-existing-tools-offer)
9. [Actionable Insights for Mokumo](#9-actionable-insights-for-mokumo)
10. [Gap Analysis: What's Missing in the Current Schema](#10-gap-analysis-whats-missing-in-the-current-schema)

---

## 1. How Print Shops Manage Customer Relationships Today

### The Reality: "Digital Duct Tape"

Most small to mid-size print shops do NOT use a dedicated CRM. Instead, they cobble together a patchwork of tools:

- **Google Drive / Dropbox** for artwork files
- **Excel / Google Sheets** for pricing and customer lists
- **Email** for art approvals and communication history
- **QuickBooks** for invoicing and basic customer records
- **Sticky notes / whiteboards** for production tracking
- **Paper folders** that physically move through the shop

One T-Shirt Forums user described their workflow in vivid detail:

> "We create a folder using EXCEL, which is printed off and put in a folder and given to the artist. After creation, it's handed back to the front desk who emails it to the customer. The folder floats around the office until the customer decides to order or cancels. We check in with customers once a month, and if they order the folder changes colors from RED to BLUE and gets ordered, then handed back to the artist for separations, then to the scheduler, and is tacked to a board in the back of the shop when ready to print."

This is not an edge case. This is the _typical_ workflow for a 2-5 person shop.

### Where Customer Data Actually Lives

For shops without management software, customer data is scattered across:

| System              | What It Holds                             | Problem                        |
| ------------------- | ----------------------------------------- | ------------------------------ |
| QuickBooks          | Name, address, payment history            | No artwork, no job context     |
| Email inbox         | Art approvals, quote conversations        | Unsearchable, person-dependent |
| Google Drive        | Artwork files per customer folder         | No link to orders, no metadata |
| Spreadsheets        | Pricing history, customer lists           | Manual, gets out of date       |
| Phone contacts      | Direct numbers                            | No shared access               |
| Shop owner's memory | Preferences, special terms, relationships | Single point of failure        |

**Key insight**: The shop owner's _brain_ is the actual CRM. When they're sick, on vacation, or forget, things fall through cracks.

### Shops Using Management Software

Shops that do use tools like Printavo, ShopVox, or DecoNetwork get basic customer profiles, but reviews consistently report:

- Customer profiles are an afterthought, not a first-class feature
- No way to see the full relationship picture (quotes + jobs + art + notes + communication)
- Updating pricing across all customers is "a nightmare" (item-by-item changes)
- Status customizations are limited (one user reported only 4 status options)
- Template limitations (variable text only, can't swap logos)

Sources:

- [T-Shirt Forums: What software do you use?](https://www.t-shirtforums.com/threads/what-software-do-you-use-in-your-screen-printing-shop.883653/)
- [PrintPlanet: Do you use management software?](https://printplanet.com/threads/do-you-use-a-print-shop-management-software.293385/)
- [Better Sign Shop: Best software for screen printers](https://bettersignshop.com/best-screen-printing-software-services)

---

## 2. Customer Types & Lifecycle

### The Six Customer Archetypes

Print shops serve fundamentally different customer types, each with distinct needs:

| Type                   | Example                          | Frequency  | Volume        | Complexity  | Price Sensitivity    |
| ---------------------- | -------------------------------- | ---------- | ------------- | ----------- | -------------------- |
| **Retail one-off**     | Family reunion, bachelor party   | Once       | 10-50 pcs     | Low         | Medium               |
| **Repeat retail**      | Local brewery seasonal merch     | 4-12x/year | 25-200 pcs    | Medium      | Medium               |
| **Sports/school**      | Youth lacrosse league            | 2-4x/year  | 50-500 pcs    | Medium-High | High (budgets)       |
| **Corporate account**  | Company branded apparel          | 4-12x/year | 50-1000 pcs   | Medium      | Low (approvals slow) |
| **Wholesale/contract** | Another print shop outsourcing   | Ongoing    | 500-5000+ pcs | High        | Very High (margins)  |
| **Decorator/broker**   | Promotional products distributor | Ongoing    | Variable      | High        | Very High            |

**Critical distinction**: Retail vs. Contract printing

> "Retail screen printing is when a print shop prints directly for the customer. Contract screen printing is when a print shop subcontracts printing to another print shop."

Contract and wholesale accounts have fundamentally different workflows:

- **Larger volumes** with tighter margins
- **PO-based ordering** instead of direct payment
- **Different pricing tiers** (reseller discounts)
- **Ongoing relationships** with regular reorders
- **Strict delivery schedules** tied to retail seasons

Source: [Extreme Screen Prints: Contract, Wholesale, & Custom](https://www.extremescreenprints.com/post/understanding-the-differences-contract-wholesale-and-custom-screen-printing)

### Customer Lifecycle

```text
Lead ──────────► Prospect ──────────► Customer ──────────► Repeat
(initial       (quoted,              (first order         (2+ orders,
 contact)       not yet ordered)      completed)           loyalty)
     │                │                    │                    │
     ▼                ▼                    ▼                    ▼
  Capture:        Track:              Build:               Nurture:
  - Source         - Quote history     - Art library        - Reorder ease
  - Needs          - Follow-ups        - Preferences        - Volume pricing
  - Contact info   - Win/loss reason   - Payment terms      - Seasonal reminders
```

**For 4Ink's small shop context**, the lifecycle is simpler but the transitions matter:

1. Someone calls/walks in/emails asking about printing
2. Shop owner builds a quote (already built in Mokumo)
3. Customer approves, order enters production
4. Delivery/pickup, payment collected
5. Months later: "Hey, I need more of those shirts"

**The critical gap**: Step 5. Most small shops lose repeat business because there's no system to remind them who ordered what, make reordering frictionless, or proactively reach out when it's been a while.

### Walk-in vs. Online vs. Wholesale

| Channel                | Workflow Difference                                             | Data Needs                                                   |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| **Walk-in**            | Immediate interaction, POS payment, face-to-face art discussion | Quick capture, mobile-friendly, receipt printing             |
| **Phone/Email**        | Async conversation, art files via email, quote back-and-forth   | Communication trail, art file attachment, quote linking      |
| **Online**             | Self-service ordering or quote request, automated flow          | Portal access, automated notifications, online payment       |
| **Wholesale/Contract** | PO-based, agreed pricing, regular schedule                      | PO tracking, pricing tiers, delivery schedules, credit terms |

Source: [Anatol Equipment: Managing Screen Printing Workflow](https://anatol.com/managing-your-screen-printing-workflow-tips-for-scheduling-production-more-effectively/)

---

## 3. Pain Points & Frustrations

### From Shop Owners (Forum/Review Quotes)

**On searching for past orders/customers:**

> "Being able to review customer history and see what a customer has ordered in the past is important for improving business processes." — Industry guidance, but rarely achieved in practice by small shops.

**On pricing management:**

> "Updating system-wide pricing is a nightmare — no way to do it quickly. You have to open each item one at a time and change the price individually, which is very tedious." — ShopVox user, T-Shirt Forums

**On software learning curves:**

> "We've been signed up to ShopVox for 3 years and still don't have our heads around the pricing." — T-Shirt Forums user

**On the patchwork problem:**

> Shop owners describe their current setups as patching together "Google Drive, Dropbox, email, and sticky notes" — described as "digital duct tape." — Industry analysis

**On workarounds killing productivity:**

> "New shop aids/tools, spreadsheets, or software added with good intention of getting the job done faster kill productivity in the long run, and when the volume outgrows the workaround or a staff member is absent, it strains the entire operation." — PrintPlanet forum

**On scheduling and status tracking:**

> "Scheduling is a highly complex process since each job is essentially unique, and manual scheduling can prove inefficient since it takes up unprecedented time and effort." — Industry analysis

### Top 10 Customer Management Pain Points (Synthesized)

| #   | Pain Point                                                                                  | Severity | Frequency     |
| --- | ------------------------------------------------------------------------------------------- | -------- | ------------- |
| 1   | **No single view of a customer** — data scattered across 4-5 systems                        | Critical | Universal     |
| 2   | **Can't find past artwork** — "What was that design we did for them last year?"             | High     | Very frequent |
| 3   | **Reorder friction** — customer calls back, shop has to rebuild everything from scratch     | High     | Frequent      |
| 4   | **No follow-up system** — repeat customers fall through the cracks                          | High     | Frequent      |
| 5   | **Communication history lost** — art approvals buried in email, no audit trail              | High     | Frequent      |
| 6   | **Pricing inconsistency** — contract customers don't get their agreed pricing automatically | Medium   | Occasional    |
| 7   | **Tax exempt tracking** — manually checking certificate status, forgetting to exempt        | Medium   | Frequent      |
| 8   | **Multiple contacts per company** — ordering contact vs. art approver vs. AP/billing        | Medium   | Frequent      |
| 9   | **Shipping complexity** — same customer, different ship-to addresses per order              | Medium   | Occasional    |
| 10  | **No customer-supplied garment tracking** — who brought what, how many, liability           | Medium   | Occasional    |

Sources:

- [T-Shirt Forums: What software do you use?](https://www.t-shirtforums.com/threads/what-software-do-you-use-in-your-screen-printing-shop.883653/)
- [ScreenPrinting.com: Productivity Hacks](https://www.screenprinting.com/blogs/news/screen-printing-tips-to-save-you-time-and-money)
- [Ordant: CRM for Printers](https://ordant.com/crm-for-printers-do-u-need-customer-relationship-management-software/)
- [ShopWorks: Fixing Common Business Mistakes](https://www.shopworx.com/screen-printing-productivity-holes/)

---

## 4. Critical Customer Data for Print Shops

### Essential Fields (Industry-Validated)

Based on analysis of Printavo, ShopVox, DecoNetwork, and Ordant customer profiles, plus forum discussions:

#### Tier 1: Must Have (Day 1)

| Field                                      | Why It Matters                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- |
| **Company name**                           | Primary identifier. Most orders are company-based, not individual.    |
| **Primary contact** (name, email, phone)   | Who you talk to about orders                                          |
| **Billing address**                        | Invoicing, tax jurisdiction                                           |
| **Tag/type** (new, repeat, contract)       | Determines pricing behavior, artwork handling, shipping defaults      |
| **Notes** (internal, not customer-visible) | "Always runs 2 weeks late on approvals" / "Prefers to text not email" |

#### Tier 2: High Value (Within First Month)

| Field                                       | Why It Matters                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| **Multiple contacts** per company           | Art director vs. purchaser vs. AP. Different people for different roles. |
| **Multiple shipping addresses**             | Corporate has HQ + satellite offices. Events have different venues.      |
| **Tax exempt status** + certificate on file | Legal requirement. Must know before invoicing.                           |
| **Payment terms** (Net 30, COD, etc.)       | Contract customers expect credit terms.                                  |
| **Preferred communication channel**         | Text vs. email vs. phone — saves time and gets faster responses          |
| **Price tier / discount level**             | Contract customers get automatic discounts                               |
| **Order history** (linked, not duplicated)  | See every quote + job + invoice in one place                             |
| **Artwork library** (linked to customer)    | Every logo, design, and variation they've ever used                      |

#### Tier 3: Power Features (For Growth)

| Field                                 | Why It Matters                                                     |
| ------------------------------------- | ------------------------------------------------------------------ |
| **Customer-supplied garment policy**  | Do they bring their own? What's the handling fee?                  |
| **PO required?** (boolean + PO field) | Corporate/institutional customers require POs on every order       |
| **Credit limit**                      | How much outstanding balance is allowed before requiring payment   |
| **Seasonal ordering patterns**        | "They always order in March for spring league, September for fall" |
| **Lead source**                       | Referral, walk-in, website, trade show — tracks marketing ROI      |
| **Win/loss tracking**                 | Why did we lose this quote? Price? Speed? Another shop?            |
| **Lifetime value**                    | Total revenue from this customer across all orders                 |
| **Last order date**                   | When to follow up. "It's been 6 months since Marcus ordered."      |

### Data Relationships (Critical for Print Shops)

```text
Customer
  ├── Contacts[] (multiple people per company)
  ├── Addresses[] (billing + multiple shipping)
  ├── Quotes[] (all quotes, any status)
  ├── Jobs[] (all orders in production)
  ├── Artworks[] (logo library, linked to customer)
  ├── Notes[] (internal, timestamped)
  ├── TaxExemptCerts[] (document storage, expiry tracking)
  └── PricingOverrides (custom rates, discount tiers)
```

**This relationship map is what makes a print shop CRM different from a generic CRM.** Generic CRMs don't understand that a customer's artwork library, pricing history, and garment preferences are all interconnected.

Sources:

- [DecoNetwork: Customer Fields](https://help.deconetwork.com/hc/en-us/articles/235251588-Customer-Fields)
- [ShopVox: Adding/Updating Customers and Contacts](https://help.shopvox.com/article/bm64j1wtv0-adding-updating-customers-and-contacts)
- [Printavo: Customer Support Docs](https://support.printavo.com/hc/en-us/articles/1260805600530-Customers)
- [Ordant: CRM Module](https://ordant.com/module/print-mis-prospects-crm/)
- [ClickUp: Screen Printing Order Form Template](https://clickup.com/templates/form/screen-printing-order)

---

## 5. Communication Patterns

### The Art Approval Loop (Biggest Communication Touch Point)

The art approval process is the most communication-intensive part of the customer relationship:

1. **Customer provides artwork** (email attachment, Dropbox link, flash drive)
2. **Shop creates proof/mockup** showing design on garment
3. **Proof sent to customer** via email or approval software
4. **Customer reviews** and either approves or requests changes
5. **Revision cycle** (1-3 rounds typical, each requiring communication)
6. **Final approval** — documented, timestamped, legally binding

> "The way you attach your quote and send your art proof to the customer -- and the verbiage you use to communicate expectations -- will set the tone for how positive or negative the complicated art approval process becomes." — Printavo Blog
> "Let clients know how many revisions are included in their quote and clearly explain that additional changes will come at an extra cost." — Industry best practice

**Key insight for Mokumo**: Art approval communication should be visible in the customer profile. "When did Sarah last approve? What version? Who sent the proof?"

### Communication Channels Used

| Channel             | When Used                                                | Pain Point                                        |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| **Phone**           | Quick questions, urgent changes, relationship building   | No record unless manually noted                   |
| **Email**           | Art files, formal quotes, approvals                      | Gets buried, hard to search for specific customer |
| **Text/SMS**        | Quick approvals, pickup notifications, payment reminders | No integration with shop software                 |
| **In-person**       | Walk-ins, pickups, relationship building                 | Nothing recorded unless shop staff writes it down |
| **Customer portal** | Self-service art uploads, order status checks            | Most small shops don't have one                   |

**The trend**: Printavo introduced text follow-ups for quotes and payments. Shops that use SMS get faster responses. But most small shops still rely on email and phone.

### Customer Follow-Up & Retention

> "Following up with past customers is one of the best ways to get returning customers and repeat business. This can include reminders about seasonal services and special offers on past services."
> "It's critical to find out as much as you can about your clients, both as professionals and as people, use both human engagement and a good CRM platform to collect and analyze purchasing habits."

**What successful shops do:**

- Track when customers last ordered
- Know their seasonal patterns (school shirts in August, holiday party shirts in November)
- Reach out proactively when it's been too long
- Make reordering dead simple ("Same as last time? Click here.")
- Store customer preferences so the next interaction starts where the last one ended

**What most small shops actually do:**

- Nothing. They wait for the customer to come back.
- The owner might remember to call someone if they happen to think of them.
- There is no system, no reminders, no follow-up workflow.

Sources:

- [Printavo Blog: Artwork Chapter](https://www.printavo.com/blog/printhustlers-guide-to-growing-a-successful-screen-printing-business-chapter-14-artwork/)
- [Teesom: Screen Printing Workflow Optimization](https://teesom.com/optimizing-screen-printing-workflow/)
- [DecoNetwork: Artwork Approvals](https://www.deconetwork.com/home/features/artwork-approvals/)
- [Screen Printing Mag: Why Print Shops Need a CRM](https://screenprintingmag.com/why-print-shops-need-a-crm-how-to-capture-more-sales-and-create-predictable-growth/)
- [Ordant: Print Shop Customer Service Tips](https://ordant.com/print-shop-customer-service-tips/)

---

## 6. Small Shop vs. Large Shop Needs

### Small Shop (1-5 people, like 4Ink)

**Context**: Owner IS the salesperson, IS the designer, IS the production manager. There is no dedicated sales team. The "CRM" is the owner's brain.

**What they need:**

- **Speed over features** — Adding a customer should take < 30 seconds
- **Instant context** — Open a customer, see everything: last order, artwork, notes, outstanding balance
- **Zero administration** — No data entry for data entry's sake
- **Mobile-friendly** — Owner takes calls in the shop, at dinner, on weekends
- **Integrated, not separate** — Customer data must be in the same tool as quoting and jobs, not a separate CRM login

**What they DON'T need:**

- Sales pipeline visualization (they know all their prospects by name)
- Lead scoring or qualification workflows
- Marketing automation or drip campaigns
- Territory management
- Multi-user permission hierarchies
- Sales forecasting dashboards

> "Small teams often lose more money in reprints, rush freight, and late invoices than the monthly fee of a management platform." — SoftwareConnect
> "Small shops actually see the fastest ROI because every saved hour translates straight to billable production or sales time." — Industry analysis

### Large Shop (10-20+ people)

**Additional needs beyond small shop:**

- Multiple salespeople tracking their own accounts
- Role-based access (sales sees pricing, production doesn't)
- Formal sales pipeline with stages and probabilities
- Customer segmentation and reporting
- Integration with external CRM (HubSpot, Salesforce)
- Automated follow-up sequences
- Credit limit management and approval workflows

### Right Level of Complexity for 4Ink

Based on research, 4Ink needs:

| Feature                           | Include?  | Rationale                              |
| --------------------------------- | --------- | -------------------------------------- |
| Quick customer creation           | **YES**   | Already have this (AddCustomerModal)   |
| Customer detail view with history | **YES**   | Core value proposition                 |
| Artwork library per customer      | **YES**   | Already linked in quoting              |
| Internal notes                    | **YES**   | Already have notes field               |
| Multiple contacts per company     | **YES**   | Common need, low complexity            |
| Tax exempt tracking               | **YES**   | Legal requirement, frequent need       |
| Multiple shipping addresses       | **YES**   | Medium effort, real pain point         |
| Payment terms                     | **YES**   | Contract customer differentiation      |
| Customer tags                     | **YES**   | Already have (new/repeat/contract)     |
| Sales pipeline/CRM                | **NO**    | Too complex for 1-person sales team    |
| Marketing automation              | **NO**    | Wrong tool for the job                 |
| Lead scoring                      | **NO**    | Overkill for small shop                |
| Credit limit management           | **DEFER** | Nice to have, not critical for Phase 1 |
| Customer portal                   | **DEFER** | Phase 2 feature                        |

Sources:

- [SoftwareConnect: Best Print Shop Management Software](https://softwareconnect.com/roundups/best-print-shop-management-software/)
- [Printmatics: Do Small Print Shops Need Management Software?](https://www.printmatics.com/software-small-print-shop)
- [Ordant: Print Shop Software for Small Businesses](https://ordant.com/print-shop-software-for-small-businesses/)
- [CoreBridge: MIS Software for Print Shops 2025](https://www.corebridge.net/post/mis-software-for-print-shops-in-2025)

---

## 7. Industry Trends (2025-2026)

### Self-Service Customer Portals

> "Print service providers are evolving into communication hubs with self-service portals, automated approvals, and data-connected workflows."

The trend is real but adoption varies by shop size:

- **Large shops** (50+ employees): Active adoption of customer portals for reorders and status checking
- **Mid-size shops** (10-50): Exploring portals, some using DecoNetwork or InkSoft
- **Small shops** (1-10): Mostly still phone/email. Portal is a "someday" feature.

**For 4Ink**: A customer portal is a Phase 2/3 feature. Phase 1 should focus on making the shop-side customer view excellent. The portal follows when there's something worth exposing to customers.

### E-Commerce Integration

> "Customers today expect speed, convenience, customization, and online accessibility, and if your print shop still relies only on walk-ins, emails, or phone calls, you may already be losing clients to competitors who have embraced digital transformation."

However, for custom screen printing (not print-on-demand), e-commerce is primarily used for:

- **Company stores** — employees pick pre-approved designs and sizes
- **Fundraiser stores** — sports teams sell pre-designed merchandise
- **Reorder portals** — repeat customers click "reorder" on past jobs

**For 4Ink**: E-commerce is a Phase 3+ feature. More relevant for the Customer Portal vertical. Not needed for core customer management.

### AI and Automation

> "85% of PSPs believe AI is now critical to competitiveness, with most already piloting AI in estimating, prepress, and workflow automation."

For small shops, the AI opportunity is in:

- **Smart pricing** — Auto-suggest pricing based on past similar orders
- **Reorder prediction** — "Marcus usually orders in March. It's February. Send a reminder?"
- **Art file processing** — Auto-detect color count, suggest separations

**For Phase 1**: None of this. But the data model should be rich enough to support it later.

### Barcode/QR Workflows

> "In 2026, more decorators will begin to automate production tracking and decoration routing via QR or barcode-driven workflows."

Printavo already has barcode support for job tracking. This is more relevant to the Production vertical than Customer Management.

Sources:

- [OnPrintShop: POD Trends 2026](https://onprintshop.com/blog/print-on-demand-trends-for-print-service-providers)
- [Walsworth: 2026 Printing Trends](https://www.walsworth.com/blog/2026-printing-trends)
- [Screen Printing Mag: 2026 Will Reshape How Print Shops Compete](https://screenprintingmag.com/2026-will-reshape-how-print-shops-compete/amp/)
- [Impressions: 2025 Year in Review](https://impressionsmagazine.com/news/year-in-review-2025-decorated-apparel-industry-in-the-eyes-of-industry-leaders-2-of-3/167968/)

---

## 8. Competitive Landscape: What Existing Tools Offer

### Feature Comparison: Customer Management

| Feature                        | Printavo                      | ShopVox                 | DecoNetwork     | Ordant  | Sales Ink CRM           |
| ------------------------------ | ----------------------------- | ----------------------- | --------------- | ------- | ----------------------- |
| Basic customer profile         | Yes                           | Yes                     | Yes             | Yes     | Yes                     |
| Multiple contacts per customer | Yes (unlimited sub-customers) | Yes (multiple contacts) | Yes             | Yes     | Limited                 |
| Order history                  | Yes                           | Yes                     | Yes             | Yes     | No (links to shop mgmt) |
| Artwork storage                | Basic                         | Yes                     | Yes             | Limited | No                      |
| Tax exempt tracking            | Yes (TaxJar integration)      | Yes                     | Yes             | Yes     | No                      |
| Custom fields                  | Limited                       | Yes                     | Yes (extensive) | Yes     | No                      |
| Billing/Shipping addresses     | Yes (separate)                | Yes                     | Yes             | Yes     | Limited                 |
| Customer notes                 | Yes                           | Yes                     | Yes             | Yes     | Yes                     |
| Payment terms                  | Basic                         | Yes                     | Yes             | Yes     | No                      |
| Price tiers per customer       | Basic                         | Yes                     | Yes             | Yes     | No                      |
| Customer portal                | Yes (Merch)                   | Yes (eCommerce addon)   | Yes (built-in)  | Basic   | No                      |
| Reorder from history           | Yes                           | Yes                     | Yes             | Yes     | No                      |
| Communication log              | Basic                         | Yes                     | Basic           | Yes     | Yes                     |
| Sales pipeline                 | No                            | Basic                   | No              | Yes     | Yes                     |
| Lead management                | No                            | Basic                   | No              | Yes     | Yes                     |
| Integration with QuickBooks    | Yes                           | Yes                     | No              | Yes     | No                      |

### Key Takeaways

1. **Printavo** is the small shop default. Simple, accessible, but shallow customer features. Users outgrow it.
2. **ShopVox** is more powerful but has a steep learning curve. Users report years of frustration with pricing setup.
3. **DecoNetwork** is the most complete all-in-one but oriented toward shops that want online stores.
4. **Ordant** has the best CRM module but is more enterprise-focused.
5. **Sales Ink CRM** is new (2025), print-specific, but separate from shop management. Requires integration.

**The opportunity for Mokumo**: None of these tools do customer management _well_ for a small shop. They either bolt CRM onto production software (Printavo, ShopVox) or build production around CRM (Ordant). Nobody has built a customer view that gives a small shop owner the "instant clarity" they need.

Sources:

- [FinancesOnline: Printavo vs ShopVox 2025](https://comparisons.financesonline.com/printavo-vs-shopvox)
- [Capterra: Printavo Reviews](https://www.capterra.com/p/154421/Printavo/reviews/)
- [Screen Printing Mag: Sales Ink CRM](https://screenprintingmag.com/sales-ink-unveils-first-crm-built-exclusively-for-print-shops/)
- [DecoNetwork: What Is DecoNetwork](https://www.deconetwork.com/what-is-deconetwork/)
- [Ordant: CRM Module](https://ordant.com/module/print-mis-prospects-crm/)
- [YoPrint: Printavo vs YoPrint](https://www.yoprint.com/printavo-vs-yoprint)

---

## 9. Actionable Insights for Mokumo

### Principle: The Customer Profile Is a Dashboard, Not a Form

The customer profile should answer these questions in 5 seconds:

1. **Who is this customer?** (Company, contact, tag type)
2. **What's our relationship?** (How many orders, how long, how much revenue)
3. **What's active right now?** (Open quotes, in-progress jobs)
4. **What did we do for them before?** (Past orders, artwork used)
5. **What do I need to know?** (Notes, preferences, tax exempt status)

### Recommended Feature Set for Phase 1

#### CORE (Must Build)

1. **Customer List Page** (`/customers`)
   - Searchable, filterable table
   - Columns: Company, Contact, Tag, Last Order, Total Revenue, Status
   - Quick filters: All, New, Repeat, Contract
   - Click row to navigate to detail

2. **Customer Detail Page** (`/customers/[id]`)
   - Header: Company name, primary contact, tag badge, quick stats (lifetime orders, revenue, last order date)
   - **Activity tab**: Timeline of all interactions (quotes, jobs, notes) in reverse chronological order
   - **Quotes tab**: All quotes for this customer (linked from quoting)
   - **Jobs tab**: All jobs for this customer (linked from jobs)
   - **Artwork tab**: All artwork associated with this customer (library view)
   - **Details tab**: Full contact info, addresses, tax status, payment terms, internal notes

3. **Quick Add Customer** (from anywhere)
   - Reuse existing `AddCustomerModal` with expanded fields
   - Minimum: Company name + contact name + email/phone
   - Everything else is optional and can be added later

4. **Customer Notes**
   - Internal-only notes (not visible to customer)
   - Timestamped, attributed to who wrote them
   - Pinned notes for critical info ("ALWAYS charge rush fee" / "Tax exempt - cert on file")

5. **Multiple Contacts per Company**
   - Primary contact (default on new quotes)
   - Additional contacts with roles: Ordering, Art Approver, Billing/AP, Other
   - Each contact: name, email, phone, role

#### PERIPHERAL (Mock Only)

6. **Tax Exempt Certificate Tracking**
   - Status: Exempt / Not Exempt / Expired
   - Certificate file upload area (mock)
   - Expiration date with visual warning

7. **Multiple Shipping Addresses**
   - Named addresses: "HQ", "Warehouse", "Event Venue"
   - Default shipping address for quotes

8. **Customer Statistics**
   - Lifetime revenue
   - Total orders
   - Average order value
   - Last order date
   - Quote-to-order conversion rate

#### DEFER (Phase 2+)

9. Customer portal / self-service
10. Automated follow-up reminders
11. Credit limit management
12. Sales pipeline / lead management
13. Marketing / email campaigns
14. Customer-facing communication log
15. E-commerce / online store per customer

### UX Recommendations

1. **The "Reorder" Button**: On the customer detail page, show past orders with a "Reorder" action that creates a new quote pre-filled with the same line items, artwork, and pricing. This is the single highest-value feature for repeat business.

2. **The "Last Seen" Indicator**: Show how long it's been since the last interaction. If a repeat customer hasn't ordered in 3+ months, surface it. Not as an automated alert (too complex for Phase 1), but as visible data.

3. **Artwork Gallery as First-Class**: The artwork tab should be visually rich — thumbnails, color counts, last used date, linked jobs. This is what makes a print shop CRM different from a generic one.

4. **Notes as Knowledge Base**: Internal notes should be prominent, not buried. "This customer always wants their logo 2 inches higher than standard" saves reprints and builds trust.

5. **Customer-Aware Quoting** (already partially built): When creating a quote, selecting a customer should auto-populate their addresses, tax status, payment terms, and show their artwork library. This is already started with the customer tag behavior.

---

## 10. Gap Analysis: What's Missing in the Current Schema

### Current `customerSchema` (from `lib/schemas/customer.ts`)

```typescript
export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // Contact name
  company: z.string().min(1), // Company name
  email: z.string().email(), // Single email
  phone: z.string(), // Single phone
  address: z.string(), // Single address (string)
  tag: customerTagEnum.default('new'), // new | repeat | contract
})
```

### Recommended Schema Expansion

Fields to add for Customer Management vertical:

| Field                 | Type      | Priority | Notes                                                               |
| --------------------- | --------- | -------- | ------------------------------------------------------------------- |
| `contacts[]`          | Contact[] | High     | Multiple contacts per company (name, email, phone, role, isPrimary) |
| `billingAddress`      | Address   | High     | Structured: street, city, state, zip                                |
| `shippingAddresses[]` | Address[] | High     | Multiple, named ("HQ", "Warehouse")                                 |
| `taxExempt`           | boolean   | High     | Is this customer tax exempt?                                        |
| `taxExemptCertExpiry` | date?     | Medium   | When does cert expire?                                              |
| `paymentTerms`        | enum      | Medium   | "cod", "net-15", "net-30", "net-60"                                 |
| `pricingTier`         | enum?     | Medium   | "standard", "contract", "wholesale"                                 |
| `discountPercentage`  | number?   | Medium   | Default discount for contract customers                             |
| `preferredContact`    | enum      | Low      | "email", "phone", "text"                                            |
| `notes`               | Note[]    | High     | Timestamped internal notes                                          |
| `leadSource`          | string?   | Low      | "referral", "walk-in", "website", "trade-show"                      |
| `createdAt`           | date      | High     | When customer was added                                             |
| `lastOrderDate`       | date?     | Medium   | Computed from linked orders                                         |
| `lifetimeRevenue`     | number?   | Medium   | Computed from linked invoices                                       |
| `poRequired`          | boolean   | Medium   | Does this customer require POs?                                     |

### Address Schema (New)

```ts
addressSchema = {
  label: string       // "HQ", "Warehouse", "Main"
  street: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string     // default "US"
  isDefault: boolean
}
```

### Contact Schema (New)

```ts
contactSchema = {
  id: uuid
  name: string
  email?: string
  phone?: string
  role: "ordering" | "art-approver" | "billing" | "owner" | "other"
  isPrimary: boolean
  notes?: string
}
```

### Note Schema (New)

```ts
noteSchema = {
  id: uuid
  content: string
  createdAt: date
  createdBy: string    // staff name or "system"
  isPinned: boolean
}
```

---

## Summary of Key Findings

1. **Small print shops use their brain as a CRM.** The biggest win is getting critical customer knowledge out of the owner's head and into a shared, searchable system.

2. **The customer profile should be a dashboard, not a data entry form.** Show what matters: active work, past history, artwork library, notes. Don't bury it in tabs and forms.

3. **Reorder friction is the silent revenue killer.** Making it trivially easy to duplicate a past order is potentially the highest-ROI feature in the entire system.

4. **Artwork is the connective tissue.** In a print shop, artwork links customers to jobs, jobs to quotes, and quotes to production. The artwork library per customer is what makes this a _print shop_ CRM, not a generic one.

5. **Multiple contacts per company is table stakes.** Even small shops deal with this. The person who orders is often not the person who approves art, and neither is the person who pays.

6. **Tax exempt tracking is a legal requirement, not a nice-to-have.** Getting this wrong means the shop eats the tax or the customer gets overcharged. It needs to be visible and easy.

7. **Internal notes are the shop's institutional memory.** "This customer is picky about Pantone matching" or "Always add 5% overage to their orders" — this information saves money and builds trust.

8. **Don't build a CRM.** Build a customer view that connects to everything else. The value isn't in lead management or sales pipelines — it's in seeing the complete picture of a customer relationship within the production context.

---

_Research compiled from 30+ sources including T-Shirt Forums, PrintPlanet, Screen Printing Mag, industry software documentation (Printavo, ShopVox, DecoNetwork, Ordant), and competitive analysis of Sales Ink CRM, InkSoft, and YoPrint._
