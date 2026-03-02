---
shaping: true
---

# Artwork Library — Shaping

**Pipeline**: `20260301-artwork-vertical`
**Stage**: Shaping
**Date**: 2026-03-02
**Status**: Shape Selected ✅

---

## Requirements (R)

| ID  | Requirement                                                                                                       | Status    |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| R0  | Gary can browse, find, and reuse a customer's artwork across orders without digging through email or Dropbox      | Core goal |
| R1  | Artwork is organized per-customer and persists across quotes — uploading once is enough for all future orders     | Must-have |
| R2  | File validation catches print-readiness issues at upload time (DPI below threshold, format, color mode)           | Must-have |
| R3  | Color count is auto-detected from uploaded artwork; Gary confirms before it affects pricing                       | Must-have |
| R4  | Gary can send a proof to a customer and capture a legally valid approval with timestamp, IP, and T&C version      | Must-have |
| R5  | Version history is preserved — Gary can see what changed between v1 and v2 of an artwork                          | Must-have |
| R6  | Parallel color treatments (variants) are supported — same design, different color targets per garment color       | Must-have |
| R7  | Art department status is visible in two places: customer detail artwork tab (full) + job card badge (at-a-glance) | Must-have |
| R8  | Approved artwork generates structured separation metadata (ink, mesh, LPI, print order) for the screen room       | Must-have |
| R9  | Artwork selected in the quote builder auto-fills color count, and a live mockup renders on the selected garment   | Must-have |

---

## Selected Shape: S1-B + S2-C + S3-B

Three independent decisions compose the selected shape. All three are locked.

---

### S1-B: Library Status Column + Job Board Indicator

Status lives on the customer detail artwork tab. Job cards get an artwork badge — no new columns, no new swimlanes.

**Design rationale**: Designed for 1–20 employee shops. Small shops don't have a dedicated art department — Gary IS the art department. A separate art board would be a ghost town. Status-on-library is the essential view; the job card badge gives at-a-glance awareness without restructuring the board. As shops grow, the cross-customer filter (`/artwork?status=proof_sent`) handles higher volume.

| Part   | Mechanism                                                                                                                                   | Flag |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
| S1-B.1 | Customer detail Artwork tab: grid of artwork cards showing name, thumbnail, current variant status, last updated                            |      |
| S1-B.2 | Artwork status chip on each card is clickable → inline `internal_status` picker (Received / In Progress / Proof Sent / Approved)            |      |
| S1-B.3 | Cross-customer artwork list at `/artwork` with filter by status, customer, date — covers the "all active jobs" visibility for R7            |      |
| S1-B.4 | Job card artwork badge: if any artwork variant for the quote is not `approved`, job card shows artwork icon + pending count                 |      |
| S1-B.5 | Badge maps to the P9 task checklist: "Artwork approved" is the first task in the screen print task template. Progress bar reflects this.    |      |
| S1-B.6 | Artwork `internal_status` updates automatically when approval state changes (e.g., `approved` approval event → `internal_status: approved`) |      |

**Integration note (S1-B.5)**: The job card badge is not artwork-specific UI — it's the first item of the P9 task checklist (`Artwork approved`). When incomplete, the job card's progress bar shows early and can display a contextual icon. This keeps the production board clean while surfacing the blocker.

---

### S2-C: Magic Link → Portal Upgrade Path

Magic link for launch. The approval page is designed as a standalone, shareable URL. When P14 (Customer Portal) arrives, it deep-links to the same page — zero rework.

**Token expiration handled**: Approval records are append-only in the DB — the token is the entry point, not the source of truth. Expired tokens surface a "Link expired — ask your printer to resend" message. Gary can resend from the app in one click. When P14 arrives, portal logins see the same approval page; old tokens still work during transition.

| Part   | Mechanism                                                                                                                        | Flag |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | :--: |
| S2-C.1 | `POST /api/approvals` creates `artwork_approvals` record + signs a short-lived token (HMAC-SHA256, 14-day TTL)                   |      |
| S2-C.2 | Email via Resend (H3) with link: `{baseUrl}/approve/{token}` — no login, frictionless                                            |  ⚠️  |
| S2-C.3 | `/approve/{token}` is a public route (no auth middleware) — renders all artwork for the quote with per-artwork approve/reject UI |      |
| S2-C.4 | On approve: captures IP, timestamp, T&C version, immutable proof snapshot reference. Appends `approval_events` record.           |      |
| S2-C.5 | Token payload contains: `quoteId`, `customerId`, `variantIds[]`, `sentAt` — page renders without session                         |      |
| S2-C.6 | P14 deep-link: portal navigates to `/approve/{token}`. Same page, zero new code. Portal adds login context around the same URL.  |      |

⚠️ S2-C.2 — Resend (H3) must be built before this step. H3 is a horizontal dependency.

---

### S3-B: Combined Proof Email

One email per quote with all artworks. Single proof page. Per-artwork approve/reject on the same page.

