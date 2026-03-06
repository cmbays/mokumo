# Garment Mockup Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reusable SVG composition engine that composites artwork onto garment templates with realistic color tinting, usable at every size from 40px Kanban thumbnails to 600px approval views.

**Architecture:** Inline SVG with `feColorMatrix` for color tinting + `<image>` for artwork overlay + `<clipPath>` for print zone masking + `mix-blend-mode: multiply` for fabric texture blending. Zero external dependencies. Data model via Zod schemas with pre-defined print zone geometry per garment category.

**Tech Stack:** React (inline SVG), Zod schemas, Vitest, Tailwind CSS. No new dependencies.

**Design Doc:** `docs/plans/2026-02-14-garment-mockup-design.md`

**Breadboard:** `docs/breadboards/mockup-engine-breadboard.md`

**Worktree:** `~/Github/mokumo-worktrees/session-0214-mockup-design` (branch: `session/0214-mockup-design`)

**Breadboard Gaps Addressed:** This plan incorporates 4 integration gaps found during breadboarding:

1. Location string normalization (Task 2 — `PRINT_POSITION_ALIASES`)
2. Job artwork-to-location mapping (Task 13 — 1:1 order assumption)
3. JobCard view model enrichment (Task 5A — extend `board-card.ts`)
4. MockupFilterProvider placement (Tasks 11-13 — per-page, not global)

---

### Task 1: Mockup Template + Print Zone Schemas

**Files:**

- Create: `lib/schemas/mockup-template.ts`
- Test: `lib/schemas/__tests__/mockup-template.test.ts`

**Step 1: Write the failing tests**

```typescript
// lib/schemas/__tests__/mockup-template.test.ts
import { describe, it, expect } from 'vitest'
import { mockupViewEnum, printZoneSchema, mockupTemplateSchema } from '../mockup-template'

describe('mockupViewEnum', () => {
  it.each(['front', 'back', 'left-sleeve', 'right-sleeve'])("accepts '%s'", (view) => {
    expect(mockupViewEnum.parse(view)).toBe(view)
  })

  it('rejects invalid view', () => {
    expect(() => mockupViewEnum.parse('top')).toThrow()
  })
})

describe('printZoneSchema', () => {
  const validZone = {
    position: 'front-chest',
    x: 30,
    y: 20,
    width: 40,
    height: 30,
  }

  it('accepts a valid print zone', () => {
    const result = printZoneSchema.parse(validZone)
    expect(result.position).toBe('front-chest')
  })

  it('rejects x > 100', () => {
    expect(() => printZoneSchema.parse({ ...validZone, x: 101 })).toThrow()
  })

  it('rejects negative y', () => {
    expect(() => printZoneSchema.parse({ ...validZone, y: -1 })).toThrow()
  })

  it('rejects width > 100', () => {
    expect(() => printZoneSchema.parse({ ...validZone, width: 101 })).toThrow()
  })
})

describe('mockupTemplateSchema', () => {
  const validTemplate = {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    garmentCategory: 't-shirts',
    view: 'front',
    svgPath: '/mockup-templates/t-shirts-front.svg',
    printZones: [
      { position: 'front-chest', x: 30, y: 20, width: 40, height: 30 },
      { position: 'left-chest', x: 55, y: 18, width: 15, height: 15 },
    ],
    viewBoxWidth: 1000,
    viewBoxHeight: 1200,
  }

  it('accepts a valid template', () => {
    const result = mockupTemplateSchema.parse(validTemplate)
    expect(result.garmentCategory).toBe('t-shirts')
    expect(result.printZones).toHaveLength(2)
  })

  it('rejects invalid garment category', () => {
    expect(() =>
      mockupTemplateSchema.parse({ ...validTemplate, garmentCategory: 'socks' })
    ).toThrow()
  })

  it('rejects invalid view', () => {
    expect(() => mockupTemplateSchema.parse({ ...validTemplate, view: 'top' })).toThrow()
  })

  it('rejects zero viewBoxWidth', () => {
    expect(() => mockupTemplateSchema.parse({ ...validTemplate, viewBoxWidth: 0 })).toThrow()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd ~/Github/mokumo-worktrees/session-0214-mockup-design && npm test -- lib/schemas/__tests__/mockup-template.test.ts`
Expected: FAIL — module `../mockup-template` not found

**Step 3: Write minimal implementation**

```typescript
// lib/schemas/mockup-template.ts
import { z } from 'zod'
import { garmentCategoryEnum } from './garment'

export const mockupViewEnum = z.enum(['front', 'back', 'left-sleeve', 'right-sleeve'])

export const printZoneSchema = z.object({
  position: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
})

export const mockupTemplateSchema = z.object({
  id: z.string().uuid(),
  garmentCategory: garmentCategoryEnum,
  view: mockupViewEnum,
  svgPath: z.string().min(1),
  printZones: z.array(printZoneSchema),
  viewBoxWidth: z.number().positive(),
  viewBoxHeight: z.number().positive(),
})

export type MockupView = z.infer<typeof mockupViewEnum>
export type PrintZone = z.infer<typeof printZoneSchema>
export type MockupTemplate = z.infer<typeof mockupTemplateSchema>
```

**Step 4: Run tests to verify they pass**

Run: `cd ~/Github/mokumo-worktrees/session-0214-mockup-design && npm test -- lib/schemas/__tests__/mockup-template.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add lib/schemas/mockup-template.ts lib/schemas/__tests__/mockup-template.test.ts
git commit -m "feat(schemas): add MockupTemplate and PrintZone schemas with tests"
```

---

### Task 2: Print Zone Constants

**Files:**

