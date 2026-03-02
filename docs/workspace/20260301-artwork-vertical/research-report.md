# Artwork Vertical — Research Report

**Pipeline**: `20260301-artwork-vertical`
**Stage**: Research
**Date**: 2026-03-01
**Status**: Complete

---

## Executive Summary

The artwork vertical is a foundational capability that feeds into customers, quoting, pricing, production, and invoicing. Research covered 6 domains across competitor analysis, technical architecture, and domain-specific workflows. Key findings:

1. **No competitor offers a per-customer artwork library spanning orders** — this is the #1 differentiation opportunity
2. **No shop management platform auto-detects colors from uploaded artwork** — all require manual entry. Building even basic auto-detection would be a genuine differentiator
3. **Separation files are the bridge between artwork and production** — no competitor captures structured separation metadata. The art-to-screen-room handoff is a unique value proposition
4. **Storage costs are manageable** — Supabase Free tier (1GB) works for early proof-of-concept; Cloudflare R2 ($0 egress, ~$4.50/mo for 300GB) is the natural scale-up path
5. **The version vs variant distinction is crucial** — versions are temporal (v1→v2), variants are parallel (same design, different color treatments). No competitor models this cleanly
6. **Mockup generation should be hybrid** — client-side SVG for interactive preview, server-side Sharp for frozen snapshots at lifecycle events

---

## 1. Competitive Landscape

### Competitor Capabilities Matrix

| Capability               | Printavo                  | InkSoft               | DecoNetwork             | YoPrint                 | GraphicsFlow         |
| ------------------------ | ------------------------- | --------------------- | ----------------------- | ----------------------- | -------------------- |
| File upload per order    | Yes                       | Via designer          | Yes                     | Yes                     | N/A                  |
| Customer art library     | **No**                    | Saved designs/store   | Design library          | **No**                  | My Art workspace     |
| Online designer          | No (basic Mockup Creator) | Yes (Design Studio)   | Yes (Online Designer)   | No                      | Stock Art Customizer |
| Auto mockup from catalog | No                        | Partial               | **Yes (SmartSelect)**   | No                      | No                   |
| Artwork approval         | Yes (flexible)            | Proposal-based        | Formal workflow         | **Yes (per-artwork)**   | Basic                |
| Revision tracking        | No                        | Proposal-level        | Multiple versions       | **Yes (best-in-class)** | No                   |
| File validation          | No                        | Boundary enforcement  | File standards notif.   | No                      | No                   |
| Annotation/markup        | No                        | No                    | Notes/attachments       | Comments only           | Comments only        |
| PDF approval sheet       | No                        | No                    | **Yes (comprehensive)** | No                      | No                   |
| Art-to-production gate   | Custom statuses           | Approval blocks cards | Approval blocks prod.   | All-art-approved gate   | N/A                  |
| Decoration zones         | No                        | Yes (boundaries)      | **Yes (auto-config)**   | No                      | No                   |
| Starting price           | $49/mo                    | $314/mo               | $199/mo + $499          | $69/mo                  | $99/mo               |

### 8 Competitive Gaps (Differentiation Opportunities)

1. **Customer Art Library** — Cross-order art vault per customer. When quoting for "Eastside High School," see all previous artwork. One-click reuse for reorders.
2. **Automated File Validation** — DPI check, vector vs raster detection, color mode, print-readiness badge. Table-stakes in packaging software, non-existent in decorated apparel.
3. **Art-to-Screen-Room Integration** — Approved artwork auto-suggests screen count, mesh, emulsion. Connects art complexity to production effort.
4. **Visual Proof Annotation** — Customers mark up proofs with circles/arrows/positioned comments. Eliminates "make the logo bigger" ambiguity.
5. **Art Department Workflow Board** — Dedicated Kanban: Received → In Progress → Separated → Proof Sent → Approved → Print-Ready. Not generic task lists.
6. **Revision History with Visual Diff** — Side-by-side comparison of artwork versions. YoPrint tracks versions but has no visual comparison.
7. **Smart Mockup from Catalog** — Leverage existing S&S catalog with product images and decoration zones.
8. **Color Count → Production Complexity** — No platform connects art color count to screen/ink/setup requirements.

### Pricing Insight

Artwork management is table-stakes, not a premium upsell. Every competitor includes it at their lowest paid tier. Differentiate on intelligence and quality, not gating.

---

## 2. Domain Model: Artwork Hierarchy

### Artwork → Design → Version model

Based on research, the domain model should distinguish three levels:

