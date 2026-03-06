---
title: Artwork Management Research
description: Competitive analysis, domain model, color detection, storage, separation files, mockup generation, and approval workflows for the Artwork Library vertical.
---

# Artwork Management Research

> Research date: March 2026 | Status: Complete
> **Informs**: P5 (Artwork Library), P6 (Quote Integration via M4), P12 (Screen Room via M6 separation handoff)
> **Epic**: #717 | **Milestones**: #718–#724 | **Spikes**: #725 (color detection), #726 (storage limits)

---

## Competitive Landscape

### Competitor Capability Matrix

| Capability               | Printavo                  | InkSoft               | DecoNetwork                   | YoPrint                 | GraphicsFlow         |
| ------------------------ | ------------------------- | --------------------- | ----------------------------- | ----------------------- | -------------------- |
| File upload per order    | Yes                       | Via designer          | Yes                           | Yes                     | N/A                  |
| Customer art library     | **No**                    | Saved designs/store   | Design library (order-scoped) | **No**                  | My Art workspace     |
| Online designer          | No (basic Mockup Creator) | Yes (Design Studio)   | Yes (Online Designer)         | No                      | Stock Art Customizer |
| Auto mockup from catalog | No                        | Partial               | **Yes (SmartSelect)**         | No                      | No                   |
| Artwork approval         | Yes (flexible)            | Proposal-based        | Formal workflow               | **Yes (per-artwork)**   | Basic                |
| Revision tracking        | No                        | Proposal-level        | Multiple versions             | **Yes (best-in-class)** | No                   |
| File validation          | No                        | Boundary enforcement  | File standards notif.         | No                      | No                   |
| Annotation/markup        | No                        | No                    | Notes/attachments             | Comments only           | Comments only        |
| PDF approval sheet       | No                        | No                    | **Yes (comprehensive)**       | No                      | No                   |
| Art-to-production gate   | Custom statuses           | Approval blocks cards | Approval blocks prod.         | All-art-approved gate   | N/A                  |
| Decoration zones         | No                        | Yes (boundaries)      | **Yes (auto-config)**         | No                      | No                   |
| Starting price           | $49/mo                    | $314/mo               | $199/mo + $499 setup          | $69/mo                  | $99/mo               |

### Pricing Insight

Artwork management is table-stakes, not a premium upsell. Every competitor includes it at their lowest paid tier. Differentiate on intelligence and quality, not gating.

### 8 Competitive Gaps

No competitor has all of these:

1. **Customer Art Library** — Cross-order vault per customer. Even DecoNetwork's "past artwork" is order-scoped, not customer-scoped.
2. **Automated File Validation** — DPI check, vector vs raster detection, color mode, print-readiness badge. Table-stakes in packaging software, absent in every decorated apparel platform.
3. **Art-to-Screen-Room Integration** — Approved artwork generates `ScreenRequirement[]`. Connects art complexity to production effort — no competitor does this.
4. **Visual Proof Annotation** — Customers mark up proofs with positioned comments. Exists in packaging software (Ashore), not in shop management.
5. **Art Department Workflow Board** — Dedicated Kanban: Received → In Progress → Separated → Proof Sent → Approved → Print-Ready.
6. **Revision History with Visual Diff** — Side-by-side version comparison. YoPrint tracks versions; no competitor shows a visual diff.
7. **Smart Mockup from Catalog** — Leverage existing S&S catalog images + decoration zone metadata.
8. **Color Count → Production Complexity** — Connect detected color count to screen count → setup fees → pricing. No platform closes this loop automatically.

---

## Domain Model

### Artwork → Variant → Version Hierarchy

