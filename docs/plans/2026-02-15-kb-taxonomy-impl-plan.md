# KB Taxonomy Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the knowledge base from a single flat `sessions` collection into four collections (pipelines, products, tools, strategy) with DRY config-driven schemas and updated Astro pages.

**Architecture:** Four Astro content collections, each with its own Zod schema that derives enums from `config/*.json` files. Pipeline docs replace sessions (renamed + new frontmatter fields). Products and tools get subdirectory-based organization with overview/history/decisions docs. Strategy holds cooldowns. All cross-referencing via frontmatter arrays + Astro collection queries at build time.

**Tech Stack:** Astro 5, Zod schemas, JSON config files, Astro content collections, static site generation

**Design Doc:** `docs/plans/2026-02-15-kb-taxonomy-design.md`

---

## Wave 0: Config Foundation (no dependencies)

### Task 1: Create `config/products.json`

**Files:**

- Create: `config/products.json`

**Step 1: Create the config file**

```json
[
  { "slug": "dashboard", "label": "Dashboard", "route": "/dashboard" },
  { "slug": "quotes", "label": "Quotes", "route": "/quotes" },
  { "slug": "customers", "label": "Customers", "route": "/customers" },
  { "slug": "invoices", "label": "Invoices", "route": "/invoices" },
  { "slug": "jobs", "label": "Jobs", "route": "/jobs" },
  { "slug": "garments", "label": "Garments", "route": "/garments" },
  { "slug": "screens", "label": "Screens", "route": "/screens" },
  { "slug": "pricing", "label": "Pricing", "route": "/settings/pricing" }
]
```

**Step 2: Commit**

```bash
git add config/products.json
git commit -m "feat(config): add canonical products.json"
git push -u origin <branch>
```

---

### Task 2: Create `config/tools.json`

**Files:**

- Create: `config/tools.json`

**Step 1: Create the config file**

```json
[
  { "slug": "work-orchestrator", "label": "Work Orchestrator" },
  { "slug": "skills-framework", "label": "Skills Framework" },
  { "slug": "agent-system", "label": "Agent System" },
  { "slug": "knowledge-base", "label": "Knowledge Base" },
  { "slug": "ci-pipeline", "label": "CI Pipeline" }
]
```

**Step 2: Commit**

```bash
git add config/tools.json
git commit -m "feat(config): add canonical tools.json"
git push
```

---

### Task 3: Create `config/workflows.json`

**Files:**

- Create: `config/workflows.json`

**Step 1: Create the config file**

```json
[
  {
    "slug": "vertical",
    "label": "Vertical",
    "stages": ["research", "interview", "shape", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "polish",
    "label": "Polish",
    "stages": ["interview", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "horizontal",
    "label": "Horizontal",
    "stages": ["research", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "bug-fix",
    "label": "Bug Fix",
    "stages": ["build", "review", "wrap-up"]
  }
]
```

**Step 2: Commit**

```bash
git add config/workflows.json
git commit -m "feat(config): add canonical workflows.json with pipeline types"
git push
```

---

### Task 4: Update `config/stages.json`

**Files:**

- Modify: `config/stages.json`

**Step 1: Add new stages and update existing ones**

Add `shape` (after interview), `wrap-up` (replaces learnings concept). Keep existing slugs valid for backward compatibility during migration. The updated file:

```json
[
  { "slug": "research", "label": "Research" },
  { "slug": "interview", "label": "Interview" },
  { "slug": "shape", "label": "Shape" },
  { "slug": "breadboarding", "label": "Breadboarding", "workAlias": "breadboard" },
  { "slug": "implementation-planning", "label": "Implementation Planning", "workAlias": "plan" },
  { "slug": "build", "label": "Build" },
  { "slug": "polish", "label": "Polish" },
  { "slug": "review", "label": "Review" },
  { "slug": "learnings", "label": "Learnings" },
  { "slug": "wrap-up", "label": "Wrap-up" },
  { "slug": "cooldown", "label": "Cooldown", "pipeline": false }
]
```

