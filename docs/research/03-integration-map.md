# Price Matrix Integration Map

**Research Date**: 2026-02-10
**Researcher**: integration-mapper agent
**Status**: Complete

---

## Executive Summary

This document maps how the price matrix vertical integrates with other Mokumo verticals. The price matrix is the **pricing engine** that feeds quote generation, honors contract pricing, flows into invoicing, enables margin reporting, and tracks production profitability.

**Key Finding**: Industry leaders (Printavo, YoPrint, InfoFlo, Ordant) treat pricing as a **centralized service** that all other verticals consume. The price matrix is not just a lookup table—it's an active calculation engine with business rules.

---

## Integration Architecture

### Conceptual Model

```
                          ┌─────────────────┐
                          │  Price Matrix   │
                          │   (Engine)      │
                          └────────┬────────┘
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
            ┌──────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
            │  Customer  │  │   Quoting   │  │ Invoicing│
            │  Vertical  │  │  Vertical   │  │ Vertical │
            └──────┬─────┘  └─────┬──────┘  └────┬─────┘
                   │               │               │
                   └───────────────┼───────────────┘
                                   │
                          ┌────────▼────────┐
                          │   Reporting     │
                          │   Vertical      │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Production     │
                          │   Vertical      │
                          └─────────────────┘
```

**Flow Direction**:

- Price Matrix → Customer (contract rates lookup)
- Price Matrix + Customer → Quoting (apply rates, calculate totals)
- Quoting → Invoicing (lock quoted prices, convert to invoice)
- Invoicing + Production → Reporting (margin analysis)

---

## Integration Point #1: Customer Vertical

### Overview

Customer records determine **which pricing rules apply** for a given quote or job. This includes contract pricing (negotiated rates), loyalty discounts (volume history), manual discount authority, and customer tier classification.

### Data Flows

**Customer → Price Matrix** (pricing context):

```typescript
interface CustomerPricingContext {
  customerId: string
  tier: 'standard' | 'contract' | 'vip'
  contractPriceSheetId?: string // If negotiated rates exist
  lifetimeOrderCount: number // For loyalty tiers
  lifetimeRevenue: number // For volume discounts
  discountAuthority: {
    // Manual override rules
    maxPercentage: number // e.g., 15% max discount
    requiresApproval: boolean // If exceeds threshold
  }
}
```

**Price Matrix → Customer** (pricing feedback):

```typescript
interface CustomerPricingHistory {
  customerId: string
  averageMargin: number // Historical margin for this customer
  totalDiscountsGiven: number // Lifetime discount total
  mostRecentQuoteDate: Date
  priceSheetVersion: string // Track which price sheet was used
}
```

### Business Rules Research

Industry practices for customer-specific pricing:

1. **Contract Pricing** ([ICS Inks](https://www.icsinks.com/contract-decorator/), [Threadbird](https://threadbird.com/contract-printing)):
   - Flat-rate print costs: **$0.50/print** is industry standard for contract work
   - Screen setup: **$20/color**
   - Color changes: **$5/screen/color**
   - Artwork fees: **$15** basic, **$60/hour** advanced (30min minimum)
   - Negotiated annually, locked for contract duration

2. **Loyalty Tiers**:
   - Repeat customer recognition
   - Volume-based discount thresholds
   - Multi-year commitment incentives

3. **Manual Discount Authority**:
   - Sales rep can approve up to X% without manager
   - Beyond threshold requires approval workflow
   - Audit trail required for compliance

### Recommended Data Model

```typescript
// New schema: lib/schemas/customer-pricing.ts
const CustomerPriceSheetSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string(),
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  priceSheetType: z.enum(['standard', 'contract', 'volume']),

  // Contract-specific overrides
  flatPrintRate: z.number().optional(), // Per-print cost (e.g., $0.50)
  screenSetupRate: z.number().optional(), // Per-color setup (e.g., $20)
  colorChangeRate: z.number().optional(), // Per-screen color change (e.g., $5)
  artworkFeeBasic: z.number().optional(), // Basic artwork fee
  artworkFeeAdvanced: z.number().optional(), // Hourly rate for advanced artwork

  // Loyalty/volume discounts
  volumeDiscountTiers: z
    .array(
      z.object({
        minQuantity: z.number(),
        discountPercentage: z.number(),
      })
    )
    .optional(),

  notes: z.string().optional(),
  approvedBy: z.string().optional(), // Manager who approved contract
})

const CustomerTierSchema = z.object({
  customerId: z.string(),
  tier: z.enum(['standard', 'silver', 'gold', 'platinum']),
  tierStartDate: z.date(),
  lifetimeOrderCount: z.number(),
  lifetimeRevenue: z.number(),
  averageMargin: z.number(),
})
```

### API Surface

```typescript
// Customer pricing lookup (called by quoting engine)
interface PriceMatrixAPI {
  getCustomerPricing(customerId: string): Promise<CustomerPricingContext>
  applyCustomerDiscounts(customerId: string, basePrice: number): Promise<number>
  validateDiscountAuthority(customerId: string, discountPercent: number): Promise<boolean>
}

// Customer history update (called after invoice completion)
interface CustomerAPI {
  updateLifetimeMetrics(customerId: string, orderValue: number, margin: number): Promise<void>
  recalculateTier(customerId: string): Promise<CustomerTier>
}
```

---

## Integration Point #2: Quoting Vertical

### Overview

The quoting vertical is the **primary consumer** of the price matrix. Auto-calculated quotes pull base pricing, apply customer-specific rules, calculate setup fees, and present margin visibility to the user.

### Data Flows

**Quote Request → Price Matrix**:

```typescript
interface QuotePricingRequest {
  customerId: string
  lineItems: Array<{
    description: string
    quantity: number
    colors: number // Ink colors
    printLocations: number // Front, back, sleeve, etc.
    garmentSKU: string // Links to garment catalog
    garmentQuantity: number // Total pieces
  }>
  setupFees: {
    screenCount: number // Unique screens needed
    artworkComplexity: 'basic' | 'advanced'
  }
  rushOrder: boolean
  customerSuppliedGarments: boolean
}
```

**Price Matrix → Quote**:

```typescript
interface QuotePricingResponse {
  lineItems: Array<{
    lineItemId: string
    unitPrice: number // Per-garment decoration cost
    garmentCost: number // Per-garment base cost (if shop-supplied)
    lineTotal: number
    marginPercent: number // Calculated margin for this line
    priceBreakdown: {
      // Transparency for user
      baseRate: number
      customerDiscount: number
      setupFeeAllocation: number
    }
  }>
  setupFees: {
    screenSetup: number // Total screen setup cost
    artworkFees: number
    rushFee: number
    total: number
  }
  subtotal: number
  tax: number // If applicable
  grandTotal: number
  overallMargin: number // Weighted average margin
  warnings: string[] // e.g., "Margin below 30% threshold"
}
```

### Business Rules Research

Industry practices for quote pricing ([Printavo Guide](https://www.printavo.com/blog/best-screen-printing-pricing-strategy/), [YoPrint Margins](https://www.yoprint.com/blog/profitability-guide-to-markups-and-margins)):

1. **Pricing Formula Components**:
   - **Direct Costs**: Garment cost + ink + labor per piece
   - **Setup Costs**: Screen prep (amortized across quantity)
   - **Markup**: 2-3x material costs typical
   - **Target Margin**: 30-50% standard, 60-70% for complex jobs

2. **Dynamic Pricing** ([InfoFlo](https://infofloprint.com/print-estimating-software/), [PrintPLANR](https://www.printplanr.com/digital-print-estimating-software/)):
   - Pull live garment costs from vendors (SanMar, AlphaBroder, S&S)
   - Predefined markups per product category
   - Quantity breaks (100, 250, 500, 1000+)
   - Location multipliers (1-color front vs. 4-color front+back)

3. **Quote Versioning**:
   - Lock pricing at quote creation date
   - Handle price sheet changes mid-negotiation
   - Quote expiration (typically 30 days)

4. **Margin Visibility**:
   - Show margin % to internal users only
   - Flag low-margin quotes (< 30%) for approval
   - Track contribution margin (Sales - Variable Costs)

### Recommended Data Model

```typescript
// Enhancement to existing lib/schemas/quote.ts
const QuoteLineItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  quantity: z.number(),
  colors: z.number(),
  printLocations: z.number(),
  garmentSKU: z.string(),
  garmentQuantity: z.number(),

  // Pricing breakdown (from price matrix)
  unitDecorationCost: z.number(), // What we charge per piece
  unitGarmentCost: z.number(), // Garment wholesale cost
  unitTotalPrice: z.number(), // Decoration + garment
  lineTotal: z.number(), // Unit total × quantity

  // Costing (internal, not shown to customer)
  directLaborCost: z.number(), // Labor per piece
  inkCost: z.number(), // Ink per piece
  contributionMargin: z.number(), // Line total - variable costs
  marginPercent: z.number(),

  priceMatrixVersion: z.string(), // Audit trail
})

const QuoteSchema = z.object({
  // ... existing fields
  lineItems: z.array(QuoteLineItemSchema),
  setupFees: z.object({
    screenSetup: z.number(),
    artworkFees: z.number(),
    rushFee: z.number(),
    total: z.number(),
  }),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  grandTotal: z.number(),

  // Margin tracking
  overallMargin: z.number(),
  contributionMargin: z.number(),
  requiresApproval: z.boolean(), // If margin below threshold
  approvedBy: z.string().optional(),

  // Version control
  priceSheetUsed: z.string(), // Which price sheet applied
  quoteLockDate: z.date(), // When pricing was locked
  expirationDate: z.date(), // Quote expires after 30 days
})
```

### API Surface

```typescript
interface QuoteAPI {
  calculateQuote(request: QuotePricingRequest): Promise<QuotePricingResponse>
  recalculateQuote(quoteId: string): Promise<QuotePricingResponse> // If price sheet changes
  lockQuotePrice(quoteId: string): Promise<void> // Freeze pricing for customer approval
  applyManualDiscount(quoteId: string, discountPercent: number, reason: string): Promise<void>
}
```

---

## Integration Point #3: Invoicing Vertical

### Overview

Invoicing converts **approved quotes into billable documents**, honoring quoted prices even if the price matrix changes. Handles partial invoicing, progress billing, tax calculation, and discount audit trails.

### Data Flows

**Quote → Invoice** (price lock):

```typescript
interface InvoiceFromQuote {
  quoteId: string
  invoiceDate: Date

  // Price lock: use quoted prices, not current matrix
  honorQuotedPrices: true

  // Partial invoicing (e.g., deposit, then balance)
  billingType: 'full' | 'deposit' | 'progress' | 'final'
  depositPercentage?: number // e.g., 50% upfront

  lineItemsToInvoice: string[] // Subset of quote line items
}
```

**Invoice → Accounting**:

```typescript
interface InvoiceRecord {
  invoiceId: string
  quoteId: string
  customerId: string
  jobId?: string // If converted to job

  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>

  subtotal: number
  taxRate: number
  taxAmount: number
  discounts: Array<{
    type: 'contract' | 'loyalty' | 'manual'
    amount: number
    reason: string
    approvedBy?: string
  }>
  grandTotal: number

  paymentStatus: 'unpaid' | 'partial' | 'paid'
  amountPaid: number
  amountDue: number

  // Audit trail
  pricingLockedAt: Date
  pricingSnapshot: object // Frozen quote pricing
}
```

### Business Rules Research

Industry practices for invoicing ([Printavo Invoicing](https://www.printavo.com/), [YoPrint Workflow](https://www.yoprint.com/)):

1. **Quote-to-Invoice Workflow**:
   - Quote → Proof → Deposit Invoice (50% typical) → Production → Final Invoice → Balance
   - Line item completion tracking
   - Convert estimates to invoices **as each line item completes**

2. **Price Locking**:
   - Honor quoted prices even if garment costs increase
   - Price lock expires with quote (typically 30 days)
   - Renegotiate if production delayed beyond lock period

3. **Invoice Line Items** ([Printavo Guide](https://www.printavo.com/)):
   - Itemize: garment costs, setup fees, color counts, proofs, rush charges
   - Show discounts as separate line (transparency)
   - Tax calculation (automatic in advanced systems)

4. **Progress Billing**:
   - Deposit: 50% upfront typical
   - Progress: invoice as milestones complete (e.g., screens burned)
   - Final: balance due on delivery

5. **Integration with Accounting** ([InfoFlo + QuickBooks](https://infofloprint.com/)):
   - Seamless QuickBooks Online sync
   - Automatic tax calculation
   - Payment tracking and reconciliation

### Recommended Data Model

```typescript
// New schema: lib/schemas/invoice.ts
const InvoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  quoteLineItemId: z.string().optional(), // Link back to original quote line
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),

  // Progress billing
  percentageInvoiced: z.number(), // Track partial billing (0-100%)
  previouslyInvoiced: z.number(), // Amount already billed
  thisInvoiceAmount: z.number(), // Current invoice portion
})

const InvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(), // INV-1001, INV-1002, etc.
  quoteId: z.string().optional(),
  customerId: z.string(),
  jobId: z.string().optional(),

  invoiceDate: z.date(),
  dueDate: z.date(),

  billingType: z.enum(['full', 'deposit', 'progress', 'final']),
  depositPercentage: z.number().optional(),

  lineItems: z.array(InvoiceLineItemSchema),

  subtotal: z.number(),
  discounts: z.array(
    z.object({
      type: z.enum(['contract', 'loyalty', 'manual', 'promotional']),
      amount: z.number(),
      percentage: z.number(),
      reason: z.string(),
      approvedBy: z.string().optional(),
      appliedAt: z.date(),
    })
  ),
  totalDiscounts: z.number(),

  taxRate: z.number(),
  taxAmount: z.number(),
  grandTotal: z.number(),

  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'overdue']),
  amountPaid: z.number(),
  amountDue: z.number(),

  payments: z.array(
    z.object({
      paymentDate: z.date(),
      amount: z.number(),
      method: z.enum(['cash', 'check', 'credit', 'ach', 'online']),
      reference: z.string(),
    })
  ),

  // Pricing audit trail
  pricingSnapshot: z.object({
    priceSheetVersion: z.string(),
    quoteLockDate: z.date(),
    originalQuoteTotal: z.number(),
  }),

  // Accounting integration
  quickbooksId: z.string().optional(),
  syncedAt: z.date().optional(),
})
```

### API Surface

```typescript
interface InvoiceAPI {
  createInvoiceFromQuote(quoteId: string, options: InvoiceFromQuote): Promise<Invoice>
  createProgressInvoice(quoteId: string, milestonePercent: number): Promise<Invoice>
  applyPayment(invoiceId: string, amount: number, method: string): Promise<Invoice>
  syncToQuickBooks(invoiceId: string): Promise<void>
  getInvoicesByCustomer(customerId: string): Promise<Invoice[]>
}
```

---

## Integration Point #4: Reporting Vertical

### Overview

The reporting vertical consumes pricing data to calculate **margins by job, customer, and product type**. Provides pricing trend analysis, discount impact, and revenue forecasting.

### Data Flows

**Price Matrix + Invoices + Production → Reports**:

```typescript
interface MarginReportRequest {
  reportType: 'job' | 'customer' | 'product' | 'time-series'
  dateRange: { start: Date; end: Date }
  filters?: {
    customerId?: string
    productCategory?: string
    minMargin?: number
    maxMargin?: number
  }
}

interface MarginReportResponse {
  summary: {
    totalRevenue: number
    totalCost: number
    totalMargin: number
    averageMarginPercent: number
  }

  byJob: Array<{
    jobId: string
    jobNumber: string
    customer: string
    revenue: number
    cost: number
    margin: number
    marginPercent: number
  }>

  byCustomer: Array<{
    customerId: string
    customerName: string
    jobCount: number
    totalRevenue: number
    averageMargin: number
    lifetimeValue: number
  }>

  byProductType: Array<{
    category: string // e.g., "T-Shirts", "Hoodies", "Hats"
    jobCount: number
    totalRevenue: number
    averageMargin: number
  }>

  trends: Array<{
    period: string // e.g., "2026-02", "2026-W06"
    revenue: number
    margin: number
    jobCount: number
  }>
}
```

### Business Rules Research

Industry practices for margin reporting ([Cnding Guide](https://www.cndinggroup.com/the-ultimate-guide-to-screen-printing-cost-calculation-and-profit-margins/), [Gelato Strategies](https://www.gelato.com/connect/blog/printing-business-profit-margin)):

1. **Target Margins**:
   - **Standard jobs**: 30-50% margin
   - **Complex jobs**: 60-70% margin
   - **Contract/wholesale**: 20-30% margin (higher volume)

2. **Contribution Margin** ([YoPrint Guide](https://www.yoprint.com/blog/profitability-guide-to-markups-and-margins)):
   - Formula: **Total Sales - Variable Costs**
   - Use for pricing decisions and production optimization
   - Monitor per order, per customer, per product type

3. **Cost Tracking Categories**:
   - **Direct Job Costs**: Materials (ink, garments) + labor (hours × rate)
   - **Indirect Overhead**: Rent, utilities, equipment depreciation, admin salaries
   - Allocate overhead proportionally to jobs

4. **KPI Monitoring**:
   - Margin by job (identify unprofitable jobs)
   - Margin by customer (identify unprofitable relationships)
   - Margin by product type (optimize product mix)
   - Bottleneck identification (labor utilization, press time)

5. **Discount Impact Analysis**:
   - Track total discounts given per customer
   - Calculate margin erosion from discounts
   - Identify discount abuse patterns

### Recommended Data Model

```typescript
// New schema: lib/schemas/reporting.ts
const JobCostingSchema = z.object({
  jobId: z.string(),

  // Revenue side (from invoice)
  invoicedAmount: number,
  discountsGiven: number,
  netRevenue: number,

  // Cost side (from production tracking)
  directCosts: z.object({
    garmentCost: z.number(),
    inkCost: z.number(),
    laborCost: z.number(), // Hours × labor rate
    setupCost: z.number(), // Screen prep labor
    total: z.number(),
  }),

  // Overhead allocation (calculated)
  overheadAllocated: z.number(), // Proportional share of fixed costs

  // Margin calculation
  totalCost: z.number(), // Direct + overhead
  grossProfit: z.number(), // Revenue - total cost
  marginPercent: z.number(), // (Profit / Revenue) × 100
  contributionMargin: z.number(), // Revenue - direct costs
})

const CustomerMarginSchema = z.object({
  customerId: z.string(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),

  jobCount: z.number(),
  totalRevenue: z.number(),
  totalCost: z.number(),
  totalMargin: z.number(),
  averageMarginPercent: z.number(),

  totalDiscountsGiven: z.number(),
  discountImpactPercent: z.number(), // Margin erosion from discounts

  lifetimeValue: z.number(),
  lifetimeMargin: z.number(),
})
```

### API Surface

```typescript
interface ReportingAPI {
  getMarginReport(request: MarginReportRequest): Promise<MarginReportResponse>
  getJobCosting(jobId: string): Promise<JobCosting>
  getCustomerMargin(customerId: string, dateRange: DateRange): Promise<CustomerMargin>
  getProductMix(): Promise<ProductMixReport>
  getPricingTrends(dateRange: DateRange): Promise<PricingTrendReport>
  getDiscountImpactAnalysis(): Promise<DiscountImpactReport>
}
```

---

## Integration Point #5: Production Vertical

### Overview

Production tracks **actual costs vs. quoted prices**, enabling profitability visibility per job. Captures labor hours, ink usage, and compares to estimated costs from the quote.

### Data Flows

**Quote → Production** (cost targets):

```typescript
interface ProductionCostTargets {
  jobId: string
  quoteId: string

  // Estimated costs (from quote)
  estimatedLaborHours: number
  estimatedLaborCost: number
  estimatedInkCost: number
  estimatedSetupTime: number

  // Budgeted margin
  targetMarginPercent: number
  targetMarginDollars: number
}
```

**Production → Reporting** (actual costs):

```typescript
interface ProductionActuals {
  jobId: string

  // Actual costs (tracked during production)
  actualLaborHours: number
  actualLaborCost: number
  actualInkUsed: number // Ounces or grams
  actualInkCost: number
  actualSetupTime: number

  // Variance analysis
  laborVariance: number // Actual - estimated
  inkVariance: number
  timeVariance: number

  // Realized margin
  quotedRevenue: number
  actualCost: number
  realizedMargin: number
  realizedMarginPercent: number
}
```

### Business Rules Research

Industry practices for production costing ([Teesom Calculator](https://teesom.com/pricing-your-way-to-profitability/), [Exile Tech Guide](https://exiletech.com/blog/screen-printing-cost-calculator/)):

1. **Labor Tracking**:
   - Time per production stage (design, screen prep, press, finishing)
   - Labor rate per role (press operator, finisher, designer)
   - Overtime multipliers
   - Idle time tracking (equipment downtime)

2. **Material Tracking**:
   - Ink usage per job (actual vs. estimated)
   - Garment spoilage (misprints, defects)
   - Screen reclamation costs
   - Waste disposal

3. **Variance Analysis**:
   - Flag jobs exceeding estimated costs by >10%
   - Identify chronic underestimation patterns
   - Feed variance data back to price matrix for calibration

4. **Real-Time Profitability**:
   - Show estimated vs. actual margin **during production**
   - Alert if job goes negative margin
   - Enable mid-job pricing renegotiation if scope changes

### Recommended Data Model

```typescript
// Enhancement to existing lib/schemas/job.ts
const JobCostingSchema = z.object({
  jobId: z.string(),
  quoteId: z.string(),

  // Estimated costs (from quote)
  estimated: z.object({
    laborHours: z.number(),
    laborCost: z.number(),
    inkCost: z.number(),
    setupTime: z.number(),
    totalCost: z.number(),
  }),

  // Actual costs (tracked during production)
  actual: z.object({
    laborHours: z.number(),
    laborCost: z.number(),
    inkCost: z.number(),
    setupTime: z.number(),
    garmentSpoilage: z.number(), // Value of wasted garments
    totalCost: z.number(),
  }),

  // Variance
  variance: z.object({
    laborHours: z.number(),
    laborCost: z.number(),
    inkCost: z.number(),
    totalCost: z.number(),
    variancePercent: z.number(),
  }),

  // Margin realization
  quotedRevenue: z.number(),
  realizedMargin: z.number(),
  realizedMarginPercent: z.number(),

  // Flags
  exceededEstimate: z.boolean(),
  varianceThresholdBreached: z.boolean(),
})

const ProductionTimeEntrySchema = z.object({
  id: z.string().uuid(),
  jobId: z.string(),
  stage: z.enum(['design', 'screen_prep', 'press', 'finishing']),
  operator: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  durationMinutes: z.number(),
  laborRate: z.number(),
  cost: z.number(),
  notes: z.string().optional(),
})
```

### API Surface

```typescript
interface ProductionAPI {
  getCostTargets(jobId: string): Promise<ProductionCostTargets>
  recordTimeEntry(entry: ProductionTimeEntry): Promise<void>
  recordMaterialUsage(
    jobId: string,
    material: string,
    quantity: number,
    cost: number
  ): Promise<void>
  getJobCosting(jobId: string): Promise<JobCosting>
  getVarianceReport(jobId: string): Promise<VarianceReport>
}
```

---

## Data Model Relationships

### Entity Relationship Diagram (Textual)

```
Customer
  ├─ hasMany: CustomerPriceSheets (contract pricing)
  ├─ hasOne: CustomerTier (loyalty tier)
  ├─ hasMany: Quotes
  ├─ hasMany: Jobs
  └─ hasMany: Invoices

PriceMatrix (Engine)
  ├─ hasMany: PriceSheets (versioned price sheets)
  ├─ hasMany: PricingRules (conditional logic)
  └─ hasMany: ProductPricing (base rates per product category)

Quote
  ├─ belongsTo: Customer
  ├─ belongsTo: PriceSheet (which price sheet was used)
  ├─ hasMany: QuoteLineItems
  ├─ hasOne: Job (if converted)
  └─ hasMany: Invoices (if invoiced)

Job
  ├─ belongsTo: Customer
  ├─ belongsTo: Quote (original quote)
  ├─ hasOne: JobCosting (cost tracking)
  ├─ hasMany: ProductionTimeEntries
  └─ hasMany: Invoices

Invoice
  ├─ belongsTo: Customer
  ├─ belongsTo: Quote (pricing source)
  ├─ belongsTo: Job (if job exists)
  ├─ hasMany: InvoiceLineItems
  ├─ hasMany: Payments
  └─ hasOne: PricingSnapshot (frozen pricing)
```

### Key Relationships

1. **Customer ↔ PriceMatrix**:
   - Customer.tier → determines which PricingRules apply
   - Customer.contractPriceSheetId → overrides standard pricing

2. **PriceMatrix → Quote**:
   - Quote.priceSheetUsed → audit trail for pricing version
   - Quote.lineItems[].priceMatrixVersion → granular tracking

3. **Quote → Invoice**:
   - Invoice.pricingSnapshot → frozen Quote pricing (price lock)
   - Invoice.quoteId → link back to original quote

4. **Quote → Job → Production**:
   - Job.quoteId → cost targets from quote
   - Job.costing → actual costs during production
   - Job.costing.variance → feeds back to price matrix calibration

5. **Invoice + Job → Reporting**:
   - Report.revenue (from Invoice)
   - Report.cost (from Job.costing)
   - Report.margin (calculated)

---

## Implementation Phases

### Phase 1: Core Price Matrix (Foundation)

**Scope**: Build the price matrix engine with basic pricing rules.

**Deliverables**:

- Price matrix schema (base rates, quantity breaks)
- Pricing calculation engine
- Quote integration (auto-calculate quotes)
- Mock data for price sheets

**Success Criteria**:

- Quote form pulls pricing from matrix
- Quantity breaks apply correctly
- Margin calculation works
- Price matrix is editable (admin UI)

---

### Phase 2: Customer Pricing (Contract & Loyalty)

**Scope**: Add customer-specific pricing overrides.

**Deliverables**:

- Customer price sheets (contract pricing)
- Customer tier system (loyalty)
- Manual discount controls
- Discount approval workflow

**Success Criteria**:

- Contract customers see negotiated rates
- Loyalty discounts apply automatically
- Manual discounts require approval if exceeding threshold
- Audit trail for all pricing overrides

---

### Phase 3: Invoicing Integration (Quote → Invoice)

**Scope**: Convert approved quotes to invoices with price locking.

**Deliverables**:

- Invoice vertical (new)
- Quote-to-invoice conversion
- Price locking mechanism
- Progress billing support
- Tax calculation
- Payment tracking

**Success Criteria**:

- Approved quotes convert to invoices
- Invoice honors quoted prices (even if matrix changes)
- Deposit invoicing works (e.g., 50% upfront)
- Tax calculates correctly
- Payment status tracked

---

### Phase 4: Production Costing (Actual vs. Estimated)

**Scope**: Track actual costs during production, compare to quote estimates.

**Deliverables**:

- Production time entry system
- Material usage tracking
- Job costing schema (estimated vs. actual)
- Variance reporting
- Real-time profitability view

**Success Criteria**:

- Operators log time per job
- Actual costs accumulate during production
- Variance report shows estimated vs. actual
- Jobs exceeding estimates flagged

---

### Phase 5: Reporting & Analytics (Margin Analysis)

**Scope**: Comprehensive margin reporting across jobs, customers, products.

**Deliverables**:

- Reporting vertical (new)
- Margin reports (job, customer, product, time-series)
- Pricing trends
- Discount impact analysis
- Revenue forecasting

**Success Criteria**:

- View margin by job
- View margin by customer
- View margin by product type
- Identify unprofitable jobs/customers
- Export reports to CSV/PDF

---

### Phase 6: Advanced Features (ERP Integration)

**Scope**: External integrations and advanced pricing logic.

**Deliverables**:

- QuickBooks integration (invoice sync)
- Vendor integrations (SanMar, AlphaBroder live pricing)
- Rebate management (volume discounts)
- Multi-year contract management
- Advanced pricing rules engine (conditional logic)

**Success Criteria**:

- Invoices sync to QuickBooks automatically
- Garment costs pulled from vendor APIs
- Rebates calculated and applied
- Price matrix supports complex rules (e.g., "if customer tier = gold AND quantity > 500, apply 15% discount")

---

## API Surface Summary

### Price Matrix Service

```typescript
interface PriceMatrixService {
  // Pricing calculation
  calculatePrice(request: PricingRequest): Promise<PricingResponse>

  // Customer pricing
  getCustomerPricing(customerId: string): Promise<CustomerPricingContext>
  applyCustomerDiscounts(customerId: string, basePrice: number): Promise<number>

  // Price sheet management
  getPriceSheet(version: string): Promise<PriceSheet>
  createPriceSheet(priceSheet: PriceSheet): Promise<PriceSheet>
  updatePriceSheet(version: string, updates: Partial<PriceSheet>): Promise<PriceSheet>

  // Validation
  validateDiscountAuthority(customerId: string, discountPercent: number): Promise<boolean>
}
```

### Quote Service

```typescript
interface QuoteService {
  calculateQuote(request: QuotePricingRequest): Promise<QuotePricingResponse>
  createQuote(quote: Quote): Promise<Quote>
  lockQuotePrice(quoteId: string): Promise<void>
  convertToInvoice(quoteId: string): Promise<Invoice>
}
```

### Invoice Service

```typescript
interface InvoiceService {
  createInvoiceFromQuote(quoteId: string, options: InvoiceFromQuote): Promise<Invoice>
  applyPayment(invoiceId: string, payment: Payment): Promise<Invoice>
  syncToQuickBooks(invoiceId: string): Promise<void>
}
```

### Reporting Service

```typescript
interface ReportingService {
  getMarginReport(request: MarginReportRequest): Promise<MarginReportResponse>
  getJobCosting(jobId: string): Promise<JobCosting>
  getCustomerMargin(customerId: string): Promise<CustomerMargin>
  getPricingTrends(dateRange: DateRange): Promise<PricingTrendReport>
}
```

### Production Service

```typescript
interface ProductionService {
  recordTimeEntry(entry: ProductionTimeEntry): Promise<void>
  recordMaterialUsage(jobId: string, material: Material): Promise<void>
  getJobCosting(jobId: string): Promise<JobCosting>
  getVarianceReport(jobId: string): Promise<VarianceReport>
}
```

---

## Key Insights from Competitive Research

### Industry Leaders

1. **[Printavo](https://www.printavo.com/)**: Unified quote → job → invoice workflow with inline pricing
2. **[YoPrint](https://www.yoprint.com/)**: Advanced pricing engine with vendor cost integration
3. **[InfoFlo Print](https://infofloprint.com/)**: Dynamic pricing matrix with QuickBooks sync
4. **[Ordant](https://ordant.com/)**: End-to-end workflow with detailed cost tracking
5. **[DecoNetwork](https://www.deconetwork.com/)**: Automated quotes with margin visibility

### Common Patterns

1. **Pricing as a Service**: Price matrix is a centralized calculation engine, not just a lookup table
2. **Price Locking**: Quotes lock pricing at creation, invoices honor locked prices
3. **Margin Visibility**: Internal users see margins in real-time during quoting
4. **Vendor Integration**: Pull live garment costs from SanMar, AlphaBroder, S&S
5. **Approval Workflows**: Low-margin quotes and high discounts require manager approval
6. **Variance Tracking**: Production actuals compared to quote estimates
7. **Customer-Specific Pricing**: Contract rates, loyalty tiers, manual discounts with audit trails

---

## Recommendations

### P0 (Critical for MVP)

1. **Build Price Matrix as a Service**: Separate calculation engine, not embedded in quote form
2. **Quote-Price Matrix Integration**: Quote form calls price matrix API for all calculations
3. **Margin Visibility**: Show margin % to shop owner during quoting
4. **Price Locking**: Lock pricing when quote is approved, honor in invoice

### P1 (High Priority)

5. **Customer Pricing Overrides**: Contract price sheets, loyalty tiers
6. **Invoice Vertical**: Convert quotes to invoices with price locking
7. **Basic Cost Tracking**: Estimated vs. actual cost comparison
8. **Discount Approval Workflow**: Flag low-margin quotes for review

### P2 (Future Enhancements)

9. **Vendor API Integration**: Pull live garment costs (SanMar, AlphaBroder)
10. **QuickBooks Sync**: Two-way invoice sync
11. **Advanced Reporting**: Margin by job, customer, product type
12. **Rebate Management**: Volume discount programs

---

## Sources

### Industry Software

- [Printavo - Screen Printing Pricing Matrix](https://www.printavo.com/blog/how-to-make-a-screen-printing-pricing-matrix)
- [YoPrint - Screen Printing Business Software](https://www.yoprint.com/screen-printing-business-software)
- [InfoFlo Print - Print Estimating Software](https://infofloprint.com/print-estimating-software/)
- [Ordant - Screen Print Estimating](https://ordant.com/screen-print-estimating/)
- [DecoNetwork - Print Shop Management Software](https://www.deconetwork.com/)

### Contract Pricing

- [ICS Inks - Contract Pricing Guidelines](https://www.icsinks.com/contract-decorator/)
- [Threadbird - Contract Screen Printing Pricing](https://threadbird.com/contract-printing)
- [Printavo - Screen Printing Pricing Guide](https://www.printavo.com/blog/screen-printing-pricing/)

### Invoicing Workflows

- [Printavo - Print Management Software](https://www.printavo.com/)
- [YoPrint - Cloud Print Shop Management](https://www.yoprint.com/)
- [InfoFlo Print - Print Shop Management](https://infofloprint.com/)

### Margin & Profitability

- [Cnding - Screen Printing Cost Calculation Guide](https://www.cndinggroup.com/the-ultimate-guide-to-screen-printing-cost-calculation-and-profit-margins/)
- [Gelato - Printing Business Profit Margin Strategies](https://www.gelato.com/connect/blog/printing-business-profit-margin)
- [YoPrint - Profitability Guide to Markups and Margins](https://www.yoprint.com/blog/profitability-guide-to-markups-and-margins)
- [Printavo - Best Screen Printing Pricing Strategy](https://www.printavo.com/blog/best-screen-printing-pricing-strategy/)

### ERP Integration

- [GetApp - Best Print Estimating Software 2026](https://www.getapp.com/industries-software/print-estimating/)
- [MRP Easy - Manufacturing ERP Systems](https://www.mrpeasy.com/blog/manufacturing-erp-systems/)

---

**End of Integration Map**
