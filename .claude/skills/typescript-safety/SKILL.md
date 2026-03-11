---
name: typescript-safety
description: TypeScript type safety for Mokumo — eliminates `any` types, designs complex generics, creates type guards, resolves compiler errors, and enforces Mokumo's Zod-first type conventions. Use when encountering TypeScript errors, introducing new generic types, writing Zod schemas, working with Drizzle row types, designing port interfaces, or when `tsc --noEmit` fails.
---

# TypeScript Safety — Mokumo

## Process

When invoked:
1. Run `npx tsc --noEmit` to capture the full error output before making changes
2. Identify the root cause (unsound inference, missing constraints, implicit `any`, wrong boundary)
3. Craft a solution using the Mokumo type hierarchy below — prefer Zod inference, then Drizzle inference, then explicit generics
4. Eliminate all `any` types — validate each replacement still satisfies call sites
5. Confirm clean compile with a second `npx tsc --noEmit` pass

---

## Mokumo Type Source Hierarchy

**Rule: never write a type by hand if the runtime value already defines the shape.**

```
z.infer<typeof schema>          ← domain entities, enums, port contracts (first choice)
typeof table.$inferSelect        ← Drizzle DB row types (infrastructure layer only)
typeof table.$inferInsert        ← Drizzle insert row types
React.ComponentProps<typeof C>  ← component prop re-use
explicit generic                ← only when no runtime source exists
```

**Never use `interface`.** Always use `type` aliases derived from the sources above.

```ts
// ✗ — manual interface drifts from runtime schema
interface Customer { id: string; name: string }

// ✓ — Zod schema is the single source of truth
export type Customer = z.infer<typeof customerSchema>
```

---

## Mokumo-Specific Patterns

### 1. Zod Enums — derive the union type

```ts
// ✗
type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void'

// ✓ — stays in sync with z.enum automatically
export const invoiceStatusEnum = z.enum(['draft', 'sent', 'partial', 'paid', 'void'])
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>
// → "draft" | "sent" | "partial" | "paid" | "void"
```

### 2. Exhaustive Switches on Status Enums

Compiler enforces every case is handled. Required for all status-dispatch logic.

```ts
function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`)
}

function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'draft':   return 'Draft'
    case 'sent':    return 'Sent'
    case 'partial': return 'Partial Payment'
    case 'paid':    return 'Paid'
    case 'void':    return 'Void'
    default: return assertNever(status, 'Unhandled InvoiceStatus')
    // TS error here if a new enum value is added without updating this switch
  }
}
```

### 3. `satisfies` for Enum Config Objects

Use `satisfies` when you need a config map keyed by an enum. Preserves literal value types while enforcing completeness.

```ts
const invoiceStatusConfig = {
  draft:   { label: 'Draft',           color: 'text-sand-11' },
  sent:    { label: 'Sent',            color: 'text-sky-11'  },
  partial: { label: 'Partial Payment', color: 'text-amber-11'},
  paid:    { label: 'Paid',            color: 'text-jade-11' },
  void:    { label: 'Void',            color: 'text-red-11'  },
} satisfies Record<InvoiceStatus, { label: string; color: string }>
// TS error if any InvoiceStatus key is missing from this object
```

### 4. Branded UUID Types (domain IDs)

Raw `string` UUIDs are interchangeable at compile time — you can pass a `CustomerId` where an `OrderId` is expected and TS won't catch it. Branding prevents this.

```ts
// Define branded types in domain entity files
type Brand<T, B extends string> = T & { readonly __brand: B }

export type CustomerId = Brand<string, 'CustomerId'>
export type OrderId    = Brand<string, 'OrderId'>
export type InvoiceId  = Brand<string, 'InvoiceId'>

// Constructor — Zod refinement is the right entry point
export const customerIdSchema = z.string().uuid().transform(s => s as CustomerId)

// ✗ — compiles but is wrong
function getInvoice(id: CustomerId) { ... }
getInvoice(orderId) // TS error: Argument of type 'OrderId' is not assignable to 'CustomerId' ✓
```

Use branded ID types for any cross-domain lookup function where a wrong ID would cause a silent data leak.

### 5. Drizzle Row Types (infrastructure layer only)

Derive types from the Drizzle table definition — never redefine the shape.

```ts
import { customerActivities } from '@db/schema/customers'

// Row coming out of the DB
type ActivityRow = typeof customerActivities.$inferSelect

// Row going into the DB (all optional except required columns)
type ActivityInsert = typeof customerActivities.$inferInsert

// Map row → domain type at the boundary using Zod parse
function mapRow(row: ActivityRow): CustomerActivity {
  return customerActivitySchema.parse({ ... })
}
```

**Drizzle types stay in `_providers/supabase/`** — never leak into domain or feature layers.

### 6. Parse at Every Boundary

All external data (DB rows, API responses, form submissions, URL params) must pass through `schema.parse()` before entering domain logic.

```ts
// ✓ — DB boundary
const activity = customerActivitySchema.parse(rawRow)

// ✓ — external API boundary
const data: unknown = await res.json()
const user = userSchema.parse(data) // throws ZodError with detail if malformed

// ✗ — implicit any leaking from external source
const result = await res.json()  // type is any, bypasses all checks
```

### 7. Port Interfaces — Zod-derived method signatures

Port interfaces (`ICustomerRepository`, etc.) are the only place `interface` appears in the codebase — and even these derive their data types from Zod schemas, not manual type annotations.

```ts
// ✓ — method parameter/return types derived from Zod
export interface ICustomerRepository {
  findById(id: CustomerId): Promise<Customer | null>  // Customer = z.infer<typeof customerSchema>
  list(filters: CustomerFilters): Promise<CustomerListResult>
}
```

---

## General TypeScript Patterns

### Eliminating `any` with generics

```ts
// ✗
function getProperty(obj: any, key: string): any { return obj[key] }

// ✓
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key] }
```

### Type guards for unknown API responses

Prefer `schema.parse()` over manual type guards for Mokumo's API boundaries. Use manual guards only for performance-critical narrow checks.

```ts
// Prefer for all Mokumo boundaries:
const validated = mySchema.safeParse(data)
if (!validated.success) throw new Error(`Invalid shape: ${validated.error.message}`)
return validated.data

// Manual guard — only when Zod is unavailable or overkill:
function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null && 'id' in v && 'name' in v
}
```

### Conditional types for utility extraction

```ts
// Extract the element type from an array type
type ElementOf<T> = T extends (infer U)[] ? U : never
type InvoiceLineItem = ElementOf<Invoice['lineItems']>

// Unwrap a Promise
type Resolved<T> = T extends Promise<infer U> ? U : T
```

### `unknown` over `any` at all times

```ts
// ✗
async function fetchData(): Promise<any> { ... }

// ✓ — caller is forced to narrow before use
async function fetchData(): Promise<unknown> { ... }
```

---

## Capabilities Reference

- Advanced generics and conditional types
- Template literal types and mapped types
- Utility types: `Parameters`, `ReturnType`, `Awaited`, `Omit`, `Partial`, `Record`
- Brand/opaque types for nominal typing
- Type narrowing through control flow
- Function overloads for complex signatures
- Module augmentation and declaration merging
- `infer` keyword for type extraction
- Variance and distribution rules

---

## When to Invoke Downstream Agents

- **`pr-review-toolkit:type-design-analyzer`** — after introducing new types or schemas, before PR creation
- **`everything-claude-code:build-error-resolver`** — when `tsc --noEmit` produces errors after type changes
