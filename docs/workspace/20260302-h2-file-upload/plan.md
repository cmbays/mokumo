---
shaping: true
pipeline: 20260302-h2-file-upload
stage: implementation-planning
created: 2026-03-02
---

# H2: File Upload Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `build-session-protocol` to complete each session.

**Goal:** Deliver a single, tested file-upload service (`IFileUploadService`) that any vertical can
consume via two calls — `createPresignedUploadUrl()` and `confirmUpload()` — and wire P5 M1
(Artwork Library) as the first consumer on day one.

**Architecture:** Two-layer model — `IFileUploadService` (consumer interface) delegates to
`IStorageProvider` (Supabase now → R2 when PSDs ship). H2 has no DB schema; dedup state lives
in the consumer's table. Presigned upload pattern bypasses Vercel's 4.5 MB body limit — file
bytes go browser → Supabase Storage directly, never through the Vercel function.

**Tech Stack:** Supabase Storage v2 SDK (`sb_secret_*` key for admin ops), Sharp 0.34.5
(WebP renditions), Web Crypto API (SHA-256 client-side), Drizzle ORM (consumer schema),
Next.js Server Actions (consumer wiring).

---

## Wave 0 — H2 Infrastructure Foundation (serial)

### Task 0.1: H2 Service Layer

> **One session, serial.** No consumer code. Pure infrastructure.
> This is the entire P4 from the breadboard: interfaces → provider → rendition service →
> upload service → entity configs → bootstrap script → exports + unit tests.

**New files:**

```
src/domain/ports/storage.ts                             # IStorageProvider, IFileUploadService
src/infrastructure/storage/
  entity-configs.ts                                     # ENTITY_CONFIGS registry
  supabase-storage.provider.ts                          # SupabaseStorageProvider (6 methods)
  rendition.service.ts                                  # RenditionService (Sharp pipeline)
  file-upload.service.ts                                # FileUploadService (createPresignedUploadUrl, confirmUpload, deleteFile)
  index.ts                                              # export { fileUploadService }
  __tests__/
    supabase-storage.provider.test.ts                   # all 6 provider methods, mocked SDK
    rendition.service.test.ts                           # format detection + Sharp pipeline
    file-upload.service.test.ts                         # createPresignedUploadUrl, confirmUpload, deleteFile; dedup + validation branches
scripts/bootstrap-storage.ts                            # idempotent bucket + RLS setup
docs/workspace/20260302-h2-file-upload/h2-infra-notes.md
```

**Modified files:**

```
src/infrastructure/bootstrap.ts                         # add: export { fileUploadService } from './storage'
```

**Key implementation notes:**

1. `IStorageProvider` interface in `domain/ports/storage.ts`:

   ```ts
   export type IStorageProvider = {
     upload(path: string, buffer: Buffer, opts: { contentType: string }): Promise<{ path: string }>
     delete(paths: string[]): Promise<void>
     createPresignedUploadUrl(
       path: string,
       expiresIn: number
     ): Promise<{ uploadUrl: string; token: string }>
     createPresignedDownloadUrl(path: string, expiresIn: number): Promise<string>
     download(path: string): Promise<Buffer>
     list(prefix: string): Promise<Array<{ name: string; size: number; mimeType: string }>>
   }
   ```

   `download()` is the server-side read path — no presigned URL, direct admin SDK buffer access.

2. `IFileUploadService` in same file:

   ```ts
   export type CreatePresignedUploadUrlInput = {
     entity: string
     shopId: string
     filename: string
     mimeType: string
     sizeBytes: number
     contentHash: string
     isDuplicate?: boolean // caller passes true if they already found a match
   }
   export type PresignedUploadResult =
     | { isDuplicate: true; path: string }
     | { isDuplicate: false; path: string; uploadUrl: string; token: string; expiresAt: Date }
   export type ConfirmUploadInput = { path: string; contentHash: string }
   export type ConfirmUploadResult = {
     originalUrl: string
     thumbUrl: string | null
     previewUrl: string | null
     status: 'ready' | 'pending'
   }
   export type IFileUploadService = {
     createPresignedUploadUrl(input: CreatePresignedUploadUrlInput): Promise<PresignedUploadResult>
     confirmUpload(input: ConfirmUploadInput): Promise<ConfirmUploadResult>
     deleteFile(paths: string[]): Promise<void>
   }
   ```