- Create: `lib/constants/print-zones.ts`
- Test: `lib/schemas/__tests__/print-zones.test.ts`

**Step 1: Write the failing tests**

```typescript
// lib/schemas/__tests__/print-zones.test.ts
import { describe, it, expect } from 'vitest'
import {
  PRINT_ZONES,
  PRINT_POSITION_LABELS,
  PRINT_POSITION_ALIASES,
  getZonesForCategory,
  getZoneForPosition,
  normalizePosition,
} from '../../constants/print-zones'
import { printZoneSchema } from '../mockup-template'

describe('PRINT_ZONES', () => {
  it('has entries for all 5 garment categories', () => {
    expect(Object.keys(PRINT_ZONES)).toEqual(
      expect.arrayContaining(['t-shirts', 'fleece', 'outerwear', 'pants', 'headwear'])
    )
  })

  it('every zone validates against printZoneSchema', () => {
    for (const [category, views] of Object.entries(PRINT_ZONES)) {
      for (const [view, zones] of Object.entries(views)) {
        for (const zone of zones) {
          expect(() => printZoneSchema.parse(zone)).not.toThrow()
        }
      }
    }
  })
})

describe('PRINT_POSITION_LABELS', () => {
  it('has a label for front-chest', () => {
    expect(PRINT_POSITION_LABELS['front-chest']).toBe('Front Chest')
  })

  it('has a label for full-back', () => {
    expect(PRINT_POSITION_LABELS['full-back']).toBe('Full Back')
  })
})

describe('getZonesForCategory', () => {
  it('returns front zones for t-shirts', () => {
    const zones = getZonesForCategory('t-shirts', 'front')
    expect(zones.length).toBeGreaterThan(0)
    expect(zones.every((z) => z.x >= 0 && z.x <= 100)).toBe(true)
  })

  it('returns empty array for invalid category', () => {
    const zones = getZonesForCategory('socks' as any, 'front')
    expect(zones).toEqual([])
  })
})

describe('getZoneForPosition', () => {
  it('returns zone geometry for front-chest on t-shirts', () => {
    const zone = getZoneForPosition('t-shirts', 'front', 'front-chest')
    expect(zone).toBeDefined()
    expect(zone?.position).toBe('front-chest')
  })

  it('returns undefined for non-existent position', () => {
    const zone = getZoneForPosition('t-shirts', 'front', 'back-pocket')
    expect(zone).toBeUndefined()
  })
})

describe('PRINT_POSITION_ALIASES', () => {
  it("maps quote-style 'Front' to 'front-chest'", () => {
    expect(PRINT_POSITION_ALIASES['Front']).toBe('front-chest')
  })

  it("maps job-style 'Back Full' to 'full-back'", () => {
    expect(PRINT_POSITION_ALIASES['Back Full']).toBe('full-back')
  })

  it("maps 'Left Chest' to 'left-chest'", () => {
    expect(PRINT_POSITION_ALIASES['Left Chest']).toBe('left-chest')
  })
})

describe('normalizePosition', () => {
  it('normalizes known alias', () => {
    expect(normalizePosition('Front Center')).toBe('front-chest')
  })

  it('falls back to kebab-case for unknown input', () => {
    expect(normalizePosition('Hip Pocket')).toBe('hip-pocket')
  })

  it('handles already-canonical input', () => {
    expect(normalizePosition('front-chest')).toBe('front-chest')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- lib/schemas/__tests__/print-zones.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// lib/constants/print-zones.ts
import type { PrintZone, MockupView } from '@/lib/schemas/mockup-template'
import type { GarmentCategory } from '@/lib/schemas/garment'

/**
 * Human-readable labels for print positions.
 */
export const PRINT_POSITION_LABELS: Record<string, string> = {
  'front-chest': 'Front Chest',
  'left-chest': 'Left Chest',
  'right-chest': 'Right Chest',
  'full-front': 'Full Front',
  'full-back': 'Full Back',
  'upper-back': 'Upper Back',
  nape: 'Nape',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
}

/**
 * Alias map: normalizes freeform location strings (from quote/job mock data)
 * to canonical kebab-case position IDs used by the mockup engine.
 *
 * BREADBOARD GAP #1: Quote data uses "Front", "Back", "Left Sleeve".
 * Job data uses "Front Center", "Back Full", "Left Chest".
 * Mockup engine expects "front-chest", "full-back", etc.
 */
export const PRINT_POSITION_ALIASES: Record<string, string> = {
  // Quote-style short names
  Front: 'front-chest',
  Back: 'full-back',
  'Left Sleeve': 'left-sleeve',
  'Right Sleeve': 'right-sleeve',
  // Job-style descriptive names
  'Front Center': 'front-chest',
  'Front Left Chest': 'left-chest',
  'Left Chest': 'left-chest',
  'Right Chest': 'right-chest',
  'Back Full': 'full-back',
  'Back Number': 'upper-back',
  'Full Front': 'full-front',
  'Full Back': 'full-back',
  'Upper Back': 'upper-back',
  Nape: 'nape',
}

/**
 * Normalize a freeform location/position string to a canonical position ID.
 * Returns the input lowercased+kebab-cased if no alias match.
 */
export function normalizePosition(input: string): string {
  return PRINT_POSITION_ALIASES[input] ?? input.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Print zone geometry per garment category and view.
 * Coordinates are percentages of the template viewBox.
 */
export const PRINT_ZONES: Record<string, Partial<Record<string, PrintZone[]>>> = {
  't-shirts': {
    front: [
      { position: 'front-chest', x: 28, y: 18, width: 44, height: 35 },
      { position: 'left-chest', x: 52, y: 18, width: 16, height: 16 },
      { position: 'right-chest', x: 32, y: 18, width: 16, height: 16 },
      { position: 'full-front', x: 22, y: 15, width: 56, height: 50 },
    ],
    back: [
      { position: 'full-back', x: 22, y: 18, width: 56, height: 50 },
      { position: 'upper-back', x: 25, y: 12, width: 50, height: 15 },
      { position: 'nape', x: 42, y: 5, width: 16, height: 10 },
    ],
  },
  fleece: {
    front: [
      { position: 'front-chest', x: 26, y: 22, width: 48, height: 32 },
      { position: 'left-chest', x: 52, y: 22, width: 16, height: 16 },
    ],
    back: [{ position: 'full-back', x: 20, y: 22, width: 60, height: 45 }],
  },
  outerwear: {
    front: [
      { position: 'left-chest', x: 52, y: 22, width: 16, height: 16 },
      { position: 'front-chest', x: 28, y: 22, width: 44, height: 30 },
    ],
    back: [{ position: 'full-back', x: 20, y: 20, width: 60, height: 48 }],
  },
  pants: {
    front: [{ position: 'left-chest', x: 30, y: 10, width: 20, height: 20 }],
    back: [],
  },
  headwear: {
    front: [{ position: 'front-chest', x: 20, y: 25, width: 60, height: 40 }],
    back: [{ position: 'full-back', x: 20, y: 25, width: 60, height: 40 }],
  },
}

/** Get all print zones for a garment category and view. */
export function getZonesForCategory(category: string, view: string): PrintZone[] {
  return PRINT_ZONES[category]?.[view] ?? []
}

/** Get a specific zone by position within a category and view. */
export function getZoneForPosition(
  category: string,
  view: string,
  position: string
): PrintZone | undefined {
  return getZonesForCategory(category, view).find((z) => z.position === position)
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- lib/schemas/__tests__/print-zones.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add lib/constants/print-zones.ts lib/schemas/__tests__/print-zones.test.ts
git commit -m "feat(constants): add print zone geometry per garment category"
```

