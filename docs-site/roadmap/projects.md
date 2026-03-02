---
title: Projects
description: Detailed breakdown of each Phase 2 project with milestones, research needs, and key decisions.
---

# Phase 2 Projects

> Living document. Each project section is expanded as work begins.
> See [Phase 2 Roadmap](/roadmap/phase-2) for the dependency graph and delivery strategy.

---

## P1: Infrastructure & Horizontal

**Status**: Active | **Priority**: Foundation | **Blocks**: Everything

The shared foundation that all verticals build on.

### Milestones

| Milestone           | Status      | Key Deliverables                                                         |
| ------------------- | ----------- | ------------------------------------------------------------------------ |
| M0: Research        | Done        | Auth patterns, deployment model, caching strategy                        |
| M1: Database & Auth | Done        | Supabase setup, Drizzle ORM, auth middleware, session management         |
| M2: API Patterns    | Done        | Server actions, route handlers, DAL/repository pattern, supplier adapter |
| M3: Caching & Jobs  | In Progress | Redis caching, background job strategy, cron alternatives                |
| M4: File Storage    | Planned     | Artwork/image upload pipeline, CDN, transformations                      |

### Research Needs

- [ ] Cron alternatives for Vercel (QStash, pg_cron, external service) — need 15-min inventory refresh
- [ ] File storage comparison: Supabase Storage vs. Vercel Blob vs. R2
- [ ] Background job patterns on serverless (Inngest, Trigger.dev, QStash)

### Key Decisions

- **Auth**: Supabase Auth, email/password, `getUser()` always (ADR-004)
- **ORM**: Drizzle with `prepare: false` for PgBouncer transaction mode (ADR-003)
- **Cache**: Upstash Redis, distributed rate limiting
- **Deployment**: Vercel, two-branch model (main → preview, production → live)

---

## P2: Garments Catalog

**Status**: Active | **Priority**: Tier 0 | **Blocks**: P6 (Quoting)

Real garment data from S&S Activewear. Shop curation (favorites, enabled/disabled). Inventory status.

### Milestones

| Milestone               | Status      | Key Deliverables                                                     |
| ----------------------- | ----------- | -------------------------------------------------------------------- |
| M0: Research            | Done        | S&S API research, multi-supplier architecture, color family taxonomy |
| M1: Schema & Sync       | Done        | catalog_styles, catalog_colors, catalog_images tables, sync pipeline |
| M2: Color System        | Done        | Color families, color groups, 3-tier taxonomy, filter grid           |
| M3: Inventory & Pricing | In Progress | Size availability badges, pricing tiers, batched products API        |
| M4: Polish              | Planned     | Performance optimization, image loading, mobile catalog UX           |

### Key Decisions

- **Composite PK**: `(source, external_id)` for multi-supplier readiness
- **Color taxonomy**: 3-tier (colorFamilyName → colorGroupName → colorName) from S&S API
- **Shop curation**: `is_enabled` + `is_favorite` at style, brand, and color-group levels

---

## P3: Customer Management

**Status**: Active | **Priority**: Tier 0 | **Blocks**: P5 (Artwork), P6 (Quoting)

Full CRM for print shop customers. Contacts, companies, addresses, groups, activity timeline, preferences. Every competitor has basic customer management — none does it well. This is an easy win.

### User Story

> Gary opens Screen Print Pro to look up Riverside High School. He sees the company page with three contacts: Coach Johnson (athletics), Ms. Rivera (PTA), and the school office. Coach Johnson's page shows his order history, pending quotes, and a timeline of every interaction — calls, emails, approvals, payments. Gary notices Coach Johnson prefers Gildan 5000 in Cardinal Red (a saved preference from previous orders). When building a new quote, the system pre-fills this garment. Under the company page, Gary sees aggregate stats: $12,400 lifetime revenue, 8 orders this year, average order value $1,550.

### Milestones

| Milestone            | Status      | Key Deliverables                                                                         |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| M0: Research         | Done        | Competitive analysis, data model research                                                |
| M1: Schema & API     | In Progress | Company/contact hierarchy, addresses, groups/tags, server actions                        |
| M2: Core UI          | In Progress | Customer detail tabs — overview, orders, artwork, contacts (Paper design sessions P1-P8) |
| M3: Activity & Notes | Planned     | Activity timeline (H1), notes feed, linked entities (quotes, jobs, invoices, artwork)    |
| M4: Preferences      | Planned     | Garment/color favorites per customer, preference cascading (company → contact)           |

### Research Findings

- [x] **Correct B2B model** → InkSoft, YoPrint, DecoNetwork all use company/contact hierarchy. Printavo's flat model is the cautionary tale — shops outgrow it.
- [x] **Nobody has a real activity timeline** → This is our differentiator. Powered by H1 (Activity Events system).
- [x] **Nobody has preference cascading** → Garment/color favorites at company → contact level. Unique capability.
- [x] **Tags for segmentation** → InkSoft does this. Essential for filtering (wholesale vs. retail, schools vs. corporate).

### Open Questions

- **Issue #700**: Contact vs. company data model — how do balance levels, credit terms, and tax exemptions cascade? Company-level with contact overrides?
- Customer portal implications for the data model (P14 auth model needs customer entity)
- Customer import format — CSV? How do shops currently store customer data?

> See [Customer & Portal Research](/research/customer-portal) for competitive CRM analysis and our opportunity table.

---

## P4: Pricing Matrix

**Status**: Planned | **Priority**: Tier 1 | **Blocks**: P6, P7, P8 (All quoting)

Configurable pricing per service type. Quantity breaks, setup fees, margin indicators. The shop owner can define pricing templates that auto-calculate when building quotes, see their margins in real time, and maintain different pricing strategies per service type.

### User Story

> Gary gets a call: "How much for 50 tees, 3-color front print?" Today he grabs a calculator, looks up garment cost, adds his markup, and emails back. With the pricing matrix, he selects "Standard Screen Print," enters the quantity and color count, and the system returns a per-piece price with margin displayed. Setup fees auto-calculate. If this is a school order, he switches to "Wholesale Screen Print" matrix — different breaks, lower margins, higher volume.

### Milestones

| Milestone        | Status         | Key Deliverables                                                                       |
| ---------------- | -------------- | -------------------------------------------------------------------------------------- |
| M0: Research     | Partially Done | Industry pricing patterns, competitor pricing UX, supplier pricing data                |
| M1: Schema & API | Planned        | Pricing template tables, service-type variants, calculation engine (`big.js` pipeline) |
| M2: Editor UI    | Planned        | Matrix editor (quantity × colors grid), margin indicators, setup fee config, preview   |
| M3: Integration  | Planned        | Wire pricing into quote builder, auto-calculation on quantity/color changes            |

### Research Findings

- [x] **Competitor pricing UX** → Printavo: unlimited matrices, quantity × color count, manual setup fees. YoPrint: presets + per-decoration-type matrices + flat matrix option. InkSoft: explicit `blank + print + setup = price` decomposition.
- [x] **Industry standard** → Every competitor uses quantity × colors matrix. Setup fee per screen/color ($15-$35). Size upcharges (XXL+ = $2-$4). Rush markup (1.5x-2x).
- [x] **Multi-service-type pricing shapes** → Screen Print: quantity × color count. DTF: transfer size × quantity. DTF Press: flat rate × quantity. Each axis is different but the configuration UX should be shared.

### Research Still Needed

