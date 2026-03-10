# Breadboarding Concepts

Reference guide for the breadboarding methodology. Consult when producing or reviewing breadboard documents.

Source: Adapted from Ryan Singer's [shaping-skills/breadboarding](https://github.com/rjs/shaping-skills) for Mokumo.

---

## The Three Elements

A breadboard maps a system using three types of interactive elements (plus Places that contain them):

### UI Affordances (U)

Things users **see and interact with**. These are tangible entry points into the system.

**Examples**:

- Customer Combobox (type-ahead search input)
- "Save as Draft" button
- Status filter tabs (All | Draft | Sent | ...)
- Color swatch in the picker grid
- Quantity input for size "M"
- "Remove" link on a line item row

**NOT UI affordances** (these are layout/decoration, not interactive):

- Section headings
- Static labels
- Separator lines
- Background colors

### Code Affordances (N)

Functions, handlers, and computations that **execute when triggered**. Users don't see these directly, but they're the machinery that makes UI affordances work.

**Phase 1 examples** (client-side):

- `calculateLineTotal(garmentPrice, colors, locations, qty)` — pricing formula
- `filterQuotes(status, searchQuery)` — filter array + update URL params
- `addLineItem()` — append empty row to form state
- `updateSizeQty(lineIndex, size, qty)` — update nested form state
- `toggleFavoriteColor(colorId)` — add/remove from favorites list

**Phase 2 examples** (server-side):

- `createQuote(data)` — API route, writes to database
- `sendQuoteEmail(quoteId, recipientEmail)` — email service call
- `fetchCustomers(query)` — database query with search
- `generateQuotePDF(quoteId)` — PDF generation service

### Data Stores (S)

State that **persists and gets read/written**. Not ephemeral UI state like "is this dropdown open" — stores hold data that other affordances depend on.

**Examples**:

- URL search params (`?status=draft&q=brewery`) — persists across navigation
- Form state (line items array, selected customer) — persists during form session
- Mock data imports (quotes, customers, garments) — read-only in Phase 1
- Computed values (subtotal, grand total) — derived from form state
- Favorites list (starred colors) — persists across sessions (localStorage in Phase 2)

---

## Places

A **Place** is a bounded context where specific affordances become available. Places are perceptual boundaries, not technical ones.

### The Blocking Test

If you can't interact with elements **behind** something, you've entered a different Place.

