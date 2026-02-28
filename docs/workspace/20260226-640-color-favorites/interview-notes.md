---
shaping: true
pipeline: 20260226-640-color-favorites
issue: 640
date: 2026-02-26
stage: interview
---

# Issue #640 — Color Group Favorites: Interview Notes

## Interview Date

2026-02-26

## Source (verbatim user quotes)

> "From the user's perspective, they will want to be able to favorite things. I think maybe it would be worth simplifying this a little bit just to meet the users' probably where their highest expectations would be. The all-brands global view is probably less useful and so we might be able to just ditch that and focus on having favoriting for colors be on the supplier or brand level so you can favorite brand colors basically and you can favorite brand styles and then you have that next layer down of customer preferences where the customer can basically have an override."

> "When I think about how this might work as a shop owner, I want to select which styles and color groups are favorites at a brand level and I want those to basically surface first or at the top whenever I need to make selections."

> "As a shop owner I have customers that have specific tastes and I want to be able to capture those tastes as their preferences and be able to update and override the shop preferences both at the style and at the color."

> "I think an open question is should we provide the ability to set your customer preferences in this garments catalog or does it make more sense to basically do that within the customer page? [...] it might be better for a v1 to just have all the preference setting largely be intended to be done on the garments page."

> "You can favorite the brand, you can favorite the colors for a brand and the styles for a brand."

> "When you look at a customer you should be able to see the customer-specific favorites that have been set and not necessarily the shop preferences because the shop is basically going to know what their preferences are."

> "I think if a customer has preferences it could be the case that the shop defaults sort of show up second, right? Like you have your customer favorites that are stand out for the customer and then you have your shop favorites after that and then you have everything else."

> "The customer record includes its basically like a company and you can have multiple contacts and stuff within that but as of right now we're only going to be focused on preferences, like a single record of preferences per customer."

> "I don't think we necessarily need to try to get into the details of favoriting individual colors though." [confirming colorGroupName level, not individual catalog_colors rows]

---

## Decisions Made

### D1: No global scope — brand-anchored favorites only

- Original design had a "global shop defaults" scope
- **Decision**: Eliminate global. All shop favorites are tied to a brand/supplier.
- Rationale: Simpler model, more useful in practice. The "all-brands global" view has low utility.

### D2: Three layers of favorites, always brand-anchored

1. **Brand favorites** — which suppliers/brands the shop prefers (e.g., ★ S&S Activewear, ★ SanMar)
2. **Style favorites** (per brand) — which styles within a brand (e.g., ★ Gildan 18000)
3. **Color group favorites** (per brand) — which colorGroupNames within a brand (e.g., ★ Navy, ★ Sport Grey)

### D3: Customer preferences override shop favorites

- Customer has their own preferred brands, styles, and color groups
- **Priority ordering when viewing**: Customer favorites → Shop favorites → Everything else
- Customer page shows customer-specific preferences only (not shop defaults)
- One preferences record per customer (customer = company record)

### D4: colorGroupName level favoriting, NOT individual color rows

- Favorites apply to canonical color groups (e.g., "Navy") not individual `catalog_colors` rows
- This aligns with the ColorFilterGrid (Wave 3) which already operates at colorGroupName level
- **Architectural implication**: The existing `catalogColorPreferences` table stores by `color_id` — a new group-level preference abstraction is needed

### D5: V1 — all preference setting happens on the Garments page

- Not on the Customer page (would require embedding a full garment catalog in customers)
- Customer page: display customer preferences (read-like view)
- Garments page: set both shop preferences AND customer-specific preferences

### D6: Quote Builder integration (future surface, foundation now)

- Garment picker in quotes is currently a clunky dropdown — needs to be rebuilt
- Favorites ordering: Supplier selection → favorited suppliers first; Style selection → favorited styles first; Color selection → favorited colors surface at top
- When a customer is selected on a quote: customer preferences take priority over shop preferences
- **This feature (Wave 4) is the foundation for the Quote Builder garment picker UX**

---

## Open Questions (from interview)

| #   | Question                                                                                                                     | Status                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| OQ1 | Exact UI treatment: float to top vs filter to only favorites vs badge/highlight                                              | Open — defer to visual mockup  |
| OQ2 | How to set customer preferences from Garments page — drawer? modal? customer selector?                                       | Open — defer to visual mockup  |
| OQ3 | Should the shop be able to see all customers' preferences from the Garments page, or only when a customer context is active? | Open                           |
| OQ4 | What happens if a customer has no preferences set — fall through to shop favorites entirely?                                 | Likely yes, needs confirmation |
| OQ5 | Brand favoriting: is this purely ordering/filtering, or does it also hide non-favorited brands entirely?                     | Open                           |

---

## Competitor Research Findings

- **Printavo**: No color favoriting at any scope. Color is static variant attribute.
- **InkSoft**: Shop-level ink palette management only. No customer-level color prefs.
- **DecoNetwork**: Catalog-wide color filter widgets. No personalization.
- **S&S/AlphaBroder portals**: Style-level favorites for dealers. No color-level preferences.
- **Conclusion**: Multi-scope color preferences are **not yet productized** in any competitor. We're building something novel.

---

## Codebase Findings

| Finding                                                                      | Implication                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `catalogColorPreferences` stores by `color_id` (individual rows)             | Need group-level preference abstraction — new table or column |
| `catalogColorPreferences.scope_type` = 'shop' \| 'brand' (customer deferred) | Schema already has brand scope; needs colorGroupName pivot    |
| `catalogStylePreferences` mirrors same scope pattern for styles              | Style favorites can reuse existing table — just needs UI      |
| Brand favorites have no DB table yet                                         | New table needed: `catalogBrandPreferences`                   |
| `FavoritesColorSection` mutations are in-memory only                         | Server actions needed for all three preference types          |
| Wave 3 `ColorFilterGrid` operates at colorGroupName level                    | Aligns with D4 — favorites must match this level              |

---

## Next Steps

1. Visual mockup session — wireframe key screens to resolve OQ1, OQ2, OQ3
2. Frame.md + shaping.md after visual design aligns
3. Spike: data model for group-level color preferences
4. Breadboarding → Implementation planning
