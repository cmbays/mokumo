# Invoicing Legal, Financial & Compliance Requirements

> **Context**: Pre-build research for Mokumo invoicing vertical
> **Date**: 2026-02-10
> **Branch**: `session/0210-invoicing-research`

---

## Screen Printing Tax Treatment by State

**Key finding**: Screen printing is classified as **fabrication of tangible personal property** in virtually all states. The entire charge (materials + labor + setup + design) is taxable.

| State          | Rate (State)  | Treatment     | Key Rules                                           |
| -------------- | ------------- | ------------- | --------------------------------------------------- |
| **Indiana**    | 7%            | Taxable       | 4Ink's home state. Full fabrication charge taxable. |
| **Kentucky**   | 6%            | Taxable       | Close market (Louisville). Full charge taxable.     |
| California     | 7.25% + local | Fabrication   | Setup/rush fees included in taxable amount          |
| Texas          | 6.25% + local | Fabrication   | Total price including all expenses                  |
| Florida        | 6% + local    | Fully taxable | All charges even when separately stated             |
| New York       | 4% + local    | Fabrication   | Section 1105(c)(2)                                  |
| Ohio           | 5.75% + local | Taxable       | Services to tangible personal property              |
| North Carolina | 4.75% + local | Fully taxable | Creative design included in taxable sales price     |

**Critical**: Separately stating labor does NOT make it exempt in CA, FL, NC, or most states.

**Only common exemptions:**

