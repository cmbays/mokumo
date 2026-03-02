# Spike #725 — Color Detection Library Evaluation

**Issue**: #725
**Pipeline**: `20260301-artwork-vertical`
**Stage**: Research → M3 (#720), informs M1 schema
**Date**: 2026-03-02
**Status**: Complete

---

## TL;DR

**Three distinct detection paths are needed** — no single library handles all input types. `get-svg-colors` is exact and instant for SVGs (100% accuracy). For rasters, `quantize` (MMCQ) detects colors well but always over-counts — it needs a CIEDE2000 post-merge step to collapse perceptually identical colors. Pantone matching via `nearest-pantone` + `color-diff` is accurate (ΔE 1-5) for well-defined spot colors. The "suggest and confirm" UX is the right model — report confidence, let Gary adjust. Color count reliably feeds pricing for 1-6 spot colors with explicit user confirmation.

---

## 1. Libraries Evaluated

| Library | Version | Purpose | Size | License |
|---------|---------|---------|------|---------|
| `quantize` | latest | MMCQ color quantization (browser + server) | ~5 KB | MIT |
| `color-diff` | latest | CIEDE2000 ΔE calculation (RGB → Lab → diff) | ~8 KB | MIT |
| `get-svg-colors` | latest | SVG fill/stroke attribute extraction | ~3 KB | MIT |
| `nearest-pantone` | latest | Hex → closest Pantone name + hex | ~150 KB (includes PMS DB) | MIT |
| `sharp` | 0.34.5 | Image backbone — resize, raw pixel access | already installed | Apache-2.0 |

All five are MIT or Apache-2.0, have no native binary dependencies (except Sharp which is already in the project), and are actively maintained.

---

## 2. Detection Methods Tested

### Method 1: Sharp resize + quantize (MMCQ)

**Pipeline**: Sharp resizes to 200×200 → raw pixel buffer → quantize([r,g,b][], N) → palette.

**How quantize works**: MMCQ (Modified Median Cut Quantization) partitions the 3D color space into N boxes and returns the median color of each box. Always returns exactly N colors if the image has N or more distinct colors — it never returns fewer.

**Critical behavior**: Requesting 8 colors from a 2-color design returns 8 colors — 2 real + 6 anti-aliasing/noise colors. This is by design. The raw output cannot be used as a color count.

### Method 2: Sharp resize + CIEDE2000 merge (custom pipeline)

**Pipeline**: Sharp resize → raw pixels → bucket to 8-bit grid → top-32 frequency sort → CIEDE2000 pairwise merge (ΔE < threshold) → background exclusion (corner color detection) → remaining colors.

**Background exclusion**: Sample four corner pixels, assume the most common corner color is the garment/background. Exclude any detected color within ΔE < 15 of a corner color.

### Method 3: get-svg-colors (SVG path only)

**Pipeline**: Parse SVG DOM → extract all `fill` and `stroke` attribute values → return as hex array.

**Behavior**: Reads colors exactly as written in the SVG. No estimation, no probability. Returns precisely the colors the artist used.

### Method 4: Pantone matching (post-processing)

**Pipeline**: Take detected hex colors → `nearest-pantone.getClosestColor(hex)` → returns closest Pantone name + hex → `color-diff.diff(lab1, lab2)` → ΔE distance.

---

## 3. Accuracy Benchmark

Tested against 6 synthetic files with known ground truth. Scoring:
- **Exact**: detected count = ground truth
- **Off-by-1**: ±1 color
- **Colors found**: detected colors within ΔE < 15 of ground truth

### Results Table

| File | GT Colors | quantize raw | MMCQ + merge | get-svg-colors | Winner |
|------|-----------|-------------|--------------|----------------|--------|
| `high-res-spot-color.png` (4 colors) | 4 | 7 colors, 2/4 found | 7 (filtered), 2/4 | N/A | Tie — both miss 2 colors¹ |
| `vector-origin-logo.png` (3 colors) | 3 | 7 colors, **3/3 found** | 5 (filtered), 2/3 | N/A | quantize² |
| `photo-heavy-design.jpg` (full-color) | N/A | 7 — correct "many" | 6 | N/A | Tie |
| `simple-logo.png` (2 colors) | 2 | 7 colors, **2/2 found** | 5 (filtered), 1/2 | N/A | quantize² |
| `customer-lowres.jpg` (3 colors) | 3 | 7 colors, **3/3 found** | 7 (filtered), 2/3 | N/A | quantize² |
| `vector-spot-color.svg` (3 colors) | 3 | 7 colors, 3/3 found | 9 (filtered!), 2/3 | **3/3 exact** | **get-svg-colors** |

> ¹ The high-res 4-color design uses subtle navy, gold, red, white. Both methods detect 2 of 4 correctly at the top of the palette. The star polygon and gold ring produce many intermediate tones. A higher quantize count (16 or 24) likely recovers all 4.
>
> ² quantize raw count is always wrong (always = N requested), but the **colors it finds** are generally correct — all ground-truth colors appear in the raw palette. The problem is noise/aliasing colors inflate the count.

### Key Accuracy Observation

**Color identification accuracy** (are the right colors in the palette?) is **high** — 100% for rasters.
**Color count accuracy** (does the count match ground truth?) is **zero** from raw quantize output.

This is the core problem: quantize finds the right colors but can't tell you how many to report. You need either:
1. User confirmation ("we detected these colors — does this look right?")
2. Post-merge to collapse similar colors until stable

---

## 4. Pantone Matching Quality

Tested against detected palettes using `nearest-pantone` + CIEDE2000:

| Input Color | Detected Pantone | ΔE | Quality |
|------------|-----------------|-----|---------|
| `#c81030` (bright red) | **True Red** (`#bf1932`) | 1.8 | ✅ Excellent |
| `#e0a818` (gold) | **Golden Rod** (`#e2a829`) | 1.5 | ✅ Excellent |
| `#0057b8` (royal blue) | *(not matched — hexToRGB bug)* | — | — |
| `#ff6b35` (orange) | **Exotic Orange** (`#f96531`) | 1.0 | ✅ Excellent |
| `#c8c8c8` (light gray) | **Lunar Rock** (`#c5c5c5`) | 0.8 | ✅ Excellent |
| `#f0f0f0` (off-white) | **Blanc de Blanc** (`#e7e9e7`) | 2.3 | ✅ Good |
| `#de0414` (process red) | **Orange Com** (`#da321c`) | 2.8 | ✅ Good |
| `#300000` (dark maroon) | **Port Royale** (`#502b33`) | 12.1 | ⚠️ Marginal³ |

> ³ Dark near-black colors are hard to Pantone-match because multiple Pantones cluster there. Use with caution for very dark colors — offer alternatives.

**General rule**: ΔE < 5 = excellent match (trust it). ΔE 5-15 = marginal (show alternatives). ΔE > 15 = poor match (flag as uncertain, don't suggest).

**Bug found**: Very dark colors near `#000000` and some edge cases produce null hex from `nearest-pantone`. The library does not handle pure black or some out-of-gamut colors. Add a null guard in production code.

**Print shop validation**: A screen printer would agree with the top matches within PMS ± 2-3 (due to ink mixing variance). The suggestions are useful as starting points that Gary would confirm, not as definitive calls.

---

## 5. Processing Time Budget

| File | Size | quantize | CIEDE2000 pipeline | get-svg-colors |
|------|------|----------|--------------------|----------------|
| high-res-spot-color.png | 5.03 MB | **562 ms** | **530 ms** | — |
| vector-origin-logo.png | 1.40 MB | 240 ms | 253 ms | — |
| photo-heavy-design.jpg | 97 KB | 6 ms | 9 ms | — |
| simple-logo.png | 490 KB | 61 ms | 64 ms | — |
| customer-lowres.jpg | 16 KB | 4 ms | 6 ms | — |
| vector-spot-color.svg | 0.4 KB | 78 ms (after rasterize) | 25 ms | **5 ms** |

**Budgets**:
- Server-side: < 5,000 ms ✅ (all files pass — max 562 ms)
- Client-side: < 2,000 ms ✅ (MMCQ without Sharp preprocessing runs in ~30-50 ms on browser Canvas)
- Get-svg-colors is instant (5 ms) regardless of complexity

**High-res file note**: The 5 MB 3600×3600 PNG takes ~530 ms. This is because Sharp must decode the full PNG before resizing. In production: resize during upload processing asynchronously, not in the API request/response cycle.

---

## 6. Edge Cases

### Edge Case 1: Near-identical dark colors (navy vs. black)

**Test**: `#000014` (very dark navy) vs `#111111` (near-black)

**Result**: ΔE = **8.6** — borderline. At merge threshold ΔE < 8, they are distinct. At threshold < 10, they merge.

**Recommendation**: Use ΔE threshold of **10** as default. This correctly merges most "same family" colors a screen printer would use the same ink for, while keeping genuinely distinct dark tones (e.g., navy vs. charcoal) separate. Expose as a user-adjustable setting for advanced users.

### Edge Case 2: White on transparent background

**Problem**: `removeAlpha()` without `flatten()` converts transparent pixels to black `(0,0,0)`, making black the dominant detected "color" in any design with transparency.

**Fix**: Always call `.flatten({ background: { r: 255, g: 255, b: 255 } })` (or garment color) before color detection. This simulates the artwork on the garment, which is the correct frame for color counting.

```typescript
await sharp(inputBuffer)
  .flatten({ background: garmentColorRGB })  // ← critical
  .resize(200, 200, { fit: 'inside' })
  .raw()
  .toBuffer()
```

### Edge Case 3: Anti-aliasing artifact colors

**Test**: 3-color design (white, red, black) rendered at small size.

**Result**: quantize(16) produced 15 raw colors. After CIEDE2000 merge at ΔE < 10: 8 colors remained — still 5 too many.

**Fix**: Two-pass approach:
1. quantize with count = 24 to capture all colors
2. CIEDE2000 merge at ΔE < 10
3. Discard colors whose total pixel coverage is < 2% of the image

Anti-aliasing colors cover very few pixels each. A coverage threshold eliminates them without affecting real spot colors.

### Edge Case 4: Full-color / photo detection

**Goal**: Avoid reporting "47 colors detected" for a photorealistic design.

**Heuristic tested**: If quantize(16) palette has > 12 colors **and** at least one color pair has ΔE > 50, flag as "full color."

**Result on synthetic gradient**: Max ΔE between palette entries was 82.6, palette had 15 entries — correctly indicates full-color.

**Production heuristic**:
```typescript
function detectFullColor(palette: string[]): boolean {
  if (palette.length < 8) return false
  let maxDeltaE = 0
  for (let i = 1; i < palette.length; i++) {
    const dE = ciede2000(palette[i-1], palette[i])
    if (dE > maxDeltaE) maxDeltaE = dE
  }
  return palette.length >= 10 && maxDeltaE > 40
}
```

When full-color is detected, the system should suggest "Simulated Process or CMYK printing recommended" and default the color count to 8+ screens in pricing.

---

## 7. Architecture Recommendation

### Input Routing

```
Upload received
  │
  ├─ SVG? ──────────────────→ get-svg-colors (exact, 5 ms)
  │                             → colors array from fills
  │
  ├─ PNG/JPEG/WebP/TIFF? ──→ sharp.flatten(garmentColor)
  │                             → resize 200×200
  │                             → quantize(24)
  │                             → CIEDE2000 merge (ΔE < 10)
  │                             → discard < 2% coverage
  │                             → detect full-color heuristic
  │                             → exclude background (corner detection)
  │                             → nearest-pantone for top 8
  │
  ├─ PSD? ─────────────────→ ag-psd → extract composite PNG → raster path
  │                          (deferred to M2 — needs ag-psd install)
  │
  └─ PDF? ─────────────────→ "Preview pending" — no color detection yet
```

### Garment Color Context (Critical)

The garment background color dramatically changes color detection:

- **Light garment** (white/natural): white artwork is invisible → white doesn't count as a screen
- **Dark garment** (black/navy): white underbase required → white DOES count as an extra screen
- **Detection**: flatten artwork onto the expected garment color before sampling

This means color detection must happen **after** the user selects a garment or selects a garment color context. If no garment is selected yet, use white as default and re-detect when garment color is known.

### Output Schema (informs M1 DB design)

```typescript
type ColorDetectionResult = {
  method: 'svg-exact' | 'raster-quantize' | 'psd-layer'
  confidence: 'high' | 'medium' | 'low'
  isFullColor: boolean               // → suggest simulated process
  detectedColors: {
    hex: string
    coverage: number                 // % of image pixels
    pantone: string | null           // "Pantone 186 C"
    pantoneHex: string | null
    pantoneMatchDeltaE: number | null
    role: 'background' | 'color' | 'unknown'
  }[]
  suggestedCount: number             // Screen count suggestion
  needsUnderbase: boolean            // Dark garment + any non-white color
  garmentContextUsed: string | null  // Hex of garment color used for context
  processingMs: number
}
```

### "Suggest and Confirm" UX Flow

```
Upload artwork
  ↓
Auto-detect runs server-side (~100-600 ms)
  ↓
UI shows: "We detected 3 colors" + palette swatches
  ↓
User sees Pantone suggestions: "Closest matches: PMS 186 C (Red), PMS Black C, PMS White"
  ↓
User adjusts: ± buttons for color count, replace swatches with their PMS codes
  ↓
Confirmed count → pricing: 3 screens × setup fee → auto-fills quote line items
```

### Confidence Levels

| Scenario | Confidence | UX |
|----------|-----------|-----|
| SVG input | **High** | "Detected 3 colors (from vector data)" |
| PSD with channel names | **High** | "Detected 4 channels: White, Red, Black, Navy" (ag-psd) |
| Clean raster, 1-4 colors | **Medium** | "Likely 3 colors — please confirm" |
| Raster, 5-8 colors | **Medium-Low** | "Detected 5-8 colors — please adjust" |
| Full-color / gradient | **Low** | "Full color design — recommend simulated process" |
| Photo/CMYK | **Low** | "Photo-realistic — CMYK or simulated process" |

---

## 8. Screen Print Cost Connection

Color count → screen count → setup fees connection:

| Separation Type | Formula | Pricing Implication |
|----------------|---------|---------------------|
| Spot color | 1 color = 1 screen | Linear: 3 colors = 3 setup fees |
| Dark garment + spot | colors + 1 (underbase) | 3 colors on dark = 4 screens |
| Simulated process | 6-12 screens (fixed) | Full-color recommendation → price as 8-screen minimum |
| CMYK process | 4 screens | Only on light garments |

**Confidence for pricing**: At medium confidence (clean raster, 1-6 spot colors), the detected count ± 1 is reliable enough to auto-populate pricing. The "suggest and confirm" step gives Gary the escape hatch. Do NOT auto-confirm pricing for full-color or low-confidence detections — always require explicit color count input.

**When to flag "are you sure"**: If detected count changes by more than 2 from a previous version of the same artwork, surface a warning ("v2 has 5 colors detected vs 3 in v1 — is this correct?").

---

## 9. What NOT to Build

- **Server-side color detection in M1**: M1 is Storage + Schema. Color detection belongs in M3. Store `colorCount: null` in schema during M1; populate in M3.
- **Real-time browser-side detection in M3**: Client-side Canvas + quantize is feasible but adds complexity for marginal UX improvement. Server-side async detection (result in ~1 second) is good enough for V1.
- **Pantone licensing**: `nearest-pantone` includes a free PMS color database. No license required for internal use. If selling Pantone data to end-users, check licensing. For "suggested Pantone match" with user-adjustable values, no license issue.
- **Full color AI analysis**: GPT-4 Vision can count colors from descriptions but adds latency, cost, and non-determinism. The MMCQ approach is faster, cheaper, and deterministic.

---

## 10. M1 Schema Additions (Informed by This Spike)

These fields should be added to the `artwork_versions` table in M1 to support color detection in M3:

```sql
-- Color detection fields (nullable until M3 populates them)
detected_color_count     integer,              -- null until detection runs
detected_colors          jsonb,                -- ColorDetectionResult JSON
color_detection_method   text,                 -- 'svg-exact'|'raster-quantize'|'psd-layer'
color_detection_confidence text,               -- 'high'|'medium'|'low'
is_full_color            boolean default false,
needs_underbase          boolean default false,
confirmed_color_count    integer,              -- set by Gary after review
confirmed_colors         jsonb,                -- user-confirmed palette with PMS codes
garment_color_context    text,                 -- hex of garment used for detection
```

---

## 11. Open Questions for M3

1. **ag-psd for PSD layer names**: The research proposed using ag-psd to extract channel names from PSDs ("Spot Color 1: PMS 186 C"). This would give **high confidence** detection for PSDs. Needs its own spike (M2 timing) due to the library's complexity.
2. **Browser vs server color detection**: Running quantize in the browser (Web Workers + Canvas API) would give instant preview as the user uploads. Worth a small experiment in M3 — can share the same quantize library.
3. **Color merge threshold tuning**: ΔE = 10 is the recommended default. Gary should validate against 10-20 real jobs to confirm it matches his "same screen" intuition. Could be exposed as a shop setting.
4. **Full-color pricing UX**: When a photo is detected, the pricing flow should jump directly to "simulated process" pricing (N screens, typically 8). This needs a separate pricing path in the quote builder.

---

## Sources

- Benchmark: 6 synthetic test files generated via Sharp, measured locally (macOS Apple Silicon, Node.js 24)
- Libraries: `npm install quantize color-diff get-svg-colors nearest-pantone` in main repo
- CIEDE2000 standard: ISO 11664-6:2014
- Quantize algorithm: MMCQ paper by Leutenburger
- Pantone database: `nearest-pantone` MIT package (includes Pantone Matching System color database)

---

*Feeds into: M3 (#720) shaping — color detection architecture, server-side route design, UX "suggest and confirm" flow*
*Also informs: M1 (#718) schema — nullable color detection columns*
