---
title: 'Schema-Driven Design Strategy'
subtitle: 'Principles, patterns, and application guide for self-describing configuration across Mokumo'
date: 2026-02-16
phase: 1
pipelineName: schema-config-design
pipelineType: horizontal
products: []
tools: [work-orchestrator, knowledge-base]
stage: wrap-up
tags: [decision, research, learning]
branch: 'session/0216-e325-i331-strategy-doc'
status: complete
---

## 1. Overview

### What Is Schema-Driven Design?

Schema-driven design is the practice of making data structures **self-describing**. Instead of raw values consumed by hardcoded parsers, every config file declares its own types, constraints, descriptions, and relationships as metadata. Consumers read the schema at runtime to generate behavior — CLI flags, validation rules, help text, UI components — rather than hard-coding them.

**Before** — hardcoded consumers:

```json
[{ "slug": "vertical", "label": "Vertical", "stages": ["research", "build", "review"] }]
```

The shell script has a `case` branch for each field. Adding a field means editing the script.

**After** — self-describing schema:

```json
{
  "type": {
    "jsonType": "string",
    "description": "Pipeline type — determines which stages are available",
    "updatable": true,
    "flag": "--type",
    "validate": { "source": "config/pipeline-types.json", "match": "slug" }
  }
}
```

The shell script reads the schema at runtime. Adding a field means adding a JSON entry — zero code changes.

### Industry Precedents

This is a well-established pattern in infrastructure and API tooling:

| Framework              | Schema Pattern                                                                                     | What It Enables                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Terraform**          | Provider schemas declare every resource attribute's type, description, required/optional, computed | Auto-generated docs, CLI validation, plan diffing               |
| **Kubernetes CRDs**    | OpenAPI v3 schema per custom resource                                                              | kubectl validation, auto-generated API docs, admission webhooks |
| **JSON Schema** (RFC)  | Formal spec for describing JSON data structures                                                    | Cross-language validation, auto-generated forms, IDE completion |
| **OpenAPI/Swagger**    | Schema-first API definitions                                                                       | Client codegen, request validation, interactive docs            |
| **AWS CloudFormation** | Resource type schemas with property constraints                                                    | Linting, drift detection, IDE support                           |

### Why It Matters

1. **Single source of truth** — change the schema, all consumers update automatically
2. **Build-time validation** — Zod schemas catch typos and structural errors in CI before merge
3. **Self-documenting** — descriptions embedded in configs flow into CLI help text, developer guides, and KB session docs
4. **Extensibility without code changes** — adding a new pipeline field means adding a JSON entry, not editing shell scripts
5. **Cross-platform consistency** — shell scripts, TypeScript, and Astro all consume the same definitions

---

## 2. Principles

### Data Describes Itself

Every config entry carries metadata about what it is and how it should be used. At minimum: `slug`, `label`, `description`. Extended metadata depends on the pattern (see Section 5).

```json
{
  "slug": "quotes",
  "label": "Quotes",
  "description": "Quote creation and pricing calculator for customer orders",
  "route": "/quotes",
  "icon": "Calculator"
}
```

The `description` field isn't decoration — it flows into Zod error messages, CLI `--help` output, and KB indexes.

### Single Source of Truth

One config file, many consumers. The canonical list of products lives in `config/products.json`. Everything else derives from it:

- **TypeScript** — `lib/config/index.ts` parses and re-exports typed arrays and slug tuples
- **Astro KB** — `content.config.ts` imports JSON directly and builds `z.enum()` tuples for frontmatter validation
- **Shell CLI** — `scripts/lib/pipeline-entity.sh` reads JSON with `jq` for slug validation
- **GitHub labels** — generated from config slugs (22 labels created from 7 config files)

If a new product is added to `products.json`, all four consumers pick it up automatically.

### Validate at Boundaries

Validation happens at two boundaries:

1. **Build time (CI)** — Zod schemas in `config/schemas/` validate every JSON file. A malformed config fails `npm test` before merge.
2. **CLI invocation** — Shell scripts read validation rules from the schema and reject invalid input with clear error messages.

Internal code trusts validated data. No defensive checks deep in the call stack.

### Generate, Don't Duplicate

When multiple artifacts need the same data, generate them from the schema instead of maintaining copies:

- **CLI help text** — `work define --help` and `work update --help` read `pipeline-fields.json` at runtime and print flag/description pairs. No hardcoded help strings.
- **Slug validation** — `_pipeline_validate_csv_slugs()` reads the `validate.source` path from the field schema and checks user input against that config file. The validation target is data, not code.
- **Zod enum tuples** — `lib/config/index.ts` exports `productSlugs`, `toolSlugs`, etc. as `[string, ...string[]]` tuples derived from parsed config arrays. App-level Zod schemas consume these tuples instead of maintaining separate string arrays.

---

## 3. Application to Mokumo

### Where We Use It Today

| Config File                   | Zod Schema                   | Consumers                                                          |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `config/domains.json`         | `domainsConfigSchema`        | Config gateway, KB content.config.ts, GitHub labels                |
| `config/products.json`        | `productsConfigSchema`       | Config gateway, KB, GitHub labels, sidebar navigation              |
| `config/tools.json`           | `toolsConfigSchema`          | Config gateway, KB, GitHub labels                                  |
| `config/stages.json`          | `stagesConfigSchema`         | Config gateway, KB pipeline stepper, pipeline-gates cross-ref      |
| `config/tags.json`            | `tagsConfigSchema`           | Config gateway, KB filtering, GitHub labels                        |
| `config/pipeline-types.json`  | `pipelineTypesConfigSchema`  | Config gateway, KB, shell scripts, GitHub labels                   |
| `config/pipeline-gates.json`  | `pipelineGatesConfigSchema`  | Shell scripts (stage transitions)                                  |
| `config/pipeline-fields.json` | `pipelineFieldsConfigSchema` | Shell scripts (`work define`, `work update`, help text generation) |

All 8 config files have:

- A Zod schema in `config/schemas/`
- Build-time validation via `npm test`
- A `description` field on every entry (enforced by `configEntryBase`)

### Where We Recently Adopted It