- [ ] S&S pricing tiers — how to normalize `{min_qty, max_qty, unit_price}` across suppliers
- [ ] Industry standard markup patterns — cost-plus vs. tiered vs. flat fee? Typical margin targets?
- [ ] Rush pricing patterns — multiplier-based (1.5x) vs. flat surcharge ($50)? Per-order or per-location?

### Key Decisions

- **Setup fees as first-class citizens**: No competitor treats setup fees well. Ours auto-calculate based on color count × print locations, display transparently on the quote, allow per-location overrides, and include in margin calculations. This is a differentiator.
- **Three-component decomposition**: `Blank Cost + Print Price + Setup Fee = Finished Price`. This is how shops actually think. InkSoft does this but with poor UX. We make it the core mental model.
- **Service-type polymorphism**: One pricing matrix UI, different "shapes" per service type. The matrix for screen print has a color count axis; the matrix for DTF has a transfer size axis. ADR-006 drives this.
- **Financial precision**: All pricing calculations use `big.js` via `money.ts` helpers. No floating-point arithmetic on money. 100% test coverage on the calculation engine.

> See [Quoting & Pricing Research](/research/quoting-pricing) for competitor analysis and industry patterns.

---

## P5: Artwork Library

**Status**: Research Complete | **Priority**: Tier 1 | **Blocks**: P6 (quote integration, M4), P8 (production gate)

Customer-associated artwork storage with metadata, approval workflows, and automated mockup generation. Artwork is stored per-customer and reusable across quotes. The bridge between customer management and quoting — when Gary builds a quote, he picks from the customer's existing artwork and the system auto-derives color count for pricing.

> **Epic**: #717 | **Pipeline**: `20260301-artwork-vertical` | **Research**: Complete 2026-03-01
> See [Artwork Management Research](/research/artwork-management) for full competitive analysis, domain model, and technical architecture.

### User Story

> Riverside High orders from Gary 4-5 times a year — always the same school logo in different configurations. Today Gary digs through email attachments and Dropbox to find the right file. With the Artwork Library, he opens Coach Johnson's customer page and sees all their artwork: the school crest (4-color), the athletics wordmark (2-color), and last year's 5K run design (3-color). Each has metadata: color count, dimensions, print-ready status, and version history. When building a new quote, Gary selects the school crest for the front — the system auto-fills "4 colors" in the print location and pulls the correct pricing. For the approval workflow, Gary uploads a new back design, and Coach Johnson can approve the front artwork while requesting changes to the back — all from the customer portal.

### Domain Model

```
Customer
  └── Artwork (logical concept — "River City Brewing Logo")
        ├── Design Variant A ("White on Dark" treatment)
        │     ├── Version 1 (original upload)
        │     ├── Version 2 (fixed spelling error)
        │     └── Version 3 (approved — immutable snapshot)
        ├── Design Variant B ("Dark on Light" treatment)
        └── Separation (per-variant, post-approval)
              ├── Channel 1: White Underbase (PMS White, 230 mesh, 45 LPI)
              └── Channel 2: Red (PMS 186C, 160 mesh, spot)
```

**Version** (temporal, sequential): Same design intent, revised. v1→v2 fixes a spelling error. Only the latest approved version goes to production.
**Variant** (parallel, simultaneous): Same base design, different color treatments for different garment colors. Multiple variants may be active and go to production in the same order.

### Milestones

| Milestone | Issue | Status | Key Deliverables | Depends On |
|-----------|-------|--------|-----------------|------------|
| M0: Research | — | ✅ Complete | Domain model, competitive analysis, architecture decisions | — |
| M1: Storage & Schema | #718 | Blocked by H2 | File upload pipeline, artwork/variant/version tables, Supabase Storage bucket, presigned uploads, Sharp rendition pipeline | H2 |
| M2: Library UI | #719 | Planned | Browse/search/tag/favorite artwork per customer, Artwork tab on customer detail, upload with file validation | M1, P3 |
| M3: Color Detection | #720 | Planned | Auto-detect color count + palette (MMCQ), PMS matching, garment-color context, underbase detection | M1 |
| M4: Quote Integration | #722 | Planned | Select artwork in quote builder, auto-derive color count → pricing, live mockup preview | M2, P6 |
| M5: Approval Workflow | #721 | Planned | Per-artwork approval with unique URL, automated reminders (T+24h/48h/72h/5-7d), version tracking, immutable proof snapshots | M2 |
| M6: Separation Metadata | #723 | Planned | Per-channel specs (ink, mesh, LPI, print order), ScreenRequirement[] handoff to Screen Room vertical | M5 |
| M7: Mockup Enhancement | #724 | Planned | SVG feDisplacementMap (fabric contours), dark garment two-layer composite, frozen mockup pipeline (Sharp server-side) | M4 |

**Critical path**: M0 → M1 → M2 → {M3, M4, M5 in parallel} → M6 → M7

**Spikes**: #725 (color detection library evaluation), #726 (Supabase Free tier storage limits)

**Absorbed issues**: #212 → M1 (storage schema), #164 → M7 (mockup), #507 → M7 (mockup)

### 8 Competitive Differentiators

No competitor has all of these. Research found gaps across every major platform (Printavo, InkSoft, DecoNetwork, YoPrint, GraphicsFlow):

1. **Customer Art Library** — Cross-order vault per customer. Nobody else has this — even DecoNetwork's "past artwork" is order-scoped, not customer-scoped.
2. **File Validation** — DPI check, vector vs raster detection, color mode, print-readiness badge. Table-stakes in packaging software, absent in every decorated apparel platform.
3. **Art-to-Screen-Room Integration** — Approved artwork generates `ScreenRequirement[]` (ink, mesh, LPI, print order). Connects art complexity to production effort — no competitor does this.
4. **Visual Proof Annotation** — Customers mark up proofs with positioned comments. Exists in packaging software (Ashore), not in decorated apparel shop management.
5. **Art Department Workflow Board** — Dedicated Kanban: Received → In Progress → Separated → Proof Sent → Approved → Print-Ready. Not generic task lists.
6. **Revision History with Visual Diff** — Side-by-side version comparison. YoPrint tracks versions; no competitor shows a visual diff.
7. **Smart Mockup from Catalog** — Leverage existing S&S catalog images + decoration zone metadata.
8. **Color Count → Production Complexity** — Auto-connect detected color count to screen count → setup fees → pricing. No platform closes this loop automatically.

### Key Decisions

- **Domain model**: Artwork → Variant → Version hierarchy. Variants are parallel color treatments. Versions are sequential revisions. Separation metadata is per approved variant.
- **Color detection**: "Suggest and confirm" — auto-detect palette at upload, user confirms/adjusts. ~85-95% accuracy for typical 1-6 spot color artwork. SVG: exact via `get-svg-colors`. Raster: MMCQ + CIEDE2000 merge (ΔE<8) + nearest-pantone.
- **Storage**: Supabase Storage **Free tier** (1GB storage + 2GB egress, $0) for POC/Beta — sufficient for <200 artworks. Scale-up: Cloudflare R2 (~$4.50/mo for 300GB, zero egress). Free tier is sufficient for initial production use; R2 migration needed when storage exceeds 1GB.
- **Mockup rendering**: Hybrid — client-side SVG for interactive preview (quote building, job board), server-side Sharp for frozen snapshots at lifecycle events (quote sent, artwork approved, job created).
- **Approval granularity**: Per-artwork within an order (YoPrint model). Approve front design, reject back design independently.
- **Legal record**: Immutable proof snapshot (not reference to mutable file) + who/what/when/IP/T&C version. Append-only — shop cannot retroactively modify approval records.
- **Separation boundary**: Artwork vertical = system of record for separation metadata. Screen Room vertical = physical screen execution. Don't build separation software — be the system of record.

