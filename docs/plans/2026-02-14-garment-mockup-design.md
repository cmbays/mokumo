# Garment Mockup Engine — Design Document

> **Date**: 2026-02-14
> **Status**: Approved
> **Phase**: Phase 1 (SVG Composition), with maturity path through Phase 4 (3D)
> **Scope**: Horizontal capability — touches Quoting, Jobs, Invoicing, Kanban, Screen Room, Garments

## Problem

4Ink needs to show customers what their printed garment will look like before production begins. Currently, Gary uses a third-party tool (specifics unknown) to create mockups manually. This is disconnected from the quote/job workflow — mockups live outside the app.

The goal is to build mockup generation into Mokumo so that anywhere a garment + artwork combination exists (quotes, jobs, invoices, Kanban cards, customer approval pages), a realistic visual mockup renders automatically.

## Requirements

- **Primary use case**: Customer-facing sales tool — mockups need to look professional
- **Realism**: Artwork should appear printed ON the fabric, not floating above it
- **Customer experience**: Thumbnail in quote email/PDF + link to full approval page
- **Cost**: Zero — free/open-source solutions only
- **Reusability**: Same component renders at 40px thumbnails and 600px approval views
- **Extracted pattern**: Composable component usable across all verticals

## Gary Questions (Unanswered)

1. What tool do you currently use for customer mockups? What do you like/dislike?
2. Do customers ever need to reposition artwork themselves, or do you always set the position?
3. Which 5 garment styles do you use most? (So we know which templates to prioritize)

## Design Decision: SVG Composition Engine

Build a React `<GarmentMockup>` component that uses inline SVG to composite greyscale garment templates + `feColorMatrix` color tinting + `<image>` artwork overlays clipped to print zones.

### Why SVG

- **Declarative**: React-friendly, props drive composition naturally
- **Scalable**: Vector — perfect at any size (40px Kanban to 600px approval)
- **Zero dependencies**: Browser-native, nothing to install
- **CSS-styleable**: Tailwind classes apply, transitions work
- **Print-ready**: Browser print maintains vector quality
- **Accessible**: ARIA labels on garment/artwork elements
- **Inspectable**: DOM nodes visible in DevTools

### Why Not Canvas/Fabric.js/Three.js for Phase 1

Canvas libraries add bundle size (+96KB for Fabric.js, +200KB for Three.js), require `"use client"` directives, and introduce SSR complexity. SVG is a simpler foundation that covers Phase 1 requirements. Canvas and 3D are upgrade paths, not starting points.

## Rendering Maturity Ladder

The data model stays the same at every level — only the renderer upgrades.

```
Level 4: 3D Garment Model (Three.js / React Three Fiber)
   ↑ same data model, swap renderer
Level 3: Interactive Canvas (Fabric.js + perspective.js)
   ↑ same data model, swap renderer
Level 2: Photo-Based Composition (S&S Activewear API)
   ↑ same data model, better template images
Level 1: SVG Composition Engine
   ↑ WE START HERE
```

### Level 1: SVG Composition (Phase 1 — build now)

- Greyscale SVG garment silhouettes as templates
- `feColorMatrix` SVG filter for accurate color tinting (preserves shading/depth)
- Artwork overlay via SVG `<image>` + `<clipPath>` for print zone masking
- `mix-blend-mode: multiply` for "printed on fabric" realism
- Auto-place with optional nudge
- **Realism: 7/10** — matches Printful/Placeit quality

### Level 2: Photo-Based Composition (Phase 2)

- Connect to S&S Activewear REST API (`api.ssactivewear.com`)
- Fetch real product photography per garment SKU and color
- Replace SVG silhouettes with actual garment photos
- Canvas compositing with `multiply` blend mode on real photos
- Print zones mapped to photo coordinates per garment style
- **Realism: 8/10** — artwork on real product photos

S&S API is free with a dealer account (Gary likely has one). Returns product images for thousands of SKUs in every available color. SanMar has a similar API. Both support the PromoStandards industry protocol.

### Level 3: Interactive Canvas (Phase 2/3)

- Fabric.js (~96KB, MIT) for interactive artwork manipulation
- Drag, resize, rotate artwork on the garment
- Perspective transforms via perspective.js (Apache-2.0) for garment contour following
- Export via Sharp (server-side) for static PNGs (emails, PDFs)
- **Realism: 8/10** with added interactivity

### Level 4: 3D Garment Model (Phase 3/4 — if needed)

- React Three Fiber + GLTF garment models
- Artwork applied as texture/decal on 3D mesh
- User can rotate entire garment in 3D space
- Real lighting, shadows, fabric draping
- Multiple open-source examples exist (e.g., basedhound/3d-tshirts_app_react)
- **Realism: 9-10/10**