```
Customer
  └── Artwork (logical concept — "River City Brewing Logo")
        ├── metadata: name, tags, service_type_suitability, favorite, created_at
        ├── Design Variant A ("White on Dark" treatment)
        │     ├── Version 1 (original upload)
        │     ├── Version 2 (fixed spelling error)
        │     └── Version 3 (approved — immutable snapshot)
        ├── Design Variant B ("Dark on Light" treatment)
        │     ├── Version 1 (original)
        │     └── Version 2 (approved)
        └── Separation (per-variant, post-approval)
              ├── Channel 1: White Underbase (PMS White, 230 mesh, 45 LPI)
              ├── Channel 2: Red (PMS 186C, 160 mesh, spot)
              └── Channel 3: Black (PMS Black C, 160 mesh, spot)
```

### Key Distinctions

| Concept            | Definition                                                                      | Relationship                          |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------- |
| **Artwork**        | Logical design concept owned by a customer                                      | 1 customer → many artworks            |
| **Design Variant** | Specific color treatment of an artwork for a garment color context              | 1 artwork → many variants             |
| **Version**        | Temporal revision of a variant (v1→v2→v3)                                       | 1 variant → many versions (linear)    |
| **Separation**     | Production specification — per-channel metadata extracted from approved variant | 1 approved variant → 1 separation set |

**Version** (temporal, sequential): Same design intent, revised. v1→v2 fixes a spelling error. Only the latest approved version goes to production.

**Variant** (parallel, simultaneous): Same base design, different color treatments for different garment colors. Multiple variants may be active and go to production in the same order.

---

## Color Detection

### The Opportunity

No shop management platform auto-detects colors. Printavo, InkSoft, YoPrint, DecoNetwork all require manual entry. The only tool doing real-time color extraction is **Separo** ($49–149/mo), which is a dedicated separation tool, not a shop management platform.

### Recommended Approach: "Suggest and Confirm"

Auto-detect a color count and palette, let the user adjust. 80%+ accuracy is realistic for typical screen printing artwork (1-6 spot colors on solid background).

### Implementation Architecture

```
┌─────────────── Client (Browser) ──────────────┐
│  1. User uploads artwork                       │
│  2. Canvas API + quantize (MMCQ) → palette     │
│  3. Display: "We detected N colors"            │
│  4. User selects garment color                 │
│  5. User confirms/adjusts color count          │
└────────────────┬───────────────────────────────┘
                 │ Upload file + metadata
                 ▼
┌─────────────── Server (Node.js) ──────────────┐
│  SVG  → get-svg-colors → exact palette        │
│  PSD  → ag-psd → layer channel names          │
│  Raster → Sharp resize → MMCQ →               │
│           CIEDE2000 merge (ΔE<8) →             │
│           exclude garment color →              │
│           nearest-pantone match                │
│  PDF  → rasterize → raster route              │
│                                               │
│  Output: { colorCount, palette, pmsMatches,   │
│            confidence, needsUnderbase }        │
└───────────────────────────────────────────────┘
```

### Key Libraries

| Library           | Purpose                                        | Size                      | License    |
| ----------------- | ---------------------------------------------- | ------------------------- | ---------- |
| `quantize`        | MMCQ color quantization (browser + server)     | ~5 KB                     | MIT        |
| `sharp`           | Image processing backbone (already in project) | —                         | Apache 2.0 |
| `get-svg-colors`  | SVG fill/stroke extraction                     | ~3 KB                     | MIT        |
| `ag-psd`          | PSD layer/channel parsing                      | ~200 KB                   | MIT        |
| `nearest-pantone` | Hex → PMS matching via CIEDE2000               | ~150 KB (PMS DB included) | MIT        |
| `color-diff`      | CIEDE2000 Delta E calculation                  | ~8 KB                     | MIT        |

### Domain-Specific Rules

- **White as a color**: Counts as a screen (underbase) on dark garments, doesn't on light garments. System needs garment color context at detection time.
- **Merge threshold**: CIEDE2000 ΔE < 8–10 for merging "same screen" colors — screen ink mixing is imprecise, slight color variations print identically.
- **Background detection**: Exclude the dominant edge-concentrated color (likely the background/garment color).
- **Gradient handling**: Smooth transitions between hues = 1 screen (halftone), not multiple screens.

