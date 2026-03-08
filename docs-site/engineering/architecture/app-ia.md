---
title: App Information Architecture & Product Philosophy
updated: 2026-02-27
research_basis: docs/workspace/20260226-640-color-favorites/research-ia-patterns.md
---

# Mokumo — App Information Architecture & Product Philosophy

> Living document. Update whenever a new feature raises a taxonomy question.
> Canonical reference for: where new features go, how preferences work, how routing is structured.
> See `docs/APP_FLOW.md` for the concrete route inventory. This doc explains the _why_ behind that inventory.

---

## The Governing Principle

> **Main nav = verbs of running the shop. Settings = nouns that define how it runs.**

More precisely:

| Main nav (sidebar)               | Settings                            |
| -------------------------------- | ----------------------------------- |
| Objects you act on daily         | Parameters you configure once       |
| Workflows with high frequency    | Rules that govern workflows         |
| Places you navigate to by intent | Pages you visit to adjust behavior  |
| Revenue-generating activities    | Infrastructure for those activities |

Empirical basis: this principle is consistent across Shopify Admin, Linear, HubSpot, Notion, Airtable.
Applied test: _"Do I go here as part of doing my job, or to change how the system behaves?"_

---

## Nav Taxonomy

### Main Sidebar (operational, daily-use — target: 7 items)

| Item        | What it is                                                      | Status                           |
| ----------- | --------------------------------------------------------------- | -------------------------------- |
| Dashboard   | Landing state — blocked jobs, recent activity, what's due today | Exists                           |
| Jobs        | Full lifecycle: quote → artwork approval → production → invoice | Exists (split: Quotes, Invoices) |
| Schedule    | Production calendar; daily destination for production staff     | Planned                          |
| Customers   | CRM records; accessed when creating or reviewing jobs           | Exists                           |
| Garments    | Visual catalog browse + shop curation (inline favorites)        | Exists                           |
| Screen Room | Screen inventory, burn status; accessed by screen room operator | Exists                           |
| Reports     | Analytics; accessed weekly/monthly by owner                     | Planned                          |

**On "Quotes" and "Invoices" as separate items**: these are phases of the same entity (a job). Long-term, they merge under "Jobs." Short-term, they remain separate while the job model matures.

**Cognitive limit:** 5–7 items is the research-backed sweet spot. We target 7. Adding an 8th requires retiring something or merging.

### Settings (configuration, episodic access)

| Section            | Contents                                                                      |
| ------------------ | ----------------------------------------------------------------------------- |
| Shop               | Name, address, logo, timezone, currency, defaults                             |
| Pricing            | Markup rules, setup fees, tax rates, decoration pricing grids                 |
| Catalog Sources    | S&S Activewear API credentials, SanMar credentials, sync settings             |
| Decoration Methods | Print types offered (screen print, DTF, embroidery), pricing grids per method |
| Users              | Team members, roles, permissions                                              |
| Integrations       | QuickBooks, Zapier, EasyPost, etc.                                            |
| Notifications      | Alert rules, email templates                                                  |
| Billing            | Subscription management                                                       |

**What does NOT go in Settings:**

- Garment favorites (operational curation, belongs inline in Garments)
- Style enable/disable (operational catalog management, belongs inline in Garments)
- Color group preferences (inline in ColorFilterGrid within Garments)

---

## Interaction Patterns

### 1. Inline Actions (preferred for curation)

When the user is curating a catalog or marking preferences, the action belongs in the browsing context — not on a separate configuration page.

**Pattern:** Star icon / toggle directly on the card or chip. Favoriting or enabling a style happens while browsing styles. The effect (surfacing order, enabled state) is visible immediately.

**Examples:**

- Star on GarmentCard → `is_favorite` for that style
- Eye/toggle on GarmentCard → `is_enabled` for that style
- Star on color group chip in ColorFilterGrid → color group preference
- Star on brand chip in brand filter → brand preference

**Research basis:** Linear (sidebar item pinning), Notion (page favoriting), Shopify (app pinning) — all use inline actions rather than dedicated configuration pages for preference marking.

### 2. Contextual Links (from operational to config)

When the user needs to reach configuration from within an operational view, provide a contextual link rather than requiring navigation to global Settings.

**Pattern:** Gear icon or "Settings →" link from within the feature, linking to the relevant Settings subsection.

**Examples:**

- Garments page: gear icon → Settings > Catalog Sources (supplier connection config)
- Jobs page: gear icon → Settings > Decoration Methods

This pattern is from HubSpot's IA redesign: users arrive with specific goals, navigation should support those workflows without forcing a separate trip to Settings.

### 3. Dedicated Config Pages (for complex setup)

Some configuration is too complex for inline actions — it requires a full screen, form, or multi-step flow. These live in Settings.

**Examples:**

- Setting up markup rules (Settings > Pricing)
- Connecting a new supplier API (Settings > Catalog Sources)
- Adding team members (Settings > Users)