**Design rationale**: Gary manages conversation threads, not individual files. One email = one proof conversation. If front logo is approved and back text needs revision, the customer clicks "Revision Requested" on that artwork alone — the approved front is preserved. Resend sends a new email with only revised artworks highlighted.

| Part   | Mechanism                                                                                                                                    | Flag |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
| S3-B.1 | `sendProof(quoteId)` gathers all `pending` variant versions for the quote → generates one token → sends one email                            |      |
| S3-B.2 | Proof page `/approve/{token}` renders all artworks as a scrollable list: thumbnail, name, notes, per-artwork `Approve` / `Request Changes`   |      |
| S3-B.3 | Customer can approve some artworks and request changes on others independently — approval state is per-variant                               |      |
| S3-B.4 | On submit: each variant's decision captured separately in `approval_events` with the same session token (IP, timestamp, T&C shared)          |      |
| S3-B.5 | Resend flow: Gary marks revised variants as ready → system sends new email highlighting only changed artworks; approved ones shown as locked |      |
| S3-B.6 | Quote progresses to "all approved" gate when every variant for the quote has status `approved`                                               |      |

---

## Fit Check

Full shape (S1-B + S2-C + S3-B) checked against all requirements.

| Req | Requirement                                                                                                       | Status    | Selected Shape |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- | :------------: |
| R0  | Gary can browse, find, and reuse a customer's artwork across orders without digging through email or Dropbox      | Core goal |       ✅       |
| R1  | Artwork is organized per-customer and persists across quotes — uploading once is enough for all future orders     | Must-have |       ✅       |
| R2  | File validation catches print-readiness issues at upload time (DPI below threshold, format, color mode)           | Must-have |       ✅       |
| R3  | Color count is auto-detected from uploaded artwork; Gary confirms before it affects pricing                       | Must-have |       ✅       |
| R4  | Gary can send a proof to a customer and capture a legally valid approval with timestamp, IP, and T&C version      | Must-have |       ✅       |
| R5  | Version history is preserved — Gary can see what changed between v1 and v2 of an artwork                          | Must-have |       ✅       |
| R6  | Parallel color treatments (variants) are supported — same design, different color targets per garment color       | Must-have |       ✅       |
| R7  | Art department status is visible in two places: customer detail artwork tab (full) + job card badge (at-a-glance) | Must-have |       ✅       |
| R8  | Approved artwork generates structured separation metadata (ink, mesh, LPI, print order) for the screen room       | Must-have |       ✅       |
| R9  | Artwork selected in the quote builder auto-fills color count, and a live mockup renders on the selected garment   | Must-have |       ✅       |

**Notes:**

- R2, R3, R5, R6, R8, R9 are satisfied by mechanisms in the domain layer (schema + services) that are independent of the S1/S2/S3 shape choices. These requirements pass regardless of which shape was selected.
- R7 is satisfied by S1-B.1–S1-B.4 (library tab + badge). The cross-customer view (S1-B.3) handles the "across all active jobs" aspect.
- R4 is satisfied by S2-C.1–S2-C.4 (immutable approval record with IP/timestamp/T&C).
- S2-C.2 carries ⚠️ for the Resend dependency (H3). R4 cannot be fully satisfied until H3 is built. This is a build-order dependency, not a shape failure.

---

## Decision Points Log

| Decision                                     | Options                                               | Choice        | Reasoning                                                                                                                                                                             |
| -------------------------------------------- | ----------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1: Art dept workflow placement              | S1-A (Standalone) / S1-B (Library) / S1-C (Job board) | **S1-B**      | 1–20 employee shops don't have dedicated art staff. Status-on-library is essential; badge on job card adds at-a-glance awareness without structural change. Extensible as shops grow. |
| S2: Customer approval delivery               | S2-A (Magic link) / S2-B (Portal) / S2-C (Path)       | **S2-C**      | Same work as S2-A. Portal deep-links to the same `/approve/{token}` page in P14 — zero rework. Token expiration handled by resend flow.                                               |
| S3: Multi-artwork proof delivery             | S3-A (Per-artwork) / S3-B (Combined)                  | **S3-B**      | One email = one conversation thread. Per-artwork approve/reject within the combined page gives per-piece granularity without email proliferation.                                     |
| R7: Art dept workflow — requirement status   | Must / Nice / Out                                     | **Must-have** | Fits naturally in S1-B. No extra structural cost; it's the library view + badge.                                                                                                      |
| R8: Separation metadata — requirement status | Must / Nice / Out                                     | **Must-have** | The art-to-screen-room handoff is the unique differentiator no competitor has. Build it in M6 — schema supports it from M1.                                                           |

---

## Flagged Unknowns

| Flag | Part   | Unknown                                          | Resolution                                                                                                                              |
| ---- | ------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| ⚠️   | S2-C.2 | H3 (Resend email horizontal) must be built first | H3 is a build-order dep; S2-C design is not blocked — email is the delivery mechanism, the approval record and page stand independently |

---

## Parts Table (Handoff to Breadboarding)

The selected shape's full parts table for the breadboarding agent.