### Accuracy by Input Type

| Input Type                       | Expected Accuracy              |
| -------------------------------- | ------------------------------ |
| SVG/vector                       | ~95%+ (colors are explicit)    |
| Clean spot-color raster          | ~85–90%                        |
| Designs with gradients           | ~70–80%                        |
| Photorealistic/simulated process | ~50–60% (inherently ambiguous) |

---

## Storage Architecture

### Provider by Phase

| Phase           | Provider                            | Why                                                                                                                        | Monthly Cost     |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **POC / Beta**  | Supabase Storage (Free tier)        | Already have Supabase project. **1GB storage + 2GB egress included — sufficient for <200 artworks.** Zero additional cost. | $0               |
| **Single Shop** | Cloudflare R2                       | Zero egress fees, S3-compatible API. Migrate when storage approaches 1GB or for production reliability.                    | ~$4.50 for 300GB |
| **SaaS Scale**  | R2 or Backblaze B2 + Cloudflare CDN | Lowest cost at scale                                                                                                       | ~$18–45 for 3TB  |

> **Correction from pre-research assumption**: Supabase is on the **Free tier** (not Pro). Free tier 1GB is sufficient for early production use. R2 migration is needed when artworks exceed ~100–200 files with originals, or when egress becomes a cost concern.

### Volume Projections (Small Shop)

| Metric              | Conservative | Moderate  |
| ------------------- | ------------ | --------- |
| Unique designs/year | 300          | 700       |
| Files per design    | 2–4          | 3–6       |
| Avg file size       | ~5 MB        | ~8 MB     |
| Storage/year        | 5–10 GB      | 28–62 GB  |
| 3-year cumulative   | 13–32 GB     | 84–186 GB |

### Architecture Patterns

1. **Presigned upload URLs** — Client uploads directly to Supabase Storage, not through app server (Vercel has 4.5MB body limit on serverless functions).
2. **Three renditions at upload** via Sharp:
   - Thumbnail: 200×200 WebP (~5–15 KB) — list views, quick browse
   - Preview: 800×800 WebP (~30–80 KB) — detail views, approval
   - Original: preserved as-is — production use, legal record
3. **Content-addressable dedup** — SHA-256 hash catches repeat logo submissions (~10–20% savings in practice).
4. **Never modify originals** — All transformations produce new files. Legal and production requirement.
5. **Shared bucket with path prefixes** — `artwork/{shop_id}/originals/`, `artwork/{shop_id}/thumbnails/`
6. **Soft delete with 30-day grace** — Mark `deleted_at`, background cron purges after 30 days.

### Typical File Sizes

| File Type       | Typical Size   | Notes                                      |
| --------------- | -------------- | ------------------------------------------ |
| Customer JPEG   | 500 KB – 10 MB | Often low-quality, preserve as-is          |
| Vector (AI/EPS) | 200 KB – 5 MB  | Balloons to 20–80 MB with embedded rasters |
| SVG             | 50 KB – 2 MB   | Smallest vector format                     |
| Print-ready PSD | 60–300 MB      | 300 DPI, multi-layer                       |
| Separation PSD  | 100–500 MB     | Per-color channels (6–12 channels)         |
| Customer PDF    | 1–30 MB        | Highly variable quality                    |

---

## Separation Files

### What Are Separations?

Color separation decomposes a full-color design into individual single-color layers. **Each separation = one film = one screen = one ink color = one press pass.** The separation count directly drives cost, press setup time, and screen room workload.

### Four Major Separation Types