**Decision rule:** If the configuration requires more than 2 inputs or a form, it belongs in Settings. If it's a single toggle or star, it's inline.

---

## Multi-Scope Preferences (Shop → Customer)

### The Scope Model

Preferences follow a priority cascade. Higher priority overrides lower:

```
Shop defaults (lowest priority)
    └── Customer overrides (highest priority in V1)
          [future: per-session context override]
```

- **Shop scope (`scope_type='shop'`)**: The baseline. Applies to all quoting unless overridden.
- **Customer scope (`scope_type='customer'`)**: Override set per customer. Only active when that customer's context is selected.

The shop owner sets shop defaults once (during setup) and adjusts occasionally. Customer overrides are set when a specific customer has known preferences that differ from shop defaults.

### Three Tiers of Preference (Issue #640)

| Tier        | What is favorited                                  | Table                             | Unit                                            |
| ----------- | -------------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| Brand       | Which supplier brands the shop prefers             | `catalog_brand_preferences`       | `brand_id`                                      |
| Style       | Which styles within a brand the shop prefers       | `catalog_style_preferences`       | `style_id`                                      |
| Color group | Which color groups within a brand the shop prefers | `catalog_color_group_preferences` | `color_group_id` → `(brand_id, colorGroupName)` |

### Enable vs Favorite

Two distinct concepts, both managed inline:

| Control           | What it means                                                                              | Visual          |
| ----------------- | ------------------------------------------------------------------------------------------ | --------------- |
| **`is_enabled`**  | Style/brand is part of the shop's working catalog. Disabled items don't appear in quoting. | Eye/toggle icon |
| **`is_favorite`** | Among enabled items, this one is preferred. Surfaces first in browsing and quoting.        | Star icon       |

An item can be:

- Enabled + favorited → shown first (star, bold)
- Enabled + unfavorited → shown below favorites (no star)
- Disabled → hidden from quoting; visible in catalog with dim/toggle to re-enable

### Visual Patterns for Scope Display

When viewing in **shop mode** (default): actions modify shop defaults.

When viewing in **customer mode** (customer context active):

- Customer overrides shown with a scope badge (`C` or `customer name`)
- Items inheriting shop default shown with a subtle "inheriting" indicator
- Toggling a star in customer mode sets a customer-specific override, not a shop default

**Key principle:** Never silently mix scopes. Always show the user which scope they are editing.

---

## Routing Conventions

| Pattern                 | Rule                          | Example                                          |
| ----------------------- | ----------------------------- | ------------------------------------------------ |
| Top-level features      | Match main nav item           | `/garments`, `/jobs`, `/customers`               |
| Feature sub-pages       | Nested under feature prefix   | `/jobs/board`, `/jobs/[id]`                      |
| Settings                | All under `/settings/` prefix | `/settings/pricing`, `/settings/catalog-sources` |
| Context-specific config | Query param on feature page   | `/garments?scope=customer&customerId=[id]`       |
| Mockup routes           | Under `/mockup/`              | `/mockup/catalog-preferences` — dev only         |

**Rule:** A route under `/settings/` signals "this is configuration." A route under a feature prefix signals "this is operational work." Preferences and curation live at the feature level, not `/settings/`.

---

## Feature Placement Decision Criteria

When a new feature arises, ask:

1. **Frequency test:** Do users go here as part of daily work, or only to change how something behaves?
   - Daily → main nav consideration
   - Episodic → Settings

2. **Inline test:** Can the action happen within an existing operational view?
   - Yes → inline action, no new page needed
   - No → consider a dedicated page under the relevant feature, not Settings

3. **Complexity test:** Does configuration require a form with 3+ inputs?
   - Yes → dedicated Settings page
   - No → inline action or contextual link from Settings

4. **Scope test:** Does the feature operate at shop scope, customer scope, or both?
   - Shop scope only → no context switcher needed
   - Both → build context switcher; never silently mix scopes

5. **Nav item count test:** Does adding this as a main nav item push the count above 7?
   - If yes → evaluate merging with an existing item, or placing inline within an existing feature

---

## Industry Context

**Differentiated capabilities:**

- Visual garment catalog with color family taxonomy and dense swatch browsing
- Shop-scoped `is_enabled` / `is_favorite` per style (shop curation of supplier catalog)
- Color group preferences at the `(brand_id, colorGroupName)` level

**Planned capabilities:**

- Real-time vendor stock/pricing at quote time
- Purchase order generation from job
- Customer self-service portal
- Artwork/mockup generation

**The distributor gap:** S&S Activewear and SanMar provide raw catalog access with no shop-level curation. Every print shop maintains a mental "house catalog" of preferred styles. No distributor tool formalizes this. Mokumo's `is_enabled` + `is_favorite` system fills this gap.

---

## Change Log

| Date       | Change        | Reason                                                                                                        |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-02-27 | Initial draft | Research pass on B2B SaaS IA patterns + print shop competitive landscape for Issue #640 nav taxonomy question |
