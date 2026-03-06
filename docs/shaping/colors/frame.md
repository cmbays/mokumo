---
shaping: true
---

# Color Preference System — Frame

## Source

> The filter list for the catalog is just a list of text... it should be a color swatch grid similar to what we have on the quotes section.

> Whenever we are looking at a particular card for a garment we only see a part of the colors that are available... it shows first 8 of however many colors.

> I'm wondering about is if we should also have the ability to have catalog favorites and then have maybe certain supplier color favorites... we should be able to put those favorites on customers.

> If you're setting up a supplier, you go to the supplier tab. If it's global, it makes sense for it to be in settings. If it's customer level, you set it up when viewing a customer.

> I think what actually makes even more sense is you just literally have the color swatches in a favorites section. You don't have to put a star over every single one.

> Gary had told me explicitly that he liked seeing the palette the way it was from Sammar.

> In most cases this is exactly the menu people want to see. There are going to be cases where they really are going to wish that they could just select the customers and configure it.

> If I just want a favorite garment type for a customer and I don't really care about the color, I can do that.

— Shop owner interview, 2026-02-15

---

## Problem

The garment catalog's color experience has two surface issues and one systemic gap:

1. **Filter is text-only**: The color family dropdown uses text labels while the rest of the app uses visual swatches. Users can't see what they're filtering by.

2. **Cards are misleading**: Garment cards show the first 8 of N available colors — an arbitrary subset that becomes confusing when combined with color filtering. No indication of what's hidden or why those 8 were chosen.

3. **No structured color preferences**: Shops manage favorite colors through tribal knowledge — physical color cards on the wall, notes in job files, memory. There is no way to express "our go-to colors" (global), "our Gildan palette" (supplier), or "ACME Corp always wants Royal Blue" (customer). No competitor in the decorated apparel space has hierarchical color preference management.

## Outcome

1. Users filter garments visually using color swatches, matching the quote builder's existing swatch picker pattern
2. Garment cards show favorited colors with a total available count — honest and useful, not arbitrary
3. Shop manages color favorites at three independent levels: global, supplier/brand, customer
4. Parent-level changes propagate safely — additions flow automatically, removals require explicit confirmation with downstream impact visibility
5. Non-technical users understand the system through single-layer interaction at each screen — no inheritance diagrams, no cascading jargon
6. System gracefully degrades — each level is optional, works at any complexity from "no favorites" to full three-level hierarchy

## Related Artifacts

- **Design document**: `docs/plans/2026-02-15-color-preference-system-design.md` (approved)
- **UX research**: `knowledge-base/src/content/sessions/2026-02-15-colors-research.md`
- **Interview decisions**: `knowledge-base/src/content/sessions/2026-02-15-colors-interview.md` (14 decisions, 3 Gary questions)
- **Issue**: [#169](https://github.com/cmbays/mokumo/issues/169)
