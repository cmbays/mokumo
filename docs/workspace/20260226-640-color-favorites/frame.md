---
shaping: true
pipeline: 20260226-640-color-favorites
issue: 640
date: 2026-02-27
stage: shaping
---

# Issue #640 — Color Group Favorites: Frame

## Source

From interview (2026-02-26):

> "From the user's perspective, they will want to be able to favorite things. I think maybe it would be worth simplifying this a little bit just to meet the users' probably where their highest expectations would be. The all-brands global view is probably less useful and so we might be able to just ditch that and focus on having favoriting for colors be on the supplier or brand level so you can favorite brand colors basically and you can favorite brand styles and then you have that next layer down of customer preferences where the customer can basically have an override."

> "When I think about how this might work as a shop owner, I want to select which styles and color groups are favorites at a brand level and I want those to basically surface first or at the top whenever I need to make selections."

> "As a shop owner I have customers that have specific tastes and I want to be able to capture those tastes as their preferences and be able to update and override the shop preferences both at the style and at the color."

> "I think an open question is should we provide the ability to set your customer preferences in this garments catalog or does it make more sense to basically do that within the customer page? [...] it might be better for a v1 to just have all the preference setting largely be intended to be done on the garments page."

> "You can favorite the brand, you can favorite the colors for a brand and the styles for a brand."

> "When you look at a customer you should be able to see the customer-specific favorites that have been set and not necessarily the shop preferences because the shop is basically going to know what their preferences are."

> "I think if a customer has preferences it could be the case that the shop defaults sort of show up second, right? Like you have your customer favorites that are stand out for the customer and then you have your shop favorites after that and then you have everything else."

> "I don't think we necessarily need to try to get into the details of favoriting individual colors though." [confirming colorGroupName level, not individual catalog_colors rows]

---

## Problem

When selecting garments for a quote or browsing the catalog, the shop owner sees every brand, style, and color in equal priority — no signal about which ones they actually use. The shop owner needs to remember, mentally, that this customer always wants Navy S&S basics, or that they never use Jerzees. As the catalog grows (4,800+ styles, 30,000+ colors), undifferentiated lists become unusable noise.

The shop needs a way to mark favorites at three levels — brand, style within a brand, and color group within a brand — and have those favorites surface first at every selection point. Customer-specific tastes should override shop defaults when a customer is in context.

---

## Outcome

Shop owner can configure garment preferences (brand favorites, style favorites, color group favorites) per brand, visible and editable from the Garments area. At every selection surface in the app — catalog browser, quote picker — favorited items surface first. When working with a specific customer, that customer's saved preferences take priority over shop defaults.

Saved preferences are never lost when the user unfavorites or disables an item; disabling/re-enabling always restores prior state.
