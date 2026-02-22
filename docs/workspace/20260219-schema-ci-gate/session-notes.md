# Wave 1, Session C: Schema CI Gate

**Session ID**: 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
**Branch**: `session/0218-schema-ci-gate`
**PR**: #534
**Status**: ✅ MERGED to main
**Date**: 2026-02-19

## Overview

Implemented V3 slice of Wave 1 (Supabase Foundation epic #529): Added Drizzle schema migration drift checks to CI and documented entity migration backlog.

## What Was Built

### 1. CI Migration Drift Checks (`.github/workflows/ci.yml`)

Added two new steps after the Build step:

**Step A: Schema migration drift check (warn on main PRs and pushes)**

```yaml
- name: Schema migration drift check (warn on main PRs and pushes)
  if: |
    (github.event_name == 'pull_request' && github.base_ref == 'main') ||
    (github.event_name == 'push' && github.ref == 'refs/heads/main')
  continue-on-error: true
  run: npx drizzle-kit check
```

- Triggers on both PR merges TO main AND direct pushes to main
- `continue-on-error: true` allows warnings without blocking
- Uses `drizzle-kit check` which only analyzes schema files (no DB connection needed)

**Step B: Schema migration drift check (hard fail on production)**

```yaml
- name: Schema migration drift check (hard fail on production)
  if: github.ref == 'refs/heads/production'
  run: npx drizzle-kit check
```

- Triggers only on pushes to `production` branch
- No `continue-on-error` = hard fail (blocks merge)
- Ensures production schema stays in sync with migrations

### 2. Entity Migration Backlog (`src/domain/entities/TODO-drizzle.md`)

Comprehensive tracking document for all domain entity schemas that will migrate to drizzle-zod:

- **Already Migrated (1)**: GarmentCatalog (Session B, Wave 1)
- **Pending Migration (25+)**: All other domain entities (Address, Artwork, Customer, Job, Quote, Invoice, Price Matrix, etc.)
- **Priority Tiers**: Recommendations for migration sequencing
- **Implementation Pattern**: Clear guide for future migrations

Key content:

- Lists all 26 entity files in `src/domain/entities/`
- Maps entities to their usage domains
- Provides step-by-step migration pattern with correct paths
- Includes `drizzle-kit generate` in workflow

## Technical Decisions

### Path Alignment

- `drizzle.config.ts` defines schema path: `./src/db/schema/*`
- All references in CI, TODO, and implementation docs use `src/db/schema/`
- Prevents future path conflicts

### CI Condition Logic

- Initial condition only covered PRs to main
- Expanded to also cover push events (post-merge catches)
- Allows catching drift from any merge method (squash, rebase, merge commit)

### Wave 0 Foundation

- Drizzle-kit already a devDependency from Wave 0
- `drizzle.config.ts` already exists
- `supabase/migrations/` directory scaffolded with `.gitkeep`
- `src/db/schema/` will be created when first entity migrates

## Review Process

### Initial Review (PR Review Agent)

Found 2 important issues:

1. **Path mismatch**: TODO referenced non-existent `src/infrastructure/database/schema/` vs actual `src/db/schema/`
2. **Push-to-main gap**: CI condition only covered PRs, not merge commits

### Fixes Applied

1. ✅ Updated all TODO paths to match `drizzle.config.ts`
2. ✅ Expanded CI condition to `(pull_request to main) OR (push to main)`
3. ✅ Added `drizzle-kit generate` step to migration pattern
4. ✅ Verified no new issues introduced

### Final Verification

- ✅ All 1385 tests pass
- ✅ Build succeeds
- ✅ Types clean (`npx tsc --noEmit`)
- ✅ YAML syntax valid
- ✅ No CLAUDE.md violations
- ✅ Review agent confirms PASS

## Testing Results

```
Test Files:    60 passed
Tests:         1385 passed
Duration:      1.88s
Build:         ✅ SUCCESS
Type Check:    ✅ PASS
Format Check:  ✅ PASS
```

## Files Modified

| File                                  | Changes    | Purpose                 |
| ------------------------------------- | ---------- | ----------------------- |
| `.github/workflows/ci.yml`            | +9 lines   | Added drift check steps |
| `src/domain/entities/TODO-drizzle.md` | +155 lines | Migration backlog doc   |

**Git commits**:

1. `2dfa606` - feat(ci): add Drizzle schema migration drift checks — Wave 1, Session C
2. `44db0b3` - fix: align Drizzle schema paths and expand CI drift check to cover pushes to main

## Dependencies & Prerequisites

- ✅ `drizzle-kit` (already devDependency from Wave 0)
- ✅ `drizzle.config.ts` (already exists)
- ✅ Supabase project scaffolding (from Wave 0)
- ✓ GitHub Actions CI workflow (already exists)

## Acceptance Criteria

All met:

- ✅ `.github/workflows/ci.yml` is valid YAML
- ✅ `npx tsc --noEmit` passes (no type errors)
- ✅ `npm test` passes (all 1385 tests)
- ✅ `npm run build` succeeds
- ✅ TODO-drizzle.md exists and lists all entity files
- ✅ CI workflow logic correct (warn on main PRs/pushes, hard fail on production)
- ✅ All paths align with `drizzle.config.ts`
- ✅ No CLAUDE.md violations

## Observations for Future Sessions

### Phase 1 Limitations

- `drizzle-kit check` currently has no real teeth (no schema files exist yet)
- Step passes trivially until first Drizzle schema is committed
- This is expected and acceptable for scaffolding phase

### Next Steps (Wave 1, Future Sessions)

1. **Session D+**: Create `src/db/schema/foo.ts` for first domain entity
2. Run `npx drizzle-kit generate` to create actual migration files
3. CI drift check will then validate schema/migration consistency
4. Move completed entities from "Pending" to "Already Migrated" in TODO-drizzle.md

### Path/Naming Convention Established

- Schema files: `src/db/schema/{entity}.ts`
- Migrations: `supabase/migrations/{timestamp}_{description}.sql`
- Type derivation: `type Foo = typeof foosTable.$inferSelect`
- Import paths: `from '@/db/schema'`

## Related Documentation

- **CLAUDE.md**: Coding standards, Tech Stack, Architecture
- **drizzle.config.ts**: Schema and migration paths
- **drizzle-kit docs**: https://orm.drizzle.team/kit-docs/overview
- **Phase 0 PR #529**: Supabase + Drizzle foundation setup

## Merge Details

- **PR #534**: feat(ci): add Drizzle schema migration drift checks
- **Merged at**: 2026-02-19T03:24:52Z
- **Merged by**: Christopher Bays (cmbays)
- **Merge method**: Squash
- **Base branch**: main

---

**For wrap-up consolidation**: This session established the CI foundation for schema consistency. All entity migration tracking and implementation patterns are documented. Next sessions will execute the actual migrations and the CI gates will validate them.