## Stable Component Interface

The props interface stays the same across all maturity levels:

```tsx
interface GarmentMockupProps {
  garmentCategory: GarmentCategory // "t-shirts" | "fleece" | etc.
  colorHex: string // Target garment color
  artworkPlacements: ArtworkPlacement[] // Artwork + position pairs
  view: MockupView // "front" | "back" | "left-sleeve" | etc.
  size: 'xs' | 'sm' | 'md' | 'lg' // Display size variant
  className?: string // Tailwind overrides
}

interface ArtworkPlacement {
  artworkUrl: string // URL to artwork image
  position: string // "front-chest" | "full-back" | etc.
  scale?: number // 1.0 = default fit
  offsetX?: number // % offset from zone center
  offsetY?: number // % offset from zone center
  rotation?: number // degrees (Level 3+)
}
```

Same props at Level 1 (SVG) and Level 4 (3D). Calling code never changes.

## Color Tinting: `feColorMatrix` SVG Filter

The key technique for making greyscale garment templates render in any color.

```tsx
// Shared filter definition (rendered once in MockupFilterProvider)
<svg style={{ position: 'absolute', width: 0, height: 0 }}>
  <defs>
    <filter id={`garment-tint-${colorHex}`}>
      <feColorMatrix type="matrix" values={colorMatrix} />
    </filter>
  </defs>
</svg>

// Applied to garment template
<image href={templateUrl} filter={`url(#garment-tint-${colorHex})`} />
```

A `hexToColorMatrix(hex: string): string` utility converts any hex color to the 20-value matrix. Memoized per color (pure math).

Why not CSS `hue-rotate()`? Imprecise — can't target specific hues. `feColorMatrix` gives per-channel control for accurate fabric color simulation while preserving template shading and depth.

## Artwork Compositing

SVG `<image>` + `<clipPath>` constrains artwork to print zones:

```tsx
<svg viewBox="0 0 1000 1200">
  <defs>
    <clipPath id="front-chest-zone">
      <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} />
    </clipPath>
  </defs>

  {/* Garment base (colored via filter) */}
  <image href={templateUrl} width="1000" height="1200" filter={`url(#tint)`} />

  {/* Artwork overlay — multiply blend for "printed" look */}
  <image
    href={artworkUrl}
    x={zone.x}
    y={zone.y}
    width={zone.width}
    height={zone.height}
    clipPath="url(#front-chest-zone)"
    preserveAspectRatio="xMidYMid meet"
    style={{ mixBlendMode: 'multiply' }}
  />
</svg>
```

## New Zod Schemas

### MockupTemplate + PrintZone

```typescript
// lib/schemas/mockup-template.ts
import { z } from 'zod'
import { garmentCategoryEnum } from './garment'

export const mockupViewEnum = z.enum(['front', 'back', 'left-sleeve', 'right-sleeve'])

export const printZoneSchema = z.object({
  position: z.string(), // "front-chest", "full-back", etc.
  x: z.number().min(0).max(100), // % from left of template viewBox
  y: z.number().min(0).max(100), // % from top
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
})

export const mockupTemplateSchema = z.object({
  id: z.string().uuid(),
  garmentCategory: garmentCategoryEnum,
  view: mockupViewEnum,
  svgPath: z.string(), // Path to SVG asset
  printZones: z.array(printZoneSchema),
  viewBoxWidth: z.number().positive(),
  viewBoxHeight: z.number().positive(),
})

export type MockupView = z.infer<typeof mockupViewEnum>
export type PrintZone = z.infer<typeof printZoneSchema>
export type MockupTemplate = z.infer<typeof mockupTemplateSchema>
```

### MockupRender (Phase 2 — stored composites)

```typescript
// lib/schemas/mockup-render.ts
import { z } from 'zod'

export const mockupRenderSchema = z.object({
  id: z.string().uuid(),
  garmentCatalogId: z.string(),
  colorHex: z.string(),
  artworkPlacements: z.array(
    z.object({
      artworkId: z.string(),
      printZonePosition: z.string(),
      scale: z.number().default(1.0),
      offsetX: z.number().default(0),
      offsetY: z.number().default(0),
    })
  ),
  imageUrl: z.string().url(), // Stored composite image
  thumbnailUrl: z.string().url(), // 80px version
  artworkVersionHash: z.string(), // For cache invalidation
  renderedAt: z.string().datetime(),
  entityType: z.enum(['quote', 'job']),
  entityId: z.string().uuid(),
})