```
Customer
  └── Artwork (logical concept — "River City Brewing Logo")
        ├── metadata: name, tags, service_type_suitability, favorite, created_at
        ├── Design Variant A ("White on Dark" treatment)
        │     ├── Version 1 (original upload)
        │     ├── Version 2 (fixed spelling)
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

### Version vs Variant

- **Version** (temporal, sequential): Same design intent, revised. v1→v2 fixes a spelling error. Only the latest approved version goes to production.
- **Variant** (parallel, simultaneous): Same base design, different color treatments. "White on navy" vs "navy on white." Multiple variants may be active simultaneously and go to production in the same order.

---

## 3. Separation Files — Domain Deep Dive

### What Are Separations?

Color separation decomposes a full-color design into individual single-color layers. **Each separation = one film = one screen = one ink color = one press pass.** The separation count directly drives cost, press setup time, and screen room workload.

### Four Major Separation Types

| Type                  | Screens                   | Garments             | Best For                    | Cost                           |
| --------------------- | ------------------------- | -------------------- | --------------------------- | ------------------------------ |
| **Spot Color**        | 1 per color (1-6 typical) | Any                  | Logos, text, solid graphics | Cheapest for 1-4 colors        |
| **CMYK Process**      | 4 (C, M, Y, K)            | Light only           | Photos, pastels             | Expensive (tight registration) |
| **Simulated Process** | 6-12                      | Any (including dark) | Photorealistic on dark      | Higher (dominant method)       |
| **Index**             | 8-15                      | Any                  | Hard edges + photos         | Easiest to print               |

### Architectural Decision: Where Separations Live

**Artwork vertical** owns:

- Separation file storage (PSD with named channels)
- Separation metadata capture (manually entered or parsed from channel names)
- Per-channel specs: ink color/PMS, role (underbase/color/highlight), halftone LPI, screen angle, dot shape, print order

**Screen Room vertical** owns:

- Physical screen inventory (mesh counts, states)
- Screen-to-separation assignment
- Exposure/burn tracking
- Screen reclamation workflow

**Handoff interface** — ScreenRequirement:

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

### Critical Insight: Don't Build Separation Software

Screen Print Pro should NOT perform color separations — that's Photoshop + UltraSeps/Sep Studio territory. Instead, be the **system of record** for separation metadata and the orchestrator connecting art department outputs to screen room inputs.

---

## 4. Color Detection — Technical Architecture

### The Opportunity

No shop management platform auto-detects colors. Printavo, InkSoft, YoPrint, DecoNetwork all require manual entry. The only tool doing real-time color extraction is **Separo** ($49-149/mo), which is a dedicated separation tool, not a shop management platform.

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
│  Route 1: SVG → get-svg-colors → exact palette│
│  Route 2: PSD → ag-psd → layer names          │
│  Route 3: Raster → Sharp resize → MMCQ →      │
│           CIEDE2000 merge (ΔE<8) →             │
│           exclude garment color →               │
│           nearest-pantone match                 │
│  Route 4: PDF → rasterize → Route 3           │
│                                                │
│  Output: { colorCount, palette, pmsMatches,    │
│            confidence, needsUnderbase }         │
└────────────────────────────────────────────────┘
```

### Key Libraries

| Library           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `quantize`        | MMCQ color quantization (browser + server) |
| `Sharp`           | Image processing backbone (server)         |
| `get-svg-colors`  | SVG fill/stroke extraction                 |
| `ag-psd`          | PSD layer/channel parsing                  |
| `nearest-pantone` | Hex → PMS matching via CIEDE2000           |
| `color-diff`      | CIEDE2000 Delta E calculation              |

### Domain-Specific Rules

- **White as a color**: Counts as a screen on dark garments (underbase), doesn't on light garments. System needs garment color context.
- **Merge threshold**: CIEDE2000 ΔE < 8-10 for merging "same screen" colors (screen ink mixing is imprecise).
- **Background detection**: Exclude the dominant edge-concentrated color (likely background/garment).
- **Gradient handling**: Smooth transitions between hues = 1 screen (halftone), not multiple screens.

### Accuracy Expectations

| Input Type                 | Expected Accuracy              |
| -------------------------- | ------------------------------ |
| SVG/vector                 | ~95%+ (colors are explicit)    |
| Clean spot-color raster    | ~85-90%                        |
| Designs with gradients     | ~70-80%                        |
| Photorealistic/sim process | ~50-60% (inherently ambiguous) |

---

## 5. Storage Architecture

### Provider Recommendation

| Phase           | Provider                            | Why                                                                                                                 | Monthly Cost     |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **POC / Beta**  | Supabase Storage (Free tier)        | Already have Supabase project; 1GB storage + 2GB egress included. Sufficient for initial testing with <200 artworks | $0               |
| **Single Shop** | Cloudflare R2                       | Zero egress fees, S3-compatible API. Move when storage exceeds 1GB or for production reliability                    | ~$4.50 for 300GB |
| **SaaS Scale**  | R2 or Backblaze B2 + Cloudflare CDN | Lowest cost at scale                                                                                                | ~$18-45 for 3TB  |

