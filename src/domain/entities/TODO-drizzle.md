# Drizzle-Zod Migration Backlog

This document tracks existing domain entity schemas that are currently hand-written Zod schemas and will need to be migrated to drizzle-zod as their respective verticals receive Supabase PostgreSQL repositories.

## Migration Status

### Already Migrated ✓

- **garment.ts** — `GarmentCatalog` (Session B, Wave 1)
  - Drizzle schema: `src/db/schema/garment.ts`
  - Zod derived from Drizzle table

### Pending Migration (Alphabetical)

These entities will be migrated to drizzle-zod when their domains/verticals add Supabase support:

1. **address.ts**
   - Schemas: `Address`
   - Used by: Customer, Job

2. **artwork.ts**
   - Schemas: `Artwork`
   - Used by: Job approval flow

3. **board-card.ts**
   - Schemas: `BoardCard`
   - Used by: Production board UI state

4. **color-preferences.ts**
   - Schemas: `ColorPreference`
   - Used by: Customer preferences

5. **color.ts**
   - Schemas: `Color`
   - Used by: Pricing, Job specifications

6. **contact.ts**
   - Schemas: `Contact`
   - Used by: Customer relationship

7. **credit-memo.ts**
   - Schemas: `CreditMemo`
   - Used by: Billing

8. **customer-screen.ts**
   - Schemas: `CustomerScreen`
   - Used by: Screen room tracking

9. **customer.ts**
   - Schemas: `Customer`
   - Domain: Customers — high priority

10. **demo-login.ts**
    - Schemas: `DemoLogin`
    - Used by: Phase 1 auth mock

11. **dtf-line-item.ts**
    - Schemas: `DTFLineItem`
    - Used by: DTF printing pricing

12. **dtf-pricing.ts**
    - Schemas: `DTFPricing`
    - Domain: Pricing submodule

13. **dtf-sheet-calculation.ts**
    - Schemas: `DTFSheetCalculation`
    - Used by: DTF sheet cost models

14. **garment.ts** (non-migrated)
    - Schemas: `Garment`, `GarmentCategory`
    - Note: `GarmentCatalog` is migrated; `Garment` (job instance) remains pending

15. **group.ts**
    - Schemas: `Group`
    - Used by: Tag grouping

16. **invoice.ts**
    - Schemas: `Invoice`
    - Domain: Billing — high priority

17. **job.ts**
    - Schemas: `Job`, `JobStatus`
    - Domain: Jobs — highest priority (core workflow)

18. **mockup-template.ts**
    - Schemas: `MockupTemplate`
    - Used by: Artwork approval

19. **note.ts**
    - Schemas: `Note`
    - Used by: Job notes

20. **price-matrix.ts**
    - Schemas: `PriceMatrix`
    - Domain: Pricing — high priority

21. **quote.ts**
    - Schemas: `Quote`
    - Domain: Quoting — high priority

22. **review-config.ts**
    - Schemas: `ReviewConfig`
    - Used by: Review pipeline state

23. **review-pipeline.ts**
    - Schemas: `ReviewPipeline`, `ReviewStage`
    - Used by: Art approval workflow

24. **scratch-note.ts**
    - Schemas: `ScratchNote`
    - Used by: Temporary notes

25. **screen.ts**
    - Schemas: `Screen`
    - Domain: Screen room tracking

26. **tag-template-mapping.ts**
    - Schemas: `TagTemplateMapping`
    - Used by: Tag organization

## Migration Priority

When allocating future work:

1. **Phase 2** (Core domains):
   - Customer, Job, Quote (quoted data models)
   - Invoice, CreditMemo (billing records)
   - PriceMatrix (pricing engine)

2. **Phase 3** (Process domains):
   - ReviewPipeline, Artwork (approval workflow)
   - Screen, CustomerScreen (screen room tracking)
   - Note (job documentation)

3. **Phase 4** (Supporting):
   - Tag-related schemas
   - DTF-specific schemas
   - Address, Contact (contact info)
   - Preference schemas

## Implementation Pattern

When migrating an entity `Foo`:

1. Create Drizzle table in `src/db/schema/foo.ts` (configured in `drizzle.config.ts`)
2. Export table in `src/db/schema/index.ts`
3. Update `src/domain/entities/foo.ts` to derive the type from Drizzle:
   ```typescript
   import { foosTable } from '@/db/schema'
   export type Foo = typeof foosTable.$inferSelect
   export const fooSchema = /* validate type */
   ```
4. Run `npm run db:generate` to create migration files in `supabase/migrations/`
5. Run `npm run db:migrate` to apply the migration
6. Update tests and repositories to use the new schema
7. Update this TODO file to move `Foo` to "Already Migrated"
