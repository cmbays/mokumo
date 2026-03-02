---
pipeline: 20260302-h2-file-upload
stage: build
session: wave-0
created: 2026-03-02
---

# H2 Infrastructure Notes — Wave 0

## Supabase SDK Quirks

### createSignedUploadUrl — no expiresIn option

`adminClient.storage.from(bucket).createSignedUploadUrl(path)` in Supabase Storage v2 SDK
does **not** accept an `expiresIn` option. The TypeScript types show the overload as:

```typescript
createSignedUploadUrl(path: string, options?: { upsert?: boolean }): Promise<...>
```

The upload URL has a platform-controlled expiry (~2 hours by default). The `IStorageProvider`
interface accepts `expiresIn: number` as a parameter (for future compatibility or alternative
implementations), but `SupabaseStorageProvider` ignores it with `void expiresIn`. This is
correct — do not add `{ expiresIn }` to the SDK call.

### createSignedUrl — uses expiresIn correctly

`createSignedUrl(path, expiresIn)` (for **download** URLs) does accept the expiry in seconds.
The pattern `provider.createPresignedDownloadUrl(path, 3600)` produces 1-hour signed download
URLs as expected.

### download → Blob → Buffer conversion

`storage.from(bucket).download(path)` returns a `Blob | null`. Server-side code needs a
`Buffer`. The conversion is:

```typescript
const arrayBuffer = await blob.arrayBuffer()
return Buffer.from(arrayBuffer)
```

This is synchronous from the caller's perspective once the `await blob.arrayBuffer()` resolves.
No streaming is used — entire file is loaded into memory. For the 50 MB artwork limit this is
acceptable. If files grow larger in future, consider streaming.

### Admin client construction

The admin client is constructed lazily inside a getter function (`getAdminClient()`), not at
module load time. This ensures tests can mock `@supabase/supabase-js` before any instance is
created. Pattern: `createClient(url, serviceRoleKey, { auth: { persistSession: false } })`.

## Sharp Notes

### Native bindings

Sharp uses libvips native bindings. These are installed as platform-specific binaries via
`@img/sharp-{platform}-{arch}` optional dependencies. No `@types/sharp` package needed —
types are bundled inside the `sharp` package itself since v0.29.

### Import syntax

`import sharp from 'sharp'` (default import) is correct. The package exports a function
(not a class). Usage: `sharp(buffer).resize(...).webp(...).toBuffer()`.

### SVG handling

Sharp handles SVG natively via libvips/librsvg. No preprocessing needed — `image/svg+xml` is
treated the same as other Sharp-native types. librsvg must be installed on the system (it's
included in the Sharp install on most platforms).

### GIF handling

Sharp extracts the **first frame only** from animated GIFs by default. This is the correct
behavior for artwork thumbnails — a 200×200 WebP of frame 1 is the expected output.

## Decision: mimeType propagation through confirmUpload

The `ConfirmUploadInput` includes `mimeType: string`. This was added to the port spec (over the
plan doc's original definition of `{ path: string; contentHash: string }`) because:

1. `RenditionService.generate()` needs the MIME type for format detection
2. Format detection by file extension is unreliable after `sanitizeFilename()` (extension can
   be stripped or changed)
3. The client already knows the MIME type at upload time and sends it to `initiateUpload()`
4. Server-side MIME sniffing would require reading file bytes — wasteful when the client already
   validated this

The MIME type travels: browser file input → `initiateUpload()` → `confirmArtworkUpload()` →
`fileUploadService.confirmUpload()` → `RenditionService.generate()`.

## Test Mocking Strategy

### Vitest v4 hoisting requirement

Vitest v4 hoists `vi.mock()` factory calls above all `const`/`let` declarations. Any variables
used inside a `vi.mock()` factory must be declared with `vi.hoisted()`. Pattern used in all
three test files:

```typescript
const { mockFoo } = vi.hoisted(() => {
  const mockFoo = vi.fn()
  return { mockFoo }
})

vi.mock('./some-module', () => ({
  SomeClass: vi.fn().mockImplementation(function (this: MyType) {
    this.foo = mockFoo
  }),
}))
```

### Class constructor mocks

Vitest v4 warns if you use an arrow function as a `vi.fn()` implementation that will be called
as a constructor. Use a regular `function` keyword with `this` assignment:

```typescript
// Wrong (arrow — cannot be a constructor):
RenditionService: vi.fn().mockImplementation(() => ({ generate: mockGenerate }))

// Correct (function — this is the new instance):
RenditionService: vi.fn().mockImplementation(function (this: { generate: typeof mockGenerate }) {
  this.generate = mockGenerate
})
```

### Sharp mock chain

The Sharp pipeline is `sharp(buffer) → .resize() → .webp() → .toBuffer()`. Each method returns
the next step, so the mock chain is:

```typescript
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('webp-bytes'))
const mockWebp = vi.fn().mockReturnValue({ toBuffer: mockToBuffer })
const mockResize = vi.fn().mockReturnValue({ webp: mockWebp })
const mockSharp = vi.fn().mockReturnValue({ resize: mockResize })
vi.mock('sharp', () => ({ default: mockSharp }))
```

After `vi.clearAllMocks()` in `beforeEach`, restore the chain manually since `mockReturnValue`
calls are cleared.

## Bucket path convention

The `IStorageProvider` is bucket-agnostic — all methods take a full `path` where the first
segment is the bucket name:

```
artwork/shop-123/originals/uuid_file.png
│        │        │         └─ filename
│        │        └─ subfolder
│        └─ shopId
└─ bucket (= entity name)
```

`parsePath()` in `SupabaseStorageProvider` splits on the first `/` to extract bucket + key.
This means consumer code never needs to know the bucket name directly.