---

### Task 3: Color Matrix Utility

**Files:**

- Create: `lib/helpers/color-matrix.ts`
- Test: `lib/helpers/__tests__/color-matrix.test.ts`

**Step 1: Write the failing tests**

```typescript
// lib/helpers/__tests__/color-matrix.test.ts
import { describe, it, expect } from 'vitest'
import { hexToColorMatrix, hexToRgb } from '../color-matrix'

describe('hexToRgb', () => {
  it('converts black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('converts white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('converts Niji blue (#2ab9ff)', () => {
    expect(hexToRgb('#2ab9ff')).toEqual({ r: 42, g: 185, b: 255 })
  })

  it('handles lowercase hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })
})

describe('hexToColorMatrix', () => {
  it('returns a string with 20 space-separated numbers', () => {
    const matrix = hexToColorMatrix('#1a1a1a')
    const values = matrix.trim().split(/\s+/)
    expect(values).toHaveLength(20)
    values.forEach((v) => expect(Number.isFinite(Number(v))).toBe(true))
  })

  it('produces identity-like matrix for white', () => {
    // White (#FFFFFF) should produce near-identity — greyscale template stays white
    const matrix = hexToColorMatrix('#FFFFFF')
    const values = matrix.trim().split(/\s+/).map(Number)
    // Row 1 (R channel) sums should be close to 1
    expect(values[0] + values[1] + values[2]).toBeCloseTo(1, 0)
  })

  it('produces a dark matrix for black', () => {
    const matrix = hexToColorMatrix('#000000')
    const values = matrix.trim().split(/\s+/).map(Number)
    // All color channel multipliers should be 0 for pure black
    expect(values[0]).toBeCloseTo(0, 1)
    expect(values[6]).toBeCloseTo(0, 1)
    expect(values[12]).toBeCloseTo(0, 1)
  })

  it('different colors produce different matrices', () => {
    const red = hexToColorMatrix('#FF0000')
    const blue = hexToColorMatrix('#0000FF')
    expect(red).not.toBe(blue)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- lib/helpers/__tests__/color-matrix.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// lib/helpers/color-matrix.ts

/**
 * Convert a hex color string to RGB components (0-255).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

/**
 * Convert a hex color to an SVG feColorMatrix "matrix" values string.
 *
 * This produces a 4x5 matrix that transforms a greyscale image into
 * the target color while preserving luminance (shading/highlights).
 *
 * The matrix maps greyscale luminance → target color channels:
 *   R' = luminance * targetR
 *   G' = luminance * targetG
 *   B' = luminance * targetB
 *   A' = A (unchanged)
 *
 * Luminance weights: R=0.2126, G=0.7152, B=0.0722 (Rec. 709)
 */
export function hexToColorMatrix(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  // Luminance extraction weights (Rec. 709)
  const lr = 0.2126
  const lg = 0.7152
  const lb = 0.0722

  // 4x5 matrix (rows: R, G, B, A; columns: R, G, B, A, offset)
  // Each row computes: output = (lr*R + lg*G + lb*B) * targetChannel
  const matrix = [
    // R output
    rn * lr,
    rn * lg,
    rn * lb,
    0,
    0,
    // G output
    gn * lr,
    gn * lg,
    gn * lb,
    0,
    0,
    // B output
    bn * lr,
    bn * lg,
    bn * lb,
    0,
    0,
    // A output (pass through)
    0,
    0,
    0,
    1,
    0,
  ]

  return matrix.map((v) => v.toFixed(4)).join(' ')
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- lib/helpers/__tests__/color-matrix.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add lib/helpers/color-matrix.ts lib/helpers/__tests__/color-matrix.test.ts
git commit -m "feat(helpers): add hexToColorMatrix SVG filter utility"
```

