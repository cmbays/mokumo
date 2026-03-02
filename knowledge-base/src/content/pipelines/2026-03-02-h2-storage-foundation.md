---
title: 'H2 File Upload Pipeline — Wave 0: Storage Foundation'
subtitle: 'Built IStorageProvider + FileUploadService + RenditionService — the complete infrastructure layer for client-direct uploads to Supabase Storage'
date: 2026-03-02
phase: 2
pipelineName: 'H2 File Upload Pipeline'
pipelineType: horizontal
products: []
domains: ['artwork', 'devx']
tools: []
stage: build
tags: ['build', 'architecture']
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'worktree-eager-soaring-giraffe'
status: complete
---

## Summary

Wave 0 of the H2 File Upload Pipeline. Built the complete storage infrastructure layer — no consumer code, no UI. Every subsequent wave (W1A, W1B, W2A, W2B) builds on this foundation.

**PR**: #738
**Resume command**:

```bash
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```

---

## What Was Built

### Files created

| File | Purpose |
|------|---------|
| `src/domain/ports/storage.ts` | `IStorageProvider` + `IFileUploadService` port contracts + all input/output types |
| `src/infrastructure/storage/entity-configs.ts` | `ENTITY_CONFIGS` registry, `UploadValidationError`, `validateEntityConfig` |
| `src/infrastructure/storage/supabase-storage.provider.ts` | 6-method Supabase Storage v2 implementation |
| `src/infrastructure/storage/rendition.service.ts` | Sharp pipeline: 200×200 WebP q80 thumb + 800×800 WebP q85 preview |
| `src/infrastructure/storage/file-upload.service.ts` | Orchestrates URL issuance, confirmation, deletion |
| `src/infrastructure/storage/index.ts` | Singleton exports, wired into `bootstrap.ts` |
| `scripts/bootstrap-storage.ts` | Idempotent bucket creation + RLS policies |
| `docs/workspace/20260302-h2-file-upload/h2-infra-notes.md` | Supabase SDK quirks, Sharp notes, Vitest v4 hoisting patterns |
| 3 test files | 43 unit tests — `SupabaseStorageProvider`, `RenditionService`, `FileUploadService` |

### Test results
- 43 new tests, all passing
- Full suite: 2,000 tests passing
- TypeScript: 0 errors
- CI: all checks green (1 Prettier fix required after initial push)

---

## Key Decisions

### Shape A — Synchronous Pipeline
Client uploads directly to Supabase Storage via XHR using a presigned signed URL. Server only generates the URL and later confirms the upload. This bypasses Vercel's 4.5 MB request body limit. Shape A was chosen over Shape B (server-proxied) in the shaping phase.

### Bucket-agnostic `IStorageProvider`
First path segment encodes the bucket name (`artwork/shop-123/originals/...`). `parsePath()` in `SupabaseStorageProvider` splits on the first `/`. Consumer code never references bucket names directly. This keeps the port clean and the provider testable without knowledge of entity-specific bucket naming.

### `existingPath` required for `isDuplicate: true`
Initially, the `isDuplicate` short-circuit reconstructed a path from `contentHash`. Caught in review: real stored paths have the form `{versionId}_{filename}`, which is not derivable from content hash alone. Fix: callers must supply `existingPath` from their DB record when setting `isDuplicate: true`. Enforced at runtime with a thrown Error rather than in the type system (conditional fields on a plain input object make discriminated unions awkward for callers).

### Supabase `createSignedUploadUrl` — no `expiresIn`
Supabase Storage v2 SDK does not accept `expiresIn` on `createSignedUploadUrl`. The upload URL has platform-controlled expiry (~2 hours). `void expiresIn` is used in the provider to acknowledge the parameter without passing it to the SDK. Documented in `h2-infra-notes.md`.

### PDF and unknown MIME types → `status: 'pending'`
Sharp cannot render PDFs natively. `RenditionService` returns `{ thumbPath: null, previewPath: null }` for any non-Sharp-native MIME type, and `FileUploadService` sets `status: 'pending'` accordingly. Future wave will add async PDF rendition.

### RLS policy — intentional INSERT omission
Only SELECT + DELETE RLS policies are applied. No INSERT policy is needed because presigned signed-URL uploads authenticate via the signed token, which bypasses RLS. Documented as a gap candidate for `supabase-rls-completeness` review rule.

---

## Review Findings (Addressed Before Merge)

**Pass 1 — 3 majors fixed:**
1. Replaced `as number | undefined` + `as string | undefined` type assertions on Supabase metadata with runtime type guards + explanatory comment
2. `isDuplicate` path contract corrected (see Key Decisions above)

**Warnings deferred (dismissible):**
- Non-null assertion comments in `rendition.service.ts:35`
- Duplicate `makeProvider()` factory across two test files
- `sanitizeFilename` empty-string edge case

**Pass 2:** `[]` — gate: **PASS**

---

## Artifacts

- Plan: `docs/workspace/20260302-h2-file-upload/plan.md`
- Manifest: `docs/workspace/20260302-h2-file-upload/manifest.yaml`
- Breadboard + Reflection: PR #736
- Implementation notes: `docs/workspace/20260302-h2-file-upload/h2-infra-notes.md` _(deleted with workspace)_

---

## What Comes Next

Wave 1 (parallel — both depend on this wave merging to main):

- **W1A `artwork-schema-actions`** — Drizzle `artworks` table schema + migration + server actions (`initiateArtworkUpload`, `confirmArtworkUpload`, `deleteArtwork`)
- **W1B `upload-modal-ui`** — Upload modal component + `useFileUpload` hook (client-side XHR, progress, hash, dedup)

Wave 2 (parallel — both depend on W1A):
- **W2A `artwork-library-page`** — Artwork library screen (grid, status badges, upload trigger)
- **W2B `artwork-upload-e2e`** — Playwright E2E: V1 happy path, V2 duplicate detection, V3 validation error