| Part   | Mechanism                                                                                                                                        | Flag |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | :--: |
| **A1** | **Customer Artwork Library (per-customer)**                                                                                                      |      |
| A1.1   | Artwork tab on customer detail page — grid of artwork cards: thumbnail, name, variant count, status chips, last updated                          |      |
| A1.2   | Artwork card → drill-down to artwork detail: version history, all variants, approval status per variant                                          |      |
| A1.3   | Upload artwork → file validation (DPI, format, color mode) → auto-color detection → confirm color count → save artwork + first variant/version   |      |
| A1.4   | Status chip on each variant: Received / In Progress / Proof Sent / Approved — inline picker to update `internal_status`                          |      |
| **A2** | **Cross-Customer Artwork View**                                                                                                                  |      |
| A2.1   | `/artwork` route — filterable list by status, customer, service type, date range                                                                 |      |
| A2.2   | Entry point for Gary to see all in-flight artwork across all customers (replaces the standalone art board)                                       |      |
| **A3** | **File Upload Pipeline (depends on H2)**                                                                                                         |  ⚠️  |
| A3.1   | Presigned upload URL pattern: client requests token → uploads directly to Supabase Storage → server confirms + triggers pipeline                 |      |
| A3.2   | Sharp rendition pipeline: original preserved + thumbnail (200×200 WebP) + preview (800×800 WebP) generated at upload                             |      |
| A3.3   | SHA-256 content hash computed at upload — dedup catches re-uploads of same file                                                                  |      |
| **A4** | **File Validation + Color Detection**                                                                                                            |      |
| A4.1   | Client-side: basic format check, file size guard before upload                                                                                   |      |
| A4.2   | Server-side: DPI check via Sharp metadata, color mode (RGB vs CMYK vs Grayscale), vector vs raster detection                                     |      |
| A4.3   | Color detection: SVG → `get-svg-colors` (exact) / raster → `quantize` + CIEDE2000 merge (ΔE<8) + 2% coverage filter / PSD → `ag-psd` layer names |      |
| A4.4   | Server returns: `{ colorCount, palette, pmsMatches, confidence, needsUnderbase }` — Gary reviews + confirms before pricing is affected           |      |
| **A5** | **Version + Variant Management**                                                                                                                 |      |
| A5.1   | Variant = parallel color treatment (same design, different garment color target). Many variants per artwork.                                     |      |
| A5.2   | Version = sequential revision of a variant (v1 → v2). Many versions per variant; only latest sent for approval.                                  |      |
| A5.3   | Upload "new version" of an existing variant: creates version record linked to previous, UI shows version history                                 |      |
| A5.4   | Approved version is immutable: sets `approved_at`, prevents file modification, preserves proof snapshot                                          |      |
| **A6** | **Proof Sending + Approval (S2-C + S3-B)**                                                                                                       |      |
| A6.1   | `sendProof(quoteId)` gathers pending variant versions → generates HMAC-SHA256 token (14-day TTL) → sends combined email via H3 (Resend)          |  ⚠️  |
| A6.2   | Public route `/approve/{token}`: renders all artworks for the quote, per-artwork `Approve` / `Request Changes` + comment box                     |      |
| A6.3   | On submit: IP, timestamp, T&C version captured; `approval_events` record appended (immutable); variant status updated                            |      |
| A6.4   | Automated reminders: T+24h / T+48h / T+72h escalation / T+5-7d final — requires H5 (QStash scheduled jobs)                                       |  ⚠️  |
| A6.5   | Resend flow: Gary marks revised variants ready → new combined email highlighting only changed artworks; approved ones shown locked               |      |
| A6.6   | "All approved" gate: when all variants for a quote are `approved`, quote unlocks for job creation                                                |      |
| **A7** | **Job Board Artwork Badge**                                                                                                                      |      |
| A7.1   | "Artwork approved" is the first item in the screen print P9 task checklist template                                                              |      |
| A7.2   | Job card shows artwork badge (icon + pending count) when any variant for the quote is not `approved`                                             |      |
| A7.3   | Badge disappears / shows green check when all variants reach `approved` status                                                                   |      |
| **A8** | **Quote Builder Integration**                                                                                                                    |      |
| A8.1   | Artwork picker in quote builder: browse customer's artwork library, select variant                                                               |      |
| A8.2   | Selecting a variant auto-fills color count (from detection result); triggers pricing recalculation                                               |      |
| A8.3   | Live mockup: selected variant rendered on selected garment via client-side SVG composite                                                         |      |
| A8.4   | Frozen mockup: at quote-sent and artwork-approved events, server-side Sharp renders and stores immutable snapshot                                |      |
| **A9** | **Separation Metadata (M6)**                                                                                                                     |      |
| A9.1   | Post-approval: per-channel metadata form — ink color/PMS, role (underbase/color/highlight), mesh count, LPI, print order                         |      |
| A9.2   | `ScreenRequirement[]` generated from separation records — handoff type to screen room vertical                                                   |      |
| A9.3   | Separation metadata is locked once approved variant is in production                                                                             |      |