### Dependencies

- **H2 (File Upload Pipeline)** must be built before M1 — presigned URLs, Sharp pipeline, Supabase Storage bucket
- **P3 (Customer)** must wire before M2 — artwork is per-customer, requires customer detail page
- **P6 (Quoting)** must be in progress before M4 — quote builder must exist to integrate artwork selection
- **New packages** (all MIT, all <200 KB, no native deps): `quantize`, `get-svg-colors`, `ag-psd`, `nearest-pantone`, `color-diff`. `sharp` already in project.

> See [Artwork Management Research](/research/artwork-management) for competitor capability matrix, color detection architecture, storage volume projections, and approval state machine.

---

## P6: Quoting — Screen Print

**Status**: Planned | **Priority**: Tier 1 (Pilot Vertical) | **Blocked By**: P2, P3, P4

The pilot vertical. End-to-end screen print quoting with real garment data, pricing matrix, and customer records. This is the first complete user journey through the system — everything built here establishes patterns for P7, P8, and beyond.

### User Story

> A customer calls Gary: "I need 100 Gildan 5000 tees — 3-color front, 1-color back — for a 5K run next month." Gary opens Screen Print Pro, searches for the customer (or creates a new one), picks Gildan 5000 from the catalog, enters size quantities (S: 10, M: 30, L: 35, XL: 20, XXL: 5), adds two print locations (front: 3 colors, back: 1 color), and the pricing matrix auto-calculates. Gary reviews the margin, adjusts if needed, and sends the quote as a PDF via email — all while the customer is still on the phone. The customer clicks "Approve" in the email. The quote status updates automatically.

### Milestones

| Milestone             | Status  | Key Deliverables                                                                                    |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| M0: Research & Design | Planned | Quote entity model decision (separate vs. unified), quote builder wireframes, status flow design    |
| M1: Schema & API      | Planned | Quote entity, line items, print locations, status transitions, revision history, server actions     |
| M2: Quote Builder     | Planned | Customer select → garment search → size entry → print config → pricing calc → review → save         |
| M3: Lifecycle         | Planned | Draft → sent → accepted/declined, revision tracking, quote board/list view                          |
| M4: Send & Deliver    | Planned | PDF generation (H4), email sending (H3), customer-facing approval page, approval webhook            |
| M5: Presets & Speed   | Planned | Quote presets for common orders ("50 tees, 1-color front"), clone previous quotes, quick-quote flow |

### Research Findings

- [x] **Printavo model** → Quote = invoice at different statuses. Elegant but conflates revision history with payment history. Evaluate during M0.
- [x] **YoPrint model** → Job presets for speed. Multi-process in one quote. Secondary matrix for two-sided jobs. Vendor costs inline.
- [x] **DecoNetwork model** → Product-first flow with auto-mockup. Customer approval link converts to production-ready order.
- [x] **InkSoft model** → `blank + print + setup = price`. Explicit decomposition. Good mental model, poor UX.

### Key Decisions (Pending)

- **Quote entity model**: Separate entity (quote → job → invoice) or unified entity (Printavo-style, one entity with status progression)? ADR-006 currently implies separate entities. Decision in M0.
- **Revision tracking**: When a customer declines and the shop revises, is this a new quote version (v1, v2, v3) or a new quote entity? Version approach preserves history; new entity is simpler.
- **Multi-process support**: Even though this is the Screen Print pilot, the quote builder schema must support adding DTF or DTF Press line items to the same quote. Build the schema flexible, gate the UI.
- **Approval flow**: Customer receives email with PDF attached + link to web approval page. One-click "Approve" button. On approval, status updates and shop gets notified. This requires H3 (Email) and a public-facing approval route.

### Architectural Bets

- **Quote builder as composable steps**: Customer select → garment select → size entry → print config → pricing → review. Each step is a component that can be reused for DTF (P7) and DTF Press (P8). The "print config" step is the only service-type-specific part.
- **Line item + imprint model**: Each line item (a garment) has one or more imprints (print locations). Each imprint has color count, artwork reference, and its own pricing. This is the Printavo model and the industry standard.
- **Price recalculation on change**: Any change to quantity, colors, or garment triggers re-pricing. The calculation pipeline runs in the domain layer (`pricing.service.ts`), not in the UI. This keeps pricing logic testable and service-type-agnostic.

> See [Quoting & Pricing Research](/research/quoting-pricing) for competitor quoting flows, pricing matrix patterns, and lifecycle models.

---

## P7: Quoting — DTF

**Status**: Planned | **Priority**: Tier 2 (Widen) | **Blocked By**: P4, P6

DTF-specific quoting with gang sheet builder, per-transfer pricing, and sheet cost optimization. This is the "Widen" phase — the P6 quote builder adapts to a fundamentally different pricing model. DTF uses CMYK process printing (unlimited colors in one pass), so color count is irrelevant. The pricing axis shifts from quantity × colors to transfer size × quantity.

### User Story

> A customer emails Gary: "I need 50 tees with this full-color photographic design on the front and a small logo on the left chest." With screen print, the photo would be impossible (unlimited colors). With DTF, Gary opens the quote builder, switches to the DTF tab, uploads the front artwork (sized to 11" × 11"), adds the chest logo (3.5" × 3.5"), enters quantity 50, and the system calculates: two designs fit on a 22" × 24" gang sheet with 73% utilization. Total: 2 gang sheets at $18 each = $36 in materials plus $1.75/garment pressing = $123.50 production cost. Gary marks up to $8/piece, sends the quote. The system handled the gang sheet layout, cost optimization, and pricing — all while Gary was on the phone.

### Milestones

| Milestone               | Status  | Key Deliverables                                                                                                       |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| M0: Research & Design   | Planned | DTF pricing model validation, gang sheet UX design, multi-process quote architecture                                   |
| M1: DTF Line Items      | Planned | DTF-specific line item schema (artwork + size + quantity, no garment), size presets, service-type tab in quote builder |
| M2: Gang Sheet Builder  | Planned | Sheet optimization algorithm (shelf-pack/bin-pack), visual layout preview, cost comparison across sheet tiers          |
| M3: Pricing Integration | Planned | Wire DTF sheet tier pricing into quote calculator, margin display, material cost breakdown                             |
| M4: Multi-Process       | Planned | Combined screen print + DTF on same quote (tab-based), shared garment cost allocation                                  |

### Research Findings

- [x] **Color count irrelevant** → DTF is CMYK process — all colors in one pass. A 1-color logo costs the same as a full-color photograph at the same size. No per-color setup fees. This is the fundamental pricing difference from screen print.
- [x] **Industry standard width**: 22" (matching max print width of commercial DTF printers). Sheet sizes: 22"×12" through 22"×240".
- [x] **Per-sheet pricing model**: Price by sheet size at quantity tiers. 22"×24" = $18, 22"×48" = $27, 22"×100" = $57 (4Ink current pricing). Alternative: per-square-foot for wholesale volume.
- [x] **No traditional setup fees**: No screens to burn, no separations. Some shops charge art prep ($10-$25) or minimum order fee ($15-$25).
- [x] **Breakeven vs screen print**: ~838 shirts for 4-color design. Below that, DTF is cheaper. Above that, screen print wins on per-unit cost. For 8+ colors or photographic designs, DTF wins at any quantity.
- [x] **Gang sheet layout software**: CADlink Digital Factory DTF (industry leading), AccuRIP, AcroRIP. Web-based: Antigro Designer. None integrate with quoting tools — this is a gap we fill.
- [x] **Production cost**: ~$0.40/transfer consumables (ink + film + powder). Press labor: $1.65-$2.50/garment. Total production cost: ~$4.35/finished garment.

