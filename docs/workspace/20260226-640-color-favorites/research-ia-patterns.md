# IA & Feature Research: Navigation Taxonomy and Garment Catalog Patterns

**Pipeline:** 20260226-640-color-favorites
**Date:** 2026-02-27
**Purpose:** Competitive and IA research to inform nav taxonomy decisions and garment-related feature planning for Mokumo.

---

## 1. B2B SaaS Nav Taxonomy Patterns

### The Governing Principle

Across every major B2B SaaS product studied, the same organizing principle emerges:

> **Main navigation = things you do every day. Settings = how those things are configured.**

More precisely: the sidebar contains _operational objects and workflows_ — the entities you create, manage, and act on as part of running the business. Settings contains _administrative configuration_ — parameters that govern how the system behaves, but which rarely change once established.

Shopify Admin articulates this most cleanly in its own documentation: "The Settings section is where you manage the core configurations of your online store," while the main sidebar contains "core aspects of your business, including orders, products, and customers." The implication is explicit — Settings is for _store configuration_, the sidebar is for _business operations_.

Linear operationalizes this as _operational actions_ vs _configuration_. From the Linear docs: "Operational actions manipulate data (creating issues, changing status, applying labels)… Configuration establishes team-specific rules and structures in Settings, determining which operational features and workflows teams use." The sidebar is where you work; Settings is where you decide how work gets organized.

HubSpot's navigation redesign (documented in their product blog) was guided by "efficiency first, then findability" — meaning high-frequency usage patterns should dictate what gets top-level placement. Their research involved qualitative interviews, click tests, surveys, treejack studies, diary studies, card sorts, and unmoderated usability testing — extensive work to establish what users do _daily_ vs what they access episodically.

### Frequency of Use as the Primary Filter

The clearest test for nav placement is use frequency:

| Placement          | Criterion                         | Examples                                                                   |
| ------------------ | --------------------------------- | -------------------------------------------------------------------------- |
| Main nav (sidebar) | Used daily or on every session    | Orders, customers, products, schedule, analytics                           |
| Settings           | Configured once or rarely changed | Payment methods, team members, integrations, shop info, notification rules |

Shopify Admin's left sidebar contains: **Home, Orders, Products, Customers, Analytics, Marketing, Discounts, Apps**. Settings (separate section at the bottom) covers: general store info, payments, shipping, taxes, notifications, domain, account. The 8-item sidebar maps exactly to the set of daily operational tasks. Settings is for infrastructure that underpins those tasks but isn't itself a daily destination.

### The Preferences / Favorites Edge Case

"Preferences" and "favorites" represent a special case: they are _user-specific configuration_ that influences _daily operational behavior_. The key question is: does the user access this feature as part of their daily flow, or only when setting up/adjusting?

Linear's approach is instructive. It allows sidebar personalization (hiding items, pinning projects/initiatives/documents) directly from the sidebar itself — the customization is accessed contextually via right-click, not via a separate Settings page. The distinction: items the user frequently accesses become pinnable and surfaceable in-context. Bulk configuration lives in Settings.

Notion handles "Favorites" differently: it is a full section in the sidebar — "Favorites is where you can easily access all of the pages most important to you. This section will appear in your sidebar once you favorite your first page." For Notion, favorited items are daily navigation destinations, so they live in the sidebar proper.

The principle: **if the artifact itself is something the user navigates to (a garment page, a customer record), the favorites mechanism belongs in the sidebar or in the operational flow. If the artifact is a configuration rule or a data source, it belongs in Settings.**

### Item Count Thresholds