| Type                  | Screens                   | Garments             | Best For                    | Cost                           |
| --------------------- | ------------------------- | -------------------- | --------------------------- | ------------------------------ |
| **Spot Color**        | 1 per color (1–6 typical) | Any                  | Logos, text, solid graphics | Cheapest for 1–4 colors        |
| **CMYK Process**      | 4 (C, M, Y, K)            | Light only           | Photos, pastels             | Expensive (tight registration) |
| **Simulated Process** | 6–12                      | Any (including dark) | Photorealistic on dark      | Higher (dominant method)       |
| **Index**             | 8–15                      | Any                  | Hard edges + photos         | Easiest to print               |

### Architectural Boundary

**Artwork vertical owns**:

- Separation file storage (PSD with named channels)
- Separation metadata capture (manually entered or parsed from channel names)
- Per-channel specs: ink color/PMS, role (underbase/color/highlight), halftone LPI, screen angle, dot shape, print order

**Screen Room vertical owns**:

- Physical screen inventory (mesh counts, states)
- Screen-to-separation assignment
- Exposure/burn tracking
- Screen reclamation workflow

**Handoff interface** — `ScreenRequirement[]`:

```typescript
type ScreenRequirement = {
  separationId: string
  inkColor: string // "Pantone 186 C" or "White Underbase"
  inkType: 'plastisol' | 'water-based' | 'discharge'
  meshCountMin: number // Derived from LPI (LPI × 4-5)
  printOrderPosition: number // 1 = first on press
  role: 'underbase' | 'color' | 'highlight'
  halftoneSpec?: {
    lpi: number
    angle: number
    dotShape: 'round' | 'elliptical' | 'square'
  }
}
```

**Critical decision**: Mokumo should NOT perform color separations — that's Photoshop + UltraSeps/Sep Studio territory. Be the **system of record** for separation metadata and the orchestrator connecting art department outputs to screen room inputs.

---

## Mockup Generation

### Recommended Architecture: Hybrid Rendering

| Context          | Rendering                           | Why                           |
| ---------------- | ----------------------------------- | ----------------------------- |
| Quote building   | Client-side SVG (on-the-fly)        | Interactive, instant feedback |
| Quote sent       | Server-side Sharp (frozen snapshot) | Immutable audit trail         |
| Artwork approved | Server-side Sharp (frozen)          | Contractual record            |
| Job card/board   | Client-side SVG (on-the-fly)        | Lightweight, always current   |
| PDF proof        | Server-side Sharp (high-quality)    | Print-quality document        |
| Customer portal  | CDN-served pre-render               | Fast, cached                  |

### Enhancement: SVG feDisplacementMap

Highest-impact upgrade to existing `GarmentMockup.tsx`. Makes artwork follow fabric contours using a grayscale displacement map. Zero server-side changes, all modern browsers support it.

```xml
<filter id="fabric-warp">
  <feImage href="/displacement-maps/tshirt-front.png" result="dispMap" />
  <feDisplacementMap in="SourceGraphic" in2="dispMap"
    scale="20" xChannelSelector="R" yChannelSelector="G" />
</filter>
```

### Dark Garment Rendering

Current `mix-blend-multiply` makes artwork invisible on dark garments. Fix: two-layer composite mirroring actual screen printing on dark fabric:

1. White underbase shape at ~80% opacity (simulates the physical underbase)
2. Artwork with multiply blend on top of the white layer

Detect garment darkness during catalog sync (average luminance in print zone area < 40% = dark mode).

### Freezing Mockups (Lifecycle Events)

Freeze (pre-render and store as immutable image) at:

1. **Quote sent** — contractual representation
2. **Artwork approved** — approval timestamp + frozen mockup = audit trail
3. **Job created** — production reference carried forward

Frozen mockups stored in Supabase Storage with reference in quote/job record. ~200KB per PNG at 800×960. 4,000 images = ~800MB. Trivial cost at both Free tier and R2.

### What NOT to Build

- Three.js 3D mockups — over-engineered for production management
- AI generative mockups — non-deterministic, artwork fidelity risk
- Custom WebGL shaders — massive effort for marginal improvement
- PSD-template APIs (Dynamic Mockups, etc.) — external dependency for something achievable with Sharp