### Key Decisions

- **Content-first workflow**: User picks artwork, sets size + quantity per design — each combination is a line item. This is inverted from screen print (garment-first). Previous shaping decision (Feb 2026) confirmed this approach.
- **Sheet optimization algorithm**: Optimize for minimum total cost, not minimum waste. May split across 2 smaller sheets if cheaper than 1 large sheet. Existing `dtf.service.ts` has shelf-pack, hex-pack, and MaxRects bin-packing algorithms (560 lines of production code already built).
- **Multi-process tab architecture**: Service-type tabs in the quote builder. Each tab preserves form data independently. Per-tab completion badge. "Add service type" button for mixed orders (screen print front + DTF back).
- **Press labor as separate line item**: Gang sheet cost covers transfer production. Press labor ($1.65-$2.50/garment) is a separate cost — must be modeled explicitly for accurate margin calculation.

### Architectural Bets

- **Existing DTF infrastructure**: `dtf-pricing.ts`, `dtf-line-item.ts`, `dtf-sheet-calculation.ts`, `dtf.service.ts`, `dtf.rules.ts`, `dtf.constants.ts` — substantial domain code already exists. P7 wraps this in the quote builder UI.
- **Quote schema adaptation**: Current `quoteLineItemSchema` is garment-oriented. DTF line items are artwork-oriented (artwork + size + quantity, no garment). The quote needs a polymorphic line item or a parallel `dtfLineItems` array (already exists on the quote entity).

> See [Quoting & Pricing Research](/research/quoting-pricing) for multi-service-type pricing shapes and competitor quoting patterns.

---

## P8: Quoting — DTF Press

**Status**: Planned | **Priority**: Tier 2 (Widen) | **Blocked By**: P4, P6

Simplified quoting for customer-supplied transfers. The customer brings pre-made DTF transfers, and the shop presses them onto garments. This is the simplest service type — no artwork processing, no gang sheets, no color decisions. Just per-garment pressing with intake QC.

### User Story

> A local t-shirt entrepreneur brings Gary a box of 75 DTF transfers they ordered from Ninja Transfers, plus 75 blank tees. Gary opens a quote, switches to the "DTF Press" tab, enters 75 garments × 1 location = $2.00/garment pressing + $0.25/garment intake handling = $168.75. He notes "customer-supplied transfers — no quality guarantee on transfer adhesion" (auto-generated disclaimer). The customer signs off. Gary's press operator does a test press on one shirt, customer approves, and the job proceeds. If a transfer peels because it was under-cured at the transfer house, that's on the customer — the waiver covers it.

### Milestones

| Milestone             | Status  | Key Deliverables                                                                                              |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| M0: Research & Design | Planned | Press-only pricing model, intake/QC workflow, waiver/disclaimer template                                      |
| M1: Schema & Pricing  | Planned | DTF Press service type, per-garment flat-rate pricing, quantity tiers, multi-location pricing                 |
| M2: Intake & QC       | Planned | Transfer quality inspection checklist, test press workflow, customer waiver/sign-off                          |
| M3: Quote Integration | Planned | DTF Press tab in quote builder, auto-disclaimer, garment sourcing toggle (customer-supplied vs. shop-sourced) |

### Research Findings

- [x] **Per-garment pricing**: $2.00-$3.50 per garment (one location). Additional locations: +$1.00-$2.00. Quantity tiers: 1-11 = $2.50, 12-49 = $2.00, 50-99 = $1.85, 100-249 = $1.75, 250+ = $1.65.
- [x] **Quality issues with customer-supplied transfers**: Under-cured powder (peeling), wrong film type for fabric, low print quality, improper storage degradation. Most shops explicitly disclaim responsibility.
- [x] **Standard policies**: No quality guarantee on customer-supplied materials. Customer signs waiver. Test press required before full run. Industry-standard spoilage allowance: 2-5%.
- [x] **Counting/sorting fee**: Some shops charge $0.25-$0.75/garment for counting and sorting customer-supplied garments.

### Key Decisions

- **Simplest service type**: No gang sheets, no color decisions, no artwork processing. Pricing is flat-rate per garment with quantity tiers. The UI should reflect this simplicity — minimal form fields.
- **Waiver/disclaimer**: Auto-generated with the quote. "Shop is not responsible for quality issues arising from customer-supplied transfers or garments." Configurable text in shop settings (P13).
- **Garment sourcing toggle**: Customer supplies garments (press-only) vs. shop sources garments (quote adds garment cost from catalog). This toggle changes the quote structure.
- **Intake QC workflow**: Transfer inspection checklist (cure quality, resolution, sizing, film type). Test press step before full production. This is the only "setup" for DTF Press jobs.

> See [Quoting & Pricing Research](/research/quoting-pricing) for DTF Press pricing axes and multi-service-type configuration.

---

## P9: Jobs & Production

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P6

Quote-to-job conversion, task tracking, production board with real persistence, notes system. Batch production support. Multiple production views (board, calendar, timeline). This is where the shop's daily work lives — the board is the heartbeat of the operation.

### User Story

> It's Monday morning. Gary opens Screen Print Pro to the production board. Five jobs are in the queue — he sees them as cards on a kanban board: 2 in "Art Prep," 1 in "Screen Burn," 2 in "Pressing." He notices the Riverside High job (due Thursday) is still in Art Prep — he drags it to "Screen Burn" after confirming the artwork is final. On the shop floor, his press operator Marcus scans the barcode on a job ticket with his phone — the board updates: "Acme Corp Polos" moves from "Pressing" to "QC." The TV mounted on the wall refreshes to show the updated board. Gary clicks on the Riverside High card and sees the task checklist: Art finalize (done), Film output (done), Screen coat (in progress), Expose, Wash, Register, Press, QC, Pack. The progress bar shows 30% complete. He also notices that two jobs this week share the same 2-color design — the system flagged them as a batch opportunity: burn one set of screens, press both orders in sequence.

### Milestones

| Milestone            | Status  | Key Deliverables                                                                   |
| -------------------- | ------- | ---------------------------------------------------------------------------------- |
| M0: Research         | Planned | Competitor production workflows, batch patterns, scheduling approaches             |
| M1: Schema & API     | Planned | Job entity, task templates per service type, status transitions, server actions    |
| M2: Board & Views    | Planned | Kanban board with persistence, calendar view, job detail with task checklist       |
| M3: Batch Production | Planned | Batch entity linking multiple jobs by design/ink color, shared screen tracking     |
| M4: Shop Floor       | Planned | Barcode scanning (PWA camera + handheld), TV board display mode, print job tickets |
| M5: Timeline View    | Planned | Gantt-style timeline for deadline planning and capacity visibility (if low-lift)   |

### Research Findings