---

### Task 4: SVG Garment Templates

**Files:**

- Create: `public/mockup-templates/t-shirts-front.svg`
- Create: `public/mockup-templates/t-shirts-back.svg`

Start with t-shirts only (most common garment). Other categories added in follow-up tasks.

**Step 1: Create t-shirt front SVG template**

Create a greyscale t-shirt silhouette SVG with:

- ViewBox: `0 0 400 480` (portrait aspect ratio for garments)
- Greyscale fills with shading (lighter chest, darker sides/folds)
- Transparent background
- Clean paths suitable for `feColorMatrix` filtering

The SVG should be a realistic t-shirt outline rendered in shades of grey (#808080 base with #999 highlights and #666 shadows). No text, no decoration — just the garment shape.

```bash
mkdir -p ~/Github/mokumo-worktrees/session-0214-mockup-design/public/mockup-templates
```

Write `public/mockup-templates/t-shirts-front.svg` — a greyscale t-shirt front silhouette with collar, shoulders, sleeves, and hem. Use multiple path fills to create depth (lighter center, darker edges for fold lines).

**Step 2: Create t-shirt back SVG template**

Write `public/mockup-templates/t-shirts-back.svg` — similar to front but without the collar V-shape, slightly different shading to indicate the back view.

**Step 3: Verify SVGs render correctly**

Open both SVGs in browser to confirm they look like realistic greyscale t-shirt silhouettes.

**Step 4: Commit**

```bash
git add public/mockup-templates/t-shirts-front.svg public/mockup-templates/t-shirts-back.svg
git commit -m "feat(assets): add greyscale t-shirt SVG templates for mockup engine"
```

---

### Task 5: Mock Mockup Template Data

**Files:**

- Modify: `lib/mock-data.ts` — add mockup template mock data
- Reference: `lib/schemas/mockup-template.ts` for types

**Step 1: Add mock template data**

At the end of `lib/mock-data.ts`, add mockup template mock data that connects to existing garment catalog entries:

```typescript
// --- Mockup Templates ---------------------------------------------------
import type { MockupTemplate } from '@/lib/schemas/mockup-template'

export const mockupTemplates: MockupTemplate[] = [
  {
    id: 'mt-00000001-0000-4000-8000-000000000001',
    garmentCategory: 't-shirts',
    view: 'front',
    svgPath: '/mockup-templates/t-shirts-front.svg',
    printZones: [
      { position: 'front-chest', x: 28, y: 18, width: 44, height: 35 },
      { position: 'left-chest', x: 52, y: 18, width: 16, height: 16 },
      { position: 'full-front', x: 22, y: 15, width: 56, height: 50 },
    ],
    viewBoxWidth: 400,
    viewBoxHeight: 480,
  },
  {
    id: 'mt-00000001-0000-4000-8000-000000000002',
    garmentCategory: 't-shirts',
    view: 'back',
    svgPath: '/mockup-templates/t-shirts-back.svg',
    printZones: [
      { position: 'full-back', x: 22, y: 18, width: 56, height: 50 },
      { position: 'upper-back', x: 25, y: 12, width: 50, height: 15 },
      { position: 'nape', x: 42, y: 5, width: 16, height: 10 },
    ],
    viewBoxWidth: 400,
    viewBoxHeight: 480,
  },
]
```

**Step 2: Verify mock data validates**

Run: `npm test -- lib/schemas/__tests__/mock-data.test.ts`
Expected: PASS (existing tests still pass; new data validates if tested)

**Step 3: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat(mock-data): add mockup template data for t-shirts front/back"
```

---

### Task 5A: Extend JobCard View Model for Mockup Data

> **Breadboard Gap #3**: `JobCard` in `board-card.ts` has no garment category, color hex, or artwork data. The Kanban board needs these to render mockup thumbnails without per-card resolution from full job data.

**Files:**

- Modify: `lib/schemas/board-card.ts`
- Modify: `lib/mock-data.ts` (job card projection section)

**Step 1: Add optional mockup fields to jobCardSchema**

In `lib/schemas/board-card.ts`, add these 3 optional fields to `jobCardSchema`:

```typescript
// Add after the existing `orderTotal` field:
  garmentCategory: garmentCategoryEnum.optional(),
  garmentColorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  primaryArtworkUrl: z.string().optional(),
```

Also add the import at the top:

```typescript
import { garmentCategoryEnum } from './garment'
```

**Step 2: Update mock data card projection**

In `lib/mock-data.ts`, wherever `JobCard` objects are projected from `Job` data, add the garment fields. Find the card projection section and add:

```typescript
// For each job card projection, resolve and add:
garmentCategory: (() => {
  const garmentId = job.garmentDetails[0]?.garmentId;
  const garment = garmentCatalog.find((g) => g.id === garmentId);
  return garment?.baseCategory;
})(),
garmentColorHex: (() => {
  const colorId = job.garmentDetails[0]?.colorId;
  const color = colors.find((c) => c.id === colorId);
  return color?.hex;
})(),
primaryArtworkUrl: (() => {
  const artworkId = job.artworkIds?.[0];
  const artwork = artworks.find((a) => a.id === artworkId);
  return artwork?.thumbnailUrl;
})(),
```

**Step 3: Verify existing tests still pass**

Run: `npm test -- lib/schemas/__tests__/board-card.test.ts`
Expected: PASS (new fields are optional, existing data still validates)

**Step 4: Commit**

```bash
git add lib/schemas/board-card.ts lib/mock-data.ts
git commit -m "feat(board-card): add optional garment mockup fields to JobCard view model"
```

---

### Task 6: MockupFilterProvider Component

**Files:**

- Create: `components/features/mockup/MockupFilterProvider.tsx`

This component renders shared SVG `<defs>` (feColorMatrix filters) once globally. All `GarmentMockup` instances reference these filters by ID instead of each defining their own.

**Step 1: Write the component**

```tsx
// components/features/mockup/MockupFilterProvider.tsx
'use client'

import { useMemo } from 'react'
import { hexToColorMatrix } from '@/lib/helpers/color-matrix'

interface MockupFilterProviderProps {
  /** Set of hex colors currently visible on screen. */
  colors: string[]
}

/**
 * Renders shared SVG filter definitions for garment color tinting.
 * Place once in the layout — all GarmentMockup instances reference
 * these filters by ID (garment-tint-{hex}).
 */
export function MockupFilterProvider({ colors }: MockupFilterProviderProps) {
  const uniqueColors = useMemo(() => [...new Set(colors.map((c) => c.toLowerCase()))], [colors])

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <defs>
        {uniqueColors.map((hex) => (
          <filter key={hex} id={`garment-tint-${hex.replace('#', '')}`}>
            <feColorMatrix type="matrix" values={hexToColorMatrix(hex)} />
          </filter>
        ))}
      </defs>
    </svg>
  )
}
```

**Step 2: Commit**

```bash
git add components/features/mockup/MockupFilterProvider.tsx
git commit -m "feat(mockup): add MockupFilterProvider for shared SVG color filters"
```

---

### Task 7: Core GarmentMockup Component

**Files:**

- Create: `components/features/mockup/GarmentMockup.tsx`

This is the core SVG composition engine.

**Step 1: Write the component**

```tsx
// components/features/mockup/GarmentMockup.tsx
'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getZoneForPosition } from '@/lib/constants/print-zones'
import type { GarmentCategory } from '@/lib/schemas/garment'
import type { MockupView } from '@/lib/schemas/mockup-template'

