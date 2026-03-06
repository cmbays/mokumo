# Vertical Discovery: UX Best Practices Research Report

**Verticals**: Screen Room Management | Garment Catalog
**Date**: 2026-02-14
**Phase**: Discovery (pre-build research)

---

## Table of Contents

1. [Screen Room UI Best Practices](#1-screen-room-ui-best-practices)
2. [Garment Catalog UI Best Practices](#2-garment-catalog-ui-best-practices)
3. [General UI Patterns (Both Verticals)](#3-general-ui-patterns-both-verticals)
4. [Recommended Patterns for Mokumo](#4-recommended-patterns-for-mokumo)
5. [Anti-Patterns to Avoid](#5-anti-patterns-to-avoid)
6. [Key Design Decisions Before Building](#6-key-design-decisions-before-building)

---

## 1. Screen Room UI Best Practices

### 1.1 The Screen Lifecycle (Domain Context)

A screen printing frame follows a continuous lifecycle that any management UI must model:

```
NEW/EMPTY → DEGREASED → COATED (emulsified) → DRYING → EXPOSED (burned) →
IN-USE (on press) → NEEDS RECLAIM → RECLAIMING → DEGREASED → [loop back to COATED]
                                                                    ↓
                                                              STORED (clean)
                                                                    ↓
                                                              RETIRED (mesh worn)
```

**Key parameters to track per screen:**

- **Screen ID / Number** (physical label on the frame)
- **Frame size** (e.g., 20x24", 23x31")
- **Mesh count** (110, 156, 200, 230, 305 — determines ink deposit and detail level)
- **Mesh type** (monofilament polyester, stainless steel)
- **Tension** (measured in Newtons — degrades over time, determines print quality)
- **Emulsion type** (diazo, SBQ, dual-cure — affects exposure time and durability)
- **Current status** (which lifecycle stage)
- **Current job link** (if in use)
- **Last reclaim date**
- **Total reclaim count** (wear indicator)
- **Notes / condition** (pinholes, damage, ghost images)

_Sources: [Lawson Screen Products — Frame Lifecycle](https://lawsonsp.com/blogs/education-and-training/the-screen-printing-frame-lifecycle-an-overview-from-prep-and-emulsion-to-exposure-and-reclaim), [Printavo — How to Reclaim Screens](https://www.printavo.com/blog/how-to-reclaim-screens-in-your-print-shop/), [Chromaline — Automate Your Screen Room](https://chromaline.com/automate-your-screen-room-with-chromaline/)_

### 1.2 How Production/Manufacturing Tools Display Equipment Inventories

#### Katana MRP

- **Real-time inventory dashboard**: Shows stock levels across locations with committed vs. available quantities
- **Simple, intuitive interface**: Users report being productive on day one — minimal training needed
- **Unified channel view**: Aggregates data from multiple sources into a single dashboard
- **Key lesson**: Simplicity wins. Even complex manufacturing data should be scannable at a glance.

_Source: [Katana MRP Features](https://katanamrp.com/features/)_

#### MaintainX (CMMS/Maintenance)

- **Color-coded status system**: Priorities (None, Low, Medium, High) with overdue tasks flagged in red
- **Comprehensive filtering**: Sort by status, priority, location, asset, or assignee
- **Multi-layered asset hierarchy**: Tracks lifecycle of complex machinery, pinpoints failures, attributes costs
- **Mobile-first design**: Field technicians update status in real-time from the shop floor
- **Business intelligence dashboard**: Tracks downtime costs over time, identifies patterns
- **Key lesson**: Mobile-first matters for physical asset tracking. Workers update screens from the shop floor, not their desks.

_Source: [MaintainX Asset Management](https://www.getmaintainx.com/use-cases/equipment-and-asset-management), [MaintainX Reviews](https://research.com/software/reviews/maintainx)_

#### UpKeep (CMMS)

- **Dashboard overview page**: Shows upcoming tasks with due dates, criticality, and assigned workers
- **Asset status tracking**: Set statuses to track unplanned downtime, view work order history per asset
- **Custom asset fields**: Currency, dropdowns, dates — tailorable to business-specific needs
- **Pattern detection**: BI dashboard identifies downtime patterns to prevent major failures
- **Key lesson**: Per-asset work order history is critical. Users need to see "what happened to this screen before" at a glance.

_Source: [UpKeep Asset Management](https://upkeep.com/product/asset-management/), [UpKeep CMMS](https://upkeep.com/product/cmms-software/)_

#### Fishbowl Inventory

- **Serial/Lot tracking**: Each part tracked by serial number, lot number, expiration dates, revision levels
- **Multi-location with bin-level granularity**: Tracks down to per-shelf level
- **Barcode scanning integration**: Faster, more accurate warehouse operations
- **Practical, no-frills interface**: Not flashy, but reliable — operational staff prioritize function over aesthetics
- **Key lesson**: Physical inventory tools need physical-world integrations (barcodes, QR codes). Plan for this even if Phase 1 is mock data.

_Source: [Fishbowl Inventory Features](https://www.fishbowlinventory.com), [Fishbowl Reviews](https://research.com/software/reviews/fishbowl-inventory)_

### 1.3 Status Lifecycle Visualization Patterns

Three dominant patterns emerged from the research:

#### Pattern A: Kanban Board (Columns = Statuses)

- **Best for**: When screens move through stages in a workflow and you want to see distribution
- **How it works**: Each column is a lifecycle status. Cards represent individual screens. Drag to change status.
- **Used by**: Manufacturing MES software (Manufacturo, Nexelem), Printavo's production board
- **Strengths**: Intuitive visual metaphor, drag-and-drop status changes, easy to spot bottlenecks (full columns)
- **Weaknesses**: Gets crowded with 100+ items, doesn't show detailed attributes, horizontal scrolling on mobile
- **Screen Room fit**: **Excellent for the "active" statuses** (Coated → Burning → On Press → Needs Reclaim) but overkill for stored/retired screens

_Sources: [Manufacturo Kanban](https://manufacturo.com/manufacturo-manufacturing-management-software/kanban-management/), [Nexelem Kanban View](https://nexelem.com/en/kanban-view/), [Kanban Board Examples](https://www.smartsheet.com/content/kanban-board-examples)_

#### Pattern B: Status Badges in Data Table

- **Best for**: Large inventories where you need to filter, sort, and search across many attributes
- **How it works**: Color-coded badges/pills in a status column within a data table
- **Used by**: MaintainX, UpKeep, ServiceNow Asset Management
- **Strengths**: Dense information display, powerful filtering/sorting, handles 500+ items gracefully
- **Weaknesses**: Less visual/intuitive than Kanban, requires understanding of status meanings
- **Screen Room fit**: **Best for the full inventory view** — all screens at a glance with filters

#### Pattern C: Lifecycle Timeline (Per-Asset)

- **Best for**: Viewing a single screen's complete history
- **How it works**: Vertical timeline showing status transitions, linked jobs, maintenance events
- **Used by**: ServiceNow, ManageEngine (asset lifecycle views), Dynamics 365
- **Strengths**: Complete audit trail, shows time-in-state, great for troubleshooting
- **Weaknesses**: Only useful for single-item detail views, not for overview
- **Screen Room fit**: **Perfect for screen detail/drawer view** — "What's this screen's history?"

_Sources: [ServiceNow Asset Management](https://www.reco.ai/hub/servicenow-asset-management), [Dynamics 365 Asset States](https://learn.microsoft.com/en-us/dynamics365/supply-chain/asset-management/setup-for-objects/object-stages), [Atlassian Asset Lifecycle](https://www.atlassian.com/itsm/it-asset-management/asset-management-lifecycle)_

**Recommended hybrid approach**: Combine all three. Use a **Kanban view for active screens** (the "workflow" subset), a **table view for full inventory**, and a **timeline in the detail drawer** for individual screen history.

### 1.4 Dashboard Patterns for Utilization & Queue Management

Manufacturing KPI dashboards consistently show these patterns:

#### Top-Level Metrics (Card Row)

- **Total screens**: Overall inventory count
- **Available**: Ready for use (clean/stored)
- **In use**: Currently on press
- **Needs attention**: Needing reclaim, low tension, damaged
- **Utilization rate**: % of screens actively in use

These are typically shown as **metric cards** across the top of a dashboard — number + label + trend indicator.

#### Distribution Charts

- **Status distribution**: Donut/pie chart showing screens by lifecycle status
- **Mesh count distribution**: Bar chart showing inventory by mesh count (are we low on 230 mesh?)
- **Frame size inventory**: Ensures adequate supply of each frame size

#### Queue/Urgency Lists

- **Reclaim queue**: Screens waiting to be reclaimed, sorted by urgency (job due date)
- **Low tension alerts**: Screens approaching retirement threshold
- **Recently used**: Quick access to screens that were just on press

_Sources: [Tulip Manufacturing Dashboards](https://tulip.co/blog/6-manufacturing-dashboards-for-visualizing-production/), [Manufacturing KPI Guide](https://www.method.me/blog/manufacturing-kpi-dashboard/), [OEE Dashboards](https://www.wynenterprise.com/blogs/business-intelligence-dashboards-for-manufacturing-overall-equipment-effectiveness/)_

### 1.5 Linking Equipment to Production Orders

The screen-to-job relationship is critical. Best practices from manufacturing software:

- **Bi-directional linking**: From a job, see which screens are assigned. From a screen, see which job it's on.
- **Screen assignment during production planning**: When setting up a job, select screens from available inventory (filtered by required mesh count)
- **Status auto-transition**: When a screen is assigned to a job, its status automatically changes to "In Use". When the job completes, it transitions to "Needs Reclaim".
- **Multi-screen per job**: A typical screen print job needs 1 screen per color. A 4-color job = 4 screens. The UI must support linking multiple screens to one job.
- **Screen reuse tracking**: Same screen can be reused for repeat orders (same design burned in). Track "last job" and "design on screen" to enable reuse.

### 1.6 Search and Filter Patterns for Physical Inventory

From MaintainX, UpKeep, and Fishbowl:

- **Global search**: Search by screen number, job number, or design name
- **Faceted filters**: Status, mesh count, frame size, tension range, emulsion type, location
- **Saved filter views**: "My Screens", "Needs Reclaim", "Available 230-mesh", "Low Tension"
- **Active filter pills**: Show applied filters as removable tags above the table
- **Sort by multiple columns**: Status, then mesh count, then tension
- **Quick-filter shortcuts**: One-click buttons for the most common views (e.g., "Available", "In Use", "Needs Reclaim")

---

## 2. Garment Catalog UI Best Practices

### 2.1 The Garment Data Model (Domain Context)

In screen printing/decorated apparel, a "garment" is a blank item (t-shirt, hoodie, polo) before decoration. The catalog is the shop's library of available blanks.

**Hierarchy**: Brand → Style → Color → Size

Example:

```
Gildan (brand)
  └── G500 Heavy Cotton Tee (style)
        ├── Black
        │     ├── S (10 in stock)
        │     ├── M (25 in stock)
        │     ├── L (15 in stock)
        │     └── XL (8 in stock)
        ├── White
        │     ├── S (20 in stock)
        │     ├── ...
        └── Navy
              ├── ...
```

**Key data per style:**

- **Brand** (Gildan, Bella+Canvas, Next Level, etc.)
- **Style number** (G500, BC3001, NL6210)
- **Name** (Heavy Cotton Tee, Unisex Jersey Short Sleeve)
- **Category** (T-Shirts, Hoodies, Polos, Tanks, Hats, Bags)
- **Fabric composition** (100% cotton, 60/40 blend, tri-blend)
- **Weight** (5.3 oz, 4.2 oz)
- **Available colors** (often 30-50+ per style)
- **Available sizes** (typically S-5XL, varies by style)
- **Size/color availability matrix** (which size/color combos exist)
- **Product images** (front, back, side — per color)
- **Pricing tiers** (wholesale pricing varies by quantity)
- **Fit/cut** (regular, slim, relaxed, ladies')
- **Tags/features** (moisture-wicking, pocket, ringspun, tear-away label)

### 2.2 How Apparel/Merchandise Tools Display Product Catalogs

#### S&S Activewear

- **Category-first navigation**: T-Shirts → Outerwear → Wovens → Sweatshirts → Accessories → Headwear
- **Multi-faceted filters**: Brand, size, color, fabric, gender-age, feature (moisture-wicking, high-visibility), price
- **Style number search**: Quick lookup when the user already knows the style number
- **Color swatch display**: Visual color dots/swatches rather than text-only color names
- **50+ colors per style**: Some styles have massive color ranges, requiring scrollable swatch rows
- **Stock by warehouse**: Logged-in wholesale users see live inventory per warehouse location

_Source: [S&S Activewear Categories](https://www.ssactivewear.com/categories), [S&S Activewear Brands](https://www.ssactivewear.com/brands)_

#### SanMar

- **Searchable by style-color-size combination**: Any combination works as a search query
- **Pre-made and custom catalogs**: Market-specific catalog generation — users can select which products to feature
- **Colorful, visual product cards**: Emphasis on helping customers quickly compare styles by quality, features, and price
- **Product reference tools**: Technical specs, data libraries, and integration APIs
- **Key lesson**: Search flexibility is paramount. Users may search by "Gildan G500" (style number), "heavy cotton tee" (name), or "black XL" (attributes).

_Source: [SanMar Data Library](https://www.sanmar.com/resources/electronicintegration/sanmardatalibrary), [SanMar Product Reference](https://www.sanmar.com/Resources/productmaterials/productreferencetools)_

#### JOOR (B2B Wholesale Fashion)

- **Virtual showroom**: Customizable templates with high-res visuals, videos, and interactive linesheets
- **iPad-optimized catalog**: Brands showcase products on tablets during in-person meetings
- **360° product imagery**: Rotatable product views for detailed inspection
- **Unlimited images per product**: No restriction on visual assets
- **Grid-based product layout**: Customizable grid cards for browsing collections
- **Key lesson**: Visual richness matters for apparel. Even in a production context (not retail), users need to quickly identify garments by sight.

_Source: [JOOR Platform](https://www.joor.com), [JOOR vs NuORDER](https://wizcommerce.com/joor-vs-nuorder/)_

#### NuORDER

- **Drag-and-drop interface**: Simple bulk uploading of product data
- **Custom linesheets**: Generate shareable product lineups for buyers
- **Catalog + order management**: Browse and order in the same interface
- **Key lesson**: The catalog isn't just for browsing — it feeds directly into the ordering/quoting workflow.

_Source: [NuORDER Features](https://wizcommerce.com/joor-vs-nuorder/)_

#### Shopify Admin (Product Variants)

- **Up to 2,048 variants per product**: New GraphQL API supports massive variant counts (size × color)
- **Variant matrix management**: Create all combinations from option sets in a single interface
- **Per-variant pricing, inventory, and images**: Each size/color combo is independently manageable
- **Key lesson**: The SKU multiplication problem (1 style × 5 colors × 8 sizes = 40 SKUs) requires matrix-aware interfaces, not flat lists.

_Source: [Shopify Variants](https://help.shopify.com/en/manual/products/variants), [Shopify 2048 Variants](https://www.shopify.com/blog/2048-variants)_

### 2.3 Grouping Strategies

Three primary catalog organization models:

| Strategy                 | Structure                    | Best When                                                |
| ------------------------ | ---------------------------- | -------------------------------------------------------- |
| **Category-first**       | T-Shirts → all brands within | User knows the garment type they need                    |
| **Brand-first**          | Gildan → all styles within   | Shop is brand-loyal or customers request specific brands |
| **Hybrid (recommended)** | Category → Brand → Style     | Supports both workflows; mirrors how S&S/SanMar organize |

**Recommended for Mokumo**: **Category-first with brand filtering**, matching the mental model of "I need a tee" → "which brand?" → "which color/size?" This matches how the shop owner thinks when quoting a job.

### 2.4 Size/Color Matrix Display Patterns

The size/color matrix is the defining UI challenge of garment catalogs. Three patterns:

#### Pattern A: Grid/Matrix Table

```
         S    M    L    XL   2XL
Black   [10] [25] [15]  [8]  [3]
White   [20] [30] [18] [12]  [5]
Navy     [5] [15] [10]  [6]  [2]
```

- **Strengths**: Dense, scannable, shows all availability at once
- **Weaknesses**: Breaks down with 50+ colors, requires horizontal scrolling on mobile
- **Best for**: Order entry / quoting view (selecting specific quantities per size/color)
- **Used by**: Acctivate, Blue Link ERP, OnSite/ShopWorx

_Source: [Matrix Magic for Apparel](https://sunrise.co/blog/dynamics365-erp-matrix-apparel-footwear/), [Acctivate Matrix Inventory](https://acctivate.com/features/matrix-inventory/)_

#### Pattern B: Color Swatches + Size Pills

- Color shown as clickable circular swatches
- Selecting a color shows available sizes as pills/chips
- Stock indicator (green/yellow/red) per size
- **Strengths**: Compact, visual, mobile-friendly
- **Weaknesses**: Can't see all combos at once, requires clicks to explore
- **Best for**: Catalog browsing / quick lookup
- **Used by**: Shopify storefronts, S&S Activewear product pages

_Source: [Shopify Swatches Guide](https://www.shopify.com/partners/blog/swatches), [Color Swatches UX](https://searchanise.io/blog/color-swatches/)_

#### Pattern C: Expandable Card

- Product card shows primary image + swatch row
- Click/expand reveals full size matrix for the selected color
- Inline stock levels
- **Strengths**: Progressive disclosure — doesn't overwhelm the catalog view
- **Weaknesses**: More clicks to get to detail, harder to compare across colors
- **Best for**: Catalog index page

**Recommended for Mokumo**: Use **Pattern B (swatches + pills) for the catalog browsing view** and **Pattern A (matrix grid) in the quote builder / order entry** where users need to specify exact quantities per size/color.

### 2.5 Image Gallery Patterns

From JOOR, NuORDER, Shopify, and ecommerce best practices:

- **Primary image per color**: When a user selects a color swatch, the main product image should update to show that color
- **Multiple angles**: Front, back, side views minimum. Side/detail views on hover or click.
- **Hover zoom**: Magnification on hover for fabric detail inspection
- **Thumbnail strip**: Small thumbnails below the main image for angle selection
- **Consistent image treatment**: Same background, lighting, and angle across all products for scannable catalog browsing
- **Placeholder for missing images**: Not all colors will have professional photos. Use a colored silhouette or placeholder.

_Sources: [Shopify Variant Images](https://apps.shopify.com/ns-product-variants-options), [JOOR Virtual Showroom](https://www.joor.com)_

### 2.6 Stock Level Visualization

From wholesale B2B platforms:

- **Traffic light system**: Green (>20 in stock), Yellow (5-20), Red (<5), Gray (out of stock)
- **Numeric display**: Exact counts for wholesale/production context (not just "in stock" / "out of stock")
- **Low stock alerts**: Badge or icon on product cards when key sizes are running low
- **Stock by location** (Phase 2): For multi-warehouse operations, show availability per warehouse
- **"Available vs. Committed"**: In production software, distinguish between total stock and stock already committed to open orders

### 2.7 Search, Filter, and Sort for Large Catalogs (500+ SKUs)

From S&S Activewear, SanMar, and SaaS filter best practices:

- **Global search with typeahead**: Search by style number, brand name, or description
- **Multi-faceted filters**: Category, brand, color family, size range, fabric, weight, features, price range, stock status
- **Range sliders**: For numeric attributes (weight: 4.0-6.0 oz, price: $2-$8)
- **Active filter pills**: Removable tags showing what's currently filtered, with "Clear all"
- **Saved views**: "My go-to tees", "Heavyweight blanks", "Youth styles"
- **Sort options**: Price (low/high), brand (A-Z), popularity, newest, stock availability
- **Result count**: Always show "Showing 47 of 342 styles" when filters are active
- **Filter persistence**: Filters survive page navigation (use URL query params — already planned for Mokumo)

_Sources: [Filter UI for SaaS](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas), [Faceted Filter Patterns](https://bricxlabs.com/blogs/universal-search-and-filters-ui), [SaaS Filter Examples](https://saasinterface.com/components/filters/)_

---

## 3. General UI Patterns (Both Verticals)

### 3.1 Data Table Best Practices

From UX research across data-heavy SaaS tools:

#### Column Design

- **Left-align text, right-align numbers**: Conventional and scannable
- **Sticky first column**: Keep the identifier (screen # or style #) visible during horizontal scroll
- **Sortable columns**: Click header to sort, click again to reverse. Visual indicator (arrow) for active sort.
- **Column reordering/hiding**: Let users customize which columns they see (TanStack Table's column visibility API)
- **Consistent column widths**: Don't let content overflow — use truncation with tooltips for long text

#### Row Actions

- **Up to 3 inline icons** on the far right of each row (e.g., Edit, View, Delete)
- **Overflow menu (⋮)** for additional actions beyond 3
- **Hover to reveal**: Show action icons only on row hover to reduce visual clutter
- **Tooltips on action icons**: Always label what icons do

#### Bulk Actions

- **Checkbox column**: Leftmost column with select-all in header
- **Floating action bar**: When items are selected, show a floating bar with "X items selected — [Assign] [Delete] [Export]"
- **Never auto-deselect**: Keep selection persistent until user clears it
- **Confirm destructive bulk actions**: Modal confirmation for batch deletes

#### Pagination

- **Show page size selector**: 10, 25, 50, 100 items per page
- **Show total count**: "1-25 of 342"
- **Prefer "Load More" for mobile**: Infinite scroll or "Load More" button instead of pagination controls

_Sources: [Data Table Design Best Practices](https://uxdworld.com/data-table-design-best-practices/), [TanStack Table & shadcn Guide](https://medium.com/codetodeploy/a-developers-guide-to-tanstack-table-shadcn-ux-first-data-table-implementation-efea4d56d95b), [Actions in Data Tables](https://medium.com/uxdworld/best-practices-for-providing-actions-in-data-tables-d629c6e73ab8)_

### 3.2 Card-Based vs Table-Based Layouts — When to Use Each

| Factor                            | Cards                  | Tables                      |
| --------------------------------- | ---------------------- | --------------------------- |
| **Image-heavy content**           | ✅ Better              | ❌ Cramped                  |
| **Many attributes per item**      | ❌ Overwhelming        | ✅ Scannable columns        |
| **Comparing items**               | ❌ Hard to compare     | ✅ Row-by-row comparison    |
| **Mobile friendliness**           | ✅ Stack naturally     | ❌ Need responsive strategy |
| **Emotional/visual browsing**     | ✅ Engaging            | ❌ Clinical                 |
| **High-volume data (100+ items)** | ❌ Slow to scan        | ✅ Dense, efficient         |
| **Quick status scanning**         | ❌ Must scan each card | ✅ Glance down one column   |

**Application to Mokumo:**

- **Garment Catalog**: **Cards for browsing** (visual products benefit from images + swatches), **table for management** (admin needs sort/filter/bulk actions)
- **Screen Room**: **Table as primary view** (screens are data-heavy, not visual), **cards for dashboard summary widgets** (metric cards at top)

_Sources: [Cards vs Tables UX](https://cwcorbin.medium.com/redux-cards-versus-table-ux-patterns-1911e3ca4b16), [Card View vs Table View](https://medium.com/design-bootcamp/when-to-use-which-component-a-case-study-of-card-view-vs-table-view-7f5a6cff557b), [NNGroup Cards](https://www.nngroup.com/articles/cards-component/)_

### 3.3 Empty State Design

Three types of empty states needed for both verticals:

#### First-Time User (No Data Yet)

- **Illustration + headline + CTA**: "No screens yet. Add your first screen to start tracking your inventory."
- **Guided onboarding**: Step-by-step cards showing "1. Add your screens → 2. Set up statuses → 3. Link to jobs"
- **Sample/demo data toggle**: "Show demo data" button that populates with realistic example data
- **Key principle**: "Two parts instruction, one part delight" — be helpful without being patronizing

#### No Search Results

- **Clear messaging**: "No screens match your filters. Try adjusting your search."
- **Show active filters**: Let users see (and remove) what's narrowing their results
- **Suggest alternatives**: "Did you mean 230 mesh?" or "Clear filters to see all screens"

#### Cleared/Completed State

- **Celebration moment**: "All screens are assigned! Your screen room is fully utilized." (with appropriate restraint)
- **Next action**: "Need more screens? Add new ones here."

_Sources: [Empty States in SaaS](https://userpilot.com/blog/empty-state-saas/), [NNGroup Empty States](https://www.nngroup.com/articles/empty-state-interface-design/), [Carbon Design System Empty States](https://carbondesignsystem.com/patterns/empty-states-pattern/)_

### 3.4 Mobile Responsive Patterns

#### Data Tables on Mobile

- **Priority column approach**: Show only 2-3 essential columns on mobile, with "expand" to see more
- **Row-to-card transformation**: Each table row becomes a stacked card on mobile
- **Sticky headers**: Column headers remain visible during scroll
- **Horizontal scroll with frozen first column**: Keep identifier visible while scrolling through data
- **Avoid**: Tiny text, horizontal scrolling without indicators, hiding too much data

#### Garment Cards on Mobile

- **Single-column stack**: Cards stack vertically on mobile (already natural)
- **Condensed swatches**: Show 5-6 color dots with "+12 more" overflow
- **Tap to expand**: Full details open in a bottom sheet rather than navigating to a new page

#### Screen Room on Mobile

- **Status-first view**: Show screens grouped by status (like a simplified Kanban)
- **Quick status toggle**: Tap to change a screen's status directly from the list
- **Barcode scan button**: Prominent CTA for scanning screen QR codes (Phase 2)

_Sources: [Mobile Tables UXmatters](https://www.uxmatters.com/mt/archives/2020/07/designing-mobile-tables.php), [NNGroup Mobile Tables](https://www.nngroup.com/articles/mobile-tables/), [Smashing Magazine Responsive Tables](https://www.smashingmagazine.com/2022/12/accessible-front-end-patterns-responsive-tables-part1/)_

---

## 4. Recommended Patterns for Mokumo

Applying the research to our specific design system: **dark theme, Linear Calm + Raycast Polish + Neobrutalist Delight**.

### 4.1 Screen Room — Recommended UI Architecture

#### Primary View: Status Table

- **Layout**: Full-width data table with TanStack Table
- **Columns**: Screen #, Status (badge), Mesh Count, Frame Size, Tension, Current Job, Last Reclaimed, Actions
- **Status badges**: Color-coded with design system tokens:
  - `--color-success` (green): Available/Stored
  - `--color-action` (blue): In Use (on press)
  - `--color-warning` (gold): Needs Reclaim, Drying, Coating
  - `--color-error` (red): Low Tension, Damaged
  - `--color-text-muted`: New (uninitialized), Retired
- **Filter bar**: Quick-filter chips (All, Available, In Use, Needs Reclaim) + advanced faceted filters
- **Top metric cards**: Total, Available, In Use, Needs Attention (with neobrutalist `4px 4px 0px` shadow on the primary metric)

#### Secondary View: Kanban (Active Screens)

- **Toggle between table and Kanban**: View switcher in the toolbar
- **Columns**: Coating → Drying → Exposed → On Press → Needs Reclaim
- **Cards**: Screen # + mesh count + linked job badge
- **Drag-and-drop**: Using dnd-kit (already in stack) to move screens between statuses

#### Detail Drawer/Panel

- **Slide-in panel** (Raycast-style): Click a row to open a detail panel from the right
- **Content**: Screen photo (if any), full specs, lifecycle timeline, linked job history, notes
- **Edit in-place**: Click to edit tension readings, add notes, change status
- **Glass effect**: Subtle backdrop blur on the panel overlay (Raycast polish layer)

#### Screen Room Dashboard (Top Section)

- **4 metric cards**: Total Screens, Available, In Use, Needs Attention
- **Utilization gauge**: Simple percentage ring showing screen utilization
- **Mesh count distribution**: Small horizontal bar chart showing inventory by mesh count
- **Reclaim queue**: List of screens needing reclaim, sorted by job urgency

### 4.2 Garment Catalog — Recommended UI Architecture

#### Primary View: Product Grid

- **Layout**: Responsive card grid (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- **Card anatomy**:
  - Product image (primary color, consistent background)
  - Brand + Style # (secondary text)
  - Product name (primary text)
  - Color swatch dots (first 6-8 + "+N more")
  - Quick-info: weight, fabric, size range
  - Stock indicator (green/yellow/red dot or bar)
- **Card style**: `bg-elevated` background, `border-border` with subtle border, `rounded-md` corners
  - **Hover**: Elevate with shadow transition + show "View Details" overlay
  - **Neobrutalist accent**: On featured/popular items, apply `4px 4px 0px` shadow in `--color-action`

#### Secondary View: Management Table

- **Toggle**: Grid ↔ Table view switcher
- **Table columns**: Style #, Brand, Name, Category, Colors (count), Sizes, Stock Status, Actions
- **Bulk actions**: Select + "Add to Quote", "Update Stock", "Archive"
- **For admin/management tasks**: Editing prices, managing stock, bulk operations

#### Catalog Filters (Left Sidebar or Top Bar)

- **Search**: Typeahead search by style number, brand, name, or description
- **Filter groups**: Category, Brand, Color Family, Size Range, Fabric, Weight Range, Features, Stock Status
- **Active filters**: Pill tags above the grid/table with "Clear All"
- **Saved views**: Bookmark icon to save filter combinations
- **URL-driven**: All filters reflected in URL query params (already a project standard)

#### Product Detail View

- **Full-page or large modal/drawer**
- **Image gallery**: Main image + thumbnails, color-matched to selected swatch
- **Color swatch strip**: Full list of available colors with names on hover
- **Size/color matrix**: Grid showing availability per size/color (Pattern A from section 2.4)
  - Green cells: In stock
  - Yellow cells: Low stock
  - Gray cells: Out of stock / not available
- **Product specs**: Fabric, weight, features as tag chips
- **Related products**: "Similar styles" carousel at bottom
- **CTA**: "Add to Quote" button (links to quoting vertical)

### 4.3 Design System Application

#### Linear Calm (Base Layer)

- **Monochrome table backgrounds**: `bg-primary` for page, `bg-elevated` for cards/table rows
- **Opacity-based text hierarchy**: Primary content at 87%, secondary at 60%, muted at 38%
- **Minimal borders**: Use subtle `border-border` dividers, not heavy lines
- **Restrained use of color**: Only status colors carry meaning

#### Raycast Polish (Polish Layer)

- **Smooth transitions**: 200ms ease for hover states, panel opens, view switches
- **Glass effect on overlays**: Backdrop blur on detail drawers and modals
- **Responsive micro-interactions**: Button press scales, table row highlight on hover
- **Command palette integration**: Quick-search screens or garments with Cmd+K style palette

#### Neobrutalist Delight (Attention Layer)

- **Primary CTAs**: "Add Screen" and "Add Garment" buttons with bold `4px 4px 0px` shadow
- **Status badges**: Bold borders on critical statuses (Needs Reclaim, Low Stock)
- **Empty state illustrations**: Bold, graphic illustrations with thick outlines
- **Spring animations**: Springy transitions on card hover, status badge changes (using Framer Motion spring)
- **Applied sparingly**: Only 1-2 neobrutalist elements per screen. The delight comes from contrast with the calm base.

---

## 5. Anti-Patterns to Avoid

### Screen Room Anti-Patterns

| Anti-Pattern                                  | Why It's Bad                                                                    | Better Approach                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Flat list with no status visualization**    | Can't see distribution at a glance                                              | Status badges + summary cards                              |
| **Forcing Kanban as the only view**           | Too many screens overwhelm columns; stored/retired screens don't fit a workflow | Offer both table and Kanban views                          |
| **No screen-to-job linking**                  | The whole point is production context                                           | Bi-directional links, always visible                       |
| **Manual status updates only**                | Error-prone, gets out of date                                                   | Auto-transitions where possible (assign to job → "In Use") |
| **Separate "screen room" isolated from jobs** | Screen room exists to serve production                                          | Deep links between screens and jobs                        |
| **Tracking too many statuses**                | Cognitive overload, screens get stuck in wrong status                           | 6-8 statuses max, clear transitions                        |
| **No tension/wear tracking**                  | Screens degrade silently until print quality suffers                            | Track tension, total reclaims, surface condition           |

### Garment Catalog Anti-Patterns

| Anti-Pattern                            | Why It's Bad                                                               | Better Approach                                        |
| --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Text-only catalog (no images)**       | Garments are visual products — impossible to identify without images       | Card-based grid with product images                    |
| **Flat list of all SKUs**               | 1 style × 40 colors × 8 sizes = 320 entries cluttering the list            | Hierarchical: Style → Color → Size matrix              |
| **No color swatches**                   | Users can't tell "Athletic Heather" from "Sport Grey" by name alone        | Visual color swatches always                           |
| **Hiding stock levels**                 | Production planning needs real-time stock knowledge                        | Always show stock status (even if mock in Phase 1)     |
| **One product image per style**         | Different colors look dramatically different                               | Per-color images (or at least colored silhouettes)     |
| **No quick path from catalog to quote** | The catalog exists to feed the quoting workflow                            | "Add to Quote" CTA on every product                    |
| **Complex nested navigation**           | Screen printing shops have 50-200 styles, not 50,000 — don't over-engineer | Simple category tabs + filters, not deep drill-downs   |
| **Ignoring the style number**           | Shop staff think in style numbers ("Grab me some G500s")                   | Style # should be prominent, searchable, and scannable |

### General Anti-Patterns

| Anti-Pattern                        | Why It's Bad                                            | Better Approach                               |
| ----------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| **No empty states**                 | New user sees a blank screen, no idea what to do        | Helpful empty states with CTAs                |
| **Filter state lost on navigation** | User builds a complex filter, clicks back, loses it all | URL-persisted filters                         |
| **No keyboard navigation**          | Power users (shop owners using this daily) need speed   | Full keyboard support, shortcuts              |
| **Overly decorative UI**            | This is production software, not a consumer app         | Linear calm as default, delight as accent     |
| **Not designing for scanning**      | Shop owners glance at dashboards between tasks          | Strong visual hierarchy, status-first layout  |
| **Ignoring print-friendly views**   | Some shops print job sheets, screen assignments         | Provide print-friendly detail views (Phase 2) |

---

## 6. Key Design Decisions Before Building

These decisions should be resolved during breadboarding, before implementation begins.

### Screen Room Decisions

| #   | Decision                     | Options                                                   | Recommendation                                                                                                                          |
| --- | ---------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Primary view mode**        | Table-first vs. Kanban-first                              | **Table-first** — more screens than active workflow. Kanban as secondary view for active screens only.                                  |
| 2   | **Status count**             | Minimal (4-5) vs. Detailed (8-10)                         | **7 statuses**: New, Coated, Exposed, In Use, Needs Reclaim, Stored, Retired. Matches physical reality without overcomplicating.        |
| 3   | **Detail view pattern**      | Side drawer vs. Full page vs. Modal                       | **Side drawer** (like Linear issue detail) — keeps table context visible.                                                               |
| 4   | **Screen-to-job linking UX** | Assign from job view vs. Assign from screen view vs. Both | **Both** — bi-directional. Primary flow is from job view ("which screens does this job need?") with quick-assign from screen inventory. |
| 5   | **Screen numbering**         | Auto-generated IDs vs. User-defined screen numbers        | **User-defined** — shops label physical screens with numbers/codes. Let them enter their own.                                           |
| 6   | **Tension tracking**         | Numeric input vs. Health indicator (Good/Fair/Poor)       | **Both** — numeric input for accurate tracking, health indicator derived from thresholds for quick scanning.                            |
| 7   | **Bulk operations needed**   | Which bulk actions?                                       | At minimum: Bulk status change, bulk assign to job, bulk retire.                                                                        |

### Garment Catalog Decisions

| #   | Decision                       | Options                                                        | Recommendation                                                                                                                                    |
| --- | ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Primary view mode**          | Card grid vs. Table                                            | **Card grid** for browsing, table toggle for management. Default to grid.                                                                         |
| 2   | **Catalog scope**              | Full supplier catalogs (10,000+ items) vs. Shop's curated list | **Curated list** — only garments the shop actually offers. Typically 50-200 styles. Phase 2 could add supplier API integration.                   |
| 3   | **Size/color matrix location** | In catalog card vs. Detail view only                           | **Detail view only** — cards show swatch count + size range. Full matrix in detail drawer.                                                        |
| 4   | **Stock tracking in Phase 1**  | Real stock numbers vs. Mock data only                          | **Mock data** with the UI designed to show real numbers later. Include stock indicators in the UI even with fake data.                            |
| 5   | **Image management**           | Upload per product vs. Pull from supplier APIs                 | **Upload per product** in Phase 1. Design for supplier API integration in Phase 2. Use placeholder silhouettes for missing images.                |
| 6   | **Catalog-to-quote flow**      | "Add to Quote" button → creates quote line item                | **Yes** — this is the primary action. Should pre-populate style, and then user selects color/sizes in the quote builder.                          |
| 7   | **Category taxonomy**          | Fixed categories vs. User-customizable                         | **Fixed** for Phase 1: T-Shirts, Long Sleeves, Sweatshirts/Hoodies, Polos, Outerwear, Tanks, Headwear, Bags/Accessories. Customizable in Phase 2. |
| 8   | **Brand management**           | Brands as a separate admin entity vs. Inline metadata          | **Separate entity** (even if simple) — brands have logos, preferred status, custom pricing. Worth the data model investment.                      |

### Cross-Cutting Decisions

| #   | Decision                   | Options                                              | Recommendation                                                                                       |
| --- | -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **View toggle pattern**    | Tabs vs. Segmented control vs. Icon toggle           | **Icon toggle** (grid icon / table icon) — compact, follows Linear pattern.                          |
| 2   | **Filter bar placement**   | Left sidebar vs. Top bar vs. Inline above table      | **Top bar** with dropdown panels — matches Linear's filter approach, doesn't steal horizontal space. |
| 3   | **Detail panel direction** | Slide from right vs. Slide from bottom vs. Full page | **Slide from right** for both — consistent pattern, keeps list context visible.                      |
| 4   | **URL state management**   | Which state goes in URL?                             | Filters, sort, view mode, selected item ID, pagination. Full bookmark-ability.                       |
| 5   | **Keyboard shortcuts**     | Which shortcuts to implement?                        | At minimum: `/` to search, `n` for new item, `j/k` for row navigation, `Enter` to open detail.       |

---

## Sources

### Manufacturing & Equipment Management

- [Katana MRP](https://katanamrp.com/) — Cloud inventory + manufacturing
- [MaintainX](https://www.getmaintainx.com/) — CMMS for equipment maintenance
- [UpKeep](https://upkeep.com/) — Asset management CMMS
- [Fishbowl Inventory](https://www.fishbowlinventory.com) — Inventory management for manufacturing
- [Manufacturo Kanban](https://manufacturo.com/manufacturo-manufacturing-management-software/kanban-management/)

### Screen Printing Industry

- [Printavo](https://www.printavo.com/) — Print shop management software
- [Printmatics](https://www.printmatics.com/) — Screen printing shop management
- [OnSite/ShopWorx](https://www.shopworx.com/) — Screen printing ERP
- [DecoNetwork](https://www.deconetwork.com/) — Print & embroidery management
- [Lawson Screen Products](https://lawsonsp.com/) — Screen lifecycle education
- [Chromaline](https://chromaline.com/) — Screen room automation

### Apparel/Wholesale Catalogs

- [S&S Activewear](https://www.ssactivewear.com/) — Wholesale apparel distributor
- [SanMar](https://www.sanmar.com/) — Wholesale apparel distributor
- [JOOR](https://www.joor.com) — B2B wholesale fashion platform
- [NuORDER](https://wizcommerce.com/joor-vs-nuorder/) — B2B commerce platform
- [Shopify Variants](https://help.shopify.com/en/manual/products/variants) — Product variant management

### UI/UX Research

- [UXPin — Inventory App Design](https://www.uxpin.com/studio/blog/inventory-app-design/)
- [Data Table Best Practices — UX Design World](https://uxdworld.com/data-table-design-best-practices/)
- [Cards vs Tables — UX Patterns](https://cwcorbin.medium.com/redux-cards-versus-table-ux-patterns-1911e3ca4b16)
- [Filter UI for SaaS — Eleken](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas)
- [Empty States in SaaS — UserPilot](https://userpilot.com/blog/empty-state-saas/)
- [NNGroup — Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [NNGroup — Neobrutalism](https://www.nngroup.com/articles/neobrutalism/)
- [Mobile Tables — UXmatters](https://www.uxmatters.com/mt/archives/2020/07/designing-mobile-tables.php)
- [TanStack Table](https://tanstack.com/table/latest)
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table)
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Manufacturing Dashboards — Tulip](https://tulip.co/blog/6-manufacturing-dashboards-for-visualizing-production/)
- [Neobrutalism Components](https://www.neobrutalism.dev/)
