# Pipeline Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Implement the pipeline architecture redesign for the `work` CLI system, transforming it from a session-based tool into a pipeline-aware orchestrator with lifecycle management, stage gates, and automated execution.

**Architecture:** Three entity types (Products, Tools, Pipelines) replace the current verticals model. Pipelines are runtime instances with lifecycle states (ready -> active -> building -> reviewing -> wrapped -> cooled). Config files are consolidated (`verticals.json` eliminated, `workflows.json` renamed to `pipeline-types.json`, `stages.json` updated to short slugs). New `work` CLI commands (define, start, build update, end, status, cooldown) drive the pipeline lifecycle with artifact-based stage gates.

**Tech Stack:** Bash/Zsh (work.sh + lib modules), JSON (pipeline registry, config files), Zod (KB frontmatter validation), yq (YAML parsing), gh CLI (GitHub API for PR management, merge detection), Astro (KB static site)

**Input Documents:**

- `docs/research/2026-02-15-pipeline-architecture-research.md` (14 design decisions)
- GitHub issue #192 (6 implementation streams with checklists)
- Current config files: `config/stages.json`, `config/workflows.json`, `config/products.json`, `config/tools.json`, `config/verticals.json`
- Current `scripts/work.sh` and `scripts/lib/` modules

**Merge Strategy:** Sequential PRs to main. This bootstrapping build uses the old pattern since the base-branch pattern is what we're implementing. Future pipeline builds will use base branch + stacked PRs.