### Volume Projections (Small Shop)

| Metric              | Conservative | Moderate  |
| ------------------- | ------------ | --------- |
| Unique designs/year | 300          | 700       |
| Files per design    | 2-4          | 3-6       |
| Avg file size       | ~5 MB        | ~8 MB     |
| Storage/year        | 5-10 GB      | 28-62 GB  |
| 3-year cumulative   | 13-32 GB     | 84-186 GB |

### Architecture Patterns

1. **Presigned upload URLs** — Client uploads directly to storage, not through app server (Vercel has 4.5MB body limit)
2. **Three renditions at upload** via Sharp:
   - Thumbnail: 200×200 WebP (~5-15 KB) — list views
   - Preview: 800×800 WebP (~30-80 KB) — detail views
   - Original: preserved as-is — production/legal
3. **Content-addressable dedup** — SHA-256 hash catches repeat logo submissions (~10-20% savings)
4. **Never modify originals** — All transformations produce new files. Legal/production requirement.
5. **Shared bucket with path prefixes** — `artwork/{shop_id}/originals/`, `artwork/{shop_id}/thumbnails/`
6. **Soft delete with 30-day grace** — Mark `deleted_at`, background cron purges after 30 days

### Typical File Sizes

| File Type       | Typical Size   | Notes                                      |
| --------------- | -------------- | ------------------------------------------ |
| Customer JPEG   | 500 KB - 10 MB | Often low-quality, preserve as-is          |
| Vector (AI/EPS) | 200 KB - 5 MB  | Balloons to 20-80 MB with embedded rasters |
| SVG             | 50 KB - 2 MB   | Smallest vector format                     |
| Print-ready PSD | 60 - 300 MB    | 300 DPI, multi-layer                       |
| Separation PSD  | 100 - 500 MB   | Per-color channels (6-12 channels)         |
| Customer PDF    | 1 - 30 MB      | Highly variable quality                    |

---

## 6. Mockup Generation

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

Current `mix-blend-multiply` makes artwork invisible on dark garments. Solution: two-layer composite mirroring actual screen printing on dark fabric:

1. White underbase shape at ~80% opacity (simulates the physical underbase)
2. Artwork with multiply blend on top of the white layer

Detect garment darkness during catalog sync (average luminance in print zone area < 40% = dark mode).

### Freezing Mockups (Lifecycle Events)

A mockup should be frozen (pre-rendered and stored as immutable image) at:

1. **Quote sent** — contractual representation
2. **Artwork approved** — approval timestamp + frozen mockup = audit trail
3. **Job created** — production reference carried forward

Frozen mockups stored in Supabase Storage with reference in quote/job record. ~200KB per PNG at 800×960. 4,000 images = ~800MB. Trivial cost.

### What NOT to Build

- **Three.js 3D mockups** — over-engineered for production management
- **AI generative mockups** — non-deterministic, artwork fidelity risk
- **Custom WebGL shaders** — massive effort for marginal improvement
- **PSD-template APIs** (Dynamic Mockups) — external dependency for something achievable with Sharp

---

## 7. Approval Workflows

### Recommended State Machine

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
| T+5-7d | Final — marked urgent, surfaces on dashboard as "stuck" |

### Proof Delivery Method

**Unique URL (no login required)** is the industry standard for fastest approval:

- Frictionless — customer clicks link, sees proof, one-click approve
- Trackable — view analytics (opened, viewed duration)
- Supports annotation
- Can be forwarded (feature, not bug — lets customer share with their team)

Customer portal login reserved for repeat/VIP customers who want full history.

### Legal Protection

Every approval must capture immutably:

- **Who**: name, email, IP address
- **What**: immutable proof snapshot (not reference to mutable file)
- **When**: timestamp with timezone
- **Terms**: which T&C version they accepted
- **Comments**: any feedback they left

Append-only — shop cannot retroactively modify approval records.

### Version vs Variant in Approval Flow

- **Versions**: Linear. v2 supersedes v1. Only latest sent for approval.
- **Variants**: Parallel. Customer approves each variant independently. All variants for an order must be approved before production starts (unless partial approval is enabled).

---

## 8. Cross-Vertical Integration Points

### Artwork → Customer

- Per-customer artwork library (FK: `artwork.customer_id`)
- Artwork tab on customer detail page
- Favorites surfaced in customer profile
- Reuse detection when creating new quotes

### Artwork → Quoting