export type MockupRender = z.infer<typeof mockupRenderSchema>
```

### Existing Schema Changes

| Schema           | Field               | Type                  | Purpose                              |
| ---------------- | ------------------- | --------------------- | ------------------------------------ |
| `QuoteLineItem`  | `mockupRenderIds`   | `string[]` (optional) | Links to stored renders (Phase 2)    |
| `GarmentCatalog` | `mockupTemplateIds` | `string[]` (optional) | Available templates for this garment |

These are Phase 2 additions. Phase 1 computes mockups on-the-fly from existing data.

## Standard Print Zones

Pre-defined zones per garment category with industry-standard dimensions:

| Zone           | Real Size       | Default View | Common Use                   |
| -------------- | --------------- | ------------ | ---------------------------- |
| `front-chest`  | 6-10" x 6-8"    | front        | Brand logos, statements      |
| `left-chest`   | 3-4.5" x 3-4.5" | front        | Corporate logos, monograms   |
| `right-chest`  | 3-4.5" x 3-4.5" | front        | Secondary logos              |
| `full-front`   | 12" x 10-14"    | front        | Main event/team designs      |
| `full-back`    | 12" x 10-14"    | back         | Large designs, names/numbers |
| `upper-back`   | 10-14" x 1-6"   | back         | Names, one-liners            |
| `nape`         | 1-3" x 1-3"     | back         | Tag replacement              |
| `left-sleeve`  | 1-4" x 1-4"     | left-sleeve  | Small logos, flags           |
| `right-sleeve` | 1-4" x 1-4"     | right-sleeve | Small logos, flags           |

Stored in `lib/constants/print-zones.ts` with percentage coordinates per garment category.

## Component Architecture

```
components/features/mockup/
├── GarmentMockup.tsx              # Core SVG composition engine
│   Props: garmentCategory, colorHex, artworkPlacements[], view, size
│   Renders: Inline SVG with template + color filter + artwork overlays
│
├── GarmentMockupCard.tsx          # Interactive wrapper
│   Adds: Front/back segmented toggle, approval badges, metadata
│   Dot indicators (•) on tabs with artwork
│
├── GarmentMockupThumbnail.tsx     # Memo'd minimal version (40-80px)
│   For: Kanban cards, table rows, quote line items
│
├── MockupPreviewPanel.tsx         # Side panel for quote editor
│   Shows: Active line item mockup, tabs for switching between items
│
├── MockupFilterProvider.tsx       # Global SVG <defs> in layout.tsx
│   Renders: Hidden SVG with shared feColorMatrix filters + clipPaths
│   Prevents: 30 duplicate filter definitions on Kanban board
│
└── hooks/
    ├── useColorMatrix.ts          # Hex → feColorMatrix values (memoized)
    └── useMockupExport.ts         # SVG → Canvas → PNG Blob (Phase 2)

lib/
├── schemas/
│   ├── mockup-template.ts         # MockupTemplate + PrintZone
│   └── mockup-render.ts           # MockupRender (Phase 2)
├── constants/
│   └── print-zones.ts             # Zone geometry per garment category
└── helpers/
    └── color-matrix.ts            # hexToColorMatrix(hex) → string