3. `ENTITY_CONFIGS` in `entity-configs.ts` — initial entry for `artwork` only. Add future
   entries here when new consumers arrive (e.g., `customer-document`). Each entry: bucket name,
   `allowedMimeTypes: string[]`, `maxSizeBytes: Record<string, number>`.

4. `SupabaseStorageProvider` — uses `sb_secret_*` key (env var `SUPABASE_SERVICE_ROLE_KEY`).
   **Never** use the anon key for server-side ops. The presigned upload token allows the browser
   client's anon key to upload to its own signed path — this is intentional by design.

5. `RenditionService.generate(originalPath, entity)`:
   - Calls `provider.download(path)` to get raw Buffer (admin SDK direct — no HTTP round-trip)
   - Format detection by `mimeType` parameter (not file extension sniffing)
   - Sharp-native: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `image/gif`,
     `image/tiff` → generates thumb (200×200 WebP q80) + preview (800×800 WebP q85)
   - SVG: Sharp handles natively via librsvg; no preprocessing needed
   - Non-Sharp: `application/pdf`, plus any unrecognised MIME → returns
     `{ thumbPath: null, previewPath: null }` with `status: 'pending'`
   - Sharp options: `fit: 'inside', withoutEnlargement: true` on all resizes

6. `FileUploadService.createPresignedUploadUrl()` — server generates path using:

   ```
   path = `${entity}/${shopId}/originals/${versionId}_${sanitizeFilename(filename)}`
   ```

   where `versionId = crypto.randomUUID()`. Server controls the path — no client path injection.

7. `bootstrap-storage.ts` — idempotent. Safe to run multiple times. Creates `artwork` bucket
   with `fileSizeLimit: 52_428_800` (50 MB), MIME allowlist matching `ENTITY_CONFIGS.artwork`.
   Applies RLS policies (SELECT + DELETE tied to `auth.jwt()->>'shop_id'`). No INSERT policy
   for anon role — uploads always use presigned tokens.

8. `index.ts` exports a singleton:

   ```ts
   import { SupabaseStorageProvider } from './supabase-storage.provider'
   import { FileUploadService } from './file-upload.service'
   const provider = new SupabaseStorageProvider()
   export const fileUploadService = new FileUploadService(provider)
   ```

   Consumer import: `import { fileUploadService } from '@infra/storage'`.

9. **Unit tests** — mock `@supabase/ssr` client methods. Test:
   - `SupabaseStorageProvider`: all 6 methods (happy path + error propagation)
   - `RenditionService`: Sharp-native format → renditions generated; non-Sharp → status: pending;
     SVG rasterize path; GIF first-frame-only path
   - `FileUploadService.createPresignedUploadUrl`: isDuplicate=true short-circuit; validation
     error on MIME mismatch; validation error on size exceeded; happy path
   - `FileUploadService.confirmUpload`: ready path; pending path for PDF
   - `FileUploadService.deleteFile`: calls provider.delete with all paths

**Test threshold:** 80% on infrastructure layer (CLAUDE.md).

---

## Wave 1 — P5 M1 Consumer Layer (parallel)

> Wave 0 must be merged before Wave 1 starts.

### Task 1.1: Artwork Schema + Server Actions (Session A)

> Consumer DB schema, repository mutations, and server actions.
> This session writes the "server half" of the P5 M1 upload flow.

**New files:**