- [x] **Quote → job transition** → Printavo: same entity at different statuses. YoPrint: separate entities with data inheritance. DecoNetwork: quote approval auto-converts. **Our bet**: separate entities (quote → job → invoice) for clean lifecycle tracking.
- [x] **Notification patterns** → Printavo: automations on status change (SMS, email, payment request). YoPrint: real-time push + in-app. **Our approach**: event-driven (H1 Activity Events) — status changes emit events that trigger configurable notifications.
- [x] **Production views** → YoPrint: Gantt + calendar + list (3 views, most flexible). Printavo: calendar + Power Scheduler ($249/mo tier). DecoNetwork: calendar only. **Our approach**: Board first, Calendar second, Timeline as Layer 5.
- [x] **Batch production gap** → DecoNetwork users explicitly complain: "still have to process each individual order." No competitor handles batch production well. This is our opportunity.

### Research Still Needed

- [ ] Task template patterns — canonical vs. custom tasks per service type. Can shops add/remove/reorder tasks per job?
- [ ] Batch production data model — batch entity linking multiple jobs? How to surface batch opportunities (auto-detect same design + ink colors)?
- [ ] Barcode scanning implementation — PWA camera scanning vs. handheld USB/Bluetooth scanner. Both should work.
- [ ] TV board display — read-only route with auto-refresh. Polling (30-60s) vs. event-driven (SSE/Supabase Realtime)?
- [ ] Capacity planning — what does "time per imprint" mean? Per-color, per-location, per-quantity range?

### Design Considerations

- **Batch production**: Data model must support a batch entity linking multiple jobs by shared attributes (design, ink colors, substrate). Batch-level status tracking (all jobs share "pressing" phase) with individual job tracking within the batch. Don't hard-code "one job = one press run."
- **Multiple production views**: Same underlying data, different renderings. Board (kanban) for quick status scanning, Calendar for deadline planning, Timeline (Gantt) for capacity. The data model (jobs with start dates, due dates, statuses, assignments) supports all views from day one.
- **Barcode scanning**: PWA camera scanning (phone points at barcode, browser-based, no app install) + handheld USB/Bluetooth scanner support (types barcode value into focused input field). Both work with a "scan input" field on the board view. YoPrint includes at all tiers ($69/mo) — Printavo gates to Premium ($249/mo). Differentiator if we include early.
- **TV board display**: Full-screen read-only board on shop floor monitor. Large cards, high contrast, no interactive controls. Polling refresh (30-60s) for Phase 2; Supabase Realtime for Phase 3. Scan is the input → board update is the output.
- **Task templates per service type**: ADR-006 drives this. Screen print: 9 steps (Art finalize → Film → Coat → Expose → Wash → Register → Press → QC → Pack). DTF: 6 steps. DTF Press: 4 steps. Tasks are checkboxes within the job; progress bar on board cards shows % complete.

> See [Production & Workflow Research](/research/production-workflow) for competitor production views, batch patterns, barcode scanning approaches, and task template details.

---

## P10: Invoicing

**Status**: Planned | **Priority**: Tier 2 | **Blocked By**: P9

Invoice generation from completed jobs, tax handling, payment recording, reminders, and aging reports. Closes the revenue loop: Quote → Job → Invoice → Payment.

### User Story

> Gary finishes pressing an order. He marks the job as complete on the production board. From the job detail page, he clicks "Create Invoice" — the system generates an invoice pre-populated from the quote (line items, quantities, pricing, customer). Gary reviews, adjusts if needed (add rush fee, apply discount), and sends it to the customer via email with a PDF attached. The customer pays by check; Gary records the payment manually. Later, Gary checks his outstanding invoices — three are overdue. The system shows aging buckets (30/60/90 days) and he sends reminder emails with one click.

### Milestones

| Milestone                | Status  | Key Deliverables                                                                                          |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------------------- |
| M0: Research & Design    | Planned | Invoice entity model (tied to P6 quote entity decision), tax approach, payment flow design                |
| M1: Schema & API         | Planned | Invoice entity, line items, tax calculations, payment records, status transitions, server actions         |
| M2: Invoice Builder      | Planned | Job-to-invoice conversion (pre-populated), line item editing, tax display, totals                         |
| M3: Send & Pay           | Planned | PDF generation (H4), email delivery (H3), payment recording (manual), customer-facing invoice view        |
| M4: Tracking & Reminders | Planned | Invoice list/board, aging buckets (30/60/90), overdue reminders (H5 for scheduled sends), payment history |
| M5: Stripe Integration   | Planned | Online payment via Stripe, payment confirmation webhooks, partial payments                                |

### Research Findings

- [x] **Payment integration** → Printavo forced Payrix (massive backlash, driving churn). YoPrint supports Stripe, Square, PayPal, Authorize.net. DecoNetwork uses DecoPay (Stripe-powered). **Our approach**: manual recording first, Stripe as fast-follow, never lock to one processor.
- [x] **Tax calculation** → InkSoft uses TaxJar. Printavo relies on manual QBO config. DecoNetwork has Avalara. **Phase 2**: simple rate lookup table. Single-state operation doesn't need multi-jurisdiction complexity.
- [x] **Infrastructure decided** → Email via Resend (H3), PDF via @react-pdf/renderer (H4), reminders via QStash (H5). All evaluated and documented.

### Research Still Needed

- [ ] Tax exemption handling for B2B customers (resale certificates) — how do shops track this today?
- [ ] Invoice numbering conventions — sequential, prefix-based, fiscal-year resets?
- [ ] Partial payment patterns — deposits, progress payments, net-30 terms
- [ ] QuickBooks/Xero export — do shops need accounting integration?

### Key Decisions

- **Invoice entity model**: Depends on P6 M0 decision. If quote and invoice are separate entities, invoices link to jobs which link to quotes. If unified (Printavo-style), the entity just changes status. Separate entities are more flexible for revision history and payment tracking.
- **Tax approach (Phase 2)**: Simple rate lookup table. Shop configures a single tax rate (e.g., 8.25% for Texas). Applied to taxable line items. Tax-exempt customers flagged in P3. Evaluate TaxJar for Phase 3 multi-state.
- **Payment strategy**: Manual recording only in M2-M4. Track payments against invoices (amount, date, method, reference). Stripe in M5 adds online collection. **Never proprietary payment processing** — Printavo's Payrix mistake is our opportunity.
- **Invoice PDF design**: Professional, brandable. Shop logo, contact info, line items with descriptions, tax breakdown, payment terms, "Pay Online" button (when Stripe enabled). Doubles as the customer-facing invoice view.

> See [Infrastructure Decisions](/research/infrastructure-decisions) for email, PDF, tax, and payment evaluations.

---

## P11: Dashboard & Analytics

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P9, P10

Real metrics replacing mock data. Production KPIs, revenue tracking, customer insights. Every competitor tracks orders and money — **none tracks production operations**. Press utilization, cost per impression, screen room efficiency, on-time delivery — these are the metrics that actually drive a print shop's profitability, and no one surfaces them.

### User Story

> It's 7:00 AM. Gary opens Screen Print Pro and sees his morning dashboard. The top row shows what matters right now: 2 jobs are blocked (one awaiting artwork approval, one out of Gildan 5000 Medium), 3 jobs ship today (all on track), and yesterday's payroll COGS was 22% (green — below the 25% target). Below that, he sees this week's production: 12 jobs completed, 94% on-time delivery, $8,400 shipped revenue. He clicks into the financial view: outstanding invoices total $4,200, with $1,800 overdue (30+ days). The customer concentration chart shows Riverside High at 28% of monthly revenue — too concentrated. He makes a mental note to pursue new accounts. On the production side, his automatic press ran at 31% utilization this week — he knows the industry average is 20-30%, so that's solid. Setup time averaged 6.2 minutes per screen — down from 8.5 last month after he standardized the registration process.

