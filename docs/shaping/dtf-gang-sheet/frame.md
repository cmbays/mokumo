---
shaping: true
---

# DTF Gang Sheet Builder — Frame

## Source

> 4Ink runs DTF printing in-house with their own printer. They currently use Drip Apps on Shopify for customer-facing gang sheet ordering (5% commission per fulfilled order, max $12/order) and PrintLife for production management. Mokumo replaces the production side.
>
> The customer buying the images probably doesn't really care about the Gang Sheet. They probably just care that they get their images at the cheapest, most efficient price possible. [Container-first] shows a lack of software sophistication.
>
> DTF is a big part of 4Ink's business, not a side service. Mostly film-only sales to other businesses and TikTok influencers. Same-day turnaround goal for orders before noon.
>
> A single quote can mix screen print + DTF + embroidery. Each service type gets its own tab/step in the quote builder.
>
> When a multi-service-type quote is accepted, it spawns separate jobs per service type, linked as siblings. Shipping gate: all sibling jobs must reach Review before any can ship.

Sources: Pre-build interview (2026-02-15, 17 questions), competitive research (5 competitors), DTF spacing standards research (Ninja Transfers, BestPriceDTF, screenprinting.com).

---

## Problem

Gary's current DTF workflow has four compounding pain points:

1. **Manual QA bottleneck** — Gary manually reviews every customer-built gang sheet for spacing, placement, and image quality. When issues are found, it triggers back-and-forth cycles with the customer (resize, fewer images, redo). This is the primary time sink.

2. **No connection between orders and production** — Drip Apps handles ordering on Shopify, PrintLife handles production tracking, but there's no link between them. Gary manually tracks which orders are on which sheets.

3. **5% commission overhead** — Every fulfilled gang sheet order pays Drip Apps a 5% commission. This is a concrete, recurring cost that Mokumo eliminates.

4. **Container-first forces customer errors** — Drip Apps requires customers to pick a sheet size first, then arrange designs manually. Customers don't know optimal sheet sizes, leading to waste and QA failures. Competitors (Antigro, Kixxl) have moved to content-first.

Beyond the gang sheet builder itself, the interview revealed a **structural gap**: 4Ink creates quotes that mix service types (screen print + DTF + embroidery), but the current quoting system has no concept of service-type-specific workflows within a single quote.

---

## Outcome

After this build, Gary can:

1. **Create DTF film-only quotes** inside Mokumo's existing quote builder, with line items that represent individual designs (image + size + quantity)
2. **See auto-calculated sheet layouts** — the system determines the optimal sheet size(s) and arrangement, optimizing for minimum cost
3. **Visually confirm the arrangement** on a read-only canvas before finalizing
4. **Create multi-service-type quotes** by switching between service type tabs that preserve state
5. **Track DTF jobs through production** with simplified DTF-specific steps

The demo (Feb 21) should be compelling enough that Gary sees Mokumo as a viable replacement for the Drip Apps + PrintLife combination.