```
src/db/schema/artworks.ts                               # artwork_versions Drizzle table
supabase/migrations/XXXX_artwork_versions.sql           # generated by db:generate
src/domain/ports/artwork.repository.ts                  # extend: add insert + findByContentHash
src/infrastructure/repositories/_providers/supabase/artworks.ts  # Supabase implementation
src/features/artwork/actions/upload.action.ts           # initiateUpload, confirmArtworkUpload
src/features/artwork/actions/__tests__/upload.action.test.ts
docs/workspace/20260302-h2-file-upload/artwork-actions-notes.md
```

**Modified files:**

```
src/infrastructure/repositories/artworks.ts             # route to supabase provider for mutations
src/db/schema/index.ts                                  # re-export artworks schema
```

**Key implementation notes:**

1. `artwork_versions` Drizzle schema (in `src/db/schema/artworks.ts`):

   ```ts
   export const artworkVersions = pgTable('artwork_versions', {
     id: uuid('id').primaryKey().defaultRandom(),
     shopId: text('shop_id').notNull(),
     contentHash: text('content_hash').notNull(),
     originalPath: text('original_path').notNull(),
     originalUrl: text('original_url').notNull(),
     thumbUrl: text('thumb_url'),
     previewUrl: text('preview_url'),
     status: text('status', { enum: ['ready', 'pending', 'processing'] })
       .notNull()
       .default('ready'),
     filename: text('filename').notNull(),
     mimeType: text('mime_type').notNull(),
     sizeBytes: integer('size_bytes').notNull(),
     createdAt: timestamp('created_at').defaultNow().notNull(),
     updatedAt: timestamp('updated_at').defaultNow().notNull(),
   })
   // Index: (shop_id, content_hash) for fast dedup lookups
   ```

2. Run `npm run db:generate` to produce the migration SQL, then check it in.

3. `IArtworkRepository` additions (in `src/domain/ports/artwork.repository.ts`):

   ```ts
   insertVersion(data: InsertArtworkVersion): Promise<ArtworkVersion>
   findVersionByContentHash(shopId: string, contentHash: string): Promise<ArtworkVersion | null>
   ```

4. Server actions in `upload.action.ts`:
   - `initiateUpload()` — calls `verifySession()`, validates shopId, calls dedup query via
     repository, if no dup calls `fileUploadService.createPresignedUploadUrl()`
   - `confirmArtworkUpload()` — calls `verifySession()`, calls `fileUploadService.confirmUpload()`,
     then `artworkRepository.insertVersion()` with the result
   - Both must call `verifySession()` — auth classification: AUTHENTICATED (shop IP)
   - Import from `@infra/storage` (not directly from provider)

5. **Dedup contract:** Consumer owns dedup state. `initiateUpload` passes `isDuplicate: true`
   when `findVersionByContentHash()` returns a match. H2 respects that flag and skips presigned
   URL generation. Per Decision D3 in shaping.

**Test threshold:** 80% on server actions.

---

### Task 1.2: Upload Modal UI (Session B — parallel with 1.1)

> Client-side orchestrator + the full upload modal component.
> Session B can run in parallel with 1.1 — stub the action signatures if 1.1 isn't merged yet.

**New files:**

```
src/features/artwork/components/upload-modal.tsx        # full modal (all states: select/progress/success/error/dup)
src/features/artwork/hooks/use-file-upload.ts           # handleFileUpload orchestrator + computeHash + XHR
src/features/artwork/components/__tests__/upload-modal.test.tsx
src/features/artwork/hooks/__tests__/use-file-upload.test.ts
docs/workspace/20260302-h2-file-upload/upload-modal-notes.md
```

**Key implementation notes:**

1. `computeHash(file: File): Promise<string>` — Web Crypto API:

   ```ts
   const buffer = await file.arrayBuffer()
   const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
   return Buffer.from(hashBuffer).toString('hex')
   ```

   Browser globals: `crypto.subtle` is available in the browser and in Node 24+.