Research cited across multiple sources (including Miller's Law) establishes 5–7 items as the cognitive sweet spot for primary navigation. More than 7 items forces re-scanning and creates decision fatigue. Shopify's production admin sidebar demonstrates this: 8 items including Home and a dedicated Settings entry. Linear's sidebar has approximately 5–7 pinnable top-level items per workspace, with additional items accessible via teams.

### Contextual Links from Operational Pages to Their Settings

HubSpot redesigned global navigation to support contextual access — users arrive with specific goals, and navigation should reflect those workflows rather than forcing a separate trip to Settings. Shopify App settings are accessible from within the App context (the app listing itself, not from a global Settings page). The pattern: Settings for a specific entity should be reachable from that entity's operational view, not only from the top-level Settings menu.

**Implication for Mokumo:** A "Garments Settings" or "Catalog Settings" link should be accessible from the Garments feature itself, not only buried under a generic Settings page.

---

## 2. Print Shop Software — Feature & IA Landscape

### Printavo

**Product focus:** Shop management — the job lifecycle from quote to payment. Not primarily a catalog browser.

**Reconstructed navigation sections** (from support documentation categories and user descriptions):

| Section                 | What it does                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Today / Dashboard**   | "A Today screen where orders and tasks assigned to you for the day are easily viewable" — landing view |
| **Quotes**              | Create estimates, attach artwork, send for approval                                                    |
| **Invoices**            | Assign due dates, tasks, work orders, shipping labels, track goods to order                            |
| **Schedule / Calendar** | Visual production calendar, capacity overview, press assignments                                       |
| **Customers**           | Customer records, past orders, customer portal access                                                  |
| **Products / Catalogs** | Connect to SanMar, S&S Activewear, AlphaBroder catalogs; also custom products                          |
| **Purchase Orders**     | Create and manage POs to vendors, track receiving                                                      |
| **Storefronts**         | Printavo Merch + InkSoft stores (added later as an extension)                                          |
| **Settings**            | Subscription, payments, users, integrations, QuickBooks, EasyPost, automation rules                    |

**Garment / product catalog handling:**

Printavo's catalog feature is _transactional_, not _browsing-first_. The primary flow is: while creating a quote, you type a style code (e.g., "PC61 Black") and the system pulls pricing from S&S, SanMar, or AlphaBroder. The catalog is a lookup tool within the quoting workflow, not a standalone catalog-browsing experience.

Printavo introduced "Global Catalogs" — allowing shops to centrally manage which catalogs are active across the account and connect with account-specific pricing. This is configured in `My Account > Product Catalog` and is clearly a settings-area feature.

There is **no concept of shop favorites, preferred styles, or curated catalogs** in Printavo's documented feature set. The shop owner cannot mark preferred styles or create a curated subset of products for their team to use. Each quote requires looking up the desired style by code.

**Automation and workflow:** Printavo has custom automation rules (triggers + actions), scheduling, task assignment, and payment collection. These are its strongest operational features.

**What Printavo lacks** (relevant to Mokumo's scope):

- No catalog-browsing experience with visual filtering
- No favorites/preferred styles concept
- No color family browsing
- eCommerce requires separate InkSoft subscription
- No integrated artwork/design tool (requires GraphicsFlow add-on)

### InkSoft (now part of Inktavo)

**Product focus:** eCommerce first — online stores for end customers. Shop management is secondary via the "Shop Manager" module.

**Navigation sections** (from help documentation):

| Section            | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| **Stores**         | Create and manage online stores for teams/schools/corporate clients |
| **Products**       | Catalog of all products in the store; add/edit/remove               |
| **Store Art**      | Upload and manage art assets                                        |
| **Proposals**      | Customized quotes and invoices                                      |
| **Production**     | Assign tasks, custom workflows, measure productivity                |
| **Purchasing**     | Inventory tracking, supplier links                                  |
| **Store Settings** | Per-store configuration                                             |

**Garment / product catalog handling:**

InkSoft connects to AlphaBroder, S&S Activewear, and SanMar catalogs. The flow is: browse the supplier catalog within InkSoft, select products, add to a store. Product categories are a first-class concept — "Product categories allow you to organize and manage all of the products you offer in your InkSoft stores." Setting up categories is explicitly called out as a prerequisite for creating well-organized stores.

The "Managing Product Catalog" section documents how shops manage their own curated product catalog separate from the raw supplier feed. This is closer to a shop-scoped preferences concept: the shop decides which products are in their catalog (enabled for use in stores), and the supplier feed is the source of truth.

**Decoration Methods** are configurable per-product: Digital Print, Screen Print, Embroidery — with specific pricing grids attached to each. This is a form of product-level shop configuration.

**No explicit favorites** — but InkSoft's concept of a shop-managed product catalog (a curated subset of supplier styles) is functionally equivalent to a "preferred styles" list. The shop owner decides which styles appear in their system.

### DecoNetwork

**Product focus:** All-in-one — combines eCommerce, production management, artwork approvals, and supplier catalogs in a single subscription (contrasted with InkSoft's multi-product model).

**Feature scope:**

- Quotes and orders
- eCommerce / online stores
- Artwork approvals and mockup generation
- Production calendar with scheduling
- Inventory tracking
- Shipping management
- Supplier catalog integrations (US, UK, Australia, EU, Canada)
- Purchase orders

**Garment / product catalog handling:**

DecoNetwork's "Supplier Catalogs" provide "accurate products, pricing, colors, and stock data to quote faster." The emphasis is on live integration with supplier inventory — real-time stock and pricing rather than a cached or curated catalog. No explicit favorites/preferred styles documented.

**Notable:** DecoNetwork supports multi-decoration shops (screen print + DTF + DTG + embroidery + sublimation) from a single platform. This is a scope expansion Signal Print Pro should note for roadmap planning.

### YoPrint

**Product focus:** Cloud-based, multi-decoration shop management (screen printing, DTG, DTF, embroidery, promo products).

**Key features:**

- Order management
- Production management with drag-and-drop scheduler
- Inventory management
- Real-time vendor stock and pricing (SanMar, AlphaBroder, S&S, Augusta Sportswear, SanMar Canada)
- Customer self-service portal
- "One scan brings up everything needed to complete a job, including production files, mockups, garments, and inventory"

YoPrint added **real-time vendor stock and pricing** as a significant feature update — dealers can check live inventory before quoting, preventing jobs on out-of-stock garments. This is a meaningful capability gap in Print Screen Pro's current implementation.

### ShopVox

**Product focus:** Print shop and sign shop management with custom pricing templates.

**Notable features:**

- Customizable pricing templates for all product types
- Integration with vendor catalogs for product selection during quoting
- Online proofing (artwork approval)
- Job Board and workflow management
- QuickBooks integration
- Business Intelligence dashboards

ShopVox's garment handling is catalog-lookup-in-quoting (same model as Printavo) with no visual browsing or favorites concept documented.

### Feature Gaps and Competitive Opportunities

Mokumo's color family filtering and visual garment browsing (current work in the #632 epic) represents a **differentiated capability** that competitors do not appear to offer. Across Printavo, InkSoft, DecoNetwork, YoPrint, and ShopVox, garment selection is uniformly a _style-code lookup_ within the quoting workflow — not a _visual catalog browsing_ experience.

**Features competitors have that Mokumo should plan to build:**

| Feature                        | Competitors with it                | Priority Signal                              |
| ------------------------------ | ---------------------------------- | -------------------------------------------- |
| Real-time vendor stock/pricing | YoPrint, DecoNetwork               | High — prevents quoting unavailable garments |
| Artwork/mockup generation      | DecoNetwork, InkSoft, GraphicsFlow | Medium — roadmap item                        |
| Online customer portal         | Printavo, InkSoft, YoPrint         | High — customer approval workflow            |
| Purchase order management      | Printavo, DecoNetwork, ShopVox     | Medium — garment sourcing completion         |
| Online stores / merch          | InkSoft, DecoNetwork               | Medium — downstream revenue for clients      |
| Multi-decoration support       | DecoNetwork, YoPrint               | Low — screen print focus is correct for now  |

**Features Mokumo has that competitors lack:**

- Visual color family taxonomy and browsing
- Curated shop-scoped garment catalog (is_enabled / is_favorite per style)
- Dense swatch grid with color filtering (hue-bucket tabs)

---

## 3. Garment Distributor Portal Patterns

### S&S Activewear

S&S Activewear (ssactivewear.com) is the primary supplier integration in Mokumo. Their dealer portal is the operational interface print shops use to browse, order, and track wholesale garments.

**Catalog navigation structure:**

S&S organizes by product category (T-Shirts, Polos, Sweatshirts, Activewear, Outerwear, Caps, Bags, Accessories, etc.) with multi-dimensional filtering:

- Brand
- Size
- Color
- Fabric / material
- Gender/age
- Feature attributes (moisture-wicking, high-visibility, etc.)
- Price

The "categories" landing page (`ssactivewear.com/categories`) is the primary browsing entry point.

**Account section (My Account):**

| Account feature           | What it does                   |
| ------------------------- | ------------------------------ |
| Order History             | View and re-access past orders |
| Order Tracking            | Track shipments                |
| Invoices                  | Access invoice records         |
| Payment Methods           | Manage saved payment           |
| Manage Shipping Addresses | Configure delivery locations   |
| Account Statement         | View account balance/history   |

S&S added several enhancements in recent platform updates including:

- **Product Comparisons** — compare items across categories
- **Extended Sessions** — users no longer logged out after 2 hours (a long-requested dealer feature)
- **Mobile optimization** — improved browsing on mobile devices
- **Consolidated product pages** — all specs on a single product page

**Favorites / saved lists:** No explicit "favorites" or "saved styles" feature is documented in S&S's public help documentation or FAQ pages. The account features are primarily order-management focused. There is no evidence of a dealer-facing "preferred styles" or "saved list" concept in the S&S portal.

The "Find your favorite clothing" marketing tagline on their homepage (`ssactivewear.com`) is marketing copy, not a technical feature — it refers to browsing the catalog, not saving favorites.

### SanMar

SanMar (`sanmar.com`) is a major premium supplier (Port Authority, Sport-Tek, Nike, The North Face, Carhartt, etc.). Their portal was rebuilt on SAP Hybris.

**Catalog navigation:**

SanMar organizes by product type with a top-level category structure:

- T-Shirts, Polos, Sweatshirts, Caps, Activewear, Outerwear, Woven Shirts, Bottoms, Workwear, Bags, Accessories, Personal Protection

Dealers can browse by product category, color groups, new arrivals, and sale status. A dedicated **Product Navigators** section (`sanmar.com/resources/productmaterials/productnavigators`) provides curated product guides.

**Account features (My SanMar):**

- Order History
- Online returns
- Address management (role-based)
- Password management

**Catalogs:** SanMar offers both print catalogs and customizable e-catalogs through ZoomCatalog. Dealers can create branded catalogs for their end customers — selecting which styles to include and adding their own pricing. This is the closest distributor feature to a "preferred styles" concept: the dealer curates a catalog for client presentations.

**Saved lists:** Not documented in public-facing portal features. The catalog customization tool (ZoomCatalog) is closest to a "saved styles" workflow, but it is catalog-presentation focused (for showing clients), not shop-operational.

### ShirtSpace

ShirtSpace is a wholesale apparel distributor with a dealer-facing browsing experience. Their catalog navigation demonstrates the standard distributor pattern:

- Category browsing (T-Shirts, Sweatshirts, Tank Tops, Bags, Hats, etc.) with cut subcategories (Men, Women, Unisex, Kids)
- Brand filtering with visual brand logos
- Attribute filters (100% Cotton, Long Sleeve, Moisture-Wicking)
- Price-based sections (Under $5)
- Decoration-method sections (DTF, DTG, Screen Printing, HTV)

No explicit favorites or saved styles in documented portal features.

### Pattern Summary: Distributors Don't Solve the Curation Problem

Across S&S Activewear, SanMar, and ShirtSpace, there is a consistent pattern:

1. **Distributors provide raw catalog browsing** — all styles, filterable by attributes
2. **Distributors do not provide shop-level curation** — no way to mark "these 40 styles are the ones my shop actually uses"
3. **The nearest equivalent is catalog-builder tools** (SanMar's ZoomCatalog) — but these are for client presentations, not internal shop workflows

This creates a gap that print shop management software must fill. Shops mentally maintain a list of "house styles" — the garments they stock, recommend, or regularly use — but no distributor portal surfaces or formalizes this concept. The shop owner ends up with this knowledge in their head.

**Mokumo's garment catalog with `is_enabled` and `is_favorite` per style is building directly into this gap.** Competitors don't offer it. Distributors don't solve it. It is a genuine workflow need that has no current tool solution.

---

## 4. Synthesis: Implications for Mokumo

### The Right Principle for Main Nav vs Settings

Based on the research, the governing principle is:

> **Main nav contains the verbs of running the shop. Settings contains the nouns that define how the shop runs.**

More precisely:

| Main nav (sidebar)               | Settings                            |
| -------------------------------- | ----------------------------------- |
| Objects you act on daily         | Parameters you configure once       |
| Workflows with high frequency    | Rules that govern workflows         |
| Places you navigate to by intent | Pages you visit to adjust behavior  |
| Revenue-generating activities    | Infrastructure for those activities |

Applied to Mokumo:

**Main nav (sidebar) candidates:**

- Dashboard / Today
- Jobs (the full quote → invoice lifecycle)
- Schedule / Calendar
- Customers
- Garments (catalog browsing + shop-scoped curation)
- Screen Room
- Reports / Analytics

**Settings candidates:**

- Shop profile (name, address, logo)
- Pricing defaults (markup rules, setup fees)
- Users and permissions
- Integrations (S&S credentials, SanMar credentials, QuickBooks)
- Notification rules
- Catalog sources (which suppliers are connected, global catalog preferences)
- Decoration methods and pricing grids

**The borderline case — Garment Catalog Configuration:**

"Which suppliers are connected" is Settings. "Which styles my shop uses" is operational — it belongs in the Garments feature itself, not in Settings. The `is_enabled` / `is_favorite` toggles on styles are workflow actions (the owner is curating their working catalog), which means they belong in the Garments feature's operational view, with a contextual link to supplier connection settings from within that feature.

This mirrors the Shopify pattern: pinning a sales channel is done from within the App/Channel context, not from the top-level Settings. Favoriting a page in Notion happens in the sidebar, not in Settings. The action of marking a style as preferred should happen while browsing garments, not by navigating to Settings first.

### Where Garment Favorites / Preferences Belong

**Not in Settings.** Favorites and `is_enabled` toggles are operational actions taken while browsing the catalog. They belong in the Garments feature as first-class interactive controls.

**Specifically:**

1. **`is_enabled` (shop catalog toggle):** Belongs in the Garments list view as a toggle that can be applied per style. Possibly also accessible via bulk actions ("enable all Gildan styles"). The Settings area should only contain the _source-level_ configuration (which supplier catalogs are connected).

2. **`is_favorite` (shop-scoped star/heart):** Belongs in the GarmentCard and GarmentDetail view as an inline action. Should be surfaceable as a filter ("Show favorites only") from the main Garments list.

3. **Color favorites** (the #640 work): Belong in the color browsing/filter UI as an inline toggle, with a "Favorites" filter tab or section. Not in Settings.

4. **A "My Catalog" or "House Styles" view:** A filtered view of the full supplier catalog showing only `is_enabled` styles — this is a main-nav-level destination, not a Settings page. The conceptual model: the shop owner curates their house catalog from the full supplier feed, and their team then browses/searches within house catalog.

### What Garment-Related Features Mokumo Should Plan to Build

In priority order based on what competitors have and what fills genuine gaps:

**Near-term (Waves already in motion):**

1. Color family filter with favorites (current work) — differentiator, no competitor has it
2. Shop catalog curation (`is_enabled` per style) — addresses the distributor gap identified above

**Medium-term (in the garments vertical):** 3. **Real-time stock availability** — YoPrint has this; prevents quoting unavailable garments. Requires polling S&S/SanMar inventory endpoint at quote time. 4. **Purchase order generation from job** — Printavo and DecoNetwork have this; completes the garment sourcing loop within one tool 5. **"House catalog" / curated view** — formalize the shop's preferred style list as a navigable first-class view 6. **Color by style/variant** — showing available colors for a selected style inline in quoting (current S&S API returns this)

**Longer-term:** 7. **Custom product upload** — shops carry styles not in S&S/SanMar (local vendor specials, custom blanks) 8. **Receiving / check-in flow** — mark received garments against POs; Printavo and DecoNetwork both have this 9. **SanMar integration** — second supplier source; SanMar has different brand coverage (Nike, The North Face, etc.)

### Recommended Nav Taxonomy for Mokumo

Based on all research above:

**Primary sidebar items** (operational, daily-use):

| Item        | Rationale                                                                |
| ----------- | ------------------------------------------------------------------------ |
| Dashboard   | Landing state — blocked jobs, recent activity, in-progress               |
| Jobs        | Core entity — the full quote → approval → production → invoice lifecycle |
| Schedule    | Production calendar; high-frequency destination for production staff     |
| Customers   | CRM records; accessed when creating/reviewing jobs                       |
| Garments    | Catalog browsing + shop curation; accessed during quoting and planning   |
| Screen Room | Screen inventory, burn status; accessed by screen room operator daily    |
| Reports     | Analytics; accessed weekly/monthly by owner                              |

**Settings (configuration, episodic access):**

| Section            | Contents                                              |
| ------------------ | ----------------------------------------------------- |
| Shop               | Name, address, logo, timezone, defaults               |
| Pricing            | Markup rules, setup fees, tax rates                   |
| Catalog Sources    | Supplier API credentials (S&S, SanMar), sync settings |
| Decoration Methods | Print types, pricing grids                            |
| Users              | Team members, roles, permissions                      |
| Integrations       | QuickBooks, Zapier, etc.                              |
| Notifications      | Alert rules, email templates                          |
| Billing            | Subscription management                               |

**Navigation item count:** 7 sidebar items (Dashboard, Jobs, Schedule, Customers, Garments, Screen Room, Reports) plus Settings at bottom — within the 5–7 cognitive limit, with Settings as a secondary slot consistent with Shopify Admin's pattern.

**Contextual link pattern:** The Garments sidebar item leads to the catalog. From within the Garments catalog, a contextual "Catalog Settings" link (gear icon, top-right) provides access to supplier connection settings — without requiring the owner to navigate to Settings > Catalog Sources independently.

---

## Research Sources

- [HubSpot — The Journey of Redesigning HubSpot's Global Navigation](https://product.hubspot.com/blog/new-hubspot-nav)
- [HubSpot — Categories, Associations, and Navigation Design](https://product.hubspot.com/blog/categories-associations-and-navigation-design)
- [Linear — Conceptual Model Documentation](https://linear.app/docs/conceptual-model)
- [Linear — Personalized Sidebar Changelog](https://linear.app/changelog/2024-12-18-personalized-sidebar)
- [Linear — How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Notion — Navigate with the sidebar](https://www.notion.com/help/navigate-with-the-sidebar)
- [Shopify Admin Guide 2026 — FireBear Studio](https://firebearstudio.com/blog/shopify-admin.html)
- [Shopify Help Center — Navigating the Shopify admin](https://help.shopify.com/en/manual/shopify-admin/shopify-admin-overview)
- [Printavo — Features](https://www.printavo.com/features/)
- [Printavo — Walkthrough](https://www.printavo.com/blog/printavo-walkthrough/)
- [Printavo — Products & Catalogs support section](https://support.printavo.com/hc/en-us/sections/115000999927-Products-Catalogs)
- [Printavo — Global Catalogs](https://support.printavo.com/hc/en-us/articles/1260804731629-Global-Catalogs)
- [Inktavo — Product family overview](https://www.inktavo.com/)
- [InkSoft — Training: Product Categories and Supplier Catalogs](https://help.inksoft.com/hc/en-us/articles/8279436520219-Training-Session-1-Product-Categories-Adding-Products-from-Supplier-Catalogs-and-Managing-your-Blank-Products)
- [InkSoft — Managing Product Catalog](https://help.inksoft.com/hc/en-us/articles/8703879774107-Managing-Product-Catalog)
- [DecoNetwork — vs Printavo comparison](https://www.deconetwork.com/deconetwork-vs-printavo/)
- [DecoNetwork — Ultimate Guide to Print Shop Management Software](https://www.deconetwork.com/the-ultimate-guide-to-print-shop-management-software/)
- [OrderMyGear — New Feature: Product Catalog](https://www.ordermygear.com/blog/omg-updates/new-feature-product-catalog/)
- [YoPrint — Homepage](https://www.yoprint.com/)
- [ShopVox — Print Shop Software](https://shopvox.com/print-shop-software/)
- [S&S Activewear — Help Center](https://www.ssactivewear.com/helpcenter/)
- [S&S Activewear — Categories](https://www.ssactivewear.com/categories)
- [SanMar — Platform Updates](https://www.sanmar.com/updates)
- [SanMar — Data Library](https://www.sanmar.com/resources/electronicintegration/sanmardatalibrary)
- [ShirtSpace — Homepage](https://www.shirtspace.com/)
- [Navigation UX Best Practices for SaaS Products — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-navigation)
- [B2B SaaS UX Design — Onething Design](https://www.onething.design/post/b2b-saas-ux-design)
