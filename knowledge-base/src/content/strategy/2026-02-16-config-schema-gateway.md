---
title: 'Config Schema Gateway — Validated Config Architecture'
subtitle: 'Strategy for schema-driven config validation, typed exports, and the lib/config gateway pattern'
date: 2026-02-16
docType: planning
phase: 2
pipelinesCompleted: []
pipelinesLaunched: []
tags: [decision, plan]
sessionId: '22f17289-2a33-40f1-94b0-f6039c0eb1b7'
branch: 'session/0216-ddd-domains-labels'
status: complete
---

## Context

Mokumo has 7 config JSON files in `config/` that define the system's taxonomy — domains, products, tools, stages, tags, pipeline types, and pipeline gates. These files are consumed by the Knowledge Base (Astro) and will be consumed by the Next.js app, automation plugins, and CI tooling as the project matures.

Today, consumers import raw JSON and derive typed data inline. There is no schema validation on the config files themselves. A malformed config file would produce confusing errors far downstream rather than failing at the source.

This document defines the **Config Schema Gateway** pattern: a dedicated module that validates config files against Zod schemas and re-exports typed data as the single public API for all consumers.

## The Problem

Raw config files are the most common source of "action at a distance" bugs. Consider what happens today if someone puts `{ "slug": 123 }` in `domains.json`:

1. The JSON is syntactically valid — no parse error
2. The KB `content.config.ts` does `.map(d => d.slug)` — gets `[123]` instead of `["garments"]`
3. The Zod enum derivation produces `z.enum([123])` — type error or silent coercion
4. A content file with `domain: "garments"` fails validation with a confusing message about enum membership

The root cause (bad JSON) is 3 layers removed from the symptom. A validated gateway catches it immediately.

