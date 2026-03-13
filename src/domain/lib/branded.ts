/**
 * Nominal (branded) types for compile-time identity safety.
 *
 * TypeScript is structurally typed — a plain `string` for a QuoteId is
 * assignable where a CustomerId is expected.  Branded types use a phantom
 * `unique symbol` property to make structurally identical types nominally
 * distinct, catching cross-entity ID mix-ups at compile time with zero
 * runtime cost.
 *
 * Usage:
 *   const qid = brandId<QuoteId>('abc-123')
 *   const cid = brandId<CustomerId>('def-456')
 *   acceptsQuoteId(qid)  // OK
 *   acceptsQuoteId(cid)  // Compile error
 *
 * @see ADR-030 — Branded Types for Nominal Safety
 */

declare const __brand: unique symbol

/**
 * Intersect any base type `T` with a phantom brand tag `S`.
 * The branded property never exists at runtime — it only lives in the
 * type system for structural incompatibility.
 */
export type Brand<T, S extends string> = T & { readonly [__brand]: S }

// ── Entity ID types ────────────────────────────────────────────────
export type CustomerId = Brand<string, 'CustomerId'>
export type QuoteId = Brand<string, 'QuoteId'>
export type JobId = Brand<string, 'JobId'>
export type InvoiceId = Brand<string, 'InvoiceId'>
export type ContactId = Brand<string, 'ContactId'>
export type AddressId = Brand<string, 'AddressId'>
export type GroupId = Brand<string, 'GroupId'>
export type ScreenId = Brand<string, 'ScreenId'>
export type ArtworkId = Brand<string, 'ArtworkId'>
export type NoteId = Brand<string, 'NoteId'>
export type CreditMemoId = Brand<string, 'CreditMemoId'>
export type PricingTemplateId = Brand<string, 'PricingTemplateId'>
export type ScratchNoteId = Brand<string, 'ScratchNoteId'>
export type MockupTemplateId = Brand<string, 'MockupTemplateId'>
export type CatalogStyleId = Brand<string, 'CatalogStyleId'>

/**
 * Cast a raw value to a branded type at a validation boundary.
 *
 * Use this at repository return sites and factory functions — anywhere
 * a raw string has been validated (e.g. Zod parse, DB read) and is
 * entering the domain layer.
 *
 * @example
 *   const id = brandId<QuoteId>(row.id)
 */
export function brandId<T extends Brand<string, string>>(raw: string): T {
  return raw as T
}