### Milestones

| Milestone                | Status  | Key Deliverables                                                                            |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------- |
| M0: Research & Design    | Planned | KPI definition, dashboard wireframes, role-based views                                      |
| M1: Morning View         | Planned | Blocked jobs, today's shipments, recent activity — the "7 AM dashboard"                     |
| M2: Financial Metrics    | Planned | Revenue by period, AR aging buckets, quote conversion rate, customer concentration          |
| M3: Production Metrics   | Planned | On-time delivery rate, turnaround time, defect rate, press utilization                      |
| M4: Customer Analytics   | Planned | Customer lifetime value, repeat rate, revenue by customer, health scoring                   |
| M5: dbt Mart Integration | Planned | Wire existing dbt pipeline to dashboard queries, dimensional models for production tracking |

### Research Findings

- [x] **No competitor tracks production operations** → Printavo: financial/sales only (total sales, AR, sales by customer). YoPrint: navigation hub, transactional reports only. DecoNetwork: sales + some production (gated to premium). InkSoft: storefront-focused, no shop-floor metrics. This is a massive differentiation opportunity.
- [x] **Key benchmarks discovered**:
  - Press utilization: 20-30% typical, 40% is good, rarely exceeds 50%
  - Impressions/hour: 150-400 (automatic press, depending on crew size)
  - Setup time per screen: target <5 min, 7-9 min typical
  - Payroll COGS: target <25% ("Rule of 25/75")
  - Defect/spoilage rate: 2-3% industry standard
  - Average order value: $500-$1,000 for small shops
  - Customer concentration: 80/20 Pareto rule strongly validated
- [x] **Morning view priority** → (1) What's blocked, (2) What ships today, (3) What's at risk, (4) Yesterday's performance, (5) Pipeline health. This aligns with our existing UX principles.
- [x] **dbt architecture ready** → Existing medallion pipeline (raw → staging → intermediate → marts) supports this. Need `fct_jobs`, `fct_invoices`, `fct_quotes`, `fct_impressions` fact tables and `metric_daily_production`, `metric_weekly_kpis`, `metric_monthly_financial` aggregate models.

### Key Decisions

- **Role-based dashboards**: Shop owner sees Mission Control + financials. Press operators see daily production board. Screen room sees resource queue. 3-6 dashboards total, not one monolithic view.
- **Morning view as the default**: The dashboard opens to "what needs attention right now" — not historical charts. Blocked items first, then today's shipments, then at-risk items.
- **Production metrics are the differentiator**: Every competitor shows revenue. We show utilization, setup time, defect rates, on-time delivery — the operational metrics that actually improve profitability.
- **dbt-powered aggregations**: Complex metric calculations (turnaround time, on-time rate, customer concentration) run in dbt marts, not in application code. The app reads pre-computed views.

> See [Competitive Analysis](/research/competitive-analysis) for competitor dashboard limitations and our opportunity.

---

## P12: Screen Room

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P9

Real screen tracking linked to production jobs. Burn status, reclaim workflow, inventory management. No competitor has this — it's a unique differentiator and a novel territory.

> **Caution**: The UX must not be burdensome. If tracking screens requires more data entry than it saves in operational clarity, it fails. **Barcode/QR scanning is the key friction reducer** — without it, the system competes with whiteboards and will lose. With it, the system becomes faster than a whiteboard. Validate with the shop owner before investing deeply.

### User Story

> Gary walks into the screen room Monday morning. He glances at the screen room dashboard on the wall-mounted tablet — it shows the "four carts" view: 12 screens Available (clean, ready to coat), 8 Drying (coated last night), 15 Burned (ready for press), 6 On Press (active jobs). He needs to prep screens for tomorrow's jobs — the system says he needs 9 screens total (4 for the Riverside High 4-color front, 3 for the Acme Corp job, 2 for a rush order). He has 8 in the Drying rack — they'll be ready by noon. He grabs a clean screen from the Available rack, scans its QR code with his phone, taps "Coat" — the screen moves to the Drying column. When the dried screens are ready, he loads them in the exposure unit, scans each one, and taps "Link to Job" → selects "Riverside High J-1024, Front, Red." All 4 screens for that job are now tracked. When his press operator loads them on the press, a scan moves them to "On Press." After printing, another scan sends them to "Needs Reclaim." Gary can see from anywhere in the shop: which screens are burned for which jobs, how many clean screens are available, and whether he needs to start reclaiming to keep up with tomorrow's schedule.

### Milestones

| Milestone                 | Status  | Key Deliverables                                                                                   |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| M0: Research & Validation | Planned | Shop owner interview (would they use this daily?), workflow observation, friction assessment       |
| M1: Schema & Status Model | Planned | Expanded screen entity (11-state lifecycle), screen-to-job linking, rack location tracking         |
| M2: Screen Room Dashboard | Planned | Four-cart kanban view (Available/Drying/Burned/On Press), screen cards with job links              |
| M3: QR Scanning           | Planned | Permanent QR labels on frames, phone/tablet scanning for status updates, one-tap transitions       |
| M4: Inventory Health      | Planned | Screen count by status/mesh, inventory health indicator (4-5x daily usage formula), reorder alerts |

### Research Findings

- [x] **Physical workflow mapped**: 10-step preparation (degreasing → coating → drying → exposing → washout → inspection → press registration). 5-step reclaiming (ink removal → decoat → haze removal → degrease → dry). **Drying is the primary bottleneck** (1-12 hours depending on equipment).
- [x] **Current tracking methods**: (1) Memory, (2) Whiteboards, (3) Labels on frames, (4) Spreadsheets, (5) Four-cart physical system. **No software handles this** — not Printavo, not YoPrint, not any competitor.
- [x] **Inventory formula**: Need 4-5x daily screen count in rotation. Small shop using 15 screens/day needs 60-75 in inventory.
- [x] **Screen lifespan**: Aluminum frames last 100-500+ reclaim cycles. Replacement triggers: tension loss (<18 N/cm), mesh damage, permanent hazing.
- [x] **Screen storage for repeat orders**: Shops hold burned screens 1-4 weeks for expected reorders. Some charge storage fees ($15-30/screen). This is a real workflow that needs a "stored" status.
- [x] **Variables per screen**: Mesh count (110-305), mesh color (white/yellow), emulsion type (diazo/photopolymer/dual-cure), tension (N/cm), frame size, exposure time.

### Research Still Needed

- [ ] **Shop owner interview**: Would Gary use this daily? What's his current pain with screen tracking?
- [ ] **Scanning hardware**: Phone camera vs. wall-mounted tablet vs. Bluetooth barcode gun ($50-100). Which has least friction in a wet, inky environment?
- [ ] **Auto-link triggers**: When a job is created, can the system auto-suggest "you need X screens for this job" based on color count per location?

### Key Decisions

- **Expanded status model**: Replace the current 3-state (`pending/burned/reclaimed`) with an 11-state lifecycle: `available → coating → drying → ready_to_burn → burned → on_press → stored → needs_reclaim → reclaiming → needs_remesh → retired`. This models the real physical workflow.
- **Four-cart UX metaphor**: The screen room dashboard mirrors the physical four-cart system shops already use. Four columns (Available, Drying, Burned, On Press), each showing screen cards. Kanban-like but with the physical cart metaphor the screen room operator already understands.
- **QR scanning is mandatory for viability**: Without scanning, this competes with whiteboards and loses. Permanent waterproof QR labels on frames ($0.10/label), one-tap status transitions. The system must be faster than grabbing a marker.
- **Screen-to-job linking**: Multiple screens link to one job. Each screen knows its job, print location, and ink color. When all screens for a job show "burned," the job's "Screens ready" task auto-completes.

