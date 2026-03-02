---
shaping: true
pipeline: 20260302-h2-file-upload
stage: shaping
created: 2026-03-02
---

# H2: File Upload Pipeline — Shaping

## Requirements (R)

| ID   | Requirement                                                                                                 | Status      |
| ---- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| R0   | Any vertical can upload files without implementing storage plumbing                                         | Core goal   |
| R1   | Client uploads bypass Vercel's 4.5 MB body limit — files go directly from browser to storage               | Must-have   |
| R2   | Content-addressed deduplication — identical file uploaded twice produces no second storage write            | Must-have   |
| R3   | Per-entity file size and MIME type enforcement (raster: 50 MB, SVG: 5 MB, PDF: 30 MB)                      | Must-have   |
| R4   | Automatic rendition generation — thumb (200×200 WebP) + preview (800×800 WebP) per upload                  | Must-have   |
| R4.1 | PNG/JPEG/WebP/SVG/GIF/TIFF processed natively via Sharp                                                     | Must-have   |
| R4.2 | PSD/AI/EPS/PDF originals stored as-is; rendition status = `pending` (processed when ag-psd lands in M2)    | Must-have   |
| R5   | Storage provider abstraction — swapping Supabase → R2 is a config change; no consumer code changes         | Must-have   |
| R6   | Path namespaced by entity + shop — `{entity}/{shop_id}/...` — cross-shop access structurally impossible     | Must-have   |
| R7   | P5 M1 (Artwork Library) works as H2's first consumer on day one with no additional infrastructure           | Must-have   |
| R8   | Consumer interface is async-ready — returns `status: 'ready' \| 'processing'` regardless of implementation | Must-have   |

---

## Architectural Context

### The Two-Layer Model

```
IFileUploadService   ← what consumers call (dedup, format detection, renditions, path convention)
    └── IStorageProvider   ← what the service delegates to (upload, delete, presigned URLs)
            ├── SupabaseStorageProvider   ← current
            └── R2StorageProvider         ← future
```

Consumers never touch `IStorageProvider` directly. They call `IFileUploadService`.
The split means storage-switching is isolated to `infrastructure/bootstrap.ts`.

### Clean Architecture Placement

```
src/domain/ports/storage.ts                         ← IStorageProvider, IFileUploadService interfaces
src/infrastructure/storage/
    supabase-storage.provider.ts                    ← SupabaseStorageProvider (IStorageProvider)
    file-upload.service.ts                          ← FileUploadService (IFileUploadService)
    rendition.service.ts                            ← RenditionService (Sharp pipeline)
    entity-configs.ts                               ← per-entity bucket/MIME/size config
    index.ts                                        ← wired export (used by consumers)
src/infrastructure/bootstrap.ts                     ← wire SupabaseStorageProvider → FileUploadService
```

### Consumer Callsite (target)

```typescript
// Any server action in any vertical:
import { fileUploadService } from '@infra/storage'

// Step 1: get presigned URL (client will upload directly)
const { path, uploadUrl, token, isDuplicate } = await fileUploadService.createPresignedUploadUrl({
  entity: 'artwork',
  shopId: session.shopId,
  filename: 'hero-logo.png',
  mimeType: 'image/png',
  sizeBytes: 2_400_000,
  contentHash: 'abc123...',  // computed client-side via Web Crypto
})

// Step 2: after client uploads, confirm and get renditions
const result = await fileUploadService.confirmUpload({
  path,
  contentHash: 'abc123...',
})
// result → { id, originalUrl, thumbUrl, previewUrl, status: 'ready' | 'processing' }
```

### Path Conventions (from spike-726)

```
{entity}/{shop_id}/originals/{version_id}_{sanitized_filename}   ← immutable original
{entity}/{shop_id}/thumbs/{version_id}.webp                       ← 200×200 WebP
{entity}/{shop_id}/previews/{version_id}.webp                     ← 800×800 WebP
{entity}/{shop_id}/frozen/{proof_id}.png                          ← immutable proof snapshot
```

### Entity Config Pattern

```typescript
// entity-configs.ts — extend to add new consumers:
export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  artwork: {
    bucket: 'artwork',
    maxSizeBytes: {
      'image/png':       50_000_000,
      'image/jpeg':      50_000_000,
      'image/webp':      50_000_000,
      'image/svg+xml':    5_000_000,
      'application/pdf': 30_000_000,
    },
    allowedMimeTypes: [
      'image/png', 'image/jpeg', 'image/webp',
      'image/svg+xml', 'image/tiff', 'image/gif',
      'application/pdf',
    ],
  },
  // future: 'customer-document', 'invoice-attachment', ...
}
```

Adding P14 as a consumer = add entry to `ENTITY_CONFIGS`. No service code changes.

