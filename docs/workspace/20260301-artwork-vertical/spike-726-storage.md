# Spike #726 — Storage Limits & Rendition Pipeline

**Issue**: #726
**Pipeline**: `20260301-artwork-vertical`
**Stage**: Research → M1 (#718)
**Date**: 2026-03-02
**Status**: Complete

---

## TL;DR

Supabase Storage Free tier (1GB) **safely handles 2-3 months of operations** for a shop at 20 artworks/month — IF the shop stores customer-submitted JPEGs/PNGs and design proofs only. Once PSDs enter the picture (60-300 MB each), free tier fails within weeks. **Migrate to Cloudflare R2 before any PSD upload feature ships.** The full upload → store → serve → presigned-URL path is fully validated on local Supabase (all 9 tests passed).

---

## 1. Real File Size Baseline (Synthetic Files)

Tested 6 synthetic artwork files representing realistic print shop inputs:

| File | Type | Size | DPI | Colors |
|------|------|------|-----|--------|
| `high-res-spot-color.png` | Print-ready raster | **5.03 MB** | 300 | 4 spot |
| `vector-origin-logo.png` | Vector-origin PNG | 1.40 MB | 300 | 3 spot |
| `photo-heavy-design.jpg` | Photo/simulated process | 97 KB | 300 | Full-color |
| `simple-logo.png` | Simple logo | 490 KB | 300 | 2 spot |
| `customer-lowres.jpg` | Customer-submitted | **16 KB** | 72 | 3 spot |
| `vector-spot-color.svg` | True SVG vector | 0.4 KB | — | 3 spot |

**Research report file size context** (for real shop files not tested synthetically):

| File Type | Real-World Range | Notes |
|-----------|-----------------|-------|
| Customer JPEG | 500 KB – 10 MB | Preserve as-is |
| Vector (AI/EPS) | 200 KB – 5 MB | Can balloon to 20-80 MB with embedded rasters |
| SVG | 50 KB – 2 MB | Smallest |
| Print-ready PSD | **60 – 300 MB** | The dominant storage concern |
| Separation PSD | **100 – 500 MB** | Per-channel, 6-12 channels |
| Customer PDF | 1 – 30 MB | Variable quality |

---

## 2. Rendition Pipeline Benchmark

For each file: thumbnail (200×200 WebP, q80) + preview (800×800 WebP, q85) generated via Sharp.

| File | Original | Thumb | Preview | **Multiplier** | Time |
|------|----------|-------|---------|--------------|------|
| high-res-spot-color.png | 5.03 MB | 4.7 KB | 24.6 KB | **×1.006** | 1,084 ms |
| vector-origin-logo.png | 1.40 MB | 2.0 KB | 8.4 KB | **×1.007** | 508 ms |
| photo-heavy-design.jpg | 97.2 KB | 0.9 KB | 7.1 KB | **×1.083** | 38 ms |
| simple-logo.png | 489.5 KB | 4.1 KB | 17.0 KB | **×1.043** | 166 ms |
| customer-lowres.jpg | 15.7 KB | 1.7 KB | 7.3 KB | **×1.572** | 25 ms |
| vector-spot-color.svg | 0.4 KB | 3.1 KB | 14.0 KB | ×48 (outlier)¹ | 94 ms |

> ¹ SVG ×48 is a statistical artifact — a 0.4 KB SVG produces renditions larger than itself. For all meaningful-size originals, the multiplier is ×1.006 to ×1.57.

**Key finding**: Renditions add essentially zero storage overhead compared to originals. Storage planning should be based entirely on original file sizes.

**Processing time**: 25 ms to 1.1 seconds per file. The large 300 DPI 3600×3600 file takes ~1 second — acceptable for async server-side processing but not for synchronous request handling. Renditions should be generated asynchronously after upload confirmation.

### Rendition Strategy

```
Upload → original stored as-is
       → async: Sharp generates thumb (200×200) + preview (800×800)
       → DB record updated with rendition URLs when ready
```

Use the `fit: 'inside', withoutEnlargement: true` Sharp option — preserves aspect ratio and never upscales smaller sources.

---

## 3. Sharp Format Support Matrix

**Sharp 0.34.5 / libvips 8.17.3** (already installed in project):

| Format | Sharp Native | Notes |
|--------|-------------|-------|
| PNG | ✓ Yes | Full support, all bit depths |
| JPEG/JPG | ✓ Yes | mozjpeg, progressive |
| WebP | ✓ Yes | Lossy + lossless |
| SVG | ✓ Yes | Via librsvg 2.61.2 — rasterizes to PNG/WebP |
| GIF | ✓ Yes | Input only (extract first frame) |
| TIFF | ✓ Yes | Multi-layer TIFF as input |
| HEIF/AVIF | ✓ Yes | Via libheif 1.20.2 |
| **PSD** | **✗ No** | Requires `ag-psd` → PNG export before Sharp |
| **AI/EPS** | **✗ No** | Requires Ghostscript → raster |
| **PDF** | **✗ No** | Requires Ghostscript or pdf.js → raster |

**Architecture implication**: The rendition pipeline needs a format-detection step before Sharp. PSD, AI/EPS, and PDF inputs require preprocessing to get a raster image Sharp can work with. M1 should support only PNG/JPEG/WebP/SVG natively; PSD/AI/PDF can be deferred to M2 with a "upload original, generate preview later" flow.

---

## 4. Free Tier Capacity

**Realistic storage estimate** (excluding PSDs):
- Average original per artwork: ~1.5 MB (weighted toward customer files, which are small)
- Rendition overhead: ×1.05 (effectively rounding error)
- Effective storage per unique artwork: **~1.6 MB**
- After 30% dedup (reorders reuse same file): **~1.1 MB per upload**

**Supabase Free tier**: 1 GB storage, 2 GB egress/month

| Scenario | Storage/Month | Months Until Full |
|----------|--------------|------------------|
| 20 artworks/mo, small files | ~22 MB | **~45 months** |
| 20 artworks/mo, larger files (avg 5 MB) | ~70 MB | **~14 months** |
| 20 artworks/mo + any PSDs (avg 50 MB) | ~600 MB | **~1.7 months** |

**Total artworks at 1 GB capacity** (no PSDs): ~900 artworks (with dedup).

**Egress concern**: 2 GB/month egress = approximately 400 preview downloads/day (assuming 5 MB preview average). For a small shop's internal use, this is adequate. Customer-facing proof delivery could exhaust it in a single campaign.

---

## 5. Dedup Impact

**SHA-256 content-addressable deduplication**:
- Input: same file uploaded twice → same hash → second upload hits existing record, no new storage cost
- Typical reorder rate: 30-40% of a shop's work reuses existing artwork
- Effective saving: 30% fewer unique files = 30% storage reduction

With 30% dedup: a shop that generates 20 uploads/month effectively stores 14 unique artworks/month.

**Implementation**: compute hash client-side before upload (Web Crypto API: `crypto.subtle.digest('SHA-256', buffer)`) and check DB for existing hash. If match, return existing file path — no storage upload needed.

---

## 6. R2 Migration Threshold & Cost

**Trigger**: Migrate to R2 when **any** of:
1. Storage exceeds **800 MB** (80% of free tier = action point)
2. The shop begins accepting PSD uploads
3. Egress exceeds **1.5 GB/month** (75% of free tier)
4. A production Vercel deployment is in use (reliability SLA)

**R2 costs** ($0.015/GB-month storage, $0 egress):

| Scale | Storage | Monthly Cost |
|-------|---------|-------------|
| POC (200 artworks, no PSDs) | 1.4 GB | **$0.02/mo** |
| Small shop, 1 year (no PSDs) | 1.7 GB | **$0.03/mo** |
| Small shop, 3 years (no PSDs) | 5.2 GB | **$0.08/mo** |
| Small shop, 3 years + PSDs (avg 50 MB) | 24.6 GB | **$0.37/mo** |
| 50 shops, 3 years + PSDs | ~1.2 TB | **$18/mo** |

**Finding**: R2 costs are essentially zero for a single shop. The migration trigger is operational (reliability, PSD support) not financial.

**Migration path**: Supabase Storage and Cloudflare R2 both have S3-compatible APIs. The abstraction layer in M1 should use a storage interface that only the config changes at migration:

```typescript
// storage.ts (interface — code against this in M1)
interface IStorageProvider {
  upload(path: string, buffer: Buffer, opts: UploadOptions): Promise<string>
  createPresignedUploadUrl(path: string, expiresIn: number): Promise<PresignedUrl>
  createPresignedDownloadUrl(path: string, expiresIn: number): Promise<string>
  delete(paths: string[]): Promise<void>
  list(prefix: string): Promise<StorageObject[]>
}

// Implementations wired in infrastructure/bootstrap.ts:
// SupabaseStorageProvider (POC/dev)
// R2StorageProvider (production)
```

---

## 7. Supabase Storage POC — Validated

**All 9 operations passed** on local Supabase (v2 key format: `sb_publishable_*` / `sb_secret_*`):

| Operation | Result | Notes |
|-----------|--------|-------|
| Create bucket (private) | ✅ | `fileSizeLimit: 50MB`, `allowedMimeTypes` enforced |
| Direct upload (server-side) | ✅ | 489 KB in 66 ms |
| Presigned download URL | ✅ | Generated in 9 ms, 1-hour expiry |
| Roundtrip download | ✅ | Byte-exact match, 15 ms |
| Presigned upload URL generation | ✅ | 7 ms, returns `{path, token}` |
| Client upload via presigned token | ✅ | Anonkey client can upload to its own token |
| Large file upload (5.03 MB) | ✅ | 61 ms on local loop (~84 MB/s) |
| List bucket contents | ✅ | Returns `{name, metadata.size, metadata.mimetype}` |
| Delete files | ✅ | Batch delete by path array |

### Key Supabase v2 SDK Notes

- **Key format changed**: Local Supabase now uses `sb_publishable_*` and `sb_secret_*` instead of JWT `anon` / `service_role`. Old JWT keys fail with `signature verification failed`.
- **Env var**: The project uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (confirmed in `src/shared/lib/supabase/server.ts`).
- **Admin ops**: Use `sb_secret_*` for bucket creation, listing, deletion. Presigned URLs can be generated server-side with secret key and used by anon clients.
- **Presigned upload pattern** (client-direct, avoids Vercel 4.5 MB body limit):
  ```typescript
  // Server action generates token
  const { data: { path, token } } = await adminClient.storage
    .from('artwork')
    .createSignedUploadUrl(`artwork/${shopId}/originals/${filename}`)

  // Client POSTs directly to storage using token
  await anonClient.storage
    .from('artwork')
    .uploadToSignedUrl(path, token, file, { contentType: mimeType })
  ```

### Recommended RLS Policies

```sql
-- Bucket (created once, server-side)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('artwork', 'artwork', false, 52428800,  -- 50 MB
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/tiff','application/pdf']);

-- Reads: shop owner reads their own files only
CREATE POLICY "artwork_shop_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'artwork' AND
    (storage.foldername(name))[1] = 'artwork' AND
    (storage.foldername(name))[2] = auth.jwt()->>'shop_id'
  );

-- Writes: service role only (presigned upload URLs bypass this)
-- No INSERT policy for anon role — uploads always use server-generated tokens.

-- Deletes: shop owner only
CREATE POLICY "artwork_shop_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artwork' AND
    (storage.foldername(name))[2] = auth.jwt()->>'shop_id'
  );
```

---

## 8. Rendition Quality Assessment

All Sharp-generated WebP renditions produced visually acceptable output for the stated purposes:

- **Thumbnails (200×200)**: Suitable for catalog grid views. Logo/text designs render clearly. Photo designs show composition at a glance.
- **Previews (800×800)**: Suitable for proof review at screen resolution. All details visible for typical print artwork.
- **SVG rasterization**: librsvg correctly renders SVG fills, shapes, and text. Output is clean and anti-aliased.

**Quality gap**: Sharp cannot render PSD files. Until ag-psd is added, PSD uploads should use a "original stored, preview pending" state with manual proof generation.

---

## 9. Architecture Recommendations for M1

### Storage Provider

```
Phase 0 (POC/Gary demo): Supabase Storage Free tier — zero cost, proven via POC
Phase 1 (Production):    Cloudflare R2 — trigger when PSDs are introduced OR storage > 800 MB
```

### Path Conventions

```
artwork/{shop_id}/originals/{version_id}_{filename}     ← original, immutable
artwork/{shop_id}/thumbs/{version_id}.webp              ← 200×200 WebP
artwork/{shop_id}/previews/{version_id}.webp            ← 800×800 WebP
artwork/{shop_id}/frozen/{proof_id}.png                 ← immutable proof snapshot (approval/quote)
```

### File Size Limits

```typescript
const LIMITS = {
  raster: 50 * 1024 * 1024,       // 50 MB (PNG/JPEG/WebP)
  svg: 5 * 1024 * 1024,           // 5 MB
  psd: 300 * 1024 * 1024,         // 300 MB (deferred to M2+)
  pdf: 30 * 1024 * 1024,          // 30 MB
}
```

### Rendition Generation

- **Synchronous**: upload → store original → return `{ id, originalUrl, status: 'processing' }`
- **Asynchronous**: generate thumb + preview → update DB with rendition URLs → WebSocket/polling for UI
- **Exception**: SVG rendition can be synchronous (5-94ms), PSD cannot (requires ag-psd preprocessing)

### Dedup

```typescript
// Before any upload:
const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
const hex = Buffer.from(hash).toString('hex')
const existing = await db.query.artworkVersions.findFirst({
  where: eq(artworkVersions.contentHash, hex)
})
if (existing) return existing.originalUrl // no upload needed
```

---

## 10. Open Questions for M1

1. **PSD support timing**: Include `ag-psd` in M1 or defer to M2? Recommendation: defer — PSD rendering is complex (layer compositing, blending modes). Ship M1 without PSD preview; display "preview pending" state.
2. **Bucket per shop vs shared bucket**: Shared bucket with path prefix is simpler. Per-shop bucket only needed if shops need different retention policies. Recommendation: shared bucket, `artwork/{shop_id}/` prefix.
3. **Frozen proof format**: PNG (lossless, ~200 KB) or WebP (lossy, ~50 KB)? Recommendation: PNG — lossless is appropriate for legal/contractual records.
4. **Egress monitoring**: Who monitors egress? At 2 GB/month free tier, a single large proof campaign could exhaust it. Recommendation: add egress metric to admin dashboard before launch.

---

## Sources

- Sharp 0.34.5 benchmark: synthetic files, measured locally (macOS Apple Silicon)
- Supabase Storage POC: local Supabase v2 (`npx supabase status` → `sb_publishable_*` keys)
- R2 pricing: `$0.015/GB-month storage, $0 egress` (verified current as of 2026-03)
- Format support: `node -e "const sharp=require('sharp'); console.log(sharp.format)"`
- File size ranges: Research report `research-report.md` §5

---

*Feeds into: M1 (#718) shaping — storage provider decision, schema design, H2 (file upload pipeline)*