---

## Approval Workflows

### State Machine

```
draft → pending_review → sent → viewed → approved → production
                                   │
                                   ▼
                           revision_requested → revised → sent (loop)
```

### Per-Artwork Granularity (YoPrint Model + Extensions)

- Each artwork/variant in an order has its own approval status
- Customer can approve front design and reject back design independently
- Separate comments per artwork
- When resending, choose to resend only revised artwork or all
- **Extension**: Group variants for the same artwork — show all color treatments together

### Automated Reminder Cadence

Based on Ashore's data (50% faster approvals with reminders):

| Timing | Action                                                  |
| ------ | ------------------------------------------------------- |
| T+0    | Initial notification (email + optional SMS)             |
| T+24h  | First reminder if not viewed                            |
| T+48h  | Second reminder                                         |
| T+72h  | Escalation — different tone, CC additional contacts     |
| T+5–7d | Final — marked urgent, surfaces on dashboard as "stuck" |

### Proof Delivery

**Unique URL (no login required)** is the industry standard for fastest approval:

- Frictionless — customer clicks link, sees proof, one-click approve
- Trackable — view analytics (opened, view duration)
- Supports annotation
- Can be forwarded (feature, not bug — lets customer share with their team for internal review)

Customer portal login reserved for repeat/VIP customers who want full history access.

### Legal Requirements

Every approval must capture immutably:

- **Who**: name, email, IP address
- **What**: immutable proof snapshot (not a reference to the mutable file)
- **When**: timestamp with timezone
- **Terms**: which T&C version they accepted
- **Comments**: any feedback left

Append-only — shop cannot retroactively modify approval records. This is an architectural requirement, not just a UX preference.

---

## Cross-Vertical Integration Points

### Artwork → Customer (P3)

- Per-customer artwork library (`artwork.customer_id` FK)
- Artwork tab on customer detail page
- Favorites surfaced in customer profile
- Reuse detection when creating new quotes

### Artwork → Quoting (P6)

- Select artwork from customer library in quote builder
- Color count auto-derived → screen count → pricing matrix lookup
- Live mockup preview (artwork on selected garment)
- Service type suitability filtering (screen print vs DTF vs DTG)

### Artwork → Pricing (P4)

- Color count drives screen count (spot color: 1:1 mapping)
- Screen count drives setup fees ($15–35 per screen typical)
- Dark garment + underbase = +1 screen = +1 setup fee
- Separation type affects total (simulated process = more screens)

### Artwork → Jobs/Production (P9)

- Frozen mockup follows from approved quote to job
- Separation metadata generates screen requirements
- Art department workflow board tracks internal status
- Approved artwork is the production gate (blocks job start)

### Artwork → Screen Room (P12)

- `ScreenRequirement[]` generated from separation metadata (see Separation Files above)
- Physical screen assignment tracked in Screen Room vertical
- Burn/exposure tracking per screen linked to separation

### Artwork → Invoices (P10)

- Frozen mockup reference carried to invoice
- Setup fees itemized per screen/color
- Artwork approval audit trail available for payment disputes

---

## Sources

**Competitors**: Printavo (printavo.com), InkSoft (inksoft.com), DecoNetwork (deconetwork.com), YoPrint (yoprint.com), GraphicsFlow (graphicsflow.com), Ordant (ordant.com), shopVOX (shopvox.com), Ashore (ashoreapp.com)

**Domain**: ScreenPrinting.com, Anatol, UltraSeps, Freehand Graphics (Sep Studio NXT), T-BizNetwork, Halftone Cat

**Technical**: Sharp (sharp.pixelplumbing.com), Supabase Storage docs, Cloudflare R2 pricing, Pantone API, CIEDE2000 color science

**Print-on-Demand**: Printful API docs, Gelato design requirements, Gooten artwork guidelines