---

## Shapes

### Shape A: Synchronous Pipeline (Confirm-and-Return)

Renditions are generated synchronously inside `confirmUpload`. The server action completes
in 25 ms–1.1 s depending on file size. Returns all URLs immediately. No webhook infrastructure.

| Part   | Mechanism                                                                                                                     | Flag |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | :--: |
| **A1** | **`IStorageProvider` interface** — `upload`, `delete`, `createPresignedUploadUrl`, `createPresignedDownloadUrl`, `list`       |      |
| **A2** | **`SupabaseStorageProvider`** — implements `IStorageProvider` using Supabase Storage v2 SDK                                   |      |
| **A3** | **`EntityConfig` registry** — `ENTITY_CONFIGS` map keyed by entity string; validates MIME + size at upload time               |      |
| **A4** | **`createPresignedUploadUrl` server action** — validates entity/MIME/size, checks `contentHash` dedup (consumer DB query), generates Supabase presigned upload URL via `createSignedUploadUrl`; returns `{path, uploadUrl, token, isDuplicate}` |      |
| **A5** | **`confirmUpload` server action** — detects format, runs Sharp rendition pipeline synchronously (R4.1), stores to `thumbs/` + `previews/`, returns `{originalUrl, thumbUrl, previewUrl, status: 'ready'}` for Sharp-native formats; `status: 'pending'` for PSD/AI/EPS/PDF (R4.2) |      |
| **A6** | **`RenditionService`** — Sharp pipeline: `fit: 'inside', withoutEnlargement: true`; thumb 200×200 WebP q80, preview 800×800 WebP q85; SVG rasterizes via librsvg (native); non-Sharp formats return early |      |
| **A7** | **`deleteFile(paths: string[])` server action** — batch-deletes original + renditions from storage; used by P5 M1 version cleanup |      |
| **A8** | **`createPresignedDownloadUrl` server action** — generates time-limited download URL for private buckets (default 1-hour expiry) |      |
| **A9** | **Bucket bootstrap script** — one-time `scripts/bootstrap-storage.ts`: creates `artwork` bucket (private, 50 MB limit, MIME allowlist), applies RLS policies; idempotent |      |

**RLS policies (from spike-726):**
```sql
-- Read: shop owner reads only their own shop's files
CREATE POLICY "storage_shop_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = name AND
    (storage.foldername(name))[2] = auth.jwt()->>'shop_id'
  );

-- Delete: shop owner only
CREATE POLICY "storage_shop_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = name AND
    (storage.foldername(name))[2] = auth.jwt()->>'shop_id'
  );
-- Writes: service role only (presigned token bypasses INSERT policy)
```

**Dedup contract:**
- Client computes SHA-256 via `crypto.subtle.digest('SHA-256', buffer)` before calling server
- `createPresignedUploadUrl` receives `contentHash`; the **consumer** checks for existing
  records in their own table (e.g., `artworkVersions.contentHash`)
- If match: `isDuplicate: true, path: existingPath` returned — no presigned URL issued
- H2 has no DB schema; dedup state lives in the consumer's table

---

### Shape B: Async Pipeline (Webhook-Triggered Renditions)

Renditions generated asynchronously after storage write. `confirmUpload` returns in ~50 ms.
H2 owns a lightweight `file_renditions` DB table. Supabase Realtime or polling for completion.

| Part   | Mechanism                                                                                                                        | Flag |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | :--: |
| **B1** | Same as A1–A4 (IStorageProvider, SupabaseStorageProvider, EntityConfig, createPresignedUploadUrl)                                |      |
| **B2** | **`file_renditions` table** — `id, entity, shop_id, original_path, thumb_path, preview_path, status (pending\|ready\|failed), created_at, completed_at` | |
| **B3** | **`confirmUpload` server action** — writes `file_renditions` row with `status: 'pending'`; returns `{originalUrl, status: 'processing'}` immediately |      |
| **B4** | **Supabase DB trigger on `file_renditions` insert** → `pg_net.http_post` → `POST /api/upload/renditions` route                  |  ⚠️  |
| **B5** | **`/api/upload/renditions` route** — receives `{renditionId, originalPath}`; runs Sharp pipeline; uploads thumb + preview; updates `file_renditions` row to `status: 'ready'` |      |
| **B6** | **Supabase Realtime subscription** — consumers subscribe to `file_renditions` where `id = ?`; UI updates when `status = 'ready'` |  ⚠️  |
| **B7** | Same as A7–A9                                                                                                                    |      |

---

## Fit Check

