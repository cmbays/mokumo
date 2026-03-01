---
shaping: true
pipeline: 20260228-inventory-pipeline
---

# Inventory Visibility — Frame

## Source

> GitHub Issue #600 — feat(analytics): inventory pipeline — raw source + dbt models for stock levels

> GitHub Issue #165 — Add real-time inventory availability to garment selection

> Interview (2026-02-28, Christopher Bays, owner perspective):
>
> "If a garment is out of stock or near out of stock, then it would probably be wise to have some form of a warning so that if Gary goes to build a quote or put something, he has a sense of that risk... I'm thinking we just set it at an hourly basis."
>
> "Ohio and Illinois are going to be the closest to him. I think it is going to matter with his delivery window because he has mentioned that if it's a nearby warehouse he gets it sooner."
>
> "I think that the total across sizes and colors is actually going to be really important because obviously if they don't have enough stock of a particular size or color or combination, then you have a problem."
>
> "I would generally recommend if we can do some research and understand [industry standard buffering] better, we'll make better informed decisions."
>
> "I think low stock should have a warning that can be overridden basically."
>
> "A show only in stock is a really good choice for the garment catalog."
>
> "When you are attempting to review and finalize a quote... there needs to be a step... at that point when the inventory exists, it's good and it records what that inventory is at that point in time before it allows the email to be sent."

## API Research Findings (2026-02-28)

Key facts discovered by probing the live S&S Activewear API:

| Finding                          | Detail                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `skuids` param is non-functional | Ignores input — always returns all 190,224 SKUs                                                             |
| `?style=<styleID>` filter works  | Returns ~368 SKUs for a given style (numeric ID, not string)                                                |
| No per-SKU filter                | Cannot refresh a single SKU without fetching all or fetching by style                                       |
| Quantity representation          | `warehouses[].qty` per warehouse — no top-level total field                                                 |
| Out-of-stock signal              | `qty: 0` present in response (not absent) — no "discontinued" flag                                          |
| No timestamp on response         | API returns no `asOf` or `lastUpdated` field                                                                |
| Warehouse codes                  | Stable state abbreviations: OH, IL, PA, CN, MA, NV, GA, TX, KS + special: FO (freight-only), DS (drop-ship) |
| Rate cost                        | 1 request per call regardless of payload size                                                               |
| Products endpoint overlap        | `/v2/products/` also contains `qty` + `warehouses` but we currently discard them                            |

---

## Problem

Gary quotes jobs daily. When he selects a garment for a quote, he has no visibility into whether S&S Activewear has enough stock to fulfill the order. This creates two risks:

1. **Quoting risk**: He commits a garment to a customer without knowing supply is constrained, then has to renegotiate or scramble for a substitute.
2. **Fulfillment risk**: Between quoting and ordering, stock depletes — the order can't be filled as quoted.

There is also no analytics infrastructure for inventory: no raw table, no dbt pipeline, and no domain entity representing stock levels. Building this foundation unlocks both the immediate UX need (#165) and future analytics (inventory trend reporting, low-stock alerts, warehouse lead time modeling).

---

## Outcome

1. Gary sees inventory risk indicators (stock level, low-stock warning) while selecting garments for a quote — both in the catalog and in the size selector.
2. At quote finalization, a point-in-time inventory snapshot is captured and a live check confirms stock before the quote is sent.
3. A "show in-stock only" filter in the garment catalog lets Gary pre-filter to safe options.
4. The backend has a raw inventory table + dbt staging layer, enabling future analytics (trend reports, lead time estimation, reorder risk dashboards).
5. Inventory data refreshes hourly via automated sync; warehouse-level granularity is preserved for future delivery lead time features.