> See [Production & Workflow Research](/research/production-workflow) for production view patterns and task template details.

---

## P13: Shop Settings & Integrations

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P1

Business configuration, API credential management (bring-your-own-token), notification preferences, decoration method setup. This is the admin surface — where the shop owner configures everything that isn't part of daily operations.

### User Story

> Gary just signed up for Screen Print Pro. The onboarding wizard walks him through: business name ("4Ink Print"), address, tax rate (8.25% for Texas), and active service types (screen print + DTF, embroidery off). He enters his S&S Activewear API credentials — the system tests the connection and confirms "Connected: 100+ brands available." Under Pricing, he sets his default screen setup fee ($25/screen), minimum order amount ($150), and standard markup (45%). Under Notifications, he enables email alerts for new quote approvals and job status changes. Later, he comes back to add a team member — his press operator Marcus gets the "Press Operator" role (can update job status, can't see financials). Everything Gary configured here flows through the entire system: tax rate appears on quotes and invoices, setup fee auto-calculates in the pricing matrix, supplier credentials enable catalog sync.

### Milestones

| Milestone                   | Status  | Key Deliverables                                                                              |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| M0: Research & Design       | Planned | Settings taxonomy, sidebar navigation structure, hardcoded-values audit                       |
| M1: Shop Profile & Tax      | Planned | Business info, address, logo, tax rate, business hours                                        |
| M2: Service Types & Pricing | Planned | Active decoration methods, default pricing parameters, setup fee config, minimum order amount |
| M3: Supplier Connections    | Planned | S&S credential management, connection testing, sync frequency config                          |
| M4: Notifications           | Planned | Email notification preferences, in-app alert configuration                                    |
| M5: Team & Roles            | Planned | User management, role assignment (owner/manager/operator/screen room), permission scoping     |

### Research Findings

- [x] **Settings page pattern**: Left sidebar with grouped sections is the dominant pattern (Linear, Shopify, GitHub, Notion). Scales to 20+ sections without redesign. Matches our existing app sidebar pattern.
- [x] **Sidebar over tabs**: Tab UX breaks at 5-6+ sections. Settings will grow over time. Sidebar accommodates growth.
- [x] **Auto-save vs. explicit save**: Simple toggles and text fields → auto-save with toast confirmation. API credentials and destructive actions → explicit "Save Changes" button with confirmation dialog.
- [x] **Hardcoded values to extract**: `TAX_RATE = 0.1`, `CONTRACT_DISCOUNT_RATE = 0.07`, `DEPOSIT_DEFAULTS_BY_TIER`, `CANONICAL_TASKS` — all currently hardcoded in domain constants. These become shop-scoped configuration in P13.
- [x] **Competitor comparison**: Printavo: store info, custom statuses, pricing matrices, team/permissions, notification triggers, integrations (Zapier, QBO). Linear: features toggle, members, labels, integrations, API, billing. Both use sidebar navigation.

### Key Decisions

- **Sidebar navigation**: Settings rendered at `/settings/{section-slug}`. Start with 6 sections: Shop Profile, Service Types, Pricing, Tax, Suppliers, Account. Each gets its own page. Sidebar groups: Business, Production, Pricing, Suppliers, Notifications, Account & Team.
- **Configuration drives behavior**: Tax rate flows into invoicing. Setup fees flow into pricing matrix. Active service types gate which quote builder tabs appear. This isn't just a settings page — it's the control plane for the entire system.
- **Onboarding wizard**: First-run experience walks through essential settings (business info, tax rate, service types, supplier credentials). Settings page is the ongoing management surface; the wizard is the initial setup. Same underlying forms, different presentation.
- **Role-based access**: Start simple — owner sees everything, press operator sees production only. Expand to granular permissions in M5. The role system must be designed from M0 even if the UI comes later.

> See [Competitive Analysis](/research/competitive-analysis) for competitor settings patterns and feature comparison.

---

## P14: Customer Portal

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P6, P10

Customer-facing portal for artwork approval, job status viewing, invoice payment, and order history. Brandable with the shop's own domain. This is where the shop's customers interact with the system — it must feel like the shop's own platform, not ours.

### User Story

> Gary's customer, Coach Johnson at Riverside High, needs to approve artwork for their spring sports order. Gary uploads the artwork in Screen Print Pro and sends an approval request. Coach Johnson receives an email: "Your artwork is ready for review." He clicks the link, logs into the portal (branded as `orders.4inkprint.com`), and sees three artwork files: varsity jacket front, t-shirt front, t-shirt back. He approves the jacket and t-shirt front, but rejects the t-shirt back — "The mascot needs to be larger." Gary gets notified, revises the back design, and re-sends just that one file. Coach Johnson approves the revision. Meanwhile, he checks on his other orders — one is in production, another shipped yesterday with a FedEx tracking number. He also pays an outstanding invoice via Stripe.

### Milestones

| Milestone             | Status  | Key Deliverables                                                                                |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| M0: Research & Design | Planned | Auth model decision, portal scope, data exposure rules, invitation flow design                  |
| M1: Auth & Shell      | Planned | Customer role in Supabase Auth, RLS policies, portal layout shell, invitation/onboarding flow   |
| M2: Order Visibility  | Planned | Order history list, job status tracking, shipment tracking display                              |
| M3: Artwork Approval  | Planned | Per-artwork approval flow, revision tracking, approval history, notification triggers           |
| M4: Invoice & Payment | Planned | Invoice viewing, payment recording (manual confirmation), Stripe integration for online payment |
| M5: Communication     | Planned | Order-scoped message threads, file attachments, read receipts                                   |
| M6: Branding & Domain | Planned | Custom domain support (`portal.shopname.com`), white-labeled UI, shop logo/colors               |

### Research Findings

- [x] **Portal models** → Printavo: URL-per-invoice (no login, no history). YoPrint: full portal with persistent login, custom domain, per-artwork approval, payment, tracking. InkSoft: online stores + portal.
- [x] **Best-in-class example** → YoPrint Pro: custom domain, full order history, per-artwork approval, payment collection (Stripe/Square/PayPal), shipment tracking, message history, white-labeled, mobile-optimized.
- [x] **Artwork approval flow** → Per-artwork granularity: approve front, reject back, approve sleeve — independently. Rejected artwork goes back for revision. Mobile-optimized.
- [x] **Auth model recommendation** → Same Supabase Auth instance with `customer` role. RLS policies enforce data isolation. InkSoft and YoPrint both use this model. Simplest and sufficient.

### Research Still Needed

- [ ] **Invitation flow**: Shop sends invite (email with magic link) vs. self-registration? Probably shop-initiated invite for B2B.
- [ ] **Data exposure rules**: What's visible to customers vs. internal-only? (e.g., customers see job status but not internal notes or margin data)
- [ ] **Partial production start**: Can production begin on approved artwork while rejected pieces are being revised? Configurable per shop or per job.
- [ ] **Mobile experience**: Is a responsive web portal sufficient, or do customers expect a native app feel? PWA?

### Key Decisions

- **Auth model**: Same Supabase Auth instance with `customer` role. RLS policies enforce data isolation. One fewer infrastructure component. The customer role gets filtered views of their own data only.
- **Persistent login over URL-per-invoice**: Customers log in once, see full order history. Printavo's URL-per-invoice model fails repeat customers. Persistent login builds the relationship.
- **Per-artwork approval**: Approve/reject individual files within an order. Shop can configure whether production starts on approved locations before all artwork is approved (shop-level or job-level setting).
- **Custom domain (M6)**: Design for it from M0 (domain routing, tenant-scoped rendering), but implement it last. High trust signal — the customer never sees our brand, only the shop's.
- **White-labeled by default**: No "Powered by Screen Print Pro" branding unless the shop opts in. B2B tool — the shop IS the brand.

> See [Customer & Portal Research](/research/customer-portal) for competitive portal analysis, artwork approval patterns, and auth model evaluation.

---

## P15: Supplier Integrations

**Status**: Planned | **Priority**: Tier 3 | **Blocked By**: P2, P13

Deeper S&S integration (order placement, tracking, invoices), SanMar via PromoStandards, and multi-supplier catalog management.

### Milestones

| Milestone               | Status         | Key Deliverables                                                           |
| ----------------------- | -------------- | -------------------------------------------------------------------------- |
| M0: Research            | Partially Done | S&S API surface mapped, SanMar SOAP evaluated, PromoStandards assessed     |
| M1: S&S Order Placement | Planned        | `POST /v2/orders/` integration — order blanks from job detail page         |
| M2: S&S Tracking        | Planned        | Shipment tracking, delivery estimates, order status in job timeline        |
| M3: SanMar Integration  | Planned        | SanMar catalog via PromoStandards SOAP, pricing, inventory                 |
| M4: Multi-Supplier UX   | Planned        | Source-scoped catalog, preferred supplier per shop, GTIN cross-referencing |

### Research Findings (from March 2026 research)

**S&S — Untapped API surface**:

- `POST /v2/orders/` — full wholesale order placement (shipping, multi-warehouse, partial fulfillment)
- `GET /v2/trackingdata/` — shipment tracking for placed orders
- `GET /v2/daysintransit/` — delivery estimates by carrier/ZIP
- `GET /v2/invoices/` — S&S billing history
- `customerPrice` field — shop's negotiated rate (the number that matters for margins)
- `expectedInventory` — restock ETAs for out-of-stock items
- alphabroder merger: 100+ brands now accessible through existing S&S credentials (no code changes)

**SanMar — Integration path**:

- SOAP-first (no native REST). Three options: PSRESTful proxy ($100/year), PromoStandards SOAP directly ($0), SanMar native SOAP ($0)
- **Preferred approach**: PromoStandards SOAP directly — avoids annual fee, covers 500+ suppliers, aligns with industry standard
- Data model structurally identical to S&S (same pricing tiers, per-warehouse inventory)
- Key gap: no `colorFamily` equivalent — GTIN is the only reliable cross-supplier key

**PromoStandards**:

- Industry SOAP/XML standard, 8 services (Product, Inventory, Pricing, Orders, Tracking, Invoices, etc.)
- Both S&S and SanMar support the full suite
- Implementing PromoStandards adapter unlocks many suppliers without per-supplier code
- Our `SSActivewearAdapter` pattern generalizes cleanly to a `PromoStandardsAdapter`

### Design Considerations

- **Order placement as differentiator**: No competitor uses S&S's order API. Ordering blanks directly from the job detail page turns "tracks what you ordered" into "orders for you."
- **PromoStandards without annual fee**: Direct SOAP integration requires a SOAP client library + XML mapping, but avoids the $100/year PSRESTful proxy and gives more control. Worth the implementation effort for long-term multi-supplier strategy.
- **This may become its own vertical** once the pilot loop (P6→P9→P10) proves the core architecture.

> See [Supplier & Catalog Research](/research/supplier-catalog) for the full technical analysis.

---

## P16: Online Stores

**Status**: Future | **Priority**: Phase 3+ | **Blocked By**: P6, P14

Shop-managed storefronts where customers can browse products, customize orders, and purchase — with orders flowing automatically into production.

### Vision

A shop creates a store for a customer (e.g., a school's spirit wear program, a company's uniform store, or a team's merchandise store). The customer manages their store (set products, pricing, open/close dates). Orders placed through the store flow directly into the production pipeline as quotes or jobs.

### Research Findings

- **DecoNetwork**: Up to 500 stores on Premium. Team stores, fundraiser stores, corporate reorder programs. Store orders flow into production calendar automatically.
- **InkSoft**: Online stores with Online Designer (customers customize products). Stores are quick to clone and launch.
- **YoPrint**: No online stores (acknowledged gap).
- **Printavo**: "Merch" feature on Premium ($249/mo) — group/team stores with aggregated orders.

### Scope (Phase 3+)

- Store creation and management for shops
- Product selection from catalog with shop-set pricing
- Customer-facing storefront (responsive, brandable)
- Order aggregation into production pipeline
- Payment collection through store
- Store lifecycle (open/close dates, fundraiser goals)

> This is explicitly out of scope for Phase 2. Captured here for roadmap visibility and to ensure the Phase 2 architecture (particularly P6 quoting and P14 customer portal) doesn't preclude it.

---

## Horizontal Enablers (Layer 2)

These are cross-cutting infrastructure capabilities that must be built before their dependent verticals. They are not standalone projects — they're pulled into existence by vertical needs.

### H1: Activity Event System

**Needed by**: P3 (M3: Activity & Notes), P9 (Jobs), P11 (Dashboard)

Lightweight `activity_events` table with polymorphic entity references. Server actions insert events on entity mutations. Simple time-ordered queries for timeline views.

**Build when**: Before P3 M3 (Activity & Notes tab).

### H2: File Upload Pipeline

**Needed by**: P5 (Artwork Library), P14 (Customer Portal)

Supabase Storage integration with RLS on buckets. Upload API route, CDN delivery, basic image transformations (thumbnail, preview).

**Build when**: Before P5 M1 (Storage & Schema).

### H3: Email Infrastructure

**Needed by**: P6 (M4: quote sending), P10 (invoice reminders), P14 (notifications)

Resend integration with React Email templates. Transactional emails (quote PDF attached, invoice link, status notifications).

**Build when**: Before P6 M4 (Polish — PDF generation + email sending).

### H4: PDF Generation

**Needed by**: P6 (M4: quote PDFs), P10 (invoice PDFs)

`@react-pdf/renderer` for server-side PDF generation. Quote and invoice templates using React components. No headless browser needed.

**Build when**: Before P6 M4 (Polish).

### H5: Background Job Runner

**Needed by**: P2 (sub-daily inventory sync), P10 (invoice reminders), P11 (metric aggregation)

Upstash QStash for HTTP-based scheduled jobs with retries. Replaces Vercel cron's daily-only limitation.

**Build when**: When P2 needs sub-daily inventory refresh (M3/M4).

> See [Infrastructure](/engineering/architecture/infrastructure) for detailed analysis, option evaluations, and cost estimates.

---

## Related Documents

- [Phase 2 Roadmap](/roadmap/phase-2) — dependency graph and strategy
- [Product Design](/product/product-design) — scope and constraints
- [User Journeys](/product/user-journeys) — what we're building toward
- [Infrastructure](/engineering/architecture/infrastructure) — infrastructure gap analysis