**Creates a new Place** (blocks what's behind):

- A different page route (`/quotes` → `/quotes/new`)
- A modal dialog (background is dimmed/inert)
- A full-screen overlay
- A confirmation dialog

**Does NOT create a new Place** (local state change):

- Accordion expand/collapse (content behind is still interactive)
- Dropdown menu open (closes on outside click, content behind accessible)
- Tooltip hover
- Inline edit mode (surrounding content still accessible)
- Filter panel show/hide
- Tab switching within the same page

### Place Hierarchy

Use hierarchical IDs to show containment:

```
P1          — Quotes List page
P2          — New Quote Form page
P2.1        — Customer Creation Modal (within P2)
P2.2        — Color Swatch Picker (subplace within P2, if it has its own interaction mode)
P3          — Quote Detail page
P3.1        — Email Preview Modal (within P3)
P3.2        — Confirm Delete Dialog (within P3)
```

**Containment vs Wiring**: Containment answers "where does this live?" — P2.1 lives inside P2. Wiring answers "what does this trigger?" — U2 in P2 opens P2.1. These are different relationships.

---

## Wiring

Every affordance connects to other affordances through two types of flow:

### Wires Out (Control Flow)

What an affordance **triggers** when activated. This is the "what happens next" chain.

```
U-save-draft click → N-validateForm() → N-saveToMockData() → N-navigateTo(/quotes)
```

### Returns To (Data Flow)

Where an affordance's **output feeds**. This is the "where does the result go" chain.

```
N-calculateLineTotal() returns to → U-line-total-display, U-subtotal-display, U-grand-total-display
```

### Key Distinction

A single action can have both:

```
U-qty-input type
  Wires Out: → N-updateSizeQty(lineIndex, size, qty)    [control: triggers the calculation]
  Returns To: → U-total-qty-display, U-line-total        [data: calculation result feeds displays]
```

### Wiring Rules

1. **Every U must connect to something** — otherwise it's decorative, not an affordance
2. **Every N must have a trigger** — something (U or another N) must activate it
3. **Never wire to framework internals** — skip React reconciliation, Next.js routing plumbing. Wire directly from trigger to destination
4. **Side effects are stores** — if something writes to URL, localStorage, or external state, create a Store (S) for it

---

## Affordance Naming

Name actual things, not abstractions.

| Good                   | Bad              |
| ---------------------- | ---------------- |
| Customer Combobox      | search input     |
| "Save as Draft" button | secondary action |
| Status filter tabs     | filter mechanism |
| Color swatch square    | color selector   |
| `calculateLineTotal()` | pricing logic    |
| `filterQuotes(status)` | filter function  |

If you can't name it specifically, you probably don't understand the design yet. Go back to the scope definition or journey design.

---

## Component Boundaries

Affordance groupings naturally reveal component boundaries:

1. **Affordances in the same Place that share state** → likely one component
2. **Affordances that appear in multiple Places** → shared component in `src/features/*/components/`
3. **Affordances unique to one Place** → local component or inline in page

### Shared Component Indicators

A group of affordances should become a shared component when:

- They appear in 2+ Places or 2+ verticals
- They have their own internal state (e.g., ColorSwatchPicker has search, favorites, selection)
- They're complex enough to warrant their own file (5+ affordances)

### Vertical-Specific Component Indicators

Keep as local component when:

- Only used in one Place
- No internal state beyond what the parent manages
- Simple enough to be inline (1-3 affordances)

---

## Vertical Slicing with Breadboards

Breadboards enable slicing into demo-able increments. Each slice cuts vertically through all layers to deliver something clickable.

### Slice Rules

1. Each slice must show **observable UI changes** — something the user can see or click
2. Slices are ordered by **dependency** — build what others depend on first
3. A slice may wire to future slices — that's expected. Show the wire, note it's not yet implemented
4. Shared components come first — they unblock multiple slices

### Example Slice Plan

```
Slice 1: Quotes List (standalone, needs DataTable)
Slice 2: ColorSwatchPicker (shared component, blocks Slice 4)
Slice 3: CustomerCombobox (shared component, blocks Slice 4)
Slice 4: New Quote Form (depends on Slices 2-3)
Slice 5: Quote Detail + Email Modal (depends on mock quote data from Slice 4)
```

---

## Place References

When a nested place has lots of internal affordances and would clutter the parent, you can **detach** it using the `_PlaceName` notation:

1. Put a **reference node** in the parent place using underscore prefix: `_letter-browser`
2. Define the full place separately with all its internals
3. Wire from the reference to the place: `_letter-browser --> letter-browser`

The reference is a **UI affordance** -- it represents "this widget/component renders here" in the parent context.

In affordance tables, list the reference as a UI affordance:

| #                | Place | Component   | Affordance       | Control | Wires Out | Returns To |
| ---------------- | ----- | ----------- | ---------------- | ------- | --------- | ---------- |
| U1               | P1    | page-header | Edit button      | click   | -> N1     | --         |
| \_letter-browser | P1    | --          | Widget reference | --      | -> P3     | --         |

Style place references with a dashed border to distinguish them in Mermaid:

```
classDef placeRef fill:#FFB3BA,stroke:#d87093,stroke-width:2px,stroke-dasharray:5 5
```

---

## Modes as Places

When a component has distinct modes (read vs edit, viewing vs editing), model them as **separate places** -- they represent different perceptual states for the user with different affordances available.

```
P3: letter-browser (Read)    -- base state
P4: letter-browser (Edit)    -- contains _letter-browser (Read) + new affordances
```

If one mode includes everything from another plus more, show this with a **place reference** inside the extended place. The reference shows composition: "everything in P3 appears here, plus these additions."

In affordance tables for the extended place:

| #                       | Place | Component    | Affordance         | Control | Wires Out | Returns To | Notes |
| ----------------------- | ----- | ------------ | ------------------ | ------- | --------- | ---------- | ----- |
| \_letter-browser (Read) | P4    | --           | Inherits all of P3 | --      | -> P3     | --         |       |
| U3                      | P4    | edit-toolbar | Add button         | click   | -> N3     | --         | NEW   |
| U4                      | P4    | edit-toolbar | Edit button        | click   | -> N4     | --         | NEW   |

The state flag (e.g., `editMode$`) that switches between modes is a **navigation mechanism**, not a data store. Don't include it as an S in either place.

---

## Subplaces (Expanded)

A **subplace** is a defined subset of a Place -- a contained area that groups related affordances. Use hierarchical IDs: `P2.1`, `P2.2`, etc.

Use subplaces when:

- A Place contains multiple distinct widgets or sections
- You're detailing one part of a larger Place
- You want to show what's in scope vs out of scope

In affordance tables, use the subplace ID in the Place column:

| #   | Place | Component     | Affordance       | Control | Wires Out | Returns To |
| --- | ----- | ------------- | ---------------- | ------- | --------- | ---------- |
| U3  | P2.1  | sales-widget  | "Refresh" button | click   | -> N4     | --         |
| U7  | P2.2  | activity-feed | activity list    | render  | --        | --         |

In Mermaid, nest the subplace subgraph inside the parent. Use the same background color (no distinct fill) -- the subplace is part of the parent, not a separate Place. Add a placeholder sibling to show there's more on the page that you're not detailing:

```
otherContent[["... other page content ..."]]
```

---

## Backend as a Place

The database and resolvers aren't floating infrastructure -- they're a **Place** with their own affordances. Model them just like any other Place:

| #   | Place   | Description                |
| --- | ------- | -------------------------- |
| P4  | Backend | API resolvers and database |

Backend affordances follow the same rules:

- **Code affordances (N)**: API routes, resolver functions, server actions
- **Data stores (S)**: Database tables, cache entries

Database tables (S) belong inside the Backend Place alongside the resolvers (N) that read and write them.

**Mokumo convention**: In Phase 1, Backend is not built -- code affordances in the Backend Place are tagged Phase 2. In Phase 2, the Backend Place contains Supabase tables (S), Drizzle queries (N), and server actions (N).

When spanning frontend + backend, label both as Places:

```
P1: Quotes List (Frontend)
P4: Backend (API + DB)
```

Wire from frontend code affordances to backend code affordances to show the boundary crossing.

---

## Chunking

Chunking collapses a subsystem into a single node in the main diagram, with details shown separately. Use chunking to manage complexity when a section of the breadboard has:

- **One wire in** (single entry point)
- **One wire out** (single output)
- **Lots of internals** between them

### When to Chunk

Look for sections where tracing the wiring reveals a "pinch point" -- many affordances that funnel through a single input and single output. These are natural boundaries for chunking.

### How to Chunk

1. **In the main diagram**, replace the subsystem with a single stadium-shaped node:

   ```
   dynamicForm[["CHUNK: dynamic-form"]]
   ```

2. **Wire to/from the chunk** using the boundary signals:

   ```
   N24 -->|formDefinition| dynamicForm
   dynamicForm -.->|valid$| U8
   ```

3. **Create a separate chunk diagram** showing the internals with boundary markers

4. **Style chunks distinctly** in the main diagram:
   ```
   classDef chunk fill:#87CEEB,stroke:#0288d1,color:#000,stroke-width:2px
   ```

Chunks often map naturally to reusable components -- they become the shared components in `src/features/*/components/`.

---

## Mechanisms Aren't Affordances

An affordance is something you can **act upon** that has meaningful identity in the system. Several things look like affordances but are actually just implementation mechanisms:

| Type                      | Example                 | Why it's not an affordance                                               |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| **Visual containers**     | `modal-frame wrapper`   | You can't act on a wrapper -- it's just a Place boundary                 |
| **Internal transforms**   | `letterDataTransform()` | Implementation detail of the caller -- not separately actionable         |
| **Navigation mechanisms** | `modalService.open()`   | Just the "how" of getting to a Place -- wire to the destination directly |

When reviewing affordance tables, double-check each Code affordance and ask:

> "Is this actually an affordance, or is it just detailing the mechanism for how something happens?"

If it's just the "how" -- skip it and wire directly to the destination or outcome:

```
N8 --> N22 --> P3     (N22 is modalService.open -- just mechanism)
N8 --> P3             (handler navigates to modal -- correct)

N6 --> N20 --> S2     (N20 is data transform -- internal to N6)
N6 --> S2             (callback writes to store -- correct)
```

---

## Side Effects Need Stores

An N that appears to wire nowhere is suspicious. If it has **side effects outside the system boundary** (browser URL, localStorage, external API, analytics), add a **store node** to represent that external state:

```
N41: updateUrl()           (wires to... nothing?)
N41: updateUrl() -> S15    (wires to Browser URL store)
```

This makes the data flow explicit. The store can also have return wires showing how external state flows back in.

Common external stores to model:

- `Browser URL` -- query params, hash fragments
- `localStorage` / `sessionStorage` -- persisted client state
- `Clipboard` -- copy/paste operations
- `Browser History` -- navigation state

**Mokumo convention**: URL search params are a key state mechanism in Phase 1. Always model them as explicit S nodes so wiring is traceable.

---

## Data Store Placement

A data store belongs in the Place where its data is **consumed** to enable some effect -- not where it's produced. Writes from other Places are "reaching into" that Place's state.

To determine where a store belongs:

1. **Trace read/write relationships** -- Who writes? Who reads?
2. **The readers determine placement** -- that's where behavior is enabled
3. **If only one Place reads**, the store goes inside that Place

Example: A `changedPosts` array is written by a Modal (when user confirms changes) but read by a PAGE_SAVE handler (when user clicks Save). The store belongs with the PAGE_SAVE handler -- that's where it enables the persistence operation.

Before putting a store in a separate DATA STORES section, verify it's actually read by multiple Places. If it only enables behavior in one Place, it belongs inside that Place.

---

## Mermaid Color Conventions

The tables are the truth. Mermaid diagrams are optional visualizations for humans. Use these standard colors:

| Type               | Color             | Hex       | classDef                                                            |
| ------------------ | ----------------- | --------- | ------------------------------------------------------------------- |
| UI affordances     | Pink              | `#FFB3BA` | `fill:#FFB3BA,stroke:#d87093,color:#000`                            |
| Code affordances   | Grey              | `#C0C0C0` | `fill:#C0C0C0,stroke:#808080,color:#000`                            |
| Data stores        | Lavender          | `#D8BFD8` | `fill:#D8BFD8,stroke:#9370db,color:#000`                            |
| Chunks             | Blue              | `#87CEEB` | `fill:#87CEEB,stroke:#0288d1,color:#000,stroke-width:2px`           |
| Place references   | Pink (dashed)     | `#FFB3BA` | `fill:#FFB3BA,stroke:#d87093,stroke-width:2px,stroke-dasharray:5 5` |
| Places (subgraphs) | White/transparent | --        | Subgraph boundary                                                   |

Line conventions:

- **Solid (`-->`)**: Wires Out -- calls, triggers, writes (control flow)
- **Dashed (`-.->`)**: Returns To -- return values, data store reads (data flow)
- **Labeled (`-.->|...|`)**: Abbreviated flow -- intermediate steps omitted