## The Pattern: Four Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Raw Data                              │
│  config/*.json — human-editable, CI-editable    │
│  The ONLY place data is authored.               │
└──────────────────────┬──────────────────────────┘
                       │ imported by
┌──────────────────────▼──────────────────────────┐
│  Layer 2: Schemas                               │
│  Zod schemas defining the valid shape of each   │
│  config file. Composable from a shared base.    │
└──────────────────────┬──────────────────────────┘
                       │ used by
┌──────────────────────▼──────────────────────────┐
│  Layer 3: Loader / Gateway                      │
│  Imports raw JSON, validates against schemas,   │
│  re-exports typed arrays + utility helpers.     │
│  This is the PUBLIC API. No one goes around it. │
└──────────────────────┬──────────────────────────┘
                       │ consumed by
┌──────────────────────▼──────────────────────────┐
│  Layer 4: Consumers                             │
│  KB content schemas, UI components, automation, │
│  plugins, label lookups — all import from L3.   │
└─────────────────────────────────────────────────┘
```

### Three Rules

1. **Single authorship**: Config data is authored ONLY in Layer 1 (JSON files). No hardcoded duplicates anywhere.
2. **Single gateway**: All consumers import from Layer 3. Never from raw JSON directly. The gateway is the choke point — if data passes through it, it's valid.
3. **Fail early**: Schema validation runs at import time (app startup) and in CI tests. A bad config file is caught before it can cause downstream harm.

### Why Four Layers, Not Two?

Validation and access are separate concerns. The schema says "what is valid." The loader says "here's the validated data, and here are convenience functions for working with it." Consumers don't need to know about validation — they just get typed data. This separation means you can change how validation works (stricter rules, cross-file consistency checks) without touching consumer code.

## Schema Composition

Most config files share a common shape: `{ slug, label }`. Rather than defining this independently for each file, schemas compose from a base:

```typescript
const configEntryBase = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
})
```

Extensions compose from base:

| Config File           | Extension    | Extra Fields                              |
| --------------------- | ------------ | ----------------------------------------- |
| `domains.json`        | none         | —                                         |
| `tools.json`          | none         | —                                         |
| `products.json`       | `.extend()`  | `route: string`                           |
| `stages.json`         | `.extend()`  | `core?: boolean`, `pipeline?: boolean`    |
| `tags.json`           | `.extend()`  | `color: string`                           |
| `pipeline-types.json` | `.extend()`  | `description: string`, `stages: string[]` |
| `pipeline-gates.json` | unique shape | Object with `stages` and `auto-overrides` |

The slug format constraint (kebab-case, starts with lowercase letter) is defined once and enforced everywhere. Adding a new simple config file is one line of schema code.

Every array config uses a non-empty wrapper — `z.array(entry).nonempty()` — which catches empty config files that would cause silent no-ops in consumers.

## Loader Exports

The loader provides three forms of each config for different consumer needs:

| Export Form      | Example                              | Consumer                                        |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| **Typed array**  | `domains: Domain[]`                  | UI components rendering `<select>` options      |
| **Slug tuple**   | `domainSlugs: [string, ...string[]]` | KB content schemas (`z.enum(domainSlugs)`)      |
| **Label lookup** | `domainLabel(slug): string`          | Display helpers rendering slugs as human labels |

One canonical derivation, many consumers. No consumer re-derives these.

## Testing Strategy

### A. Schema Validation Tests

Each JSON file is validated against its schema. Tests also check structural invariants:

- No duplicate slugs within a file
- Slugs match kebab-case format
- Non-empty arrays
- Required fields present

### B. Cross-File Consistency Tests

References between config files must resolve:

- Every stage slug in `pipeline-types.json` must exist in `stages.json`
- Every stage key in `pipeline-gates.json` must exist in `stages.json`
- `pipeline-gates.json` `next` values must reference valid stage slugs (or `null`)

These catch broken references that no single-file schema can detect.

## Applied to Mokumo

### Module Structure

```
lib/config/
  schemas.ts          ← Zod schemas for all 7 config files
  index.ts            ← Loader: validates, re-exports typed data + utilities
  __tests__/
    config.test.ts    ← Schema validation + cross-file consistency tests
```

### All Config Files Covered

| Config File           | Schema                      | Typed Export    | Slug Tuple          | Label Lookup          |
| --------------------- | --------------------------- | --------------- | ------------------- | --------------------- |
| `domains.json`        | `domainsConfigSchema`       | `domains`       | `domainSlugs`       | `domainLabel()`       |
| `products.json`       | `productsConfigSchema`      | `products`      | `productSlugs`      | `productLabel()`      |
| `tools.json`          | `toolsConfigSchema`         | `tools`         | `toolSlugs`         | `toolLabel()`         |
| `stages.json`         | `stagesConfigSchema`        | `stages`        | `stageSlugs`        | `stageLabel()`        |
| `tags.json`           | `tagsConfigSchema`          | `tags`          | `tagSlugs`          | `tagLabel()`          |
| `pipeline-types.json` | `pipelineTypesConfigSchema` | `pipelineTypes` | `pipelineTypeSlugs` | `pipelineTypeLabel()` |
| `pipeline-gates.json` | `pipelineGatesConfigSchema` | `pipelineGates` | —                   | —                     |

### KB Consumer Integration

The KB (Astro) has its own build system and cannot use `@/lib/config` path aliases. For this phase:

- **KB keeps importing raw JSON** (existing pattern works)
- **Domains wired into KB** following the existing pattern in `content.config.ts` and `lib/utils.ts`
- **Future migration**: When the KB build can resolve the gateway, switch from raw JSON to typed imports

### Relationship to Domain Schemas

Config schemas and domain schemas serve different masters but form a validation pipeline:

1. **Config schemas** validate the system vocabulary (what categories, stages, domains exist)
2. **Config loaders** export typed data (validated arrays, enum tuples, label maps)
3. **Domain schemas** consume that vocabulary (a Job's stage field must be from the stages config)
4. **Domain data** is validated against domain schemas (a specific job instance is checked)

Each layer trusts the layer below it. Domain schemas don't re-validate that "build" is a valid stage — the config layer already guaranteed that.

### What Changes Now vs. Later

**Now (this PR):**

- `lib/config/schemas.ts` — Zod schemas for all 7 config files
- `lib/config/index.ts` — validated typed exports + utility functions
- `lib/config/__tests__/config.test.ts` — schema validation + cross-file consistency
- Wire `domains.json` into KB `content.config.ts` + `lib/utils.ts`
- All tests pass via `npm test`

**Later (separate PRs):**

- Migrate KB consumers from raw JSON imports to config gateway
- Migrate app-side consumers to import from `@/lib/config`
- Add config-driven automation (label sync, plugin registration)

## Decisions Made

1. **Config gateway lives in `lib/config/`** — infrastructure concern, separate from domain schemas in `lib/schemas/`
2. **Schemas compose from a shared base** — `configEntryBase` with slug + label, extended per file
3. **KB keeps raw JSON imports for now** — Astro build system boundary, pragmatic deferral
4. **Cross-file consistency tests included** — catches broken references between config files
5. **Non-empty array enforcement** — empty config files are treated as errors, not silent no-ops