- Select artwork from customer library when building quote
- Color count auto-derived → screen count → pricing matrix lookup
- Live mockup preview (artwork on selected garment)
- Service type suitability (screen print vs DTF vs DTG)

### Artwork → Pricing

- Color count drives screen count (spot color: 1:1)
- Screen count drives setup fees ($15-35 per screen typical)
- Dark garment + underbase = +1 screen = +1 setup fee
- Separation type affects pricing (simulated process = more screens)

### Artwork → Jobs/Production

- Frozen mockup follows from approved quote to job
- Separation metadata generates screen requirements
- Art department workflow board tracks internal status
- Approved artwork is production gate (blocks job start)

### Artwork → Screen Room

- ScreenRequirement[] generated from separation metadata
- Mesh count derived from LPI (LPI × 4-5)
- Print order from separation sequence
- Physical screen assignment tracked

### Artwork → Invoices

- Frozen mockup reference carried to invoice
- Setup fees itemized per screen/color
- Artwork approval audit trail available for disputes

---

## 9. Technical Dependencies

### Horizontal Enabler: H2 (File Upload Pipeline)

Must be built before Artwork M1. Requires:

- Supabase Storage bucket setup with RLS policies
- Presigned upload URL generation (`createSignedUploadUrl()`)
- Sharp pipeline for thumbnail/preview generation at upload
- Content hash computation for dedup
- File metadata extraction (dimensions, format, color mode)

### New Dependencies to Evaluate

| Package           | Purpose                 | Size                      | License |
| ----------------- | ----------------------- | ------------------------- | ------- |
| `quantize`        | MMCQ color quantization | ~5 KB                     | MIT     |
| `get-svg-colors`  | SVG color extraction    | ~3 KB                     | MIT     |
| `ag-psd`          | PSD file parsing        | ~200 KB                   | MIT     |
| `nearest-pantone` | Hex → PMS matching      | ~150 KB (includes PMS DB) | MIT     |
| `color-diff`      | CIEDE2000 calculation   | ~8 KB                     | MIT     |

All are MIT-licensed, small, and have no native dependencies. Sharp is already in the project.

---

## 10. Recommended Milestone Structure

### P5: Artwork Library — Milestones

| Milestone                   | Deliverables                                                                                                                                    | Depends On        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **M0: Research**            | This document. Domain understanding, competitive gaps, technical decisions.                                                                     | —                 |
| **M1: Storage & Schema**    | File upload pipeline (H2), artwork/variant/version tables, Drizzle schema, Supabase Storage bucket, presigned uploads, Sharp rendition pipeline | H2                |
| **M2: Library UI**          | Browse/search/tag/favorite artwork per customer. Customer detail Artwork tab. Upload flow with file validation.                                 | M1, P3 (Customer) |
| **M3: Color Detection**     | Auto-detect color count + palette at upload. PMS matching. "Suggest and confirm" UX. Garment color context for underbase detection.             | M1                |
| **M4: Quote Integration**   | Select artwork from customer library in quote builder. Auto-derive color count → pricing. Live mockup preview.                                  | M2, P6 (Quoting)  |
| **M5: Approval Workflow**   | Per-artwork approval with unique URL. Automated reminders. Version tracking. Terms acceptance. Immutable proof snapshots.                       | M2                |
| **M6: Separation Metadata** | Capture per-channel specs (ink, mesh, LPI, print order). Generate ScreenRequirement[] for screen room handoff.                                  | M5                |
| **M7: Mockup Enhancement**  | SVG feDisplacementMap for fabric contours. Dark garment rendering. Frozen mockup pipeline (Sharp server-side).                                  | M4                |

### Critical Path

M0 → M1 → M2 → {M3, M4, M5 in parallel} → M6 → M7

M3 (color detection) and M5 (approval workflow) can run in parallel once the library UI is in place. M6 (separation metadata) depends on having the approval workflow (separations happen post-approval). M7 (mockup enhancement) can start as soon as quote integration works.

---

## Sources

Full source lists are maintained per research agent output. Key sources include:

**Competitors**: Printavo (printavo.com), InkSoft (inksoft.com), DecoNetwork (deconetwork.com), YoPrint (yoprint.com), GraphicsFlow (graphicsflow.com), Ordant (ordant.com), shopVOX (shopvox.com), Ashore (ashoreapp.com)

**Domain**: ScreenPrinting.com, Anatol, UltraSeps, Freehand Graphics (Sep Studio NXT), T-BizNetwork, Halftone Cat

**Technical**: Sharp (sharp.pixelplumbing.com), Supabase Storage docs, Cloudflare R2 pricing, Pantone API, CIEDE2000 color science

**Print-on-Demand**: Printful API docs, Gelato design requirements, Gooten artwork guidelines