**Excluded:** Stream F (Research Skills, #201) is backlog and not part of this plan.

---

## Wave 0: Config + Entity Foundation

**Mode**: Serial (1 session)
**Purpose**: Update all config files to target state, create backward-compatible KB schema, build pipeline entity data layer, patch `work build` for base branch support.

### Task 0.1: Config File Migration

**Files:**

- `config/workflows.json` -> DELETE (replaced by pipeline-types.json)
- `config/pipeline-types.json` (NEW — renamed + updated content)
- `config/stages.json` (UPDATE — new short slugs)
- `config/verticals.json` -> DELETE
- `config/pipeline-gates.json` (NEW — stage gate definitions)

**Steps:**

1. Create `config/pipeline-types.json` with updated content from research doc (stage arrays use new short slugs: shape, breadboard, plan). Add descriptions per type. Delete `config/workflows.json`.
2. Update `config/stages.json`: rename slugs (`shaping` -> `shape`, `breadboarding` -> `breadboard`, `implementation-planning` -> `plan`), remove stale entries (`polish` — it's a pipeline type not a stage, `learnings` — replaced by `wrap-up`), remove `workAlias` fields (no longer needed when slugs are short), keep `cooldown` with `"pipeline": false`.
3. Delete `config/verticals.json`.
4. Create `config/pipeline-gates.json` with stage gate definitions per the research doc (required artifacts per stage, gate types: `artifact-exists`, `human-confirms`, `human-approves-manifest`, auto-mode overrides).

### Task 0.2: KB Schema — Backward-Compatible Transition

**Files:**

- `knowledge-base/src/content.config.ts` (UPDATE)
- `knowledge-base/src/lib/utils.ts` (UPDATE)

**Steps:**

1. Update `content.config.ts`:
   - Remove `verticalsConfig` and `workflowsConfig` imports
   - Add `pipelineTypesConfig` import from `config/pipeline-types.json`
   - Change `pipeline: z.enum(verticals)` to `pipelineName: z.string()` (free text, no enum validation — pipeline names are not config-backed)
   - Add `pipelineId: z.string().optional()` (format: YYYYMMDD-topic)
   - Add backward-compat: use `z.preprocess()` to accept `pipeline` key and map to `pipelineName` (so existing frontmatter doesn't break)
   - Change `pipelineType: z.enum(workflows)` to `z.enum(pipelineTypes)` using new config
   - Change `stage: z.enum(stages)` to `z.string()` TEMPORARILY (accepts both old and new slugs during migration — Wave 1 restores strict enum)
   - Update `strategy` collection: change `pipelinesCompleted`/`pipelinesLaunched` from `z.array(z.enum(verticals))` to `z.array(z.string())` (free text pipeline names)
2. Update `utils.ts`:
   - Remove `verticalsConfig` import
   - Update `pipelineLabel()` to use `labelFromSlug()` fallback only (no config-driven lookup for pipeline names — they're free text)
   - Update `stageLabelMap` to handle both old and new slugs during transition
3. Verify: `npm run kb:build` passes with existing frontmatter files unchanged.

### Task 0.3: Pipeline Entity + Registry

**Files:**

- `scripts/lib/pipeline-entity.sh` (NEW)
- `scripts/lib/pipeline-registry.sh` (NEW)

**Steps:**

1. Design pipeline entity JSON schema matching research doc:
   ```json
   {
     "id": "YYYYMMDD-topic",
     "name": "topic",
     "type": "vertical|polish|horizontal|bug-fix",
     "products": [],
     "tools": [],
     "stage": "current-stage-slug",
     "state": "ready|active|building|reviewing|wrapped|cooled",
     "issue": null,
     "auto": false,
     "artifacts": {},
     "baseBranch": null,
     "worktrees": [],
     "prs": {},
     "kbDocs": [],
     "createdAt": "ISO-8601",
     "startedAt": null,
     "completedAt": null
   }
   ```
2. Implement `pipeline-entity.sh`:
   - `_pipeline_create()` — create entity with ID generation (YYYYMMDD-topic)
   - `_pipeline_read()` — read entity by ID
   - `_pipeline_update()` — update entity fields
   - `_pipeline_transition()` — state machine validation (ready->active->building->reviewing->wrapped->cooled)
   - `_pipeline_validate_type()` — validate type against `config/pipeline-types.json`
3. Implement `pipeline-registry.sh`:
   - Registry file: `~/Github/mokumo-worktrees/.pipeline-registry.json`
   - `_registry_pipeline_init()` — create registry if not exists
   - `_registry_pipeline_add()` — add pipeline to registry
   - `_registry_pipeline_get()` — get pipeline by ID
   - `_registry_pipeline_list()` — list all pipelines, filter by state
   - `_registry_pipeline_update()` — update pipeline in registry
4. Source both from `work.sh`.

### Task 0.4: Work.sh Consumer Updates

**Files:**

- `scripts/work.sh` (UPDATE)

**Steps:**

1. Remove `verticals.json` dependency from `_work_phase()`: replace strict vertical validation with lenient topic acceptance (any kebab-case string). The old phase commands remain functional but without enum validation — they'll be replaced by new pipeline commands in Wave 2.
2. Update `_work_build()` to support `baseBranch` manifest field:
   - Read `baseBranch` from manifest: `yq -r '.baseBranch // "main"' "$MANIFEST"`
   - Use as branch base for worktree creation (instead of hardcoded `main`)
   - Pull base branch instead of main when baseBranch is set
3. Source new lib files (`pipeline-entity.sh`, `pipeline-registry.sh`).
4. Verify: existing `work` commands still function.

### Task 0.5: Entity-First Directory Setup

**Steps:**

1. Create `docs/products/` and `docs/tools/` directory stubs (if not existing)
2. Implement directory creation in `_pipeline_create()`: `docs/{products|tools}/{slug}/{pipeline-id}/`
3. Document the directory convention in a comment block in `pipeline-entity.sh`

---

## Wave 1: Parallel Migrations

**Mode**: Parallel (3 sessions)
**Purpose**: Migrate KB frontmatter + pages, implement pipeline management commands, update skill references.
**Depends on**: Wave 0 merged to main.

### Task 1.1: KB Frontmatter Migration + Page Updates (Session: `kb-pipeline-schema`)

**Files:**

- ~57 files in `knowledge-base/src/content/pipelines/` (frontmatter migration)
- ~7 files in `knowledge-base/src/content/sessions/` (check if migration needed)
- Strategy collection files (check pipelinesCompleted/Launched)
- `knowledge-base/src/content.config.ts` (tighten validation)
- `knowledge-base/src/pages/index.astro`
- `knowledge-base/src/pages/pipelines/[pipeline].astro`
- `knowledge-base/src/pages/pipelines/[pipeline]/[stage].astro`
- `knowledge-base/src/components/Sidebar.astro`
- `knowledge-base/src/components/VerticalHealth.astro`

**Steps:**

1. **Frontmatter migration** (~60 files):
   - Rename `pipeline: <value>` to `pipelineName: <value>` in all pipeline docs
   - Update stage slugs: `shaping` -> `shape`, `breadboarding` -> `breadboard`, `implementation-planning` -> `plan`, `learnings` -> `wrap-up`
   - Remove `polish` stage references (polish is a pipeline type, map to appropriate stage)
   - Validate: no `pipeline:` keys remain in frontmatter
2. **Schema tightening** (content.config.ts):
   - Remove backward-compat `z.preprocess` for `pipeline` -> `pipelineName` (all files migrated)
   - Restore `stage: z.enum(stages)` with new stage slugs (remove temporary `z.string()`)
3. **Page updates**:
   - `[pipeline].astro`: Replace `getStaticPaths()` — derive routes from unique `pipelineName` values in content via `getCollection('pipelines')` instead of `verticalsConfig.map()`. Remove `verticalsConfig` import.
   - `[pipeline]/[stage].astro`: Similar route derivation from content data
   - `index.astro`: Update pipeline filter to use dynamic pipeline names from content instead of verticals enum. Remove `verticalsConfig` import.
   - Update `coreStages` array: `['research', 'breadboard', 'build']` (was `breadboarding`)
4. **Component updates**:
   - `Sidebar.astro`: Remove `verticalsConfig` import, derive pipeline nav from content
   - `VerticalHealth.astro`: Rename component references from "vertical" to "pipeline" in display text, update stage references
5. **Validation**:
   - `npm run kb:build` — all 60+ docs pass schema validation
   - `npm run kb:dev` — pipeline pages render, routes work, filters functional
6. Create KB session doc.

### Task 1.2: Work Pipeline Management Commands (Session: `work-pipeline-mgmt`)

**Files:**

- `scripts/work.sh` (UPDATE — dispatcher)
- `scripts/lib/pipeline-define.sh` (NEW)
- `scripts/lib/pipeline-status.sh` (NEW)

**Steps:**

1. **Implement `work define`** (`lib/pipeline-define.sh`):
   - Parse args: `work define <name> [--type <type>] [--issue <number>] [--prompt "<text>"] [--auto]`
   - Generate pipeline ID: `YYYYMMDD-<name>` (kebab-case enforced)
   - Validate type against `config/pipeline-types.json` (default: `vertical`)
   - Create pipeline entity in registry (state: `ready`)
   - If `--issue` provided: link to GitHub issue via `gh issue view`
   - If `--prompt` provided and no `--issue`: create GitHub issue automatically
   - Create artifact directory: `docs/{products|tools}/{entity-slug}/{pipeline-id}/`
   - Display: pipeline ID, type, linked issue, artifact directory
2. **Implement `work status`** (`lib/pipeline-status.sh`):
   - No args (dashboard):
     - Group pipelines by state (ready, active, building, reviewing, wrapped, cooled)
     - Show: ID, name, type, stage, state, products/tools, linked issue
     - Progress indicators per pipeline (stages completed / total)
     - Staleness alerts (pipelines stuck in a state for >3 days)
   - With ID (deep dive):
     - Full pipeline entity detail
     - All completed stages with artifact paths
     - Current stage progress
     - Linked worktrees, PRs, KB docs
3. **Update `work list`**: Group infrastructure (worktrees, sessions, ports) by pipeline ID where possible.
4. **Update `work clean`**: Accept pipeline ID, clean all sessions within a pipeline.
5. **Update work.sh dispatcher**: Add `define`, `status` routes. Update `clean` to accept pipeline IDs.
6. **Update help text** with new commands.
7. Source new lib files from work.sh.
8. Create KB session doc.

### Task 1.3: Skills Stage Reference Update (Session: `skills-stage-update`)

**Files:**

- `.claude/skills/shaping/SKILL.md` + templates + reference
- `.claude/skills/breadboarding/SKILL.md` + templates + reference
- `.claude/skills/breadboard-reflection/SKILL.md`
- `.claude/skills/implementation-planning/SKILL.md`
- `.claude/skills/build-session-protocol/SKILL.md`
- `.claude/skills/cool-down/SKILL.md`
- `.claude/skills/learnings-synthesis/SKILL.md`
- `.claude/skills/vertical-discovery/SKILL.md`
- `.claude/skills/one-on-one/1on1-log.md`

**Steps:**

1. Audit all 16 skills for references to old stage names or verticals-based concepts.
2. Update stage slug references throughout:
   - `shaping` (as stage name) -> `shape`
   - `breadboarding` (as stage name) -> `breadboard`
   - `implementation-planning` (as stage name) -> `plan`
   - `learnings` -> `wrap-up`
   - `polish` (as stage) -> clarify as pipeline type, not stage
   - Note: skill NAMES don't change (`shaping` skill is still called `shaping`). Only stage slug references change.
3. Update artifact output path patterns:
   - Old: `docs/breadboards/{vertical}-breadboard.md`, `docs/shaping/{topic}/frame.md`
   - New: `docs/{products|tools}/{entity-slug}/{pipeline-id}/breadboard.md`, etc.
   - Note: Skills should accept path injection from pipeline orchestrator. Default paths can stay for non-pipeline usage.
4. Update `vertical-discovery` skill: rename references from "vertical" to "pipeline" where appropriate.
5. Update `learnings-synthesis` skill: align with `wrap-up` stage name.
6. Update `build-session-protocol` skill: reference new pipeline entity concepts.
7. Update templates that reference stage names (shaping templates, breadboard templates).
8. Verify: all skills can still be invoked and produce correct output format.
9. Create KB session doc.

---

## Wave 2: Orchestrator Execution Pipeline

**Mode**: Serial (1 session)
**Purpose**: Implement the core execution commands that drive the pipeline lifecycle: start, build update, end, cooldown, stage gates, auto mode.
**Depends on**: Wave 1 task 1.2 (`work-pipeline-mgmt`) merged — needs registry + define infrastructure.

### Task 2.1: Stage Gate Validation (Session: `work-execution-pipeline`)

**Files:**

- `scripts/lib/pipeline-gates.sh` (NEW)

**Steps:**

1. Load gate definitions from `config/pipeline-gates.json`.
2. Implement `_pipeline_check_gate()`:
   - `artifact-exists`: Check all required artifacts exist in pipeline artifact directory
   - `human-confirms`: Prompt and wait for human input (keyboard confirm)
   - `human-approves-manifest`: Display manifest summary, prompt for approval
3. Implement `_pipeline_auto_override()`: In `--auto` mode, `human-*` gates fall through to `artifact-exists`.
4. Implement `_pipeline_report_missing()`: List missing artifacts blocking gate passage.

### Task 2.2: `work start` — Pre-build Orchestration

**Files:**

- `scripts/lib/pipeline-start.sh` (NEW)
- `scripts/prompts/` (NEW/UPDATED — prompt templates per stage)

**Steps:**

1. Validate pipeline exists and is in `ready` state.
2. Create single worktree for entire pre-build phase: `session/MMDD-<pipeline-name>-prebuild`
3. Create single branch, one PR for all pre-build artifacts.
4. Launch Claude session with pipeline context seed:
   - Read: linked GitHub issue, product/tool entity docs, prior pipeline wrap-ups, ROADMAP.md
   - Pipeline ID, type, products, tools passed as context
5. Sequentially run pre-build stages based on pipeline type's stage list:
   - For each stage: invoke appropriate skill, validate gate, update pipeline state, record artifacts
   - `research`: Future (#201) — stub that creates `research-findings.md` placeholder
   - `interview`: Launch requirements-interrogator agent, human required
   - `shape`: Invoke shaping skill, produce frame.md + shaping.md
   - `breadboard`: Invoke breadboarding + reflection skills, produce breadboard.md + reflection.md
   - `plan`: Invoke implementation-planning skill, produce manifest.yaml
6. After each stage completion: check gate, update pipeline entity, commit artifacts.
7. Transition pipeline: `ready` -> `active`.
8. After plan stage: if `--auto`, transition to `building`. Otherwise, wait for human manifest approval.

### Task 2.3: `work build` — Base Branch + Wave Execution

**Files:**

- `scripts/lib/pipeline-build.sh` (NEW — refactor existing \_work_build logic)

**Steps:**

1. Validate pipeline exists and has manifest artifact.
2. Create base branch: `build/<pipeline-id>` from main.
3. Read manifest from pipeline artifact directory.
4. For each wave:
   - Create session branches from base branch (not main)
   - Session PRs target base branch
   - Track sessions in pipeline entity
   - Auto-advance when all sessions in wave N merge
5. Transition pipeline: `active` -> `building`.
6. After final wave: transition to `reviewing`.
7. Refactor: Extract current `_work_build` logic into `pipeline-build.sh`, keep backward compat for non-pipeline manifests.

### Task 2.4: `work end` — Post-build + Merge Detection

**Files:**

- `scripts/lib/pipeline-end.sh` (NEW)

**Steps:**

1. Create final PR: base branch -> main.
2. Run review stage:
   - All breadboard affordances implemented? (checklist from breadboard doc)
   - Design system compliance (invoke design-audit skill/agent)
   - Tests pass, types check, build succeeds
   - KB docs created for each build session
3. Transition pipeline: `building` -> `reviewing`.
4. Merge detection polling:
   ```bash
   while true; do
     state=$(gh pr view "$PR_NUMBER" --json state -q '.state')
     [[ "$state" == "MERGED" ]] && break
     sleep 90
   done
   ```
5. After merge detected: run wrap-up stage.
6. Generate wrap-up doc in pipeline artifact directory:
   - What was built (from manifest sessions)
   - Plan deviations (diff manifest vs actual)
   - Patterns discovered
   - Review issues and resolutions
   - PR and KB doc links
   - Recommended agent memory updates (scoped per agent type)
7. Transition pipeline: `reviewing` -> `wrapped`.

### Task 2.5: `work cooldown` — Batch Processing

**Files:**

- `scripts/lib/pipeline-cooldown.sh` (NEW)

**Steps:**

1. Find all pipelines in `wrapped` state.
2. Read all wrap-up docs since last cooldown.
3. Synthesize cross-cutting themes.
4. Update PROGRESS.md (one update covering all wrapped pipelines).
5. Optionally update ROADMAP.md if strategic direction shifts.
6. Transition pipelines: `wrapped` -> `cooled`.

### Task 2.6: `--auto` Mode + Dispatcher + Integration

**Files:**

- `scripts/work.sh` (UPDATE — dispatcher)
- All lib/pipeline-\*.sh files (auto flag propagation)

**Steps:**

1. `--auto` flag stored in pipeline entity at define time.
2. Propagated to stage gates: skip `human-confirms` and `human-approves-manifest`.
3. Propagated to merge detection: skip human merge (auto-merge via gh CLI).
4. Update work.sh dispatcher: add `start`, `build` (update), `end`, `cooldown` routes.
5. Update help text with full command reference.
6. End-to-end test: `work define test-pipeline --type bug-fix` -> verify entity created, `work status test-pipeline` -> verify display, `work clean test-pipeline` -> verify cleanup.
7. Create KB session doc.

---

## Summary

| Wave      | Sessions       | Mode     | Key Deliverables                                                                             |
| --------- | -------------- | -------- | -------------------------------------------------------------------------------------------- |
| 0         | 1              | Serial   | Config migration, KB backward-compat schema, pipeline entity/registry, work build baseBranch |
| 1         | 3              | Parallel | KB frontmatter migration + pages, work define/status/list, skills stage updates              |
| 2         | 1              | Serial   | work start/build/end/cooldown, stage gates, auto mode, integration                           |
| **Total** | **5 sessions** |          |                                                                                              |

## Dependency Graph

```
Wave 0: pipeline-config-foundation
    |
    +---> Wave 1: kb-pipeline-schema (B+C)
    |
    +---> Wave 1: work-pipeline-mgmt (D-mgmt)
    |         |
    |         +---> Wave 2: work-execution-pipeline (D-exec)
    |
    +---> Wave 1: skills-stage-update (E)
```

## Key Decisions

1. **3 waves, 5 sessions**: Wave 0 (foundation), Wave 1 (3 parallel migrations), Wave 2 (execution pipeline).
2. **No stream overlap between A and D**: Config foundation is small and fast — better to complete it first than risk coordination issues.
3. **Sequential PRs to main**: This bootstrapping build uses the old merge pattern. The base-branch pattern is what we're implementing for future builds.
4. **KB backward-compat in Wave 0**: `z.preprocess()` accepts old `pipeline` field during transition. Wave 1 migrates all files and removes the compat layer.
5. **Work.sh lib module pattern**: New commands go in `scripts/lib/pipeline-*.sh` files to avoid merge conflicts between parallel sessions.
6. **Stage validation relaxed temporarily**: Wave 0 uses `z.string()` for stage validation; Wave 1 restores `z.enum()` after migration.
7. **Stream D split**: Management commands (define/status/list) in Wave 1, execution commands (start/build/end/cooldown) in Wave 2. Management is simpler and unblocks testing; execution is complex and depends on management layer.