- Valid resale certificate (customer reselling goods)
- Qualifying tax-exempt nonprofit
- Equipment purchases by the printer (manufacturer's exemption)

---

## Required Invoice Elements (US)

### Required

- Seller's legal business name and DBA
- Seller's business address
- Buyer's name and address
- Unique sequential invoice number
- Invoice date and due date
- Itemized description of goods/services (quantities, unit prices)
- Total amount due
- Sales tax (separately stated)
- Tax identification number (EIN/TIN) for 1099 thresholds

### Recommended

- Purchase order number (if customer provides one)
- Payment methods accepted
- Late payment penalties/interest rates
- Remittance address (if different from business)
- Payment terms

---

## Tax-Exempt Customers

### Resale Certificate Workflow

1. **Collect** — Customer provides state-issued resale certificate before first tax-exempt purchase
2. **Verify** — Confirm permit number is active, not expired, business name matches
3. **Store** — Keep copies (your proof during audit)
4. **Flag** — Mark customer as tax-exempt in system
5. **Monitor** — Track expiry dates, request renewals

### Multi-Jurisdiction Certificates

- **MTC Uniform Certificate**: Valid in ~38 states
- **Streamlined Sales Tax Certificate**: Valid in 24 member states
- Some states require renewal (PA, FL every 5 years; TX is one-time)

---

## Multi-State Tax (Nexus)

Since _South Dakota v. Wayfair_ (2018), every sales-tax state has economic nexus rules:

| Common Threshold | Notes                           |
| ---------------- | ------------------------------- |
| $100,000 revenue | Most common                     |
| 200 transactions | Being eliminated by many states |
| $500,000 revenue | NY, CA, TX                      |

**4Ink relevance**: Mostly IN/KY local market. Economic nexus unlikely unless shipping volume grows significantly. Tax rate per invoice (not hardcoded) provides flexibility.

### Tax Service Integration (Phase 2+)

| Service | Cost       | Best For                          |
| ------- | ---------- | --------------------------------- |
| TaxJar  | $19-$99/mo | Simple, cheaper. Owned by Stripe. |
| Avalara | ~$5,000/yr | Complex multi-state. More robust. |

---

## Record Retention Requirements

| Authority             | Period     | Notes                        |
| --------------------- | ---------- | ---------------------------- |
| IRS (standard)        | 3 years    | Income/expense records       |
| IRS (bad debt)        | 7 years    | Bad debt deductions          |
| IRS (underreported)   | 6 years    | Income underreported by >25% |
| IRS (fraud/no filing) | Indefinite |                              |
| IRS (employment)      | 4 years    |                              |
| Most states           | 3-4 years  | Varies                       |

**Recommendation**: Design for **7-year retention**. Never hard-delete invoice records.

---

## Data Integrity Requirements

### Invoice Immutability

- Once issued, invoices must never be modified or deleted
- Corrections: issue credit memo + new invoice
- Voiding: mark as VOID, keep record
- Draft invoices: can be freely edited before issuance

### Sequential Numbering

- Each invoice must have a unique number
- Numbers must progress chronologically
- Gaps acceptable (voided invoices) but documented
- Voided numbers never reused

### Audit Trail

Every invoice action logged:

- **Who**: User performing the action
- **What**: Action type (created, sent, voided, payment received, etc.)
- **When**: UTC timestamp
- **Details**: Before/after values for changes
- Logs are append-only, never editable

### Data Export Requirements

Support exporting to:

- **PDF**: Individual invoices
- **CSV/Excel**: Bulk export for accountants
- **JSON**: System integrations and data migration

---

## Accounting Integration

### QuickBooks Online (Primary Target)

| Entity         | Direction     | Notes                              |
| -------------- | ------------- | ---------------------------------- |
| Customers      | Bidirectional | Name, email, address, tax-exempt   |
| Items/Products | App → QBO     | Line items, SKUs, descriptions     |
| Invoices       | App → QBO     | Line items, tax, totals, due dates |
| Payments       | App → QBO     | Method, amount, applied to invoice |
| Tax Rates      | QBO → App     | Pull configured rates              |
| Credit Memos   | App → QBO     | Refunds and adjustments            |

**Technical**: OAuth 2.0, SyncToken for updates, 500 queries/min, 500K API calls/month

### QuickBooks Desktop (Secondary)

- Still $2.78B in ecosystem revenue
- Integration via QBXML Web Connector (SOAP-based polling)
- Consider middleware like Conductor (REST API over Web Connector)
- Phase 3 if customer demand warrants

### Common Integration Pitfalls

1. **Duplicate entries** — biggest risk. Use idempotency keys.
2. **Sync timing** — bank feeds vs app syncs create mismatches
3. **Tax rounding** — match QBO's rounding method
4. **Deleted records** — always void, never delete (prevents orphans)
5. **Chart of accounts changes** — validate mappings on each sync
6. **Token expiration** — handle OAuth refresh gracefully

---

## Payment Processing Compliance

### PCI DSS

- 4Ink is Level 4 (<20K e-commerce or <1M total transactions)
- **Best approach**: Never store card numbers. Use tokenized processor (Square).
- With tokenization: SAQ-A (simplest compliance questionnaire)

### ACH Requirements (if offered)

- Written authorization required for all ACH debits
- Customer notified in advance of amounts/dates
- Banking info encrypted at rest and in transit
- Authorization records retained up to 7 years

### Credit Card Surcharges

| State               | Status                                  |
| ------------------- | --------------------------------------- |
| Indiana             | Allowed (up to actual processing cost)  |
| Kentucky            | Allowed                                 |
| California          | **Prohibited**                          |
| Connecticut         | **Prohibited**                          |
| Massachusetts       | **Prohibited**                          |
| Debit/prepaid cards | **Prohibited everywhere** (federal law) |

**Recommendation**: Offer cash discounts instead of surcharges (legal everywhere).

---

## Financial Best Practices

### AR Aging Buckets

| Bucket     | Status             | Action                           |
| ---------- | ------------------ | -------------------------------- |
| Current    | Not yet due        | No action                        |
| 1-30 days  | Slightly past due  | Automated reminder               |
| 31-60 days | Past due           | Follow-up call/email             |
| 61-90 days | Seriously past due | Hold new orders                  |
| 90+ days   | Delinquent         | Final demand, consider write-off |

**Healthy benchmark**: 80-90% of receivables in Current/1-30

### Bad Debt Handling

- Deductible under IRS Section 166
- Must demonstrate reasonable collection efforts
- Document: debt evidence, collection attempts, determination of worthlessness
- Keep records 7 years for bad debt deductions
- System: mark as "written off" with date/reason, never delete

### Late Fees

- Industry standard: 1.5%/month (18% annually) on past-due balances
- 4Ink decision: configurable per customer, auto-calculated, separate line item
- Must be disclosed in payment terms on invoice

### Revenue Recognition (GAAP ASC 606)

- Deposits are NOT revenue when received (liability: deferred revenue)
- Revenue recognized when goods delivered/services rendered
- Small businesses on cash basis have simpler treatment
- Track deposits separately from recognized revenue

---

## Phase 1 vs Phase 2+ Implementation

### Phase 1 (Mock Data / UAT) — Implement Now

- [x] All required invoice fields
- [x] Invoice status lifecycle
- [x] Single invoice with deposits as partial payments
- [x] Tax-exempt customer flag + certificate fields
- [x] AR aging calculations (stats bar)
- [x] Void/credit memo workflow
- [x] Sequential numbering (match QB)
- [x] Audit log entries
- [x] Tax rate fields per invoice
- [x] Payment tracking fields
- [x] Late fee configuration

### Phase 2+ (Production) — Defer

- [ ] Tax service integration (TaxJar)
- [ ] Square payment gateway
- [ ] QuickBooks sync (Online and/or Desktop)
- [ ] PDF generation and email delivery
- [ ] Automated reminder workflows
- [ ] Resale certificate document storage
- [ ] Data export (CSV/PDF/JSON)

---

## Sources

- GoCardless — Invoice Requirements in the USA
- IRS — How Long Should I Keep Records?
- CDTFA — California Regulation 1541 (Printing)
- Texas Comptroller — Manufacturing Exemptions
- Florida Sales Tax Rules 12A-1.027
- NC DOR — Taxable Items
- NY Tax Bulletin TB-ST-740
- ScreenPrinting.com — Tax Exempt Steps
- Avalara — Economic Nexus State Guide, Resale Certificates
- QuickBooks Online API documentation
- Xero Developer — Integration Best Practices
- PCI DSS Compliance Levels — vistainfosec
- LawPay — Credit Card Surcharge Rules by State
- NACHA — ACH Rules Compliance
- Fonoa — Sequential Invoice Numbering
- HubiFi — Immutable Audit Trails