Note: We keep `polish`, `learnings`, `breadboarding`, and `implementation-planning` as valid slugs because existing pipeline docs reference them. Removing them would break validation on the 53 migrated docs. They can be deprecated in a future cleanup (#190).

**Step 2: Commit**

```bash
git add config/stages.json
git commit -m "feat(config): add shape and wrap-up stages"
git push
```

---

## Wave 1: Schema + Content Migration (depends on Wave 0)

### Task 5: Update `content.config.ts` with four collections

**Files:**

- Modify: `knowledge-base/src/content.config.ts`

**Step 1: Rewrite the content config to define all four collections**

```typescript
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import verticalsConfig from '../../config/verticals.json'
import stagesConfig from '../../config/stages.json'
import tagsConfig from '../../config/tags.json'
import productsConfig from '../../config/products.json'
import toolsConfig from '../../config/tools.json'
import workflowsConfig from '../../config/workflows.json'

// Derive enum tuples from canonical config files
const verticals = verticalsConfig.map((v) => v.slug) as [string, ...string[]]
const stages = stagesConfig.map((s) => s.slug) as [string, ...string[]]
const tags = tagsConfig.map((t) => t.slug) as [string, ...string[]]
const products = productsConfig.map((p) => p.slug) as [string, ...string[]]
const tools = toolsConfig.map((t) => t.slug) as [string, ...string[]]
const workflows = workflowsConfig.map((w) => w.slug) as [string, ...string[]]

// ── Pipelines (renamed from sessions) ─────────────────────────────
const pipelines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pipelines' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.coerce.date(),
    phase: z.number().int().min(1).max(3),
    pipeline: z.enum(verticals),
    pipelineType: z.enum(workflows),
    products: z.array(z.enum(products)).optional().default([]),
    tools: z.array(z.enum(tools)).optional().default([]),
    stage: z.enum(stages),
    tags: z.array(z.enum(tags)),
    sessionId: z.string().optional(),
    branch: z.string().optional(),
    pr: z.string().optional(),
    status: z.enum(['complete', 'in-progress', 'superseded']).default('complete'),
  }),
})

// ── Products ──────────────────────────────────────────────────────
const productDocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    product: z.enum(products),
    docType: z.enum(['overview', 'history', 'decisions', 'reference']),
    lastUpdated: z.coerce.date(),
    status: z.enum(['current', 'draft', 'deprecated']).default('current'),
  }),
})

// ── Tools ─────────────────────────────────────────────────────────
const toolDocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    tool: z.enum(tools),
    docType: z.enum(['overview', 'history', 'decisions']),
    lastUpdated: z.coerce.date(),
    status: z.enum(['current', 'draft', 'deprecated']).default('current'),
  }),
})

// ── Strategy ──────────────────────────────────────────────────────
const strategy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/strategy' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.coerce.date(),
    docType: z.enum(['cooldown', 'planning']),
    phase: z.number().int().min(1).max(3),
    pipelinesCompleted: z.array(z.string()).optional().default([]),
    pipelinesLaunched: z.array(z.string()).optional().default([]),
    tags: z.array(z.enum(tags)),
    sessionId: z.string().optional(),
    branch: z.string().optional(),
    pr: z.string().optional(),
    status: z.enum(['complete', 'in-progress']).default('complete'),
  }),
})

export const collections = { pipelines, productDocs, toolDocs, strategy }
```

**Step 2: Verify the schema compiles**

```bash
cd knowledge-base && npx astro sync
```

Expected: May warn about missing content directories (we'll create them next), but should not have TypeScript errors in the config itself.

**Step 3: Commit**

```bash
git add knowledge-base/src/content.config.ts
git commit -m "feat(kb): define four content collections with DRY config schemas"
git push
```

---

### Task 6: Migrate content directory — rename sessions → pipelines

**Files:**

- Move: `knowledge-base/src/content/sessions/` → `knowledge-base/src/content/pipelines/`

**Step 1: Use git mv to rename the directory**

```bash
cd ~/Github/mokumo-worktrees/<branch>
git mv knowledge-base/src/content/sessions knowledge-base/src/content/pipelines
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor(kb): rename sessions/ → pipelines/ content directory"
git push
```

---

### Task 7: Migrate pipeline doc frontmatter (all 53 docs)

**Files:**

- Modify: All 53 files in `knowledge-base/src/content/pipelines/*.md`

This is a bulk transformation. For each file:

1. Replace `vertical: <value>` with `pipeline: <value>`
2. Remove `verticalSecondary:` line
3. Add `pipelineType:` based on the classification table in the design doc
4. Add `products:` array based on the classification table
5. Add `tools:` array based on the classification table

**Classification reference:**

| pipeline value      | pipelineType | products                                                          | tools                                                                            |
| ------------------- | ------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| quoting             | vertical     | [quotes]                                                          | []                                                                               |
| customer-management | vertical     | [customers]                                                       | []                                                                               |
| invoicing           | vertical     | [invoices]                                                        | []                                                                               |
| price-matrix        | vertical     | [pricing]                                                         | []                                                                               |
| jobs                | vertical     | [jobs]                                                            | []                                                                               |
| screen-room         | vertical     | [screens]                                                         | []                                                                               |
| garments            | vertical     | [garments]                                                        | []                                                                               |
| dashboard           | vertical     | [dashboard]                                                       | []                                                                               |
| mobile-optimization | horizontal   | [dashboard, quotes, customers, invoices, jobs, garments, pricing] | []                                                                               |
| dtf-gang-sheet      | vertical     | [garments]                                                        | []                                                                               |
| devx                | horizontal   | []                                                                | [work-orchestrator, skills-framework, agent-system, knowledge-base, ci-pipeline] |
| meta                | horizontal   | []                                                                | [knowledge-base]                                                                 |

**Step 1: Write a migration script or manually transform each file**

For each `.md` file, the frontmatter transformation looks like this example:

Before:

```yaml
vertical: quoting
verticalSecondary: []
```

After:

```yaml
pipeline: quoting
pipelineType: vertical
products: [quotes]
tools: []
```

Before (devx example):

```yaml
vertical: devx
verticalSecondary: [meta]
```

After:

```yaml
pipeline: devx
pipelineType: horizontal
products: []
tools: [work-orchestrator, skills-framework, agent-system, knowledge-base, ci-pipeline]
```

**Important per-file considerations:**

- `2026-02-14-phase1-cooldown.md` — skip this file entirely, it will be moved to strategy collection in Task 8
- Some docs have `verticalSecondary: []` (empty array) — just remove the line
- Some have `verticalSecondary: [meta]` or similar — remove the line, the cross-referencing is now via `products`/`tools`
- Some devx/meta docs may need specific `tools` values based on their content (read each to determine which tools apply)

**Step 2: Verify the build**

```bash
cd knowledge-base && npx astro sync && npm run build
```

Expected: All 52 pipeline docs (53 minus cooldown) validate against the new schema.

**Step 3: Commit**

```bash
git add knowledge-base/src/content/pipelines/
git commit -m "refactor(kb): migrate pipeline doc frontmatter — vertical→pipeline, add pipelineType/products/tools"
git push
```

---

### Task 8: Move cooldown doc to strategy collection

**Files:**

- Move: `knowledge-base/src/content/pipelines/2026-02-14-phase1-cooldown.md` → `knowledge-base/src/content/strategy/2026-02-14-phase1-cooldown.md`
- Modify: Update its frontmatter to match the strategy schema

**Step 1: Create strategy directory and move file**

```bash
mkdir -p knowledge-base/src/content/strategy
git mv knowledge-base/src/content/pipelines/2026-02-14-phase1-cooldown.md knowledge-base/src/content/strategy/
```

**Step 2: Update frontmatter to strategy schema**

Before:

```yaml
title: 'Phase 1 Cool-Down — Cross-Vertical Learnings'
subtitle: 'Synthesis of patterns, velocity data, and demo week shaping from the full Phase 1 build cycle'
date: 2026-02-14
phase: 1
vertical: meta
verticalSecondary:
  [
    quoting,
    customer-management,
    invoicing,
    price-matrix,
    jobs,
    garments,
    screen-room,
    mobile-optimization,
  ]
stage: learnings
tags: [learning, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0214-cooldown'
status: complete
```

After:

```yaml
title: 'Phase 1 Cool-Down — Cross-Vertical Learnings'
subtitle: 'Synthesis of patterns, velocity data, and demo week shaping from the full Phase 1 build cycle'
date: 2026-02-14
docType: cooldown
phase: 1
pipelinesCompleted:
  [
    quoting,
    customer-management,
    invoicing,
    price-matrix,
    jobs,
    garments,
    screen-room,
    mobile-optimization,
  ]
pipelinesLaunched: []
tags: [learning, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0214-cooldown'
status: complete
```

**Step 3: Verify**

```bash
cd knowledge-base && npx astro sync
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(kb): move cooldown doc to strategy collection with updated schema"
git push
```

---

## Wave 2: Placeholder Content (depends on Wave 1 for schema validation)

### Task 9: Create product placeholder docs (8 products × 3 docs = 24 files)

**Files:**

- Create: `knowledge-base/src/content/products/<slug>/overview.md` for each of 8 products
- Create: `knowledge-base/src/content/products/<slug>/history.md` for each of 8 products
- Create: `knowledge-base/src/content/products/<slug>/decisions.md` for each of 8 products

**Step 1: Create directory structure**

```bash
cd knowledge-base/src/content
for slug in dashboard quotes customers invoices jobs garments screens pricing; do
  mkdir -p products/$slug
done
```

**Step 2: Create overview.md for each product**

Template (example for quotes):

```yaml
---
title: "Quotes"
subtitle: "Quote creation, line items, pricing calculation, and approval workflow"
product: quotes
docType: overview
lastUpdated: 2026-02-15
status: draft
---

## Overview

*To be written. This is a placeholder created during the KB taxonomy restructure.*

## Current State

Phase 1 mockup complete with mock data.

## Key Routes

- `/quotes` — Quote list
- `/quotes/new` — New quote form
- `/quotes/[id]` — Quote detail
```

Repeat for all 8 products with appropriate titles, subtitles, and route information. Use `status: draft` for all placeholders.

Product details for each:

- **dashboard**: "Dashboard" / "At-a-glance view of shop status, blocked items, and recent activity" / `/dashboard`
- **quotes**: "Quotes" / "Quote creation, line items, pricing calculation, and approval workflow" / `/quotes`, `/quotes/new`, `/quotes/[id]`
- **customers**: "Customers" / "Customer directory, contact management, and quote/job history" / `/customers`, `/customers/[id]`
- **invoices**: "Invoices" / "Invoice generation, payment tracking, and aging reports" / `/invoices`, `/invoices/[id]`
- **jobs**: "Jobs" / "Production job management, Kanban board, and stage tracking" / `/jobs`, `/jobs/[id]`
- **garments**: "Garments" / "Garment catalog, SKU selection, size breakdown, and mockup engine" / `/garments`, `/garments/[id]`
- **screens**: "Screens" / "Screen room management, mesh tracking, burn status, and job linking" / integrated
- **pricing**: "Pricing" / "Price matrix configuration, markup rules, and quantity break calculations" / `/settings/pricing`

**Step 3: Create history.md for each product**

Template:

```yaml
---
title: "Quotes — History"
subtitle: "Build history and changelog for the Quotes product"
product: quotes
docType: history
lastUpdated: 2026-02-15
status: draft
---

## Build History

*Pipeline sessions that built or modified this product will be listed here.*
```

**Step 4: Create decisions.md for each product**

Template:

```yaml
---
title: "Quotes — Decisions"
subtitle: "Key decisions made during Quotes development"
product: quotes
docType: decisions
lastUpdated: 2026-02-15
status: draft
---

## Decision Log

*Key decisions will be aggregated here from pipeline sessions.*
```

**Step 5: Verify**

```bash
cd knowledge-base && npx astro sync && npm run build
```

Expected: All 24 product docs validate against the productDocs schema.

**Step 6: Commit**

```bash
git add knowledge-base/src/content/products/
git commit -m "feat(kb): add placeholder product docs for all 8 products"
git push
```

---

### Task 10: Create tool placeholder docs (5 tools × 3 docs = 15 files)

**Files:**

- Create: `knowledge-base/src/content/tools/<slug>/overview.md` for each of 5 tools
- Create: `knowledge-base/src/content/tools/<slug>/history.md` for each of 5 tools
- Create: `knowledge-base/src/content/tools/<slug>/decisions.md` for each of 5 tools

**Step 1: Create directory structure**

```bash
cd knowledge-base/src/content
for slug in work-orchestrator skills-framework agent-system knowledge-base ci-pipeline; do
  mkdir -p tools/$slug
done
```

**Step 2: Create overview.md for each tool**

Tool details:

- **work-orchestrator**: "Work Orchestrator" / "Shell function automating worktree creation, session management, and Claude launch"
- **skills-framework**: "Skills Framework" / "Domain expertise containers with instructions, templates, and references for Claude agents"
- **agent-system**: "Agent System" / "Specialized AI assistants with own context windows, system prompts, and tool configurations"
- **knowledge-base**: "Knowledge Base" / "Astro-powered documentation site with Pagefind search, pipeline tracking, and workflow chains"
- **ci-pipeline**: "CI Pipeline" / "GitHub Actions CI running tsc, lint, test, and build on push/PR to main"

Template (example for work-orchestrator):

```yaml
---
title: "Work Orchestrator"
subtitle: "Shell function automating worktree creation, session management, and Claude launch"
tool: work-orchestrator
docType: overview
lastUpdated: 2026-02-15
status: draft
---

## Overview

*To be written. This is a placeholder created during the KB taxonomy restructure.*

## Key Commands

- `work <topic>` — New workstream
- `work list` — Show sessions and ports
- `work clean <topic>` — Remove worktree + session + branch

## Source

`scripts/work.sh`
```

**Step 3: Create history.md and decisions.md for each tool**

Same template pattern as products, adjusted for tool schema.

**Step 4: Verify**

```bash
cd knowledge-base && npx astro sync && npm run build
```

**Step 5: Commit**

```bash
git add knowledge-base/src/content/tools/
git commit -m "feat(kb): add placeholder tool docs for all 5 tools"
git push
```

---

## Wave 3: Page Updates (depends on Wave 1 for collection rename)

### Task 11: Update DocCard component

**Files:**

- Modify: `knowledge-base/src/components/DocCard.astro`

**Step 1: Update the Props interface and link href**

Changes needed:

- `vertical` prop → `pipeline`
- Remove `verticalSecondary` prop
- Add `pipelineType` prop (optional, for display)
- Add `products` prop (optional, for display)
- Change link href from `/sessions/${slug}` to `/pipelines/${slug}`
- Update meta row: show pipeline name + product badges instead of vertical + verticalSecondary

The `verticalLabel()` function stays (it reads from `verticalsConfig` which still holds the pipeline names).

**Step 2: Verify** by running `npm run build` in knowledge-base.

**Step 3: Commit**

```bash
git add knowledge-base/src/components/DocCard.astro
git commit -m "refactor(kb): update DocCard for pipeline schema"
git push
```

---

### Task 12: Update WorkflowChain component

**Files:**

- Modify: `knowledge-base/src/components/WorkflowChain.astro`

**Step 1: Update hardcoded stage order and labels**

The component currently has hardcoded `stageOrder` and `shortStageLabels` arrays. Replace with imports from `config/stages.json`:

```typescript
import stagesConfig from '../../../config/stages.json'

const stageOrder = stagesConfig.filter((s) => s.pipeline !== false).map((s) => s.slug)

const shortStageLabels: Record<string, string> = Object.fromEntries(
  stagesConfig.filter((s) => s.pipeline !== false).map((s) => [s.slug, s.label])
)
```

Also update the link href from `/sessions/${session.slug}` to `/pipelines/${session.slug}`.

**Step 2: Commit**

```bash
git add knowledge-base/src/components/WorkflowChain.astro
git commit -m "refactor(kb): update WorkflowChain to use config-driven stages and pipeline links"
git push
```

---

### Task 13: Update Pipeline component

**Files:**

- Modify: `knowledge-base/src/components/Pipeline.astro`

**Step 1: Replace hardcoded shortLabels with config import**

```typescript
import stagesConfig from '../../../config/stages.json'

const shortLabels: Record<string, string> = Object.fromEntries(
  stagesConfig.map((s) => [s.slug, s.label])
)
```

Update the stage link href from `/verticals/${vertical}/${stage.slug}` to `/pipelines/${vertical}/${stage.slug}`.

Rename the `vertical` prop to `pipeline` in the interface.

**Step 2: Commit**

```bash
git add knowledge-base/src/components/Pipeline.astro
git commit -m "refactor(kb): update Pipeline component for config-driven labels and pipeline routes"
git push
```

---

### Task 14: Update DecisionRecord component

**Files:**

- Modify: `knowledge-base/src/components/DecisionRecord.astro`

**Step 1: Update link href and prop names**

Change:

- `vertical` prop → `pipeline`
- Link href from `/sessions/${slug}` to `/pipelines/${slug}`

**Step 2: Commit**

```bash
git add knowledge-base/src/components/DecisionRecord.astro
git commit -m "refactor(kb): update DecisionRecord for pipeline naming"
git push
```

---

### Task 15: Update VerticalHealth component

**Files:**

- Modify: `knowledge-base/src/components/VerticalHealth.astro`

**Step 1: Rename prop from `vertical` to `pipeline`**

Update the interface and all internal references. The component logic stays the same — it already uses `stagesConfig` for stage enumeration.

**Step 2: Commit**

```bash
git add knowledge-base/src/components/VerticalHealth.astro
git commit -m "refactor(kb): rename VerticalHealth prop vertical → pipeline"
git push
```

---

### Task 16: Update Sidebar component

**Files:**

- Modify: `knowledge-base/src/components/Sidebar.astro`

**Step 1: Add Products, Tools, and Strategy sections**

Update the `views` array and add new navigation sections:

```typescript
const views = [
  { id: 'all', label: 'All Pipelines', href: '/' },
  { id: 'products', label: 'Products', href: '/products' },
  { id: 'tools', label: 'Tools', href: '/tools' },
  { id: 'strategy', label: 'Strategy', href: '/strategy' },
  { id: 'decisions', label: 'Decisions', href: '/decisions' },
  { id: 'gary-tracker', label: 'Gary Tracker', href: '/gary-tracker' },
]
```

Rename the "Verticals" section heading to "Pipelines" and update `sessionCount` label from "sessions" to "pipeline docs".

Update the prop name from `verticalCounts` to `pipelineCounts` and update `data-vertical-filter` to `data-pipeline-filter` on the buttons.

**Step 2: Commit**

```bash
git add knowledge-base/src/components/Sidebar.astro
git commit -m "refactor(kb): update Sidebar with new collection navigation and pipeline naming"
git push
```

---

### Task 17: Rename and update pipeline detail page

**Files:**

- Move: `knowledge-base/src/pages/sessions/[...slug].astro` → `knowledge-base/src/pages/pipelines/[...slug].astro`
- Modify: Update collection references from `sessions` to `pipelines`

**Step 1: Create pipelines directory and move file**

```bash
mkdir -p knowledge-base/src/pages/pipelines
git mv knowledge-base/src/pages/sessions/[...slug].astro knowledge-base/src/pages/pipelines/[...slug].astro
rmdir knowledge-base/src/pages/sessions 2>/dev/null || true
```

**Step 2: Update the page**

Key changes:

- `getCollection('sessions')` → `getCollection('pipelines')`
- Destructure `pipeline` instead of `vertical`, `pipelineType` instead of nothing, `products`/`tools` instead of `verticalSecondary`
- Update the meta grid: "Vertical" label → "Pipeline", link to `/pipelines/${pipeline}` instead of `/verticals/${vertical}`
- Add Products and Tools rows in the meta grid when arrays are non-empty
- WorkflowChain: filter by `pipeline` instead of `vertical`
- Stage link: `/pipelines/${pipeline}/${stage}` instead of `/verticals/${vertical}/${stage}`

**Step 3: Verify**

```bash
cd knowledge-base && npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(kb): rename sessions page → pipelines, update collection references"
git push
```

---

### Task 18: Rename and update pipeline browse pages

**Files:**

- Move: `knowledge-base/src/pages/verticals/[vertical].astro` → `knowledge-base/src/pages/pipelines/[pipeline].astro`
- Move: `knowledge-base/src/pages/verticals/[vertical]/[stage].astro` → `knowledge-base/src/pages/pipelines/[pipeline]/[stage].astro`

**Step 1: Create pipeline page directory structure and move files**

```bash
mkdir -p knowledge-base/src/pages/pipelines/\[pipeline\]
git mv knowledge-base/src/pages/verticals/\[vertical\].astro knowledge-base/src/pages/pipelines/\[pipeline\].astro
git mv knowledge-base/src/pages/verticals/\[vertical\]/\[stage\].astro knowledge-base/src/pages/pipelines/\[pipeline\]/\[stage\].astro
rm -rf knowledge-base/src/pages/verticals
```

**Step 2: Update `[pipeline].astro`**

Key changes:

- `getCollection('sessions')` → `getCollection('pipelines')`
- `Astro.params.vertical` → `Astro.params.pipeline`
- Filter by `s.data.pipeline === pipeline` instead of `s.data.vertical === vertical`
- Update VerticalHealth and Pipeline component props
- Update back link to `/`
- Update heading text from "sessions" to "pipeline docs"

**Step 3: Update `[pipeline]/[stage].astro`**

Same changes as above, plus:

- `getStaticPaths` generates `pipeline`+`stage` combos from `pipelines` collection
- Back link points to `/pipelines/${pipeline}`
- Pipeline component gets `pipeline` prop instead of `vertical`

**Step 4: Verify**

```bash
cd knowledge-base && npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(kb): rename verticals pages → pipelines with updated params"
git push
```

---

### Task 19: Update index page

**Files:**

- Modify: `knowledge-base/src/pages/index.astro`

**Step 1: Update collection and variable names**

Key changes:

- `getCollection('sessions')` → `getCollection('pipelines')`
- All `session` variable names → pipeline-appropriate names (or keep generic `doc`)
- `verticalCounts` → `pipelineCounts`
- `s.data.vertical` → `s.data.pipeline`
- `data-vertical=` → `data-pipeline=`
- Update client-side JS: `activeVertical` → `activePipeline`, `verticalFilter` → `pipelineFilter`
- Update header: "All Sessions" → "All Pipeline Docs"
- Update mobile select: "All Verticals" → "All Pipelines"
- Sidebar props: pass updated names

**Step 2: Verify**

```bash
cd knowledge-base && npm run build
```

**Step 3: Commit**

```bash
git add knowledge-base/src/pages/index.astro
git commit -m "refactor(kb): update index page for pipeline naming"
git push
```

---

### Task 20: Update decisions page

**Files:**

- Modify: `knowledge-base/src/pages/decisions.astro`

**Step 1: Update collection reference and component props**

Key changes:

- `getCollection('sessions')` → `getCollection('pipelines')`
- `s.data.vertical` → `s.data.pipeline` in DecisionRecord prop
- DecisionRecord: `vertical` prop → `pipeline`

**Step 2: Commit**

```bash
git add knowledge-base/src/pages/decisions.astro
git commit -m "refactor(kb): update decisions page for pipeline collection"
git push
```

---

### Task 21: Update gary-tracker page

**Files:**

- Modify: `knowledge-base/src/pages/gary-tracker.astro`

**Step 1: Update glob path**

Change:

```typescript
const sessionFiles = import.meta.glob('/src/content/sessions/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
```

To:

```typescript
const sessionFiles = import.meta.glob('/src/content/pipelines/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
```

**Step 2: Commit**

```bash
git add knowledge-base/src/pages/gary-tracker.astro
git commit -m "refactor(kb): update gary-tracker glob path to pipelines/"
git push
```

---

## Wave 4: New Pages (depends on Wave 2 for content + Wave 3 for components)

### Task 22: Create products index page

**Files:**

- Create: `knowledge-base/src/pages/products/index.astro`

**Step 1: Create the products index page**

This page shows a grid of all products with their status and linked pipeline doc counts.

It should:

- Import `productsConfig` from config
- `getCollection('productDocs')` to get overview docs
- `getCollection('pipelines')` to count linked pipeline docs per product
- Display a card grid with product name, subtitle (from overview doc), status, and counts
- Link each card to `/products/[product]`

Style: Match the existing KB design system (bg-bg-elevated cards, border-border, text tokens).

**Step 2: Verify**

```bash
cd knowledge-base && npm run build
```

**Step 3: Commit**

```bash
git add knowledge-base/src/pages/products/
git commit -m "feat(kb): add products index page"
git push
```

---

### Task 23: Create product detail page

**Files:**

- Create: `knowledge-base/src/pages/products/[product].astro`

**Step 1: Create the product detail page**

This page serves as the product landing page. It should:

- Use `getStaticPaths()` generating one path per product from `productsConfig`
- Fetch all `productDocs` for this product slug (overview, history, decisions)
- Fetch `pipelines` where `products` array contains this product slug
- Render the overview doc content at the top
- Show a "History" section listing related pipeline docs (sorted by date)
- Show a "Decisions" section with any decisions (from the product's decisions.md)
- Show a "Related Pipeline Sessions" section with auto-linked pipeline docs

**Step 2: Verify with `npm run build`**

**Step 3: Commit**

```bash
git add knowledge-base/src/pages/products/
git commit -m "feat(kb): add product detail page with auto-linked pipelines"
git push
```

---

### Task 24: Create tools index page

**Files:**

- Create: `knowledge-base/src/pages/tools/index.astro`

**Step 1: Create the tools index page**

Same pattern as products index but for tools. Shows a grid of all tools with status and linked pipeline doc counts.

**Step 2: Commit**

```bash
git add knowledge-base/src/pages/tools/
git commit -m "feat(kb): add tools index page"
git push
```

---

### Task 25: Create tool detail page

**Files:**

- Create: `knowledge-base/src/pages/tools/[tool].astro`

**Step 1: Create the tool detail page**

Same pattern as product detail page but for tools:

- `getStaticPaths()` from `toolsConfig`
- Fetch `toolDocs` for this tool slug
- Fetch `pipelines` where `tools` array contains this tool slug
- Render overview, history, decisions, and auto-linked pipeline docs

**Step 2: Commit**

```bash
git add knowledge-base/src/pages/tools/
git commit -m "feat(kb): add tool detail page with auto-linked pipelines"
git push
```

---

### Task 26: Create strategy index page

**Files:**

- Create: `knowledge-base/src/pages/strategy/index.astro`

**Step 1: Create the strategy index page**

Lists all strategy docs (cooldowns, planning sessions) sorted by date descending. Each card shows title, subtitle, date, docType badge, and pipelines completed/launched.

**Step 2: Commit**

```bash
git add knowledge-base/src/pages/strategy/
git commit -m "feat(kb): add strategy index page"
git push
```

---

### Task 27: Create strategy detail page

**Files:**

- Create: `knowledge-base/src/pages/strategy/[...slug].astro`

**Step 1: Create the strategy detail page**

Similar to the pipeline detail page but adapted for the strategy schema:

- Show docType badge (Cooldown / Planning)
- Show pipelines completed and pipelines launched as linked lists
- Render the markdown body

**Step 2: Commit**

```bash
git add knowledge-base/src/pages/strategy/
git commit -m "feat(kb): add strategy detail page"
git push
```

---

## Wave 5: Final Verification

### Task 28: Full build verification

**Step 1: Run full build**

```bash
cd knowledge-base && npm run build
```

Expected: Clean build with all four collections, all pages generated, no schema validation errors.

**Step 2: Run dev server and spot-check**

```bash
npm run dev
```

Verify:

- [ ] `/` — index loads, shows pipeline docs, sidebar has new sections
- [ ] `/pipelines/<any-slug>` — detail page renders with correct meta grid
- [ ] `/pipelines/<pipeline-name>` — browse page shows pipeline docs
- [ ] `/products` — index shows 8 product cards
- [ ] `/products/quotes` — detail page renders overview + linked pipeline docs
- [ ] `/tools` — index shows 5 tool cards
- [ ] `/tools/work-orchestrator` — detail page renders
- [ ] `/strategy` — shows cooldown doc
- [ ] `/strategy/2026-02-14-phase1-cooldown` — detail page renders
- [ ] `/decisions` — still works, shows decision-tagged pipeline docs
- [ ] `/gary-tracker` — still works

**Step 3: Commit any fixes, then final commit**

```bash
git add -A
git commit -m "fix(kb): address build verification issues"
git push
```

---

## Parallelization Summary

```
Wave 0: Tasks 1-4   (config files — all independent, run in parallel)
Wave 1: Tasks 5-8   (schema + migration — sequential within wave)
Wave 2: Tasks 9-10  (placeholders — independent, run in parallel)
Wave 3: Tasks 11-21 (page/component updates — mostly independent, run in parallel)
Wave 4: Tasks 22-27 (new pages — mostly independent, run in parallel)
Wave 5: Task 28     (verification — depends on all above)
```

Tasks within each wave can be parallelized where marked. Cross-wave dependencies are strict.