```

## UX Model: Auto-Place with Nudge

The shop owner is not a designer. The interaction model is:

1. **Select print location** from segmented toggle (front-chest, full-back, etc.)
2. **Artwork auto-centers** in selected zone at sensible default size
3. **Optional drag to nudge** position (with snap-back-to-center guide)
4. **Optional scale slider** or corner handles (aspect ratio locked)
5. **Done** — mockup attached to quote/job

This covers 95% of real-world screen printing jobs in ~10 seconds.

### Print Location Toggle

```
[ Front • ] [ Back ] [ L.Chest • ] [ Sleeve ]
```

- Active location highlighted
- Dot (•) indicates artwork exists on that location
- Click switches garment view (cross-fade animation)

### Display Size Hierarchy

| Size | Pixels    | Context                   | Detail                           |
| ---- | --------- | ------------------------- | -------------------------------- |
| `xs` | 40-48px   | Kanban cards, table rows  | Garment silhouette + color       |
| `sm` | 64-80px   | Quote line items          | Artwork clearly visible          |
| `md` | 280-320px | Job detail, quote detail  | Full detail, print location tabs |
| `lg` | 400-600px | Editor, customer approval | Interactive controls, zoom       |

All sizes render from the same SVG — vector scales naturally.

## Integration Points

### Where Mockups Appear

| Screen                             | Size | Interaction                        | Phase |
| ---------------------------------- | ---- | ---------------------------------- | ----- |
| Quote line item (detail view)      | `sm` | Click to expand                    | 1     |
| Quote creation (preview panel)     | `md` | Live preview as data changes       | 1     |
| Job detail ("What We're Printing") | `md` | Front/back toggle, approval badges | 1     |
| Kanban production board            | `xs` | None — visual identifier           | 1     |
| Customer approval page             | `lg` | Zoom, approve/reject controls      | 2     |
| Quote PDF/email                    | `sm` | Static image (server-rendered)     | 2     |
| Invoice detail                     | `sm` | Click to expand                    | 2     |
| Screen room (screen → job link)    | `sm` | Artwork reference                  | 2     |
| Garment catalog (recent artwork)   | `sm` | Preview with recent artwork        | 3     |
| Dashboard recent jobs              | `xs` | Visual identifier                  | 2     |

### Existing Component to Evolve

The current `ArtworkPreview` component (`app/(dashboard)/quotes/_components/ArtworkPreview.tsx`) is the seed:

- Takes `garmentColor` (hex) → flat color square
- Takes `artworkThumbnailUrl` → centered overlay
- Takes `location` → text label

`GarmentMockup` is its evolution:

- `garmentColor` → `feColorMatrix` on real garment SVG template
- `artworkThumbnailUrl` → SVG `<image>` at accurate print zone coordinates
- `location` → maps to `PrintZone` geometry

Migration: Build `GarmentMockup`, then replace `ArtworkPreview` usage in `QuoteDetailView`.

## Garment Template Assets (Phase 1)

10 SVG templates needed (5 categories x 2 views):

```
public/mockup-templates/
├── t-shirts-front.svg
├── t-shirts-back.svg
├── fleece-front.svg
├── fleece-back.svg
├── outerwear-front.svg
├── outerwear-back.svg
├── pants-front.svg
├── pants-back.svg
├── headwear-front.svg
└── headwear-back.svg
```

Requirements:

- Greyscale with shading/highlights (for color tinting to look realistic)
- Transparent background
- Clean paths suitable for `feColorMatrix` filtering
- Sources: FreeSVG, Freepik (free license), or hand-traced in Inkscape

Phase 2: Replace with real product photos from S&S Activewear API.

## Supplier API Integration (Phase 2)

### S&S Activewear API

```
GET /v2/styles/{styleId} → garment metadata
GET /v2/styles/{styleId}/colors/{colorId}/images → product photos per color
```

- Free with dealer account (most screen printers have one)
- Returns product images for thousands of SKUs in every available color
- Supports PromoStandards protocol

### Integration Flow

```
User selects "Gildan 5000, Black"
  → Resolve GarmentCatalog.sku to S&S styleId
  → GET /v2/styles/{styleId}/colors/black/images
  → Receive real product photo URL
  → Use as template image instead of SVG silhouette
  → Composite artwork onto real photo
  → Customer sees their logo on THE ACTUAL SHIRT they're ordering
```

### Print Zone Mapping for Photos

Photos have different perspectives than SVG templates. Phase 2 needs a "template calibration" step:

- For each frequently used garment photo, define print zones manually (one-time setup)
- Fallback: use category-level default zones for uncalibrated photos
- Store calibration in `MockupTemplate` schema (same schema, different source image)

## Performance Considerations

### Kanban Board (30+ cards)

- **Shared `<defs>`**: `MockupFilterProvider` defines SVG filters once globally
- **`React.memo`** on `GarmentMockupThumbnail`: only re-renders when props change
- **`useMemo`** on color matrix calculation: pure math, memoized per color
- **Profile first**: 30 inline SVGs with a few elements each is lightweight. Measure before optimizing.

### Phase 2: Cached Static Images

- When quote is sent → render mockup to static WebP via Sharp
- Store in Supabase Storage (`mockups/{entityType}/{entityId}/{view}.webp`)
- Serve static images for emails, PDFs, customer approval pages
- Re-render on artwork change (tracked via `artworkVersionHash`)

## Scope Assessment

**This is NOT a huge lift.** The core build is:

- 1 schema file (MockupTemplate + PrintZone)
- 1 constants file (print zone geometry)
- 1 utility function (hexToColorMatrix)
- 4 React components (core renderer, card, thumbnail, filter provider)
- 10 SVG template files
- Integration into 3-4 existing views

**Hardest part**: Creating the 10 SVG garment templates with good shading. Everything else is straightforward React/SVG/CSS.

**Risk**: Template quality determines mockup quality. Simple silhouettes look okay; detailed templates with fabric shading look great. Can start simple and improve templates over time.

## Related Research

This design was informed by research from 5 parallel agents:

- **Market landscape**: Printful API (free), Dynamic Mockups (1K free/mo), Mockey AI (free manual), S&S Activewear API (free with dealer account)
- **Libraries evaluated**: Fabric.js, Konva, PixiJS, Three.js/R3F, Sharp, perspective.js, CSS blend modes
- **UX patterns**: CustomInk, Printful, DecoNetwork, YoPrint — all follow select-garment → select-location → place-artwork → preview
- **Industry standards**: Pre-defined print zones (front chest 6-10", left chest 3-4.5", full back 12"), approval workflows with digital signature