export interface ArtworkPlacement {
  artworkUrl: string
  position: string
  scale?: number
  offsetX?: number
  offsetY?: number
}

// Size presets (classes applied to the root wrapper)
const SIZE_CLASSES = {
  xs: 'w-10 h-12', // 40x48 — Kanban cards, table rows
  sm: 'w-16 h-20', // 64x80 — Quote line items
  md: 'w-72 h-80', // 288x320 — Job detail
  lg: 'w-[400px] h-[480px]', // 400x480 — Editor, approval
} as const

interface GarmentMockupProps {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  size?: keyof typeof SIZE_CLASSES
  className?: string
  /** Path to SVG template. Falls back to /mockup-templates/{category}-{view}.svg */
  templatePath?: string
}

/**
 * Core SVG composition engine for garment mockups.
 * Renders a garment template with color tinting and artwork overlays.
 *
 * Uses feColorMatrix filters (from MockupFilterProvider) for color tinting,
 * and mix-blend-mode: multiply for realistic fabric texture.
 */
export function GarmentMockup({
  garmentCategory,
  colorHex,
  artworkPlacements = [],
  view = 'front',
  size = 'md',
  className,
  templatePath,
}: GarmentMockupProps) {
  const svgPath = templatePath ?? `/mockup-templates/${garmentCategory}-${view}.svg`
  const filterId = `garment-tint-${colorHex.replace('#', '').toLowerCase()}`

  // Resolve print zones for artwork placements
  const resolvedPlacements = useMemo(
    () =>
      artworkPlacements
        .map((placement) => {
          const zone = getZoneForPosition(garmentCategory, view, placement.position)
          if (!zone) return null
          return { ...placement, zone }
        })
        .filter(Boolean) as (ArtworkPlacement & {
        zone: { x: number; y: number; width: number; height: number }
      })[],
    [artworkPlacements, garmentCategory, view]
  )

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'relative rounded-md overflow-hidden bg-surface',
        className
      )}
    >
      <svg
        viewBox="0 0 400 480"
        className="w-full h-full"
        role="img"
        aria-label={`${garmentCategory} mockup - ${view} view`}
      >
        {/* Garment template with color tint filter */}
        <image href={svgPath} width="400" height="480" filter={`url(#${filterId})`} />

        {/* Artwork overlays */}
        {resolvedPlacements.map((placement, i) => {
          const { zone, artworkUrl, scale = 1, offsetX = 0, offsetY = 0 } = placement

          // Convert percentage coordinates to viewBox units
          const zx = (zone.x / 100) * 400
          const zy = (zone.y / 100) * 480
          const zw = (zone.width / 100) * 400
          const zh = (zone.height / 100) * 480

          // Apply scale and offset
          const scaledW = zw * scale
          const scaledH = zh * scale
          const cx = zx + zw / 2 + (offsetX / 100) * zw
          const cy = zy + zh / 2 + (offsetY / 100) * zh
          const ax = cx - scaledW / 2
          const ay = cy - scaledH / 2

          const clipId = `clip-${view}-${placement.position}-${i}`

          return (
            <g key={`${placement.position}-${i}`}>
              <defs>
                <clipPath id={clipId}>
                  <rect x={zx} y={zy} width={zw} height={zh} />
                </clipPath>
              </defs>
              <image
                href={artworkUrl}
                x={ax}
                y={ay}
                width={scaledW}
                height={scaledH}
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="xMidYMid meet"
                style={{ mixBlendMode: 'multiply' }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `cd ~/Github/mokumo-worktrees/session-0214-mockup-design && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add components/features/mockup/GarmentMockup.tsx
git commit -m "feat(mockup): add core GarmentMockup SVG composition engine"
```

---

### Task 8: GarmentMockupThumbnail (Memo'd Wrapper)

**Files:**

- Create: `components/features/mockup/GarmentMockupThumbnail.tsx`

**Step 1: Write the component**

```tsx
// components/features/mockup/GarmentMockupThumbnail.tsx
'use client'

import { memo } from 'react'
import { GarmentMockup } from './GarmentMockup'
import type { ArtworkPlacement } from './GarmentMockup'
import type { GarmentCategory } from '@/lib/schemas/garment'
import type { MockupView } from '@/lib/schemas/mockup-template'

interface GarmentMockupThumbnailProps {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  className?: string
}

/**
 * Memoized small mockup for Kanban cards, table rows, and list items.
 * Renders at xs size (40x48px) by default.
 */
export const GarmentMockupThumbnail = memo(function GarmentMockupThumbnail({
  garmentCategory,
  colorHex,
  artworkPlacements,
  view = 'front',
  className,
}: GarmentMockupThumbnailProps) {
  return (
    <GarmentMockup
      garmentCategory={garmentCategory}
      colorHex={colorHex}
      artworkPlacements={artworkPlacements}
      view={view}
      size="xs"
      className={className}
    />
  )
})
```

**Step 2: Commit**

```bash
git add components/features/mockup/GarmentMockupThumbnail.tsx
git commit -m "feat(mockup): add GarmentMockupThumbnail memo wrapper"
```

---

### Task 9: GarmentMockupCard (Interactive Wrapper)

**Files:**

- Create: `components/features/mockup/GarmentMockupCard.tsx`

**Step 1: Write the component**

```tsx
// components/features/mockup/GarmentMockupCard.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GarmentMockup } from './GarmentMockup'
import type { ArtworkPlacement } from './GarmentMockup'
import type { GarmentCategory } from '@/lib/schemas/garment'
import type { MockupView } from '@/lib/schemas/mockup-template'
import { PRINT_POSITION_LABELS } from '@/lib/constants/print-zones'

interface GarmentMockupCardProps {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Which views have artwork (for tab indicators). */
  availableViews?: MockupView[]
}

/**
 * Interactive mockup card with front/back toggle and artwork indicators.
 * Used in quote detail, job detail, and editor contexts.
 */
export function GarmentMockupCard({
  garmentCategory,
  colorHex,
  artworkPlacements = [],
  size = 'md',
  className,
  availableViews = ['front', 'back'],
}: GarmentMockupCardProps) {
  const [activeView, setActiveView] = useState<MockupView>('front')

  // Determine which views have artwork placed
  const viewHasArtwork = (view: MockupView): boolean => {
    const viewPositionMap: Record<string, string[]> = {
      front: ['front-chest', 'left-chest', 'right-chest', 'full-front'],
      back: ['full-back', 'upper-back', 'nape'],
      'left-sleeve': ['left-sleeve'],
      'right-sleeve': ['right-sleeve'],
    }
    const positions = viewPositionMap[view] ?? []
    return artworkPlacements.some((p) => positions.includes(p.position))
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* View toggle tabs */}
      <div className="flex gap-1" role="tablist" aria-label="Mockup views">
        {availableViews.map((view) => {
          const hasArt = viewHasArtwork(view)
          const isActive = activeView === view
          const label =
            view === 'front'
              ? 'Front'
              : view === 'back'
                ? 'Back'
                : view === 'left-sleeve'
                  ? 'L. Sleeve'
                  : 'R. Sleeve'

          return (
            <button
              key={view}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveView(view)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                isActive
                  ? 'bg-surface text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface/50'
              )}
            >
              {label}
              {hasArt && (
                <span
                  className="ml-1 inline-block size-1.5 rounded-full bg-action"
                  aria-label="has artwork"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Mockup render */}
      <GarmentMockup
        garmentCategory={garmentCategory}
        colorHex={colorHex}
        artworkPlacements={artworkPlacements}
        view={activeView}
        size={size}
      />
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add components/features/mockup/GarmentMockupCard.tsx
git commit -m "feat(mockup): add GarmentMockupCard with view toggle and indicators"
```

---

### Task 10: Barrel Export

**Files:**

- Create: `components/features/mockup/index.ts`

**Step 1: Create barrel export**

```typescript
// components/features/mockup/index.ts
export { GarmentMockup } from './GarmentMockup'
export type { ArtworkPlacement } from './GarmentMockup'
export { GarmentMockupCard } from './GarmentMockupCard'
export { GarmentMockupThumbnail } from './GarmentMockupThumbnail'
export { MockupFilterProvider } from './MockupFilterProvider'
```

**Step 2: Commit**

```bash
git add components/features/mockup/index.ts
git commit -m "feat(mockup): add barrel export for mockup components"
```

---

### Task 11: Integration — QuoteDetailView

> **Breadboard ref**: P1 (Quote Detail View), U1 (mockup thumbnail per print location)
> **Breadboard Gap #1**: Location strings need normalization ("Front" → "front-chest")
> **Breadboard Gap #4**: MockupFilterProvider rendered per-page, not in layout

**Files:**

- Modify: `app/(dashboard)/quotes/_components/QuoteDetailView.tsx`

Replace the existing `ArtworkPreview` usage with `GarmentMockupThumbnail` for a richer visual.

**Step 1: Read current QuoteDetailView** to find exact ArtworkPreview usage locations

Reference: `app/(dashboard)/quotes/_components/QuoteDetailView.tsx` (line ~197-205, in the print locations loop)

Current code at each print location:

```tsx
<ArtworkPreview
  garmentColor={color.hex}
  artworkThumbnailUrl={artwork?.thumbnailUrl}
  artworkName={artwork?.name}
  location={detail.location}
/>
```

**Step 2: Add imports and collect colors**

At the top of the component, add:

```tsx
import { MockupFilterProvider, GarmentMockupThumbnail } from '@/components/features/mockup'
import type { ArtworkPlacement } from '@/components/features/mockup'
import { normalizePosition } from '@/lib/constants/print-zones'
```

Inside the component, collect all garment colors for MockupFilterProvider:

```tsx
const garmentColors = useMemo(() => {
  return quote.lineItems
    .map((item) => {
      const color = allColors.find((c) => c.id === item.colorId)
      return color?.hex
    })
    .filter(Boolean) as string[]
}, [quote.lineItems])
```

**Step 3: Add MockupFilterProvider at the top of the JSX return** (per-page, not global)

```tsx
<div className="space-y-6">
  <MockupFilterProvider colors={garmentColors} />
  {/* ... rest of existing JSX */}
```

**Step 4: Replace ArtworkPreview with GarmentMockupThumbnail**

For each print location detail, replace the `<ArtworkPreview>` with:

```tsx
{
  color && (
    <GarmentMockupThumbnail
      garmentCategory={garment?.baseCategory ?? 't-shirts'}
      colorHex={color.hex}
      artworkPlacements={
        artwork
          ? [
              {
                artworkUrl: artwork.thumbnailUrl,
                position: normalizePosition(detail.location),
              },
            ]
          : []
      }
      className="shrink-0"
    />
  )
}
```

Key: `normalizePosition(detail.location)` converts `"Front"` → `"front-chest"`, `"Back"` → `"full-back"`, etc.

**Step 5: Verify the dev server renders correctly**

Run: `PORT=3005 npm run dev`
Navigate to any quote detail page. Confirm mockup thumbnails appear instead of flat color squares.

**Step 6: Commit**

```bash
git add app/(dashboard)/quotes/_components/QuoteDetailView.tsx
git commit -m "feat(quotes): replace ArtworkPreview with GarmentMockup in detail view"
```

---

### Task 12: Integration — Kanban Board Cards

> **Breadboard ref**: P4 (Kanban Board), U9 (xs mockup thumbnail per card)
> **Breadboard Gap #3**: Resolved by Task 5A — `JobCard` now has `garmentCategory`, `garmentColorHex`, `primaryArtworkUrl`
> **Breadboard Gap #4**: MockupFilterProvider rendered per-page in board/page.tsx

**Files:**

- Modify: `app/(dashboard)/jobs/_components/JobBoardCard.tsx`
- Modify: `app/(dashboard)/jobs/board/page.tsx` (add MockupFilterProvider)

**Step 1: Add mockup thumbnail to JobBoardCard**

Import the thumbnail component:

```tsx
import { GarmentMockupThumbnail } from '@/components/features/mockup'
```

In the card JSX, add a thumbnail on the left side of the header area. The card data comes from the enriched `JobCard` view model (Task 5A):

```tsx
{
  /* Add before or alongside the header div */
}
{
  card.garmentCategory && card.garmentColorHex && (
    <GarmentMockupThumbnail
      garmentCategory={card.garmentCategory}
      colorHex={card.garmentColorHex}
      artworkPlacements={
        card.primaryArtworkUrl
          ? [
              {
                artworkUrl: card.primaryArtworkUrl,
                position: 'front-chest', // primary artwork defaults to front-chest
              },
            ]
          : []
      }
      className="shrink-0"
    />
  )
}
```

Cards without mockup data (missing `garmentCategory` or `garmentColorHex`) render without a thumbnail — graceful degradation.

**Step 2: Add MockupFilterProvider to the board page**

In `app/(dashboard)/jobs/board/page.tsx`, collect all garment colors from visible cards and render a per-page MockupFilterProvider:

```tsx
import { MockupFilterProvider } from '@/components/features/mockup'

// Inside the component, collect colors:
const garmentColors = useMemo(() => {
  return jobCards.map((card) => card.garmentColorHex).filter(Boolean) as string[]
}, [jobCards])

// In the JSX return, add at top:
;<MockupFilterProvider colors={garmentColors} />
```

**Step 3: Verify on dev server**

Run: `PORT=3005 npm run dev`
Navigate to `/jobs/board`. Confirm small mockup thumbnails appear on job cards that have garment data.

**Step 4: Commit**

```bash
git add app/(dashboard)/jobs/_components/JobBoardCard.tsx app/(dashboard)/jobs/board/page.tsx
git commit -m "feat(kanban): add garment mockup thumbnails to job board cards"
```

---

### Task 13: Integration — Job Detail Page

> **Breadboard ref**: P3 (Job Detail), U6-U8 (mockup card + view toggle + dot indicators)
> **Breadboard Gap #2**: Job `printLocations[]` has no `artworkId`. Use 1:1 order mapping with `artworkIds[]`.
> **Breadboard Gap #1**: Job `printLocations[].position` uses "Front Center" etc — needs normalization.
> **Breadboard Gap #4**: Per-page MockupFilterProvider.

**Files:**

- Modify: `app/(dashboard)/jobs/[id]/page.tsx`

**Step 1: Add imports**

```tsx
import { GarmentMockupCard, MockupFilterProvider } from '@/components/features/mockup'
import type { ArtworkPlacement } from '@/components/features/mockup'
import { normalizePosition } from '@/lib/constants/print-zones'
import { garmentCatalog, colors as allColors, artworks as allArtworks } from '@/lib/mock-data'
```

**Step 2: Build mockup data from job**

Inside the component, after the existing `useMemo` blocks, add:

```tsx
// Resolve garment category and color for primary garment
const mockupData = useMemo(() => {
  if (!job) return null
  const garmentId = job.garmentDetails[0]?.garmentId
  const colorId = job.garmentDetails[0]?.colorId
  const garment = garmentCatalog.find((g) => g.id === garmentId)
  const color = allColors.find((c) => c.id === colorId)
  if (!garment || !color) return null

  // BREADBOARD GAP #2: Map artworkIds[] to printLocations[] in order (1:1)
  const artworkPlacements: ArtworkPlacement[] = job.printLocations
    .map((loc, i) => {
      const artworkId = job.artworkIds[i]
      const artwork = artworkId ? allArtworks.find((a) => a.id === artworkId) : undefined
      return {
        artworkUrl: artwork?.thumbnailUrl ?? '',
        position: normalizePosition(loc.position), // "Front Center" → "front-chest"
      }
    })
    .filter((p) => p.artworkUrl) // Only include locations with artwork

  return {
    garmentCategory: garment.baseCategory,
    colorHex: color.hex,
    artworkPlacements,
    colors: [color.hex],
  }
}, [job])
```

**Step 3: Add "What We're Printing" section + MockupFilterProvider**

In the JSX, after the `<QuickActionsBar>` and before the two-column layout, add:

```tsx
{
  /* Per-page MockupFilterProvider */
}
{
  mockupData && <MockupFilterProvider colors={mockupData.colors} />
}

{
  /* What We're Printing */
}
{
  mockupData && (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">What We're Printing</h3>
      <GarmentMockupCard
        garmentCategory={mockupData.garmentCategory}
        colorHex={mockupData.colorHex}
        artworkPlacements={mockupData.artworkPlacements}
        size="md"
      />
    </div>
  )
}
```

**Step 4: Verify on dev server**

Run: `PORT=3005 npm run dev`
Navigate to any job detail page (e.g., `/jobs/{id}`). Confirm:

- Mockup card renders with garment silhouette tinted to correct color
- Front/back toggle works
- Dot indicators show which views have artwork
- Jobs without garment data show no mockup section (graceful degradation)

**Step 5: Commit**

```bash
git add app/(dashboard)/jobs/[id]/page.tsx
git commit -m "feat(jobs): add garment mockup card to job detail page"
```

---

### Task 14: Type Check + Full Test Suite

**Files:** None new — validation pass.

**Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass (existing + new mockup schema tests)

**Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 4: Run production build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit any fixes needed, then final commit**

```bash
git add -A
git commit -m "chore: pass full type check, test suite, and production build"
```

---

### Task 15: Push + PR

**Step 1: Push branch**

```bash
git push -u origin session/0214-mockup-design
```

**Step 2: Create PR**

```bash
gh pr create --title "feat: Garment mockup SVG composition engine" --body "$(cat <<'EOF'
## Summary

- Adds reusable garment mockup engine that composites artwork onto SVG garment templates
- `feColorMatrix` SVG filter for accurate color tinting (preserves fabric shading)
- `mix-blend-mode: multiply` for realistic "printed on fabric" appearance
- Pre-defined print zone geometry per garment category
- 4 React components: GarmentMockup (core), GarmentMockupCard (interactive), GarmentMockupThumbnail (memo'd), MockupFilterProvider (shared filters)
- Integrated into: QuoteDetailView, JobBoardCard (Kanban), JobDetailPage
- Zero new dependencies — all browser-native SVG/CSS
- Full Zod schemas + Vitest tests for MockupTemplate and PrintZone
- Design doc: `docs/plans/2026-02-14-garment-mockup-design.md`

## Architecture

Level 1 of a 4-level maturity path:
1. **SVG Composition** (this PR) — greyscale templates + color tinting
2. Photo-Based (Phase 2) — S&S Activewear API product photos
3. Interactive Canvas (Phase 2/3) — Fabric.js drag/resize/rotate
4. 3D Garment Model (Phase 3/4) — Three.js/R3F

Same component props interface at every level — rendering engine is swappable.

## Test plan

- [ ] `npm test` — all schema tests pass (mockup-template, print-zones, color-matrix)
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — production build succeeds
- [ ] Visual: Quote detail shows garment mockup thumbnails per line item
- [ ] Visual: Kanban board cards show small mockup thumbnails
- [ ] Visual: Job detail page shows "What We're Printing" mockup card with front/back toggle
- [ ] Different garment colors render with correct tinting
- [ ] Artwork appears within print zone boundaries (clipped correctly)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Dependency Chain

```
Task 1 (schemas) ──┐
Task 2 (constants + aliases)─┼── Task 5 (mock data) ─┬── Task 6 (FilterProvider)
Task 3 (color util)──────────┘                        │
                                                      ├── Task 5A (JobCard schema)
                                                      │
                                                      └── Task 7 (GarmentMockup core)
Task 4 (SVG assets) ─────────────────────────────────┘    │
                                                            ├── Task 8 (Thumbnail)
                                                            ├── Task 9 (Card)
                                                            └── Task 10 (Barrel)
                                                                 │
                                                ┌────────────────┼────────────────┐
                                                │                │                │
                                    Task 11 (Quote)    Task 12 (Kanban)    Task 13 (Job)
                                    uses: normalizePosition   uses: JobCard      uses: normalizePosition
                                                │                │                │
                                                └────────────────┼────────────────┘
                                                                 │
                                                            Task 14 (Validate)
                                                                 │
                                                            Task 15 (PR)
```

Tasks 1-4 can run in parallel. Task 5A depends on Task 5. Tasks 11-13 can run in parallel.