**Config-driven CLI commands** (PRs #348, #384):

`work define` and `work update` read `pipeline-fields.json` at runtime to determine which CLI flags are valid, how to validate values, and what help text to display. The JSON schema declares:

- `flag` / `negateFlag` — CLI flag strings (`--type`, `--auto` / `--no-auto`)
- `jsonType` — determines parsing behavior (boolean flags consume no value arg)
- `validate` — cross-file reference validation (`{ "source": "config/products.json", "match": "slug" }`)
- `inputFormat` — input parsing (`"csv"` for comma-separated arrays)
- `updatable` — controls which fields appear as CLI flags vs. lifecycle-managed

Adding a new updatable field to the pipeline means adding one JSON entry. Both `define` and `update` pick it up with zero code changes.

### Where It Applies Next

| Candidate                              | Current State                                                                                    | Schema-Driven Benefit                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Pipeline state machine** (#330)      | States and transitions hardcoded in `_PIPELINE_STATES` array and `_pipeline_valid_transitions()` | Extract to `config/pipeline-states.json` with `from`/`to`/`trigger` entries. Shell reads transitions at runtime. |
| **GitHub issue templates** (#329)      | Product/tool dropdowns duplicated across 4 YAML files                                            | Generate dropdown options from `config/products.json` and `config/tools.json` at CI time                         |
| **Config-driven `work status`** (#326) | Display format hardcoded in shell                                                                | Read field metadata (description, jsonType) to auto-format status output                                         |
| **Navigation items**                   | Hardcoded in `lib/constants/navigation.ts`                                                       | Already partially derived — products have `route` and `icon` fields                                              |

---

## 4. Decision Criteria

When evaluating whether data should use schema-driven design, apply these criteria:

| #   | Criterion              | Question                                     | Threshold                                  |
| --- | ---------------------- | -------------------------------------------- | ------------------------------------------ |
| 1   | **Multiple consumers** | Does 2+ files/systems read this data?        | If yes, must be schema-driven              |
| 2   | **User-facing**        | Do values appear in UI, CLI, or docs?        | Descriptions flow to users — schema-driven |
| 3   | **Needs validation**   | Can invalid values cause runtime errors?     | Catch at build time — schema-driven        |
| 4   | **Extensible**         | Will the list grow over time?                | No code changes needed — schema-driven     |
| 5   | **Cross-platform**     | Is it consumed by both shell and TypeScript? | Single source — schema-driven              |

**Rule**: If a data set meets **2 or more** criteria, it should be schema-driven.

### Worked Examples

**Products list** — meets all 5: consumed by TypeScript, Astro, shell, and GitHub labels (1); displayed in sidebar and CLI (2); invalid slugs break pipelines (3); new products will be added (4); shell validates slugs against it (5). Verdict: schema-driven.

**Pipeline fields** — meets 4: consumed by define, update, and help (1); flags shown in `--help` (2); invalid flags rejected (3); new fields expected (4). Verdict: schema-driven.

**Design tokens** (CSS variables in `globals.css`) — meets 1: only consumed by Tailwind/CSS (not multi-consumer), not user-facing as data, not cross-platform. Verdict: **not** schema-driven — CSS custom properties are the correct abstraction here.

---

## 5. Patterns Catalog

### Pattern A: Enum Config

**Used by**: `products.json`, `tools.json`, `tags.json`, `domains.json`, `stages.json`

Structure: array of entries extending `configEntryBase` (`slug` + `label` + `description`) with optional domain-specific fields.

```json
[
  {
    "slug": "quotes",
    "label": "Quotes",
    "description": "...",
    "route": "/quotes",
    "icon": "Calculator"
  },
  {
    "slug": "garments",
    "label": "Garments",
    "description": "...",
    "route": "/garments",
    "icon": "Shirt"
  }
]
```

Zod schema pattern:

```typescript
const productEntry = configEntryBase.extend({
  route: z.string().regex(/^\/[a-z0-9\-\/]*$/),
  icon: z.string().regex(/^[A-Z][a-zA-Z0-9]+$/),
})
export const productsConfigSchema = z.array(productEntry).nonempty()
```

Gateway exports: validated array, slug tuple (`as [string, ...string[]]`), label lookup function.

### Pattern B: Field Schema

**Used by**: `pipeline-fields.json`

Structure: `z.record()` keyed by field name. Each entry declares type, constraints, and behavior metadata.

```json
{
  "type": {
    "jsonType": "string",
    "description": "Pipeline type",
    "updatable": true,
    "required": true,
    "default": "vertical",
    "flag": "--type",
    "validate": { "source": "config/pipeline-types.json", "match": "slug" }
  }
}
```

Zod schema pattern:

```typescript
const pipelineFieldEntry = z
  .object({
    jsonType: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    description: z.string().min(1),
    updatable: z.boolean(),
    required: z.boolean(),
    // ... optional: default, flag, negateFlag, inputFormat, validate
  })
  .refine((f) => !f.updatable || f.flag !== undefined, {
    message: 'Updatable fields must have a flag',
  })
  .refine((f) => f.jsonType !== 'boolean' || !f.flag || f.negateFlag !== undefined, {
    message: 'Boolean fields with flag must have negateFlag',
  })

export const pipelineFieldsConfigSchema = z.record(z.string(), pipelineFieldEntry)
```

Key design: `.refine()` enforces cross-field invariants — constraints that span multiple properties.

### Pattern C: Gate/Transition Config

**Used by**: `pipeline-gates.json`

Structure: `z.object()` with named sections. Stage keys reference entries from another config file.

```json
{
  "stages": {
    "build": {
      "description": "Implementation complete, ready for review",
      "artifacts": ["session-doc.md"],
      "gate": "artifact-exists",
      "next": "review"
    }
  },
  "auto-overrides": { "build": "review" }
}
```

Zod schema pattern:

```typescript
const validStageSlugs = rawStages.map((s) => s.slug) as [string, ...string[]]

const gateStageEntry = z.object({
  description: z.string().min(1),
  artifacts: z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]*\.[a-z0-9]+$/)),
  gate: z.enum(['artifact-exists', 'human-confirms', 'human-approves-manifest']),
  next: z.enum(validStageSlugs).nullable(),
})
```

Key design: imports raw JSON from another config file to build enum constraints at schema definition time. Cross-file references are validated statically.

### Pattern D: Reference Validation (Config Gateway)

**Used by**: `lib/config/index.ts`

Structure: central module that parses all configs through their Zod schemas, exports typed data, slug tuples, and label lookup functions.

```typescript
export const products = parseConfig(productsConfigSchema, rawProducts, 'config/products.json')
export const productSlugs = products.map((p) => p.slug) as [string, ...string[]]
export function productLabel(slug: string): string {
  return lookupLabel(productLabelMap, slug, 'product')
}
```

Downstream consumers import from `@/lib/config` — never from raw JSON directly (except Astro, which runs its own Zod validation at build time).

---

## 6. Implementation Guide

### How to Add a New Config-Driven Field

Example: adding a `priority` field to pipeline entities.

**Step 1** — Add to `config/pipeline-fields.json`:

```json
"priority": {
  "jsonType": "number",
  "description": "Pipeline priority (1=urgent, 2=high, 3=normal, 4=low)",
  "updatable": true,
  "required": false,
  "default": 3,
  "flag": "--priority"
}
```

**Step 2** — Done. Both `work define` and `work update` automatically:

- Accept `--priority <n>` as a flag
- Display it in `--help` output
- Validate the value as a number
- Write it to the pipeline entity JSON

No shell script changes. No TypeScript changes. No test changes (structural invariant tests auto-detect new fields).

### How to Create a Zod Schema for a New Config File

**Step 1** — Create the JSON file in `config/`:

```json
[{ "slug": "example", "label": "Example", "description": "An example entry" }]
```

**Step 2** — Create `config/schemas/example.ts`:

```typescript
import { z } from 'zod'
import { configEntryBase } from './base'

const exampleEntry = configEntryBase.extend({
  // Add domain-specific fields here
})

export const exampleConfigSchema = z.array(exampleEntry).nonempty()
export type ExampleEntry = z.infer<typeof exampleEntry>
```

**Step 3** — Export from `config/schemas/index.ts`:

```typescript
export { exampleConfigSchema, type ExampleEntry } from './example'
```

**Step 4** — Add gateway entry in `lib/config/index.ts`:

```typescript
import rawExample from '../../config/example.json'
export const example = parseConfig(exampleConfigSchema, rawExample, 'config/example.json')
export const exampleSlugs = example.map((e) => e.slug) as [string, ...string[]]
```

**Step 5** — Add tests. In `config/schemas/__tests__/config-validation.test.ts`:

```typescript
it('example.json', () => {
  expect(() => exampleConfigSchema.parse(rawExample)).not.toThrow()
})
```

In `lib/config/__tests__/config.test.ts`:

```typescript
it('no duplicate slugs in example', () => {
  assertNoDuplicateSlugs(example, 'example')
})
```

### How to Consume Configs in Shell vs TypeScript

**Shell** (via `jq`):

```bash
# Read config path
config="$(git rev-parse --show-toplevel)/config/products.json"

# Get all slugs
jq -r '.[].slug' "$config"

# Validate a slug exists
echo "$slug" | jq -r '.[].slug' "$config" | grep -Fqx "$slug"
```

**TypeScript** (via gateway):

```typescript
import { products, productSlugs, productLabel } from '@/lib/config'

// Typed array
products.forEach((p) => console.log(p.slug, p.route))

// Zod enum tuple for schema validation
const schema = z.object({ product: z.enum(productSlugs) })

// Label lookup with fallback
const label = productLabel('quotes') // "Quotes"
```

**Astro KB** (direct JSON import + Zod):

```typescript
import productsConfig from '../../config/products.json'
const products = productsConfig.map((p) => p.slug) as [string, ...string[]]
// Use in collection schema:
product: z.enum(products)
```

---

## Summary

Schema-driven design is now an adopted practice for Mokumo. The pattern is proven across 8 config files, 8 Zod schemas, 925+ tests, and 2 config-driven CLI commands. The decision criteria (Section 4) and patterns catalog (Section 5) provide the framework for applying it to new data structures as the project grows.

### Key Artifacts

| Artifact             | Location                                             |
| -------------------- | ---------------------------------------------------- |
| Config files         | `config/*.json` (8 files)                            |
| Zod schemas          | `config/schemas/*.ts` (8 schemas + base)             |
| Config gateway       | `lib/config/index.ts`                                |
| Schema tests         | `config/schemas/__tests__/config-validation.test.ts` |
| Gateway tests        | `lib/config/__tests__/config.test.ts`                |
| Shell helpers        | `scripts/lib/pipeline-entity.sh`                     |
| Config-driven define | `scripts/lib/pipeline-define.sh`                     |
| Config-driven update | `scripts/lib/pipeline-update.sh`                     |

### Related Issues

- #325 — Schema-Driven Configuration Design (parent epic)
- #327 — Config-driven `work define`
- #328 — Zod validation schemas for all configs
- #343 — Standard config schema contract
- #344, #345 — Enrich configs with descriptions and metadata
- #383 — Lower-priority hardening items
