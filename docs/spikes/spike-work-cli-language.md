# Spike: Work CLI Implementation Language

**Issue**: [#346](https://github.com/cmbays/mokumo/issues/346) — Evaluate CLI implementation language
**Parent**: [#333](https://github.com/cmbays/mokumo/issues/333) — Work CLI Robustness
**Date**: 2026-02-17
**Status**: Complete
**Reviewed by**: Architect agent (2026-02-17) — 8 findings addressed

---

## Context

The `work` CLI (`scripts/work.sh` + `scripts/lib/*.sh`) manages the full pipeline lifecycle for Mokumo development. It was prototyped in bash for zero-dependency shell integration — sourcing directly into zsh, managing git worktrees, launching Zellij sessions, and orchestrating Claude Code instances.

**Codebase size**: 4,215 lines across 13 files (1 dispatcher + 12 library modules).

| File                   | Lines | Purpose                                                                   |
| ---------------------- | ----- | ------------------------------------------------------------------------- |
| `work.sh`              | 1,296 | Main dispatcher, session management, build orchestration, progress report |
| `pipeline-end.sh`      | 382   | Post-build: final PR, merge polling, wrap-up doc generation               |
| `pipeline-start.sh`    | 378   | Pre-build: Claude prompt construction, Zellij launch                      |
| `pipeline-entity.sh`   | 375   | Entity CRUD, state machine, type validation                               |
| `pipeline-gates.sh`    | 311   | Stage gate validation, artifact checks, human approval prompts            |
| `pipeline-build.sh`    | 300   | Build wave orchestration, base branch management                          |
| `registry.sh`          | 246   | Session registry CRUD, Claude session ID capture                          |
| `pipeline-status.sh`   | 222   | Dashboard display, deep-dive detail view                                  |
| `pipeline-registry.sh` | 191   | Pipeline registry CRUD with file locking                                  |
| `kdl-generator.sh`     | 173   | Zellij KDL layout generation from YAML manifests                          |
| `pipeline-cooldown.sh` | 143   | Batch cooldown processing                                                 |
| `pipeline-define.sh`   | 118   | Pipeline creation command                                                 |
| `pipeline-update.sh`   | 80    | Pipeline field modification                                               |

**External dependencies**: 139 `jq` invocations, 29 `yq` calls, 28 `git` calls, 21 `gh` calls, 12 `zellij` calls, 15 `tmux` calls, 30 `claude` references, 11 `npm` calls.

---

## 1. Current Pain Points

### 1.1 No Type System — Everything Is a String

Every value passes through bash as a string. Type dispatch requires manual case branches or jq conversions. This creates subtle bugs that only surface at runtime.

**Example** — `pipeline-entity.sh:24-35` (state machine validation):

```bash
_pipeline_valid_transitions() {
    local from="$1"
    case "$from" in
        ready)     printf '%s\n' "active" ;;
        active)    printf '%s\n' "building" ;;
        building)  printf '%s\n' "reviewing" ;;
        reviewing) printf '%s\n' "wrapped" "building" ;;
        wrapped)   printf '%s\n' "cooled" ;;
        cooled)    ;;
        *)         ;;
    esac
}
```

This state machine has no compiler-checked exhaustiveness. A typo like `"reviwing"` silently falls through to `*)`. In TypeScript, this would be a discriminated union with `satisfies` checking. In Go, an enum-style `iota` constant set.

**Example** — `pipeline-update.sh:32-75` (flag dispatch):

```bash
while [[ $# -gt 0 ]]; do
    case "$1" in
        --auto)     _pipeline_update_json "$pipeline_id" "auto" "true" || return 1 ;;
        --no-auto)  _pipeline_update_json "$pipeline_id" "auto" "false" || return 1 ;;
        --issue)    local issue_num="${2:?'--issue requires a value'}" ...
```

Every new flag requires manually adding a case branch. The value type (string vs JSON vs number) is known only by convention. A config-driven approach (#325) could generate this, but bash has no mechanism to generate typed code from a schema.

### 1.2 Error Propagation Is Fragile

Bash relies on return codes (`$?`) and convention. The `local` keyword silently clobbers `$?`, requiring separate declaration and assignment lines.

**Example** — `work.sh:933-936` (the workaround comment is telling):

```bash
# NB: local and assignment MUST be separate lines. In bash,
# 'local var=$(cmd)' clobbers $? with local's exit status (always 0).
local wt_err
wt_err=$(git -C "$PRINT4INK_REPO" worktree remove "$WORKTREE_DIR" --force 2>&1)
```

This pattern appears throughout the codebase. A typed language would have try/catch or Result types.

### 1.3 JSON Manipulation Is Awkward

With 139 jq invocations, the CLI is essentially a jq orchestrator. Every registry read, pipeline update, and config lookup shells out to `jq` as a subprocess.

**Example** — `pipeline-status.sh:65-66` (a single status row requires multiple jq calls):

```bash
p_type=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .type' "$PIPELINE_REGISTRY_FILE")
p_stage=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .stage' "$PIPELINE_REGISTRY_FILE")
```

Each line spawns a subprocess, re-reads the file, and re-parses it. A typed language would deserialize once and access fields directly.

Note: Even within bash, these could be consolidated into a single jq call using `@tsv` extraction (e.g., `read -r p_type p_stage <<< $(jq -r '... | "\(.type)\t\(.stage)"' ...)`). This optimization would reduce subprocess overhead without a language change — see Option E in Section 5.

**Example** — `pipeline-entity.sh:162-188` (building a JSON entity):

```bash
entity=$(jq -n \
    --arg id "$id" --arg name "$name" --arg type "$type" \
    --argjson products "$products" --argjson tools "$tools" \
    --arg stage "$first_stage" --arg created "$now" \
    '{ id: $id, name: $name, type: $type, ... }')
```

Object construction requires passing every field as a named argument. Missing a `--arg` causes a silent empty string.

### 1.4 Zsh/Bash Array Incompatibility

The code is sourced into zsh but has a bash shebang. Arrays are 0-indexed in bash, 1-indexed in zsh. The codebase works around this with manual index adjustment.

**Example** — `work.sh:614-616`:

```bash
local _arr_start=0
[[ -n "${ZSH_VERSION:-}" ]] && _arr_start=1
```

This pattern appears in both `work.sh` and `pipeline-build.sh`. It's a maintenance hazard — forget it in one place and you get off-by-one bugs that only manifest in one shell.

### 1.5 No Test Framework

There are zero tests for the work CLI. The 529 tests in the project are all Vitest schema tests for the Next.js app. Shell script testing frameworks (bats-core) exist but:

- No IDE integration (no red squiggles, no test explorer)
- Test fixtures require temp directories and cleanup
- Mocking external commands (git, gh, zellij) is manual and fragile
- No coverage reporting

### 1.6 Registry File Locking Is Manual

Both `registry.sh` and `pipeline-registry.sh` implement their own mkdir-based advisory locking. This works but is fragile — stale locks require manual cleanup.

**Example** — `pipeline-registry.sh:23-35`:

```bash
_pipeline_registry_lock() {
    local lockdir="${PIPELINE_REGISTRY_FILE}.lock"
    local attempts=0
    while ! mkdir "$lockdir" 2>/dev/null; do
        attempts=$((attempts + 1))
        if (( attempts > 50 )); then
            echo "Error: Could not acquire pipeline registry lock after 5s." >&2
            return 1
        fi
        sleep 0.1
    done
}
```

A typed language would use proper file locking primitives (flock, or a proper mutex library).

---

## 2. Startup Latency Benchmarks

All measurements on Apple Silicon (M-series), macOS Darwin 25.2.0, warm cache.

| Operation                             | Time        | Notes                                                    |
| ------------------------------------- | ----------- | -------------------------------------------------------- |
| `source work.sh` (into running shell) | **8ms**     | Near-instant. No subprocesses.                           |
| `work status` (pipeline dashboard)    | **70ms**    | 1 jq read + config lookups                               |
| `work list` (show infra)              | **537ms**   | `git worktree list` + `zellij list-sessions` + port scan |
| `node -e 'process.exit(0)'`           | **49ms**    | Node.js cold start baseline                              |
| `node` + JSON parse (2 config files)  | **54ms**    | +5ms for fs.readFileSync + JSON.parse                    |
| `bash -c 'node -e ...'` (hybrid call) | **143ms**   | bash → node subprocess overhead                          |
| `bash -c 'node + 2 JSON reads'`       | **201ms**   | bash → node with schema loading                          |
| `jq` (single query)                   | **3-4ms**   | Per-invocation subprocess cost                           |
| `npx tsx -e ...`                      | **1,639ms** | TypeScript JIT compilation — unusable                    |
| `node --version`                      | **16ms**    | Minimal node startup                                     |

**Key observations**:

- Sourcing bash is essentially free (8ms). This is unbeatable.
- `jq` is fast per-call (3-4ms) but the 134 invocations in status/display paths add up.
- Node.js cold start is ~50ms — acceptable for subcommands but noticeable for `work list`.
- `npx tsx` is 1.6 seconds — a TypeScript JIT approach without pre-compilation is not viable.
- The **hybrid penalty** (bash → node subprocess) is ~90-150ms overhead per delegation. This means hybrid commands would need to batch operations in a single node call, not make multiple small calls.

### Latency Budget by Command Class

Not all commands have equal latency sensitivity. The budget defines what's "acceptable" per class:

| Command Class                       | Examples                               | Current | Hybrid Estimate     | Budget      | Rationale                                                                    |
| ----------------------------------- | -------------------------------------- | ------- | ------------------- | ----------- | ---------------------------------------------------------------------------- |
| **Instant** (read-only, frequent)   | `work status`, `work sessions`         | 70ms    | ~150ms              | **< 200ms** | Frequent checks during active work. Must feel snappy.                        |
| **Fast** (read-only, infrequent)    | `work list`                            | 537ms   | ~537ms (stays bash) | **< 600ms** | Informational overview. Dominated by git/zellij subprocesses.                |
| **Interactive** (write, infrequent) | `work define`, `work update`           | ~100ms  | ~250ms              | **< 500ms** | One-off commands. User is about to do multi-minute work.                     |
| **Orchestration** (long-running)    | `work start`, `work build`, `work end` | 2s+     | ~2s+                | **< 5s**    | Already slow (git pull, npm install, Zellij launch). Node overhead is noise. |
| **Background** (batch)              | `work cooldown`, `work progress`       | 5-30s   | 5-30s               | **N/A**     | GitHub API calls dominate. Latency budget irrelevant.                        |

**Key constraint**: `work status` is the most latency-sensitive command that would delegate to node. At ~150ms (single node call replacing 30+ jq calls), it stays within the 200ms budget. If the hybrid implementation exceeds 200ms for `work status`, that is a signal to optimize (e.g., caching, pre-warming).

**Commands that delegate to node**: Of the ~20 subcommands in the dispatcher, approximately 8-10 would trigger a node call: `define`, `update`, `status`, `start` (prompt building only), `build` (manifest parsing only), `end` (PR body generation), `cooldown`, `progress`. The rest (`list`, `clean`, `sessions`, `resume`, `fork`, phase commands) are shell-integration heavy and stay in bash.

---

## 3. Shell Integration Analysis — What MUST Stay in Bash

Regardless of language choice, these capabilities require bash/zsh:

### 3.1 Must Stay in Bash

| Capability                                | Why                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `work()` shell function                   | Must be sourceable into zsh. Tab completion, shell aliases.                |
| `$ZELLIJ` / `$TMUX` environment detection | Parent process context — only visible from the sourced shell.              |
| `source scripts/work.sh`                  | Users add this to `.zshrc`. Non-negotiable.                                |
| `cd "$WORKTREE_DIR"`                      | Changes the calling shell's working directory. A subprocess can't do this. |
| `zellij action new-tab`                   | Must run in the Zellij context of the calling shell.                       |
| `tmux` session/window management          | Must detect and modify the calling tmux session.                           |
| `read -r` for confirmations               | Gate prompts (human-confirms) must block the calling shell.                |

### 3.2 Can Be Delegated to an External Binary

| Capability                         | Why                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Pipeline entity CRUD               | JSON read/write/validate — pure data transformation.                                                        |
| State machine transitions          | Validation logic with no shell side effects.                                                                |
| Config schema loading & validation | Parse `config/*.json`, validate values.                                                                     |
| Registry read/update/lock          | File I/O with atomic write semantics.                                                                       |
| Status dashboard formatting        | Read JSON, format output.                                                                                   |
| PR body generation                 | Template interpolation from entity data.                                                                    |
| Prompt construction                | String interpolation from pipeline context. (Depends on entity read + config loading.)                      |
| Manifest parsing (YAML)            | `yq` equivalent in native code.                                                                             |
| Port scanning                      | Subprocess call (`lsof`) with no shell-context dependency. Works identically from node via `child_process`. |

### 3.3 The Code Split: 40 / 20 / 40

The original estimate of "60% delegatable / 40% stays in bash" was imprecise. A file-level analysis gives a more accurate picture:

**~40% Pure logic** (1,568 lines) — migrates entirely to TypeScript:

- `pipeline-entity.sh` (375), `pipeline-registry.sh` (191), `registry.sh` (246), `pipeline-status.sh` (222), `pipeline-update.sh` (80), `pipeline-gates.sh` (311), `pipeline-cooldown.sh` (143)
- These files are self-contained data logic: JSON CRUD, state machine validation, config lookups, status formatting. They have no intrinsic shell-integration dependency.

**~20% Mixed logic** (850 lines) — jq calls inside shell-integration functions get replaced with single `node` calls, but the surrounding bash stays:

- Parts of `pipeline-start.sh` (prompt building delegates to node, but Zellij launch stays in bash)
- Parts of `pipeline-build.sh` (manifest parsing delegates to node, but worktree creation stays in bash)
- Parts of `pipeline-end.sh` (PR body generation delegates to node, but `gh pr create` and merge polling stay in bash)
- Parts of `pipeline-define.sh` (validation delegates to node, but `gh issue create` stays in bash)

**~40% Shell integration** (1,797 lines) — stays in bash permanently:

- `work.sh` dispatcher (1,296 lines: `_work_new`, `_work_clean`, `_work_phase`, `_work_build`, `_work_resume`, `_work_fork`, `_work_list`, `_work_sessions`, `_work_help`, `_work_progress`)
- `kdl-generator.sh` (173 lines: Zellij KDL layout rendering)
- Shell integration portions of the mixed files above

---

## 4. Evaluation Matrix

### Criteria Definitions

| #   | Criterion            | Weight | What "5" looks like                                  |
| --- | -------------------- | ------ | ---------------------------------------------------- |
| 1   | Startup latency      | HIGH   | `work status` < 200ms (see latency budget)           |
| 2   | Shell integration    | HIGH   | Seamless zsh sourcing, env vars, Zellij/tmux         |
| 3   | Schema consumption   | MEDIUM | Native JSON/YAML parsing with typed validation       |
| 4   | Testing story        | HIGH   | Unit tests with mocking, coverage, IDE integration   |
| 5   | Maintenance burden   | HIGH   | Easy to add commands/flags, compiler catches renames |
| 6   | Dependency footprint | LOW    | Minimal user-installed prerequisites                 |
| 7   | Migration path       | HIGH   | Incremental adoption without big-bang rewrite        |

### Scoring (1-5, higher is better)

| Criterion                   | A: Enhanced Bash | B: TypeScript (Node) | C: Go | D: Hybrid (TS core + bash shell) | E: Bash jq Optimization |
| --------------------------- | :--------------: | :------------------: | :---: | :------------------------------: | :---------------------: |
| **1. Startup latency**      |        5         |          3           |   5   |                4                 |            5            |
| **2. Shell integration**    |        5         |          1           |   2   |                5                 |            5            |
| **3. Schema consumption**   |        2         |          5           |   4   |                5                 |            2            |
| **4. Testing story**        |        2         |          5           |   5   |                4                 |            2            |
| **5. Maintenance burden**   |        2         |          4           |   4   |                4                 |            3            |
| **6. Dependency footprint** |        4         |          3           |   4   |                3                 |            4            |
| **7. Migration path**       |        5         |          1           |   1   |                5                 |            5            |
| **Weighted total**          |      25/35       |        22/35         | 25/35 |            **30/35**             |          26/35          |

### Detailed Scoring Rationale

**A: Enhanced Bash (25/35)**

- Startup: 5 — Sourcing is 8ms. Unbeatable.
- Shell: 5 — It IS the shell. No delegation friction.
- Schema: 2 — jq works but every access is a subprocess. No compile-time validation. Adding a field requires updating case statements in multiple files.
- Testing: 2 — bats-core exists but has no IDE integration, no coverage, and mocking external commands is painful. This is the killer weakness.
- Maintenance: 2 — No types, no compiler, no autocomplete. The zsh/bash array incompatibility is an ongoing hazard. Every new command is a copy-paste of the case/esac pattern.
- Dependencies: 4 — jq and yq are the only non-standard deps. Both install via brew.
- Migration: 5 — No migration needed. Keep building where we are.

**B: TypeScript / Node.js (22/35)**

- Startup: 3 — Node.js is ~50ms baseline, ~200ms with schema loading. Acceptable for most commands but `work list` and `work status` would feel sluggish compared to today's 70ms. `npx tsx` is 1.6s — unusable without pre-compilation.
- Shell: 1 — Cannot source into zsh. Would need a complete rewrite with a new UX (CLI binary instead of shell function). Users lose tab completion, environment variable access, and the ability to `cd` into worktrees.
- Schema: 5 — Zod validation, TypeScript inference, shared types with the Next.js app. This is the primary draw.
- Testing: 5 — Vitest with full mocking, coverage, IDE integration. Same toolchain as the app.
- Maintenance: 4 — TypeScript compiler catches type errors, renames propagate, IDE autocomplete. But the Node.js ecosystem adds churn (package updates, ESM/CJS issues).
- Dependencies: 3 — Requires Node.js (already installed), but adds a package.json with dependencies (commander, zod, etc.). The CLI would need its own build step.
- Migration: 1 — All-or-nothing. Can't source a Node.js binary into zsh. The shell integration story completely changes.

**C: Go (25/35)**

- Startup: 5 — Go binaries start in ~5ms. Single static binary with no runtime.
- Shell: 2 — Same problem as TypeScript — can't source into zsh. Would need a bash wrapper for shell integration, but the wrapper → binary call adds ~10ms overhead (much less than Node.js). Cross-compilation is easy.
- Schema: 4 — Strong typing with struct tags. JSON/YAML parsing is native. No Zod equivalent, but Go's type system is sufficient for config validation.
- Testing: 5 — `go test` with excellent mocking, benchmarking, coverage. Table-driven tests are a natural fit for state machine validation.
- Maintenance: 4 — Go compiler is strict. Renames propagate. But Go is a different language from the app — context switching overhead for a solo developer.
- Dependencies: 4 — Single binary. User needs nothing extra installed (not even Go — distribute pre-compiled binary).
- Migration: 1 — All-or-nothing rewrite. Different language, different toolchain, different mental model.

**D: Hybrid — TypeScript Core + Bash Shell (30/35)**

- Startup: 4 — Bash sourcing is still 8ms. TypeScript core is called as a subprocess (~50-200ms per delegation). Fast for shell-only commands, acceptable for data-heavy commands. The key insight: batch operations in a single Node call instead of many small calls.
- Shell: 5 — The bash shell layer is unchanged. Users still `source work.sh`, still get tab completion, still have `$ZELLIJ` detection. Shell integration stays in bash.
- Schema: 5 — TypeScript core uses Zod for config validation, shares types with the Next.js app. Pipeline entity types are defined once and used everywhere.
- Testing: 4 — TypeScript core is fully testable with Vitest. Bash shell layer has limited testing — critical paths (`_work_clean`, `_work_new`, dispatcher routing) should get bats-core integration tests. Not 5 because the bash glue code that connects everything together remains harder to test than pure TypeScript.
- Maintenance: 4 — TypeScript core benefits from compiler, autocomplete, and type safety. Bash shell layer is thin and stable (routing + shell integration). New flags can be schema-driven in the TS core.
- Dependencies: 3 — Node.js (already installed) + a project-local package. The TS core compiles to a single JS bundle.
- Migration: 5 — **Incremental by design.** Each command's logic can migrate independently: bash dispatcher stays, calls `node scripts/work-core.js <subcommand> <args>` for the data-heavy parts. Shell integration stays in bash. No big-bang rewrite.

**E: Bash jq Optimization (26/35) — Considered and Rejected**

- Startup: 5 — Same as Option A. No subprocess overhead for non-jq operations.
- Shell: 5 — Unchanged.
- Schema: 2 — jq patterns can be optimized but remain untyped. No compile-time validation.
- Testing: 2 — Same bats-core limitations as Option A.
- Maintenance: 3 — Better than raw Option A because consolidated jq calls are simpler to maintain. But still no types, no compiler, no autocomplete.
- Dependencies: 4 — Same as Option A.
- Migration: 5 — No migration. Refactor in place.

**Why E is rejected**: The jq optimization addresses the _performance_ pain point (reducing 134 subprocess calls to ~30 by batching reads) but does nothing for the _structural_ problems: no types, no compiler, no tests, zsh/bash array bugs, fragile error handling. The friction tax on adding new commands and flags remains. Option E is worth doing as a **parallel optimization** for the bash code that will NOT be migrated (the shell integration layer), but it is not a substitute for typed logic in the core.

---

## 5. Migration Path Analysis

### Option A: Enhanced Bash — No Migration

Stay where we are. Add bats-core for testing, shellcheck for linting, and accept the ceiling.

**Effort**: Low (days)
**Risk**: Low
**Ceiling**: Medium — the 134 jq calls and lack of types will continue to be a friction tax on every new feature.

### Option B: Full TypeScript — Big-Bang Rewrite

Replace the entire `work` CLI with a Node.js/TypeScript CLI binary (e.g., using commander.js or oclif).

**Effort**: High (weeks). Rewrite 4,215 lines + design new shell integration story.
**Risk**: High. Shell integration changes drastically. Users lose `source work.sh`.
**Migration**: All-or-nothing. Can't run half-bash, half-typescript.
**Blocker**: Node.js startup penalty for simple commands. Would need a daemon or socket server to amortize startup — significant complexity.

### Option C: Full Go — Big-Bang Rewrite

Replace with a Go binary. Same UX change as TypeScript but faster startup.

**Effort**: High (weeks). Different language from the rest of the project.
**Risk**: High. Chris would need to learn/maintain Go alongside TypeScript.
**Migration**: All-or-nothing. Same problem as TypeScript.
**Advantage over B**: ~5ms startup, single binary distribution.

### Option D: Hybrid — Incremental TypeScript Core (Recommended)

Keep `work.sh` as the bash dispatcher and shell integration layer. Extract pure logic into a TypeScript module that bash calls as a subprocess.

**Architecture**:

```
                                  ┌──────────────────────────┐
  User's zsh                      │  scripts/work-core/      │
  ─────────                       │  (TypeScript, compiled)   │
  source scripts/work.sh          │                          │
        │                         │  src/                    │
        ▼                         │    pipeline-entity.ts    │
  work() bash function            │    pipeline-registry.ts  │
  ├─ Shell integration            │    state-machine.ts      │
  │  (git, zellij, tmux,         │    config-loader.ts      │
  │   worktree, cd, env)         │    status-formatter.ts   │
  │                               │    gates.ts             │
  └─ Delegates data ops ──────►  │    prompt-builder.ts     │
     node dist/work-core.js       │                          │
     <subcommand> <json-args>     │  Compiled to:            │
                                  │    dist/work-core.js     │
                                  └──────────────────────────┘
```

**Package structure**: `scripts/work-core/` is a standalone package (NOT a workspace member of the main Next.js app). It has its own `package.json`, `tsconfig.json`, and `vitest.config.ts`. Minimal dependencies: `zod` (schema validation) + `yaml` (manifest parsing). No CLI framework (commander, oclif) — the bash layer handles all argument parsing and routing.

**Migration sequence** (incremental, one module at a time):

1. **Phase 0: Setup** — Create `scripts/work-core/` with package.json, tsconfig, Vitest config. Configure `esbuild` (via `tsup`) to compile `src/index.ts` → `dist/work-core.js` as a single bundled file. Add `postinstall` hook to root `package.json` that runs `npm run build:cli`.

2. **Phase 1: Pipeline entity & state machine** — Migrate `pipeline-entity.sh` logic to TypeScript. Bash calls `node dist/work-core.js entity read <id>` instead of raw jq. Tests validate state transitions exhaustively. The state machine transition graph should come from config (`pipeline-types.json`), not hardcoded — enabling new pipeline types without code changes.

3. **Phase 2: Registry operations** — Migrate `pipeline-registry.sh` and `registry.sh`. Proper file locking (via `proper-lockfile` or Node.js `fs.flock`), atomic writes, typed CRUD.

4. **Phase 3: Config loading & validation** — Migrate config schema loading. Zod schemas shared with Next.js app. `work define` validates against typed schemas instead of jq queries.

5. **Phase 4: Status & formatting** — Migrate `pipeline-status.sh` display logic. Single `node` call replaces 30+ jq invocations. Projected improvement: current `work status` with 1 pipeline takes 70ms; hybrid with single node call should take ~60ms (one file read + one config read, no subprocess-per-field overhead).

6. **Phase 5: Prompt building** — Migrate `pipeline-start.sh` prompt construction. Template interpolation in TypeScript. Note: this depends on Phase 1 (entity read) and Phase 3 (config loading) because the prompt builder calls `_pipeline_read`, `_pipeline_type_description`, `_pipeline_stage_skill_hint`, and `_pipeline_gate_artifacts`.

7. **Phase 6: Progress report** (optional — lowest priority) — The `_work_progress` function (lines 1012-1296 of `work.sh`) works well as bash. It runs infrequently, latency is irrelevant (6 GitHub API calls dominate), and `gh` CLI handles auth + pagination for free. Migrating to `@octokit/rest` would add a significant dependency and require separate auth management for negligible benefit. **Recommendation**: Keep in bash permanently unless a concrete need arises.

Each phase is independently shippable. The bash dispatcher stays unchanged. Users notice nothing except (potentially) slightly different output formatting.

**Effort**: Medium (spread over weeks). Each phase is a focused PR.
**Risk**: Low. Bash shell layer is untouched. Rollback = revert to jq calls.

### Option E: Bash jq Optimization — Considered and Rejected

Restructure the existing bash to reduce jq invocations without changing languages. For example, `pipeline-status.sh` lines 65-66 make separate jq calls per pipeline per field:

```bash
# Current: 2 subprocess calls per pipeline
p_type=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .type' "$PIPELINE_REGISTRY_FILE")
p_stage=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .stage' "$PIPELINE_REGISTRY_FILE")
```

This could be consolidated:

```bash
# Optimized: 1 subprocess call per pipeline
read -r p_type p_stage <<< $(jq -r --arg id "$id" \
    '.pipelines[] | select(.id == $id) | "\(.type)\t\(.stage)"' \
    "$PIPELINE_REGISTRY_FILE")
```

Across the full codebase, this optimization could reduce 134 jq calls to ~30-40 by batching reads with `@tsv` extraction. This would meaningfully improve `work status` performance (from 70ms to perhaps 40-50ms).

**Why rejected as the primary strategy**: This addresses performance but not the structural problems (no types, no tests, no compiler, zsh/bash array bugs). The ceiling is still medium.

**Why preserved as a parallel track**: The ~40% of code that stays permanently in bash (shell integration layer) should still use optimized jq patterns. Batch reads with `@tsv` wherever the bash layer reads pipeline data. This reduces latency in the transition period while modules migrate, and permanently improves the bash code that remains.

---

## 6. Serialization Contract

The boundary between bash and the TypeScript core is the most critical design decision in the hybrid architecture. This section defines the contract.

### 6.1 Invocation Pattern

Bash calls the TypeScript core as a single node subprocess:

```bash
# General form
result=$(node "${WORK_SCRIPT_DIR}/work-core/dist/work-core.js" <command> <subcommand> [--flags] 2>/dev/null)

# Examples
result=$(node "$WORK_CORE" entity read "$pipeline_id")
result=$(node "$WORK_CORE" entity create --name "$name" --type "$type" --products "$products")
result=$(node "$WORK_CORE" status dashboard)
result=$(node "$WORK_CORE" config validate --type "$type")
```

The `WORK_CORE` variable is resolved once at source-time in `work.sh`:

```bash
WORK_CORE="${WORK_SCRIPT_DIR}/work-core/dist/work-core.js"
```

**Path resolution**: Because `WORK_SCRIPT_DIR` is resolved when `work.sh` is sourced (from `.zshrc`), it always points to the main repo's copy (`~/Github/mokumo/scripts/`). Worktree-local changes to the TypeScript core do NOT take effect until merged to main and the shell is re-sourced. This is intentional — the running `work` CLI uses the stable main-branch binary.

### 6.2 Environment Contract

The node process inherits the calling shell's environment. The TypeScript core reads these variables:

| Variable              | Required | Source                 | Purpose                                     |
| --------------------- | -------- | ---------------------- | ------------------------------------------- |
| `PRINT4INK_ROOT`      | Yes      | `work.sh` config block | Resolve config file paths (`config/*.json`) |
| `PRINT4INK_WORKTREES` | Yes      | `work.sh` config block | Locate pipeline and session registries      |
| `PRINT4INK_GH_REPO`   | No       | `work.sh` config block | GitHub owner/repo for API calls (future)    |

The node process does NOT need or use: `ZELLIJ`, `TMUX`, `ZSH_VERSION`, `WORK_SCRIPT_DIR`. These are shell-context variables consumed only by the bash layer.

### 6.3 Output Protocol

The TypeScript core uses two output modes, determined by the command:

**Data mode** (for commands where bash consumes the output):

```json
{"ok": true, "data": { ... }}
{"ok": false, "error": "Pipeline 'xyz' not found", "code": "ENTITY_NOT_FOUND"}
```

Bash checks the `ok` field:

```bash
result=$(node "$WORK_CORE" entity read "$id" 2>/dev/null)
if ! echo "$result" | jq -e '.ok' >/dev/null 2>&1; then
    echo "Error: $(echo "$result" | jq -r '.error')" >&2
    return 1
fi
# Extract data
p_name=$(echo "$result" | jq -r '.data.name')
```

**Display mode** (for commands where output goes directly to the user):

```
=== Pipeline Status (1 pipeline) ===

--- Active (pre-build) (1) ---
  20260216-review-orchestration  horizontal  stage=research  issue=#302
    progress: stage 1/5 (research)
```

Display mode writes plain text to stdout. Bash passes it through unchanged:

```bash
node "$WORK_CORE" status dashboard
# Output goes directly to terminal, no parsing needed
```

### 6.4 Error Protocol

| Scenario                         | Stdout                                         | Stderr               | Exit Code |
| -------------------------------- | ---------------------------------------------- | -------------------- | --------- |
| Success (data mode)              | `{"ok": true, "data": ...}`                    | (empty)              | 0         |
| Application error (data mode)    | `{"ok": false, "error": "...", "code": "..."}` | (empty)              | 1         |
| Success (display mode)           | Formatted text                                 | (empty)              | 0         |
| Application error (display mode) | (empty)                                        | Error message text   | 1         |
| Node crash / unhandled exception | (empty)                                        | Stack trace          | 1         |
| `dist/work-core.js` missing      | (empty)                                        | "Cannot find module" | 1         |

Bash handles the "missing binary" case gracefully:

```bash
if [[ ! -f "$WORK_CORE" ]]; then
    echo "Error: work-core not built. Run: cd scripts/work-core && npm run build" >&2
    return 1
fi
```

### 6.5 Debug Mode

Pass `--debug` to enable verbose logging on stderr:

```bash
node "$WORK_CORE" entity read "$id" --debug
# stderr: [work-core] Reading pipeline registry: /path/to/.pipeline-registry.json
# stderr: [work-core] Found pipeline: 20260216-review-orchestration
# stdout: {"ok": true, "data": { ... }}
```

Debug output goes to stderr so it doesn't interfere with data mode parsing. The bash layer can optionally propagate a `WORK_DEBUG` environment variable.

---

## 7. Compilation Strategy

### 7.1 Toolchain: tsup (esbuild wrapper)

**Decision**: Use `tsup` to compile TypeScript to a single JavaScript file.

| Alternative           | Why not                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `tsc`                 | Outputs multiple files, requires `node_modules` at runtime for imports.                            |
| Raw `esbuild`         | Works but requires manual config. `tsup` wraps it with sensible defaults.                          |
| `npx tsx` (JIT)       | 1.6 second startup — unusable.                                                                     |
| `pkg` / `bun compile` | Native binary compilation adds build complexity for negligible benefit on a single-developer tool. |

`tsup` produces a single `dist/work-core.js` with all dependencies bundled. No `node_modules` needed at runtime.

### 7.2 Build Strategy: Built on Install

**Decision**: Build via `postinstall` hook, NOT checked into git.

| Strategy                      | Pros                                                                    | Cons                                                              |
| ----------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Built on install** (chosen) | No generated code in git. No merge conflicts from concurrent worktrees. | Requires `npm install` before `work` commands use TS core.        |
| Checked into git              | Works without build step.                                               | Merge conflicts when two worktrees modify TS core. Pollutes diff. |

Implementation:

```json
// Root package.json
{
  "scripts": {
    "postinstall": "cd scripts/work-core && npm install && npm run build",
    "build:cli": "cd scripts/work-core && npm run build"
  }
}
```

```json
// scripts/work-core/package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs --out-dir dist --clean",
    "dev": "tsup src/index.ts --format cjs --out-dir dist --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

The `dist/` directory is gitignored. Every `npm install` (which already runs in every new worktree) builds the CLI core automatically.

### 7.3 Graceful Degradation

If `dist/work-core.js` doesn't exist (e.g., first clone before `npm install`), the bash layer falls back to the existing jq-based implementation. This is critical during the migration period when both code paths exist:

```bash
_work_core_available() {
    [[ -f "${WORK_CORE:-}" ]]
}

# Example: pipeline read with fallback
_pipeline_read() {
    local id="$1"
    if _work_core_available; then
        node "$WORK_CORE" entity read "$id"
    else
        # Legacy jq fallback
        _registry_pipeline_get "$id"
    fi
}
```

This fallback pattern enables the migration to proceed module by module without breaking anyone's workflow.

---

## 8. Testing Strategy

### 8.1 TypeScript Core (Vitest)

The TypeScript core is fully testable with Vitest. Target: 90%+ coverage on core logic.

**Unit tests** for:

- State machine transitions (exhaustive: every state × every possible input)
- Entity CRUD (create, read, update, delete, field validation)
- Config schema validation (valid and invalid inputs for each config file)
- Registry locking (concurrent access, stale lock recovery)
- Status formatting (snapshot tests for display output)

**Integration tests** for:

- Full command roundtrips: `entity create` → `entity read` → verify fields
- Config loading from real `config/*.json` files

### 8.2 Bash Shell Layer (bats-core)

The hybrid model does NOT solve the testing problem for the shell integration layer. The bash code that connects everything together — the dispatcher, worktree creation, cleanup, Zellij integration — remains harder to test. But it is not untestable.

**Critical paths that need bats-core tests**:

- `_work_clean` — The most complex cleanup logic (CWD safety, 5-phase resource cleanup). Bugs here lose work.
- `_work_new` — Worktree creation, port scanning, Zellij layout generation. Bugs here block developers.
- Dispatcher routing — Ensure all subcommands route correctly (regression guard for typos).
- The zsh/bash array index adjustment — A dedicated test that runs in both shells to catch off-by-one bugs.

**What NOT to test in bats-core**: Data logic that is migrating to TypeScript. Writing bash tests for `_pipeline_create` or `_pipeline_transition` is wasted effort if those functions will be replaced by `node "$WORK_CORE" entity create`.

**Sequencing**: Add bats-core tests AFTER the TypeScript core migration stabilizes (Phase 3+), when the bash layer's responsibilities are clear and stable. Don't invest in bash tests for code that will be rewritten.

### 8.3 End-to-End Tests

After both layers are tested independently, add integration tests that exercise the full bash → node → bash flow:

- `work define <name>` → verify pipeline appears in registry JSON
- `work update <id> --auto` → verify field change persists
- `work status` → verify output matches expected format

These can be bats-core tests that call `work` commands and assert on output/side effects.

---

## 9. Recommendation

### Recommended: Option D — Hybrid (TypeScript Core + Bash Shell)

**Rationale**:

1. **Preserves what works**: Shell integration (sourcing, env vars, Zellij/tmux, worktree creation) stays in bash. Users see zero UX change. The `work()` function stays exactly as it is.

2. **Fixes the core problem**: The 134 jq invocations, untyped state machine, manual flag dispatch, and untestable logic all move to TypeScript where they get Zod validation, Vitest tests, and compiler checking.

3. **Incrementally adoptable**: Unlike Options B and C, the hybrid approach doesn't require a big-bang rewrite. Each module migrates independently. If we hit a problem with one module, the bash fallback still works.

4. **Shared type system**: Pipeline entity schemas defined in Zod can be shared between the work CLI and the Next.js app. When Phase 2 adds a Drizzle database, the same types flow from CLI → app → database.

5. **Acceptable startup penalty**: The hybrid adds ~50-200ms for commands that delegate to Node.js. The most latency-sensitive delegated command (`work status`) stays within the 200ms budget by batching all data operations in a single `node` call.

6. **Testing story covers both layers**: TypeScript core is fully testable with Vitest (90%+ coverage). Bash shell layer gets bats-core tests for critical paths (`_work_clean`, `_work_new`, dispatcher). E2E tests validate the full flow.

### What NOT to do

- **Don't compile to a native binary** (pkg, bun compile, Deno compile). The build complexity isn't worth it for a developer tool used by one person.
- **Don't use `npx tsx`** for runtime execution. It's 1.6 seconds. Pre-compile with `tsup` instead.
- **Don't try to eliminate bash entirely**. Shell integration is bash's superpower. Trying to replicate `source`, `$ZELLIJ`, and `cd` from TypeScript adds more complexity than it removes.
- **Don't write bats-core tests for data logic** that will be rewritten in TypeScript. Wait until the TypeScript core migration stabilizes, then write bats-core tests for the shell integration layer that remains.
- **Don't migrate the progress report** (`_work_progress`). It works well in bash, runs infrequently, and `gh` CLI handles auth/pagination for free. Adding `@octokit/rest` is not worth the dependency.

### Implementation Sequencing

Given the dependencies mapped in the previous session:

1. **This spike** → decision made (Option D: Hybrid)
2. **Phase 0** — Set up `scripts/work-core/` with tsup, Vitest, and the serialization contract.
3. **#327 (config-driven `work define`)** — implement in TypeScript core as the pilot migration. This is the cleanest module to extract because `pipeline-define.sh` is only 118 lines and mostly delegates to `_pipeline_create` in entity.sh.
4. **#330 (pipeline state machine as config)** — extract to TypeScript. Define the state machine as a typed graph with exhaustive transition checking. The transition graph should come from config (`pipeline-types.json`), enabling new pipeline types without code changes.
5. **#332 (config-driven help text)** — generate help from TypeScript-defined schemas.
6. **#335 (Zellij auto-launch)** — this stays in bash (shell integration). Independent of the hybrid migration.
7. **#298 (E2E validation)** — now testable: write Vitest tests for the TypeScript core, bats-core integration tests for the bash shell layer.
8. **Parallel track**: Apply Option E jq optimizations to the bash code that remains permanently.

### Risks and Mitigations

| Risk                                          | Mitigation                                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js startup adds latency                  | Batch operations in single `node` calls. Use `tsup`/`esbuild` for single-file output. Latency budget per command class (Section 2).      |
| Two languages to maintain                     | Bash layer is ~40% of code but thin and stable (routing + shell integration). It changes rarely after initial build.                     |
| `dist/work-core.js` not built yet             | Graceful degradation: bash falls back to jq-based implementation when binary missing (Section 7.3).                                      |
| TypeScript core grows its own dependency tree | Keep deps minimal: `zod` + `yaml`. No framework (commander, oclif).                                                                      |
| Debugging across bash → node boundary         | Structured JSON output protocol (Section 6.3). `--debug` flag for verbose stderr logging (Section 6.5).                                  |
| Serialization contract drift                  | Define contract once in this spike (Section 6). TypeScript types enforce output shape.                                                   |
| Concurrent worktree build conflicts           | `dist/` is gitignored, built via `postinstall`. Each worktree builds independently. Running shell uses main-branch binary (Section 6.1). |
| Shell layer remains under-tested              | bats-core tests for critical paths post-Phase 3. E2E tests validate full flow (Section 8).                                               |

---

## Appendix: Raw Benchmark Data

```
Environment: macOS Darwin 25.2.0, Apple Silicon, Node.js v25.5.0

source work.sh:           0.008s (8ms)
work status (dashboard):  0.070s (70ms)
work list (infra):        0.537s (537ms) — dominated by git/zellij/lsof subprocess calls

node -e 'exit':           0.049s (49ms)
node + 2 JSON reads:      0.054s (54ms)
node --version:           0.016s (16ms)
npx tsx -e 'exit':        1.639s (1,639ms)

bash -> node subprocess:  0.143s (143ms)
bash -> node + schemas:   0.201s (201ms)

jq single query:          0.003s (3ms)
jq config file read:      0.004s (4ms)

Go: not installed (benchmark unavailable — estimated 5-10ms from published data)
Bun: not installed
Deno: not installed
```

---

_Generated by Claude Code session `session/0217-language-spike` for issue #346._
_Architect review: 8 findings addressed (2026-02-17)._