2. `uploadToStorage(uploadUrl: string, token: string, file: File, onProgress: (pct: number) => void)`
   — Uses `XMLHttpRequest` (not `fetch`) for upload progress events:

   ```ts
   xhr.upload.onprogress = (e) => onProgress(Math.round((e.loaded / e.total) * 100))
   ```

   Sets `Authorization: Bearer ${token}` header. No file bytes go through the Vercel function.

3. `handleFileUpload` orchestrator in `use-file-upload.ts`:
   1. Call `computeHash(file)` → `contentHash`
   2. Call `initiateUpload({ entity: 'artwork', shopId, filename, mimeType, sizeBytes, contentHash })`
      - `isDuplicate: true` → set `duplicateState`, return early
      - `UploadValidationError` → set `errorState`, return early
   3. Call `uploadToStorage(uploadUrl, token, file, setProgress)` → updates progress bar
   4. Show rendition skeleton (U6)
   5. Call `confirmArtworkUpload({ path, contentHash })` → receives artwork record
   6. Show success state (U7) with thumbnail preview

4. Modal states (mutually exclusive, driven by orchestrator):
   - `idle` → shows dropzone (U3) + file info if selected (U4)
   - `uploading` → shows progress bar (U5, 0–100%)
   - `processing` → shows rendition skeleton (U6)
   - `success` → shows thumbnail preview + "Done" (U7)
   - `error` → shows error message (U8)
   - `duplicate` → shows duplicate notice + link to existing artwork (U9)

5. File dropzone: use `<input type="file" accept="image/*,application/pdf">`. Validate MIME
   client-side before calling the server (fast feedback) but server validates too (authoritative).

6. Design system: use `bg-elevated`, `border-border`, `text-action`, `text-muted-foreground`.
   Progress bar: simple `div` with `bg-action` width transition. Rendition skeleton: 2–3 shimmer
   bars (see existing skeleton patterns in `@shared/ui/`). Close button: `bg-surface` + X icon
   from Lucide.

7. **Stub pattern for parallel development** — if `upload.action.ts` isn't merged yet:
   ```ts
   // tmp stub — replace when 1.1 merges
   const initiateUpload: typeof import('../actions/upload.action').initiateUpload = async () => ({
     isDuplicate: false,
     path: '',
     uploadUrl: '',
     token: '',
     expiresAt: new Date(),
   })
   ```
   This lets the modal be fully built and tested before server actions are merged.

**Test threshold:** 70% on UI components (CLAUDE.md).

---

## Wave 2 — Artwork Library Page + Integration (parallel)

> Wave 1 sessions A and B must both be merged before Wave 2 starts.

### Task 2.1: Artwork Library Page (Session A)

> Wire upload modal into the Artwork Library page. Render uploaded artworks in the grid.

**New files:**

```
app/(dashboard)/artwork/page.tsx                        # Artwork Library server page
app/(dashboard)/artwork/loading.tsx                     # skeleton while loading
src/features/artwork/components/artwork-library.tsx     # page-level component (U1 + grid)
src/features/artwork/components/artwork-grid.tsx        # grid layout (U2 cards)
src/features/artwork/components/artwork-card.tsx        # individual card with thumb + name + status
docs/workspace/20260302-h2-file-upload/artwork-library-notes.md
```

**Key implementation notes:**

1. `page.tsx` — async Server Component. Calls `verifySession()`, loads `artworkVersions` for
   `shopId`, renders `<ArtworkLibrary artworks={artworks} shopId={shopId} />`.

2. `ArtworkLibrary` — client component (needs state for modal open/close). Contains:
   - "Upload Artwork" button (U1) → opens `<UploadModal />`
   - `<ArtworkGrid>` with artwork cards (U2)

3. `ArtworkCard` — renders `thumbUrl` if `status === 'ready'`, otherwise placeholder skeleton.
   Shows `filename`, `mimeType`, `status` badge (`ready` → success token, `pending` → warning token).

