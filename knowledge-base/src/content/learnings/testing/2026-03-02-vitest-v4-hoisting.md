---
title: 'Vitest v4 — vi.hoisted() Pattern for Mock Variables'
type: 'gotcha'
status: active
date: 2026-03-02
---

# Vitest v4 — `vi.hoisted()` Pattern for Mock Variables

**Discovered**: 2026-03-02
**Pipeline**: H2 Wave 0 (`20260302-h2-file-upload`)
**Files**: `src/infrastructure/storage/__tests__/`

---

## The Problem

Vitest v4 hoists `vi.mock()` factory calls above all `const`/`let` declarations at the top of the
file. Any variable used inside a `vi.mock()` factory must therefore already be initialized when
the factory executes — but `const mockFoo = vi.fn()` is NOT yet initialized at that point.

This causes: `ReferenceError: Cannot access 'mockFoo' before initialization`

## The Fix: `vi.hoisted()`

Wrap mock variable declarations in `vi.hoisted()` — these are guaranteed to be initialized before
any `vi.mock()` factory runs:

```typescript
const { mockFoo, mockBar } = vi.hoisted(() => {
  const mockFoo = vi.fn()
  const mockBar = vi.fn().mockReturnValue({ baz: vi.fn() })
  return { mockFoo, mockBar }
})

vi.mock('./some-module', () => ({
  SomeClass: vi.fn().mockImplementation(function (this: { foo: typeof mockFoo }) {
    this.foo = mockFoo // ✓ mockFoo is initialized
  }),
}))
```

## Class Constructor Mocks

Vitest v4 warns if you pass an arrow function to `mockImplementation` for a class constructor.
Arrow functions cannot be constructors (`new (() => {})` throws). Use a regular `function`:

```typescript
// ✗ Wrong — arrow function cannot be a constructor
RenditionService: vi.fn().mockImplementation(() => ({ generate: mockGenerate }))

// ✓ Correct — function keyword with `this` assignment
RenditionService: vi.fn().mockImplementation(function (this: { generate: typeof mockGenerate }) {
  this.generate = mockGenerate
})
```

## Sharp Mock Chain Restoration

After `vi.clearAllMocks()` in `beforeEach`, `mockReturnValue` calls are cleared. Restore the
chain manually:

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  // Restore Sharp chain
  mockToBuffer.mockResolvedValue(Buffer.from('webp-bytes'))
  mockWebp.mockReturnValue({ toBuffer: mockToBuffer })
  mockResize.mockReturnValue({ webp: mockWebp })
  mockSharp.mockReturnValue({ resize: mockResize })
})
```

The full Sharp pipeline mock:

```typescript
const { mockToBuffer, mockWebp, mockResize, mockSharp } = vi.hoisted(() => {
  const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('webp-bytes'))
  const mockWebp = vi.fn().mockReturnValue({ toBuffer: mockToBuffer })
  const mockResize = vi.fn().mockReturnValue({ webp: mockWebp })
  const mockSharp = vi.fn().mockReturnValue({ resize: mockResize })
  return { mockToBuffer, mockWebp, mockResize, mockSharp }
})

vi.mock('sharp', () => ({ default: mockSharp }))
```