| Req  | Requirement                                                                      | Status    | A  | B  |
| ---- | -------------------------------------------------------------------------------- | --------- | -- | -- |
| R0   | Any vertical can upload files without implementing storage plumbing              | Core goal | ✅ | ✅ |
| R1   | Client uploads bypass Vercel 4.5 MB body limit via presigned URL                | Must-have | ✅ | ✅ |
| R2   | Content-addressed dedup — identical file = no duplicate storage write            | Must-have | ✅ | ✅ |
| R3   | Per-entity file size and MIME type enforcement                                   | Must-have | ✅ | ✅ |
| R4   | Automatic rendition generation — thumb + preview per upload                      | Must-have | ✅ | ✅ |
| R4.1 | PNG/JPEG/WebP/SVG/GIF/TIFF via Sharp natively                                   | Must-have | ✅ | ✅ |
| R4.2 | PSD/AI/EPS/PDF stored as-is; rendition status = `pending`                       | Must-have | ✅ | ✅ |
| R5   | Storage provider abstraction — Supabase → R2 is config change only              | Must-have | ✅ | ✅ |
| R6   | Path namespaced by entity + shop; cross-shop access structurally impossible      | Must-have | ✅ | ✅ |
| R7   | P5 M1 works as first consumer on H2 day one                                     | Must-have | ✅ | ❌ |
| R8   | Consumer interface is async-ready (`status: 'ready' \| 'processing'`)           | Must-have | ✅ | ✅ |

**Notes:**

- B fails R7: B4 (pg_net trigger) and B6 (Realtime subscription) are flagged unknowns — B cannot
  be delivered with confidence before P5 M1 needs to start. A has zero flagged unknowns.
- A satisfies R8: returns `status: 'ready'` synchronously for Sharp-native formats,
  `status: 'pending'` for PSD/AI/EPS/PDF. The consumer interface is identical to what
  Shape B would return — shape can be swapped later without breaking consumers.

---

## Selected Shape: A — Synchronous Pipeline

**Rationale:** Shape A passes all requirements and has zero flagged unknowns. Every mechanism
is concretely understood (spike-726 validated the full path). Shape B is architecturally sound
but B4 (pg_net trigger behavior in local dev + Vercel) and B6 (Realtime subscription wiring)
are unvalidated — they would introduce new unknowns and delay P5 M1.

The key insight: **the interface is async-ready regardless of which shape runs beneath it.**
When Shape B becomes worthwhile (at real scale, or when rendition latency matters), the swap
is confined to `file-upload.service.ts` and `infrastructure/bootstrap.ts`. No consumer changes.
Shape A is the right call *right now* — we get "robust and right" at the interface level,
pragmatic at the implementation level.

**File size timing to build intuition:**

| File                     | confirmUpload latency |
| ------------------------ | --------------------- |
| SVG (0.4 KB)             | ~94 ms                |
| Customer JPEG (16 KB)    | ~25 ms                |
| Simple PNG (490 KB)      | ~166 ms               |
| High-res PNG (5 MB, 300 DPI) | ~1,084 ms         |
| PSD (any size)           | ~5 ms (stored only)   |

For 20 artwork uploads/month, the worst case (1.1 s) is an acceptable UX with a loading
spinner. The free tier holds ~900 artworks before R2 migration.

---

## Parts Table (Shape A — Final)

