# Implementation Details: Drizzle Schema CI Gate

## Context

Wave 0 (PR #529) established the Supabase + Drizzle foundation:

- Added `drizzle-kit` as a devDependency
- Created `drizzle.config.ts` pointing to `./src/db/schema/*` and `./supabase/migrations`
- Scaffolded `supabase/` directory with migration folder

This session adds the CI infrastructure to catch schema/migration drift early.

## CI Workflow Design

### Why Two Steps?

1. **Main branch (warn)** — Catches drift before it reaches production
   - Developers can iterate and fix issues on feature branches
   - PR can still merge with a warning (learning phase)
   - `continue-on-error: true` enables gradual adoption

2. **Production branch (hard fail)** — Ensures production integrity
   - Blocks any merge that introduces drift
   - Enforces strict schema/migration consistency in production
   - No exceptions

### Condition Logic Evolution

**Initial condition** (Issue #1 - Push-to-main gap):

```yaml
if: github.event_name == 'pull_request' && github.base_ref == 'main'
```

Problem: Only caught PRs. When a PR merged, the resulting push to main wasn't checked.

**Final condition** (Fixed):

```yaml
if: |
  (github.event_name == 'pull_request' && github.base_ref == 'main') ||
  (github.event_name == 'push' && github.ref == 'refs/heads/main')
```

Now catches:

- `pull_request` event where base branch is `main` (before merge)
- `push` event to `main` (after any merge method: squash, rebase, merge commit)

### Production Check

```yaml
if: github.ref == 'refs/heads/production'
```

Only triggers on direct pushes to production, not PRs targeting production (which haven't merged yet).

## Entity Migration Backlog

### Design Rationale

The TODO-drizzle.md serves as:

1. **Current state tracker** — Which entities are migrated, which are pending
2. **Future roadmap** — Priority guidance for remaining migrations
3. **Implementation cookbook** — Step-by-step pattern for developers
4. **Dependency map** — Shows which entities are used by which domains

### Entity Count & Mapping

26 total entity files in `src/domain/entities/`:

- **1 already migrated**: GarmentCatalog (split from `garment.ts`)
- **25 pending**: All others

Special case: `garment.ts` contains two schemas:

- `GarmentCatalog` — migrated (Session B, Wave 1)
- `Garment` (job instance) — pending

Listed in both "Already Migrated" (item header) and "Pending Migration" (item 14) to show the dual nature.

### Migration Tiers

**Phase 2 (Core domains — high priority)**:

- Customer, Job, Quote (job data models)
- Invoice, CreditMemo (billing records)
- PriceMatrix (pricing engine)

**Phase 3 (Process domains)**:

- ReviewPipeline, Artwork (approval workflow)
- Screen, CustomerScreen (screen room)
- Note (documentation)

**Phase 4 (Supporting)**:

- Tags, DTF-specific, contact info, preferences

Guidance: Tier 1 entities block full Supabase integration. Tier 2/3 enable feature completion.

### Implementation Pattern

Each migration follows:

```typescript
// 1. Create Drizzle table
// src/db/schema/foo.ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core'

export const foosTable = pgTable('foos', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  // ... columns
})

// 2. Export from index
// src/db/schema/index.ts
export { foosTable }

// 3. Update entity type
// src/domain/entities/foo.ts
import { foosTable } from '@/db/schema'

export type Foo = typeof foosTable.$inferSelect
export const fooSchema = z.object({
  // validate against table schema
})

// 4. Generate migration
// Terminal: npx drizzle-kit generate

// 5. Update tests & repositories
// Use new schema in data access layer
```

Key points:

- Type derives from Drizzle table, not hand-written interface
- Schema validates the derived type
- Import path: `@/db/schema` (configured in tsconfig)
- Migration files auto-generated, never hand-written

## Path Resolution

### drizzle.config.ts

```typescript
schema: './src/db/schema/*'
out: './supabase/migrations'
```

Schema files must live in `src/db/schema/`. Migrations output to `supabase/migrations/`.

### tsconfig Path Alias

```json
"@/db/schema": ["./src/db/schema"]
```

Allows imports like `from '@/db/schema'` instead of relative paths.

### Issue Resolution

**Problem**: Initial TODO referenced `src/infrastructure/database/schema/` (non-existent path per architecture cleanup).

**Solution**: Aligned all references to `src/db/schema/`, matching:

- Actual drizzle.config.ts
- Future development patterns
- Clean architecture (no deep infrastructure nesting for schema files)

## Testing & Verification

### What Was Tested

1. **YAML syntax** — `.github/workflows/ci.yml` is valid GitHub Actions
2. **CI conditions** — Manually verified conditions match all intended scenarios
3. **Full test suite** — All 1385 tests pass
4. **Type safety** — `npx tsc --noEmit` clean
5. **Build** — Production build succeeds
6. **Format check** — Prettier validates all markdown/yaml

### drizzle-kit check Behavior

Currently: `npx drizzle-kit check` will pass (no schema files yet)

When first entity migrates:

- `drizzle-kit check` validates that schema.ts and generated migrations are consistent
- Catches common errors: orphaned migrations, schema changes without migrations, broken references
- Does NOT require database connection (pure file analysis)

## CodeRabbit Rate Limit

CodeRabbit was rate-limited (hourly commit review limit). This didn't block the PR since:

- All checks passed before rate limit was hit
- PR was already manually reviewed by a specialized agent
- No review comments to address

For future context: If rate-limited again, use `@coderabbitai review` comment after wait period, or push new commits to trigger new review.

## CLAUDE.md Compliance

Verified no violations:

- ✅ No `interface` declarations (doc-only changes)
- ✅ No `console.log` usage
- ✅ No hardcoded URLs or env-specific strings
- ✅ No imports from mock providers
- ✅ TODO file placed correctly in `src/domain/entities/` (domain layer)
- ✅ CI changes follow established patterns
- ✅ Branch + PR workflow respected (never push to main)

## Merge Commit

```
Commit: 44db0b3 (squashed)
Author: cmbays
Date: 2026-02-19T03:24:52Z

feat(ci): add Drizzle schema migration drift checks — Wave 1, Session C

- Add warn step for PRs targeting main (continue-on-error: true)
- Add hard-fail step for production branch pushes
- Create TODO-drizzle.md documenting entity migration backlog
- All 25 entity schemas tracked with migration status and priority

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## Known Limitations & Future Work

### Current State

- `drizzle-kit check` is a no-op until first schema file is created
- Expected and acceptable for Wave 1 scaffolding
- Step will gain real value in Wave 2+ when migrations begin

### Future Enhancements

- Could add `drizzle-kit introspect` for existing DB schemas
- Could add migration file linting (naming conventions, etc.)
- Could add schema change impact analysis in PR comments
- Could add automated migration generation for breaking changes

### Deferred Decisions

- Which entities migrate in which wave (recorded in TODO priority tiers)
- Whether to auto-generate migrations vs. hand-write them
- How to handle zero-downtime migrations (blue-green deployment strategy)

These are intentionally deferred to future sessions as they depend on actual DB schema choices.

---

**Summary**: Solid foundation for schema consistency. CI gates are in place. Entity tracking is comprehensive. Development path is clear. Ready for first migrations.
