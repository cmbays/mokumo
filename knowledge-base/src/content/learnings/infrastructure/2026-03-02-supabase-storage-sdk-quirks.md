---
title: 'Supabase Storage SDK v2 — Quirks and Patterns'
type: 'gotcha'
status: active
date: 2026-03-02
---

# Supabase Storage SDK v2 — Quirks and Patterns

**Discovered**: 2026-03-02
**Pipeline**: H2 Wave 0 (`20260302-h2-file-upload`)
**Files**: `src/infrastructure/storage/supabase-storage.provider.ts`

---

## `createSignedUploadUrl` — No `expiresIn` Option

`adminClient.storage.from(bucket).createSignedUploadUrl(path)` in Supabase Storage v2 **does not
accept** an `expiresIn` option. The TypeScript overload is:

```typescript
createSignedUploadUrl(path: string, options?: { upsert?: boolean }): Promise<...>
```

The upload URL has a platform-controlled expiry (~2 hours by default). If your port interface
accepts `expiresIn` for forward-compatibility, use `void expiresIn` to acknowledge the parameter
without passing it to the SDK.

## `createSignedUrl` (Download) — Uses `expiresIn` Correctly

```typescript
storage.from(bucket).createSignedUrl(path, expiresIn)  // ✓ works as expected
```

## `download()` Returns `Blob | null` — Convert to Buffer

```typescript
const { data: blob, error } = await storage.from(bucket).download(key)
if (!blob) throw new Error(...)
const arrayBuffer = await blob.arrayBuffer()
return Buffer.from(arrayBuffer)
```

No streaming — full file loaded into memory. Acceptable for 50 MB artwork limit.

## `list()` Metadata — Runtime Guards Required

`storage.from(bucket).list()` returns objects where `metadata` is `Record<string, unknown>`. Do
NOT cast with `as number | undefined` — use runtime guards:

```typescript
size: typeof obj.metadata?.size === 'number' ? obj.metadata.size : 0,
mimeType: typeof obj.metadata?.mimetype === 'string'
  ? obj.metadata.mimetype
  : 'application/octet-stream',
```

## Admin Client — Lazy Construction

Construct the admin client inside a getter function, not at module load time. This lets tests mock
`@supabase/supabase-js` before any instance is created:

```typescript
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('...')
  return createClient(url, key, { auth: { persistSession: false } })
}
```

## RLS — INSERT Policy Omitted for Signed Upload URLs

Supabase signed upload URLs (`createSignedUploadUrl`) grant write access via the signed token,
bypassing RLS. An INSERT policy on `storage.objects` is therefore not needed when all uploads go
through signed URLs. Only SELECT + DELETE policies are required for shop-scoped access control.

## Bucket Path Convention

`IStorageProvider` is bucket-agnostic — first path segment = bucket name:

```
artwork/shop-123/originals/uuid_file.png
│        │        │         └─ filename
│        │        └─ subfolder
│        └─ shopId
└─ bucket
```

`parsePath(path)` splits on the first `/` to extract bucket + key. Consumer code never references
bucket names directly.