| Part   | Mechanism                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1** | **`IStorageProvider` interface** (`domain/ports/storage.ts`) — `upload(path, buffer, opts)`, `delete(paths[])`, `createPresignedUploadUrl(path, expiresIn)`, `createPresignedDownloadUrl(path, expiresIn)`, `list(prefix)` |
| **A2** | **`SupabaseStorageProvider`** (`infrastructure/storage/supabase-storage.provider.ts`) — implements `IStorageProvider` using Supabase Storage v2 SDK; uses `sb_secret_*` key for admin ops, `sb_publishable_*` for anon; handles `createSignedUploadUrl` / `uploadToSignedUrl` pattern |
| **A3** | **`ENTITY_CONFIGS` registry** (`infrastructure/storage/entity-configs.ts`) — keyed by entity string (`'artwork'`, future: `'customer-document'`); each entry: `{ bucket, allowedMimeTypes, maxSizeBytes: Record<mimeType, number> }` |
| **A4** | **`createPresignedUploadUrl` server action** — validates `entity` in `ENTITY_CONFIGS`, validates MIME type + size against config, returns `{ isDuplicate: true, path }` if `contentHash` already known to consumer (consumer passes hash; H2 doesn't query DB), else calls `provider.createPresignedUploadUrl(path, 600)` → `{ path, uploadUrl, token, isDuplicate: false, expiresAt }` |
| **A5** | **`confirmUpload` server action** — calls `RenditionService.generate(originalPath)`; for Sharp-native formats returns `{ originalUrl, thumbUrl, previewUrl, status: 'ready' }`; for non-Sharp formats returns `{ originalUrl, thumbUrl: null, previewUrl: null, status: 'pending' }`; also calls `provider.createPresignedDownloadUrl` to return readable URLs |
| **A6** | **`RenditionService`** (`infrastructure/storage/rendition.service.ts`) — format detection by MIME type; Sharp pipeline: `fit: 'inside', withoutEnlargement: true`; thumb 200×200 WebP q80, preview 800×800 WebP q85; SVG rasterizes to PNG via librsvg then to WebP; GIF extracts first frame; TIFF reads all layers; non-Sharp MIME returns `{ thumbPath: null, previewPath: null }` |
| **A7** | **`deleteFile(paths: string[])` server action** — batch-deletes via `provider.delete(paths)`; accepts original + rendition paths together; callers pass all paths to clean up |
| **A8** | **`createPresignedDownloadUrl` server action** — wraps `provider.createPresignedDownloadUrl(path, expiresIn)`; default 3600 s; used by P5 M1 to serve originals for download/display |
| **A9** | **`scripts/bootstrap-storage.ts`** — idempotent bucket setup: `artwork` bucket (private, `fileSizeLimit: 52_428_800`, `allowedMimeTypes` array), RLS `SELECT` + `DELETE` policies tied to `auth.jwt()->>'shop_id'`; safe to run multiple times; new entity buckets added here |

---

## Decision Points Log

| # | Decision | Options Considered | Chosen | Rationale |
| - | -------- | ------------------ | ------ | --------- |
| D1 | Sync vs async renditions | A (sync in confirmUpload) vs B (webhook-triggered async) | **A — sync** | Zero flagged unknowns; 1.1 s max acceptable for small shop; interface is async-ready so shape can evolve later without breaking consumers |
| D2 | H2 DB schema | H2 owns `file_renditions` table vs no H2 schema (consumers track in their tables) | **No H2 schema** | Dedup state lives in consumer's table (e.g., `artwork_versions.content_hash`). H2 is pure storage service — no DB coupling. Avoids cross-vertical schema dependency. |
| D3 | Dedup responsibility | H2 checks dedup vs consumer checks vs hybrid | **Consumer checks, H2 respects** | H2 receives `contentHash` from consumer. If consumer already has a record with that hash, they pass `isDuplicate: true` before calling H2. H2 has no DB to query. Keeps H2 stateless. |
| D4 | Entity config location | Hardcoded in service vs registry pattern vs DB | **Registry (`ENTITY_CONFIGS`)** | Type-safe, zero runtime overhead, extensible — adding P14 = new entry, no service code changes |
| D5 | Path generation responsibility | Client generates path vs server generates path | **Server generates path** | Server controls naming convention, prevents path injection, ensures `{entity}/{shop_id}/` prefix is always enforced |
| D6 | Architecture placement | `shared/lib/storage` vs `infrastructure/storage` | **`infrastructure/storage`** | Clean arch rules: storage providers are infrastructure concerns; `shared/` is for UI primitives and cross-cutting utilities |

---

## Open Questions (Non-Blocking)

| # | Question | Impact | When to Resolve |
| - | -------- | ------ | --------------- |
| OQ1 | Frozen proof format: PNG (lossless) vs WebP (smaller)? | Legal/compliance for approval records | Before P5 M5 (Approval Workflow) |
| OQ2 | Egress monitoring: who watches the 2 GB/month free tier limit? | Operational risk during beta | Before any external customer access (P14) |
| OQ3 | Multi-bucket vs shared bucket: single `artwork` bucket vs per-entity buckets? | Currently single bucket per entity type. If retention policies diverge per entity, may need separate buckets | Revisit when >2 entity types use H2 |
| OQ4 | Orphan cleanup: presigned URL issued but client never uploads — what cleans up pending path reservations? | H2 has no pending state (stateless), so nothing to clean. Consumer may have a pending record. | Consumer responsibility; add note to P5 M1 implementation plan |

---

## Handoff to Breadboarding

Shape A is selected. Parts table is the input. Breadboard should map:

1. **UI affordances** — file picker, drag-and-drop zone, upload progress indicator, rendition
   loading state, error states (wrong MIME, too large, network fail)
2. **Non-UI affordances** — `createPresignedUploadUrl` action, `confirmUpload` action,
   `deleteFile` action, `RenditionService`, `SupabaseStorageProvider`, `ENTITY_CONFIGS`,
   bucket bootstrap script
3. **Wiring** — how P5 M1 (first consumer) calls H2; where in the feature layer H2 is invoked

The breadboard should produce **two vertical slices**:
- Slice 1: Upload a new file end-to-end (happy path)
- Slice 2: Upload a duplicate file (dedup short-circuit)
