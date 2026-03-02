---
shaping: true
pipeline: 20260302-h2-file-upload
stage: shaping
created: 2026-03-02
---

# H2: File Upload Pipeline — Frame

## Source

> Artwork vertical M1 (#718) is blocked by H2 (File Upload Pipeline). The presigned URL pattern
> is required because Vercel has a 4.5 MB body limit — clients cannot POST files through server
> actions or route handlers for large artwork files. Sharp renditions must be generated
> per-upload. Storage must be swappable (Supabase Free tier now → Cloudflare R2 when PSDs ship).
>
> Spike #726 validated the full upload → store → serve → presigned-URL path on local Supabase
> (all 9 operations passed). IStorageProvider interface drafted. RLS policies designed.
> Path conventions established.
>
> Consumers: P5 M1 (Artwork Library, first consumer), P14 M3 (Customer Portal Artwork Approval,
> second consumer). Each would re-implement identical plumbing without H2.

— From artwork-vertical-research.md, spike-726-storage.md, phase-2.md (2026-03-02)

---

## Problem

Verticals that need file uploads (P5 Artwork, P14 Customer Portal) face identical
infrastructure constraints — Vercel's 4.5 MB body limit blocks direct server-side uploads,
Sharp rendition generation must be orchestrated per file, identical files must not be stored
twice, and storage must be swappable when Cloudflare R2 becomes necessary. Without a shared
horizontal, each vertical re-implements this plumbing differently, accumulating duplicate code
and inconsistent behavior across consumers.

---

## Outcome

H2 provides a single, tested file upload service that any vertical can consume with a thin
callsite. Consumers call `createPresignedUploadUrl()` and `confirmUpload()` — they receive
back `{originalUrl, thumbUrl, previewUrl}` and never touch storage directly. The provider
(Supabase → R2) is a configuration change invisible to consumers. P5 M1 is the first
consumer and must work on H2 day one.
