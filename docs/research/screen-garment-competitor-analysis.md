# Competitive Analysis: Screen Room & Garment Catalog

**Verticals**: Screen Room Management | Garment Catalog
**Date**: 2026-02-14
**Research Method**: Marketing sites, feature pages, help docs, Capterra/G2 reviews, industry forums, comparison articles

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Per-Competitor Breakdown](#per-competitor-breakdown)
3. [Comparative Feature Matrix](#comparative-feature-matrix)
4. [Market Gaps](#market-gaps)
5. [Best-in-Class Examples](#best-in-class-examples)
6. [Pricing & Positioning](#pricing--positioning)
7. [Key Takeaways for Mokumo](#key-takeaways)

---

## Executive Summary

**The biggest finding: Nobody does Screen Room management well.** This is the single largest gap across all 9 competitors analyzed. Physical screen tracking (mesh count, burn status, tension, lifecycle management) is almost universally absent from dedicated software. Most shops still use whiteboards, spreadsheets, or physical cart systems in their darkroom. This represents a massive differentiation opportunity for Mokumo.

Garment Catalog is better served — most competitors offer vendor catalog integration (SanMar, S&S Activewear/AlphaBroder, etc.) with real-time pricing and stock. The differentiation opportunity here is in the **browsing experience, size/color matrix UX, and connection to quoting**. Nobody has a truly delightful catalog browser.

---

## Per-Competitor Breakdown

### 1. PrintLife (theprintlife.com)

**Background**: 4Ink's current tool. ~200 shops. Angular SPA. Built by a screen printer with 10+ years of experience who found existing tools inadequate.

**Screen Room / Screen Management**:

- **No dedicated screen management feature**
- No screen tracking (mesh count, burn status, tension)
- No screen-to-job linking
- No screen lifecycle workflow
- No screen inventory dashboard
- Production workflow is basic: step-based project progression with mock approval

**Garment Catalog / Inventory**:

- **SanMar catalog integration** via product API (confirmed in 2024 update)
- Custom products feature: create reusable products, set pricing, manage inventory, upload images, assign sizes
- Impression cost display per print location (added 2024)
- Minimum quantity warnings based on decoration method
- Limited — feels more like a product database than a catalog browser
- No mention of AlphaBroder/S&S integration beyond SanMar

**UI Patterns**:

- Angular SPA with project cards
- Customer portal with qty visibility
- Store feature (undergoing overhaul as of 2024)
- Limited mobile support (no mobile-specific mentions)

**Verdict**: PrintLife is focused on order/invoicing workflow. Screen room and catalog are afterthoughts. This is the tool Mokumo is replacing — the bar is low.

---

### 2. Printavo (printavo.com)

**Background**: Largest player in market. Thousands of shops. Known for simplicity and strong community. Now part of Inktavo ecosystem.

**Screen Room / Screen Management**:

- **No dedicated screen room feature**
- Can store mesh information in the system for reference
- Blog content about mesh counts and exposure calculators (educational, not tooling)
- No screen lifecycle tracking
- No screen-to-job linking
- No screen inventory or utilization metrics

**Garment Catalog / Inventory**:

- Built-in supplier catalogs for pricing/quoting
- Pulls products and prices from suppliers for suggested retail pricing
- Pricing matrix: quantity breaks, imprint locations
- **Missing a "real" receiving system** — can't track what showed up when (per Capterra reviews)
- Stock level monitoring but limited depth
- No advanced garment browsing experience — catalog is a quoting tool, not a browser

**UI Patterns**:

- Clean, simple interface (widely praised)
- Drag-and-drop calendar for scheduling
- Mobile app exists but **chronically buggy** (won't load on updated iPhones per Oct 2024 review)
- No bulk operations mentioned for screen management
- Strong onboarding — new employees pick up quickly

**Weaknesses (from reviews)**:

- No read/write user permissions (painful at 20+ employees)
- No third-party brokerage/outsourced ordering support
- Mobile app unreliable
- Inventory receiving is superficial

**Verdict**: Great at job management and quoting, weak at physical asset tracking and inventory depth. The "biggest player" has notable gaps.

---

### 3. ShopVOX (shopvox.com)

**Background**: Broader custom manufacturing focus (print, sign, apparel shops). Two tiers: Express and Pro.

**Screen Room / Screen Management**:

- **No dedicated screen room feature**
- Visual production boards for job tracking
- No screen lifecycle, mesh tracking, or screen inventory
- Production workflow covers job stages, not screen stages

**Garment Catalog / Inventory**:

- **Strongest vendor catalog integration** among competitors
- Integrated catalogs: SanMar, AlphaBroder, S&S Activewear, TSC Apparel, Carolina Made, Uneek, PenCarrie, AS Colour
- Pull styles, sizes, and costs directly from vendors
- Auto-generates purchase orders from sales orders (cross-order consolidation)
- Low-stock threshold alerts with auto-reorder triggers
- Size/style-based inventory tracking
- Can import custom catalogs for non-integrated vendors
- Compiles purchasing lists of blanks needed across open orders

**UI Patterns**:

- Complex, full-featured interface — steep learning curve
- Production board visualization
- Custom PDF export (limited; $150/doc for custom templates)
- "Clunky" per user reviews, especially Express tier
- Mobile: limited mentions

**Weaknesses (from reviews)**:

- Buggy feature releases (2FA lockouts, sales tax bugs, golden products issues)
- UI navigation difficulties — not intuitive
- Slow performance
- Limited API for custom integrations
- Express vs Pro feature gaps create confusion

**Verdict**: Best vendor catalog integration in the market. But the UI is painful and there's no screen room management. Strong back-end, weak front-end.

---

### 4. Teesom (teesom.com)

**Background**: Screen-print focused. Claims "#1 Screen Printing Software." Free tier available. 80+ features. Built specifically for decorated apparel.

**Screen Room / Screen Management**:

- **No dedicated screen room feature** (despite being screen-print focused!)
- Job board, calendar, and task board for production management
- No screen tracking, lifecycle, or inventory
- No screen-to-job linking

**Garment Catalog / Inventory**:

- **Broadest vendor integration**: AlphaBroder, Augusta Sportswear, Blue Generation, SanMar, S&S Activewear, TSC Apparel (continuously adding more)
- **Live vendor integration** — real-time stock levels and pricing (not just cached catalog data)
- Multi-warehouse inventory control (multiple locations or zones within a building)
- Smart vendor swapping at purchase time — if one vendor is out, swap to another with same item
- Unified inventory codes across vendors (same item from different vendors tracked under one code)
- 3-tier pricing strategy (rush order pricing with date-based tiers)
- Customer self-service portal for order tracking, payments, quote advancement

**UI Patterns**:

- Feature-rich but cluttered interface
- Dashboard with job board, calendar, task board
- Online customer portal
- No specific mobile mentions

**Verdict**: Best live vendor integration in the market. Multi-warehouse and vendor-swapping are standout features. But the irony: called "#1 Screen Printing Software" yet has zero screen room management. Huge branding disconnect.

---

### 5. YoPrint (yoprint.com)

**Background**: Newer entrant with modern UI. Cloud-native. Barcode-driven workflows. Growing quickly.

**Screen Room / Screen Management**:

- **No dedicated screen room feature**
- No screen tracking or lifecycle
- No screen inventory
- Production management via drag-and-drop scheduler with customizable workflows

**Garment Catalog / Inventory**:

- Vendor integration: SanMar, AlphaBroder, S&S Activewear
- **Real-time inventory** across multiple locations
- Stock categories: available, on-hand, incoming, committed
- Reorder column with exact quantities needed
- Barcode scanning for received items
- Stock take functionality for quick adjustments
- Purchase order workflow with status tracking and vendor communication
- Multi-warehouse with stock transfers between locations

**UI Patterns**:

- **Most modern UI** in the market — clean, contemporary design
- Barcode-driven: print barcoded work orders, box labels, packing slips; single scan brings up everything
- Drag-and-drop scheduler with timeline, calendar, and list views
- Smart filters to show only relevant information
- Customer self-service portal

**Verdict**: Best UI/UX in the competitive set. Strong inventory management. Barcode workflow is innovative. But still no screen room management. The modern UI sets the bar for what Mokumo should aspire to.

---

### 6. DecoNetwork (deconetwork.com)

**Background**: E-commerce + production management. Built for garment decorators of all types (screen print, embroidery, DTG, DTF, sublimation). Strong e-commerce/storefront focus.

**Screen Room / Screen Management**:

- **No dedicated screen room feature**
- Production calendar with task assignment to press operators
- Workflow tracking: order progress from approval through completion
- Artwork approval tracking with documented customer approvals
- Low-resolution image flagging before production

**Garment Catalog / Inventory**:

- Supplier catalog integration: SanMar, S&S Activewear, BTC Activewear, Gildan Brands
- Live pricing and stock level updates
- Product search by style, color, and size
- Purchase orders sent directly to suppliers
- Automated reordering
- Real-time inventory tracking
- Pricing engine: screen setup fees, extra color charges, underbase costs, garment minimums, rush markups

**UI Patterns**:

- E-commerce storefront builder (team stores, fundraising, corporate programs, online shops)
- Production calendar view
- Artwork mockup generation
- Customer-facing stores with automated order → production flow
- Most e-commerce-forward of all competitors

**Verdict**: Best for shops that need customer-facing e-commerce. Solid catalog integration. No screen room. The e-commerce focus means production depth is secondary.

---

### 7. Katana MRP (katanamrp.com) — Adjacent

**Background**: General manufacturing ERP. Not screen-print specific. Useful for inventory/asset management patterns.

**Relevant Patterns for Screen Room**:

- **Batch & serial number tracking** — closest analog to individual screen tracking
- Bin location assignment — could map to screen rack positions
- Bill of materials (BOM) — screen = component linked to job
- Shop floor app for real-time task progress
- Barcode-enabled workflows for stock movements
- Multi-location inventory with transfer tracking

**Relevant Patterns for Garment Catalog**:

- Real-time inventory across products, materials, locations
- Reorder point automation based on levels and lead times
- Make-to-order (MTO) and make-to-stock (MTS) workflows
- Contract manufacturing for outsourced production
- Demand forecasting from stock analysis

**UI Patterns**:

- Modern, clean manufacturing dashboard
- Visual production planning
- Real-time shop floor visibility
- Barcode scanning at warehouse stations

**Verdict**: Not a competitor but the best **pattern source** for screen room management. Serial number tracking = screen tracking. Bin locations = screen rack positions. BOM = screen-to-job linking. Katana's asset management patterns are directly applicable.

---

### 8. InkSoft (inksoft.com) — Adjacent

**Background**: E-commerce platform for custom branded merchandise. Part of Inktavo ecosystem (with Printavo). Design-to-print focus.

**Screen Room / Screen Management**:

- **None** — InkSoft is an e-commerce/design platform, not production management

**Garment Catalog / Inventory**:

- **Best catalog browsing experience** for customer-facing stores
- Integrated supplier feeds: SanMar, S&S Activewear (with recommended products filter), AlphaBroder, and others
- Products added from supplier catalogs with auto-populated info (cost, sizing, details, images)
- Product categories for organization and store management
- Custom supplier assignment
- "Enforce From Supplier Inventory" option — shows real-time vendor stock
- Blank, customizable, and pre-decorated product support
- Online design tool with product mockups

**UI Patterns**:

- Store-front focused — best product browsing UX
- Product category organization
- Design customization interface
- Customer-facing product selection

**Verdict**: Best reference for garment catalog UX from a browsing/shopping perspective. The way InkSoft presents products to customers is the closest to a "catalog browser" experience. Not relevant for screen room.

---

### 9. GraphicsFlow (graphicsflow.com) — Adjacent

**Background**: Art management tool for print shops. Formerly Digital Art Solutions. Part of Inktavo ecosystem.

**Screen Room / Screen Management**:

- **None** — art/design tool only

**Garment Catalog / Inventory**:

- **None** — focused on design templates and artwork, not garments

**Relevant Features**:

- 25,000+ vector design templates
- Stock Art Customizer (text editing, clip art swapping, color scheme unification)
- Color separations for screen printing (production-ready output)
- Design creation under 3 minutes
- Monthly fresh design updates

**Verdict**: Not relevant for screen room or garment catalog. Relevant only as art department workflow context — how designs flow from approval to screen burning.

---

## Comparative Feature Matrix

### Screen Room Management

| Feature                      | PrintLife | Printavo | ShopVOX | Teesom | YoPrint | DecoNetwork | Katana  | InkSoft | GraphicsFlow |
| ---------------------------- | --------- | -------- | ------- | ------ | ------- | ----------- | ------- | ------- | ------------ |
| Dedicated screen management  | -         | -        | -       | -      | -       | -           | N/A     | -       | -            |
| Screen tracking (individual) | -         | -        | -       | -      | -       | -           | Serial# | -       | -            |
| Mesh count tracking          | -         | Ref only | -       | -      | -       | -           | Custom  | -       | -            |
| Burn status tracking         | -         | -        | -       | -      | -       | -           | -       | -       | -            |
| Tension readings             | -         | -        | -       | -      | -       | -           | -       | -       | -            |
| Screen-to-job linking        | -         | -        | -       | -      | -       | -           | BOM     | -       | -            |
| Screen lifecycle workflow    | -         | -        | -       | -      | -       | -           | -       | -       | -            |
| Screen inventory dashboard   | -         | -        | -       | -      | -       | -           | Partial | -       | -            |
| Utilization metrics          | -         | -        | -       | -      | -       | -           | -       | -       | -            |
| Bulk operations (reclaim)    | -         | -        | -       | -      | -       | -           | Batch   | -       | -            |

**Legend**: `-` = Not available | `Ref only` = Reference info, not tracking | `Partial` = Related feature exists | `N/A` = Not applicable

**Key Finding**: **ZERO competitors offer dedicated screen room management.** Katana MRP has analogous patterns (serial tracking, BOM, batch ops) but is not screen-print specific.

---

### Garment Catalog / Inventory

| Feature                    | PrintLife | Printavo | ShopVOX     | Teesom     | YoPrint | DecoNetwork      | Katana | InkSoft    | GraphicsFlow |
| -------------------------- | --------- | -------- | ----------- | ---------- | ------- | ---------------- | ------ | ---------- | ------------ |
| Garment catalog browser    | Basic     | Basic    | Yes         | Yes        | Yes     | Yes              | N/A    | Best       | -            |
| Vendor catalog integration | SanMar    | Multiple | Best        | Best       | Good    | Good             | N/A    | Good       | -            |
| SanMar                     | Yes       | Yes      | Yes         | Yes        | Yes     | Yes              | -      | Yes        | -            |
| S&S Activewear             | -         | Yes      | Yes         | Yes        | Yes     | Yes              | -      | Yes        | -            |
| AlphaBroder                | -         | Yes      | Yes         | Yes        | Yes     | -                | -      | Yes        | -            |
| Other vendors              | -         | ?        | 8+          | 6+         | 3       | 4+               | -      | Multiple   | -            |
| Live pricing               | -         | Yes      | Yes         | Yes        | Yes     | Yes              | -      | Yes        | -            |
| Live stock levels          | -         | ?        | Alert-based | Yes (best) | Yes     | Yes              | -      | Optional   | -            |
| Size/color matrix          | Basic     | Basic    | Yes         | Yes        | Yes     | Yes              | -      | Yes        | -            |
| Multi-warehouse            | -         | -        | -           | Yes        | Yes     | -                | Yes    | -          | -            |
| Auto-reorder               | -         | -        | Yes         | -          | Yes     | Yes              | Yes    | -          | -            |
| Vendor swapping            | -         | -        | -           | Yes (best) | -       | -                | -      | -          | -            |
| Purchase orders            | -         | -        | Yes         | Yes        | Yes     | Yes              | Yes    | -          | -            |
| Stock images               | Basic     | Basic    | Yes         | Yes        | Yes     | Yes              | -      | Best       | -            |
| Search/filter              | Basic     | Basic    | Good        | Good       | Good    | Style/Color/Size | -      | Best       | -            |
| Feeds into quoting         | Yes       | Yes      | Yes         | Yes        | Yes     | Yes              | -      | E-commerce | -            |

---

### UI Patterns

| Pattern          | PrintLife | Printavo      | ShopVOX | Teesom    | YoPrint    | DecoNetwork |
| ---------------- | --------- | ------------- | ------- | --------- | ---------- | ----------- |
| Primary layout   | Cards     | List/Calendar | Board   | Dashboard | Board/List | Calendar    |
| Mobile support   | -         | Buggy         | Limited | Limited   | Good       | Limited     |
| Bulk actions     | -         | -             | Yes     | -         | Yes        | -           |
| Barcode scanning | -         | -             | -       | -         | Yes (best) | -           |
| Drag-and-drop    | -         | Calendar      | Board   | -         | Scheduler  | Calendar    |
| Empty states     | Unknown   | Minimal       | Unknown | Unknown   | Designed   | Unknown     |
| Customer portal  | Yes       | Yes           | Yes     | Yes       | Yes        | Yes (best)  |

---

## Market Gaps

### Gap 1: Screen Room Management (MASSIVE)

**Nobody has it.** This is the most striking finding. Screen printing is literally named after the screens, yet no software tracks them. Current industry practice:

- Whiteboards in the darkroom
- Excel spreadsheets
- Physical four-cart system (Speed → Take → Clean → Drying)
- Manual mesh count logs averaged monthly
- "Count the screens on the rack" inventory method

**Why this matters**: Screen rooms are where production bottlenecks hide. A burned screen that's wrong wastes emulsion, time, and press capacity. Screens in poor condition (low tension, damaged mesh) cause print quality issues. Without tracking, shops can't answer: "Do we have a 156-mesh screen ready for this job?" or "How many screens need reclaiming before tomorrow's jobs?"

**Opportunity level**: Blue ocean. First mover advantage. No competitor to benchmark against means we define the category.

### Gap 2: Screen-to-Job Linking

No competitor links physical screens to specific jobs in software. Press operators know which screens go with which job through physical labels, sticky notes, or memory. This is a workflow gap that causes:

- Wrong screens loaded on press
- Screens reclaimed before job reprint
- Lost screen history for repeat jobs ("What mesh did we use last time?")

### Gap 3: Screen Lifecycle Analytics

No one tracks screen lifecycle data:

- How many burn cycles before a screen needs re-meshing?
- Which mesh counts are most utilized vs. sitting idle?
- Average turnaround time from reclaim to ready?
- Screen utilization rate by mesh count?

### Gap 4: Garment Catalog UX

While vendor integrations exist everywhere, the **browsing experience** is universally utilitarian. Current catalogs are designed for quoting workflows (search → select → price), not for discovery or visual browsing. Nobody offers:

- Visual garment browser with large product photos
- Side-by-side style comparison
- Color swatch palettes per garment
- "Popular with your customers" recommendations
- Quick-view for garment specs without leaving the browsing context
- Saved favorites / frequently ordered lists

### Gap 5: Unified Inventory View

No competitor shows a unified view of: "Here's what we have in stock, what's on order, what's committed to jobs, and what we need to order — with garment images." YoPrint comes closest with their available/on-hand/incoming/committed categories, but it's data-heavy and image-light.

---

## Best-in-Class Examples

### Best Garment Vendor Integration: Teesom

Teesom's live vendor integration with real-time stock checking across vendor warehouses, unified inventory codes across vendors, and instant vendor swapping at purchase time is the gold standard. When a vendor is out of stock, you swap to another in one click with no workflow disruption.

### Best Catalog UX (Customer-Facing): InkSoft

InkSoft's product catalog browsing — organized by categories, with supplier-populated images, product details, sizing, and cost — provides the best visual product discovery. Their "Recommended Products" filter curates popular items. While customer-facing (not back-office), the UX patterns are directly applicable.

### Best Overall Inventory Management: YoPrint

YoPrint's real-time multi-location inventory with available/on-hand/incoming/committed categories, barcode scanning for receiving, reorder calculations, and stock take functionality is the most complete inventory system. The barcode-driven workflow is genuinely innovative in this space.

### Best Production Catalog Integration (Purchase Orders): ShopVOX

ShopVOX's ability to auto-generate purchase orders from sales orders, consolidating items across multiple orders into vendor-specific POs, is the most production-efficient catalog integration. 8+ vendor integrations is also the broadest catalog reach.

### Best Modern UI: YoPrint

YoPrint's clean, modern interface with drag-and-drop scheduling, barcode scanning, smart filters, and customer self-service portal sets the UI bar for the market. It proves that screen printing software doesn't have to look like it was built in 2010.

### Best Asset Tracking Patterns (Applicable to Screens): Katana MRP

While not screen-print specific, Katana's serial number tracking, bin location management, shop floor app, and BOM-based component linking are the exact patterns needed for screen room management. Their approach to tracking individual manufacturing assets is the best reference architecture.

---

## Pricing & Positioning

| Competitor       | Starting Price       | Mid Tier               | Top Tier            | Model               | Free Tier                           |
| ---------------- | -------------------- | ---------------------- | ------------------- | ------------------- | ----------------------------------- |
| **PrintLife**    | ~$30/mo (est.)       | —                      | —                   | Flat monthly        | —                                   |
| **Printavo**     | $49/mo (Starter)     | $149/mo (Standard)     | $199/mo (Premium)   | Per-plan            | Free trial                          |
| **ShopVOX**      | ~$55/mo (Express)    | ~$95/mo (Pro base)     | +$29/user           | Per-plan + per-user | Free trial                          |
| **Teesom**       | Free (≤20 orders/mo) | $67/mo (single user)   | $97-147/mo (multi)  | Per-plan            | Yes (full features, limited orders) |
| **YoPrint**      | ~$60/mo ($2/day)     | —                      | —                   | Tiered              | 14-day trial                        |
| **DecoNetwork**  | $199/mo (Standard)   | $299/mo (Premium est.) | Enterprise (custom) | Per-plan            | Free demo                           |
| **Katana**       | $179/mo              | —                      | —                   | Per-plan + usage    | 14-day trial                        |
| **InkSoft**      | ~$150/mo (est.)      | —                      | —                   | Per-plan            | Demo only                           |
| **GraphicsFlow** | ~$49/mo (est.)       | —                      | —                   | Per-plan            | Free trial                          |

**Positioning spectrum**:

```
Simple/Affordable ←————————————————————————————→ Complex/Expensive

PrintLife  Printavo  Teesom  YoPrint  ShopVOX  InkSoft  DecoNetwork  Katana
  $30       $49-199   $0-147  $60      $55-95   ~$150    $199-500+    $179+
```

**Mokumo positioning opportunity**: Between Printavo and ShopVOX in complexity, with the UI quality of YoPrint, at a competitive price point ($49-99/mo). The screen room feature alone justifies a premium over simpler tools.

---

## Key Takeaways for Mokumo

### 1. Screen Room = Category-Defining Feature

This is the single biggest opportunity. **No competitor offers screen room management.** Building this feature well doesn't just differentiate — it creates a new category. The feature should include:

- Individual screen registry (ID, mesh count, frame size, manufacturer)
- Lifecycle state machine: `new → coated → burned → in-use → reclaim → storage` (or `retire`)
- Screen-to-job linking (which screens are assigned to which jobs)
- Screen condition tracking (tension readings, burn count, notes)
- Visual dashboard: screens by state, by mesh count, availability for upcoming jobs
- Bulk operations: batch reclaim, batch coat, batch retire
- History: every state change logged with timestamp and user

### 2. Garment Catalog Should Be a Delight, Not a Utility

Every competitor treats the catalog as a quoting input. Mokumo can treat it as a **browsing experience**:

- Visual-first: large garment photos, color swatches, clean cards
- Smart organization: by brand, style, category, color family
- Size/color matrix: the core data display that every shop needs, done beautifully
- Vendor-agnostic: show the garment, not the vendor (vendor is metadata)
- Favorites/recent: frequently ordered items one click away
- Search that works: fuzzy matching, filter by color/brand/category/price range

### 3. Connect Screen Room to Production Pipeline

The real power comes from linking screens to the broader production workflow:

- Quote → Job → Screens needed → Screen room prep → Press → Reclaim
- "This job needs 4 screens: 2x 156-mesh, 1x 230-mesh, 1x 110-mesh. 3 are ready, 1 needs burning."
- Dashboard card: "Screens to burn for tomorrow's jobs"

### 4. Steal Patterns Liberally

| Pattern                   | Steal From       | Apply To                       |
| ------------------------- | ---------------- | ------------------------------ |
| Serial/asset tracking     | Katana MRP       | Screen registry                |
| Bin location management   | Katana MRP       | Screen rack positions          |
| BOM linking               | Katana MRP       | Screen-to-job association      |
| Live vendor integration   | Teesom           | Garment catalog pricing        |
| Barcode scanning workflow | YoPrint          | Screen identification          |
| Product browsing UX       | InkSoft          | Garment catalog browser        |
| Multi-warehouse inventory | Teesom / YoPrint | Multi-location screen tracking |
| Visual production board   | ShopVOX          | Screen room dashboard          |
| Clean modern UI           | YoPrint          | Everything                     |

### 5. Phase 1 Scope Recommendations

**Screen Room (high confidence — blue ocean)**:

- Screen registry with lifecycle states (the core innovation)
- Screen-to-job linking (the production connection)
- Dashboard with state counts and upcoming needs
- Bulk reclaim/coat operations

**Garment Catalog (moderate confidence — differentiate on UX)**:

- Visual catalog browser with product images
- Size/color matrix display
- Brand/style/category organization
- Search and filter
- Mock vendor data for Phase 1 (real integration Phase 2+)

### 6. Risks to Monitor

- **Printavo/Inktavo ecosystem**: Printavo + InkSoft + GraphicsFlow together cover quote-to-storefront. If they add screen room tracking, they'd be formidable. But their pattern is acquisition, not innovation — they buy tools, not build features.
- **YoPrint momentum**: Newest and most modern competitor. If any existing player adds screen room tracking, it would likely be YoPrint. Monitor their changelog.
- **Teesom's vendor integration depth**: Their live integration is the benchmark. Phase 2 vendor integration needs to match or exceed Teesom's real-time stock/pricing/swapping.
- **Vendor consolidation**: S&S Activewear acquired AlphaBroder (Aug 2024). The supplier landscape is consolidating. Build vendor integration to be vendor-agnostic.

---

## Appendix: Research Sources

### Competitor Websites

- [PrintLife](https://www.theprintlife.com/)
- [Printavo](https://www.printavo.com/)
- [ShopVOX](https://shopvox.com/)
- [Teesom](https://teesom.com/)
- [YoPrint](https://www.yoprint.com/)
- [DecoNetwork](https://www.deconetwork.com/)
- [Katana MRP](https://katanamrp.com/)
- [InkSoft](https://www.inksoft.com/)
- [GraphicsFlow](https://www.graphicsflow.com/)

### Feature & Help Documentation

- [ShopVOX SanMar Integration](https://docs.shopvox.com/article/qtpap33i9h-san-mar-apparel-catalog-integration)
- [ShopVOX Custom Catalog Import](https://docs.shopvox.com/article/wqkwlp7imi-importing-custom-catalogs-for-apparel-from-other-suppliers)
- [Teesom Features (80+)](https://teesom.com/teesom-features/)
- [Teesom Vendor Integration](https://teesom.com/vendor-integration-screen-printing/)
- [Teesom Live Vendor Integration](https://teesom.com/live-vendor-integration-what-sets-us-apart/)
- [YoPrint Inventory Management](https://www.yoprint.com/inventory-management-for-screen-printing)
- [YoPrint Screen Printing Features](https://www.yoprint.com/screen-printing-business-software)
- [DecoNetwork Screen Printing](https://www.deconetwork.com/home/built-for/screen-printing/)
- [InkSoft Supplier Catalogs](https://help.inksoft.com/hc/en-us/articles/8336637035419-Add-Products-from-Integrated-Supplier-Catalogs-recommended)
- [Katana Features](https://katanamrp.com/features/)
- [PrintLife 2024 Update](https://www.theprintlife.com/the-print-life-screen-print-management-software-2024-update-is-live/)

### Reviews & Comparisons

- [Printavo Capterra Reviews](https://www.capterra.com/p/154421/Printavo/reviews/)
- [ShopVOX Capterra Reviews](https://www.capterra.com/p/155218/shopVOX/reviews/)
- [Printavo SoftwareWorld Review](https://www.softwareworld.co/software/printavo-reviews/)
- [DecoNetwork Top 8 Comparison](https://www.deconetwork.com/top-8-screen-printing-shop-management-software-picks/)
- [Best Print Shop Software 2025](https://softwareconnect.com/roundups/best-print-shop-management-software/)
- [Screen Printing Software (17 Tools)](https://www.convertcalculator.com/blog/software-for-screenprinters/)

### Industry & Community

- [Darkroom Optimization 101](https://www.screenprinting.com/blogs/news/darkroom-optimization-101-how-many-screens-does-your-shop-really-need)
- [Ink Management Software (Screen Printing Mag)](https://screenprintingmag.com/ink-management-software/)
- [T-Shirt Forums: Software Discussion](https://www.t-shirtforums.com/threads/what-software-do-you-use-in-your-screen-printing-shop.883653/)
- [Anatol: Managing Workflow](https://anatol.com/managing-your-screen-printing-workflow-tips-for-scheduling-production-more-effectively/)
- [Anatol: Inventory Tips](https://anatol.com/tips-for-managing-your-screen-printing-shop-s-inventory/)

---

## Addendum: Additional Competitor Details (UX Research Agent)

### OnSite/ShopWorx — The Closest to Screen Room Management

OnSite/ShopWorx is notably absent from the main analysis but deserves special attention. It's the **only competitor that stores screen-specific production data** as part of its ERP:

- **Production variables per job**: Mesh counts, ink colors, squeegee properties, images, and custom parameters
- **Screen detail storage**: Stores screen details linked to specific orders
- **Thread/ink color library**: Maintains a library of ink colors for reference
- **Size matrix for apparel**: Native apparel size matrix for order entry
- **Dynamic production calendar**: Schedules based on shop setup and production types

**Critical distinction**: OnSite treats screens as **job attributes** (metadata on an order), NOT as **tracked physical assets** with lifecycle states. There's no screen inventory, no lifecycle management, no tension tracking, no reclaim queue, and no screen utilization dashboard. It's "here are the production details for this job" — not "here are all our screens and their current status."

This is the precise gap Mokumo should fill: **screen-as-first-class-entity with lifecycle management**, not screen-as-job-metadata.

_Sources: [OnSite Features](https://www.shopworx.com/onsite-screen-print-business-software/), [ShopWorx Screen Printing](https://www.shopworx.com/industries/screen-printing-management-software/)_

### Printmatics — Smart Scheduling Pattern

Printmatics offers two patterns worth noting:

- **Drag-and-drop production calendar**: Schedule jobs across departments and equipment types
- **Dynamic filter production monitor**: Track workflow filtered by department, customer, equipment type
- **Smart Scheduler**: Auto-schedules production as efficiently as possible

These production scheduling patterns could apply to screen room prep workflow (which screens to burn/coat/reclaim next based on job schedule).

_Source: [Printmatics Screen Printing](https://www.printmatics.com/screen-printing-shop-management-software)_

### Additional User Complaints (Across Competitors)

From Capterra/review research, common pain points relevant to our verticals:

**Printavo**:

- No read/write permissions — painful at scale (20+ employees)
- No real receiving system — can't track what arrived when
- Can't assign automated job run times
- Mobile app chronically buggy (won't load on updated iPhones, Oct 2024 review)

**ShopVOX**:

- 2FA launch was broken — expired codes, user lockouts
- Sales tax, "golden products" features launched with critical bugs
- Significant pricing creep over time
- Express vs Pro tier confusion

**DecoNetwork**:

- **Batch production extremely lacking** — must process each order individually
- **Sorting orders is very difficult** with the current system
- Not designed for showroom operations
- Challenging onboarding process
- Slow to add desired features

**YoPrint**:

- Relatively new — some features missing compared to established tools
- No webstore/merch store feature (frequently requested)
- Smaller ecosystem and community

### Printavo Status System — Pattern Worth Studying

Printavo's custom invoice status system is the best workflow pattern in the market:

- **Unlimited custom statuses** (some shops have 100+)
- **Color-coded badges** on calendar and production board
- **Status-triggered notifications**: Internal and external (email/SMS)
- **Status-triggered automations and tasks**: Workflow automation based on transitions
- **Calendar/board filtering by status**: Focus views on specific workflow stages

This pattern — custom statuses with triggers — is directly applicable to screen lifecycle states. When a screen transitions to "Needs Reclaim," it could trigger a notification to the screen room team.

_Source: [Printavo Customizing Statuses](https://support.printavo.com/hc/en-us/articles/360054178254-4-2-Customizing-Job-Statuses)_

### Vendor Integration Landscape Note

**S&S Activewear acquired AlphaBroder in August 2024**, consolidating two of the biggest wholesale apparel distributors. This means:

- Fewer vendor APIs to integrate in Phase 2
- Potentially simplified supplier catalog integration
- Vendor-agnostic design is critical — the supplier landscape is consolidating

### Summary of Additional Findings

| Insight                                                                | Impact on Mokumo                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| OnSite tracks screen data as job metadata, not asset inventory         | Confirms the "screen as first-class entity" approach is novel                    |
| Printavo's status trigger system is the market's best workflow pattern | Adopt for screen lifecycle transitions (status change → notification/automation) |
| Printmatics smart scheduler auto-allocates production                  | Future feature: auto-suggest screens to burn based on job schedule               |
| Batch production is a known pain point (DecoNetwork)                   | Ensure screen room supports bulk operations from day one                         |
| S&S + AlphaBroder consolidation                                        | Build vendor integration vendor-agnostically                                     |
| Mobile apps are universally weak or buggy                              | Mobile screen room tracking is a differentiation opportunity                     |