4. When modal closes with `success`, invalidate/refetch the artwork list. Pattern: pass
   `onSuccess` callback to modal → parent calls `router.refresh()`.

5. Add route `artwork` to `docs/APP_FLOW.md` — note the page exists and its purpose.

---

### Task 2.2: E2E Tests (Session B — parallel with 2.1)

> Playwright E2E tests covering V1 (happy path), V2 (dedup), V3 (validation).
> Can start while 2.1 is in progress if the page URL is established.

**New files:**

```
tests/e2e/journeys/artwork-upload.spec.ts               # V1 + V2 + V3 journeys
docs/workspace/20260302-h2-file-upload/e2e-notes.md
```

**Test journeys:**

- **V1 — Happy Path:** Navigate to `/artwork` → click "Upload Artwork" → drop a 300 DPI PNG
  → observe progress bar → rendition skeleton → thumbnail appears in grid. Assert:
  artwork card visible with `status === 'ready'`.

- **V2 — Dedup Short-Circuit:** Upload same PNG a second time. Assert: duplicate notice shown
  (U9) immediately, no new card in grid, S2 storage write count unchanged.

- **V3 — Validation Error:** Attempt to upload a file with invalid MIME or oversized file
  (stub a large file client-side if needed). Assert: error state shown (U8) immediately,
  no progress bar ever shown, no storage write.

Use fixtures for test files (`tests/e2e/fixtures/artwork-test-files/`). Use `page.route()` to
intercept storage XHR for V2/V3 without making real Supabase calls in CI.

---

## Wrap-Up Session (post-Wave 2)

After all PRs merge, run the KB pipeline doc and update MEMORY.md:

1. Consolidate workspace notes into `knowledge-base/src/content/pipelines/2026-03-02-h2-file-upload.md`
2. Add `fileUploadService` export to `src/infrastructure/bootstrap.ts` port checks (compile-time assertion)
3. Add OQ4 note (orphan cleanup responsibility) to `docs/workspace/20260302-h2-file-upload/` for P5 M1 to handle
4. Update `docs/APP_FLOW.md` with `/artwork` route

---

## File Map Summary

| Wave | Session | Files Created                                                                                                             | Files Modified                                                                                        |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| W0   | 0.1     | `domain/ports/storage.ts`, `infrastructure/storage/` (6 files + 3 tests), `scripts/bootstrap-storage.ts`                  | `infrastructure/bootstrap.ts`                                                                         |
| W1   | 1.1     | `db/schema/artworks.ts`, migration, `features/artwork/actions/upload.action.ts`, supabase artworks provider, action tests | `domain/ports/artwork.repository.ts`, `infrastructure/repositories/artworks.ts`, `db/schema/index.ts` |
| W1   | 1.2     | `features/artwork/components/upload-modal.tsx`, `features/artwork/hooks/use-file-upload.ts`, component + hook tests       | —                                                                                                     |
| W2   | 2.1     | `app/(dashboard)/artwork/page.tsx`, `loading.tsx`, `artwork-library.tsx`, `artwork-grid.tsx`, `artwork-card.tsx`          | `docs/APP_FLOW.md`                                                                                    |
| W2   | 2.2     | `tests/e2e/journeys/artwork-upload.spec.ts`, test fixtures                                                                | —                                                                                                     |

---

## Open Questions (non-blocking, from shaping)

| #   | Question                                            | When to Resolve              |
| --- | --------------------------------------------------- | ---------------------------- |
| OQ1 | Frozen proof format: PNG vs WebP?                   | Before P5 M5 (Approval)      |
| OQ2 | Egress monitoring dashboard?                        | Before P14 (external access) |
| OQ3 | Multi-bucket vs shared bucket for >2 entity types?  | Revisit when needed          |
| OQ4 | Orphan cleanup for abandoned presigned URL uploads? | Consumer responsibility note |
