---
title: 'Work Orchestrator'
subtitle: 'Shell function automating worktree creation, session management, pipeline orchestration, and progress reporting'
tool: work-orchestrator
docType: overview
lastUpdated: 2026-02-17
status: current
---

## Overview

The Work Orchestrator is a Bash shell function (`work()`) in `scripts/work.sh` that provides CLI subcommands for the full development workflow. It bridges Shape Up methodology to git worktrees + Zellij terminal sessions + Claude Code instances.

Source this file in your shell profile:

```bash
source ~/Github/mokumo/scripts/work.sh
```

Then use `work <subcommand>` for all session lifecycle operations.

## Architecture

`work.sh` defines a single `work()` function that dispatches to internal `_work_*` functions based on the first argument. It sources 4 library files:

| Library                    | Purpose                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `lib/registry.sh`          | Session registry (JSON-based tracking of active/archived sessions) + persistent session store |
| `lib/kdl-generator.sh`     | Zellij KDL layout generation for tabs and sessions                                            |
| `lib/pipeline-registry.sh` | Pipeline state tracking                                                                       |
| `lib/pipeline-entity.sh`   | Pipeline entity operations                                                                    |

### Config

| Variable                  | Default                         | Purpose                     |
| ------------------------- | ------------------------------- | --------------------------- |
| `PRINT4INK_REPO`          | `~/Github/mokumo`           | Main repo (stays on `main`) |
| `PRINT4INK_WORKTREES`     | `~/Github/mokumo-worktrees` | Worktree parent directory   |
| `PRINT4INK_MAX_WORKTREES` | 15                              | Safety limit                |
| `PRINT4INK_PORT_MIN/MAX`  | 3001-3015                       | Dev server port range       |

## Key Commands

### Session Creation

| Command                            | Purpose                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `work <topic>`                     | New workstream: creates worktree from main, Zellij tab, npm install, session context, `.envrc` |
| `work <topic> <base-branch>`       | Related work: worktree from specified branch                                                   |
| `work --stack <topic>`             | Stack from current branch (auto-detects `$PWD`)                                                |
| `work <topic> --prompt "task"`     | Seed new Claude with initial prompt                                                            |
| `work <topic> --yolo`              | Skip Claude permissions (`--dangerously-skip-permissions`)                                     |
| `work <topic> --claude-args "..."` | Pass arbitrary flags to Claude CLI                                                             |

### Pipeline Phase Commands

| Command                            | Pipeline Phase                                       |
| ---------------------------------- | ---------------------------------------------------- |
| `work research <pipeline>`         | Vertical discovery + competitor research             |
| `work interview <pipeline>`        | Requirements interrogation                           |
| `work breadboard <pipeline>`       | Affordance mapping and wiring                        |
| `work plan <pipeline>`             | Implementation planning                              |
| `work build <manifest> [--wave N]` | Multi-tab Zellij layout from YAML execution manifest |
| `work polish <pipeline>`           | Post-build polish                                    |
| `work review <pipeline>`           | Quality gate + doc sync                              |
| `work learnings <pipeline>`        | Cross-cutting pattern synthesis                      |
| `work cooldown <pipeline>`         | 5-step retrospective                                 |

Phase commands auto-generate topic names (`<pipeline>-<phase>`), load phase-specific prompt templates from `scripts/prompts/`, and register sessions with vertical and stage metadata.

### Session Management

| Command                                | Purpose                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `work sessions [--vertical <name>]`    | List sessions from registry (optionally filtered)                                       |
| `work resume <topic>`                  | Resume Claude session by topic — checks persistent store first, then registry           |
| `work resume <topic> --new-worktree`   | Create fresh worktree + resume Claude session inside it (continue coding after cleanup) |
| `work fork <new-topic> <source-topic>` | Fork a session with linked context                                                      |
| `work status [<pipeline-id>]`          | Show pipeline status (auto-injects `$WORK_PIPELINE_ID` when inside a worktree)          |
| `work end [<pipeline-id>]`             | End pipeline (auto-injects `$WORK_PIPELINE_ID` when inside a worktree)                  |
| `work next`                            | AI-powered focus recommendation (runs Claude in print mode)                             |

### Utilities

| Command                           | Purpose                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `work list`                       | Quick overview: worktrees, Zellij sessions, dev server ports                           |
| `work clean <topic>`              | Remove worktree + Zellij + branch + registry entry + mark persistent store `clearedAt` |
| `work progress [--output <path>]` | Generate PROGRESS.md from live GitHub API data                                         |
| `work help`                       | Full help text                                                                         |

## Per-Worktree Environment (Added Feb 17, 2026)

When `work <topic>` creates a worktree, it writes a `.envrc` file (gitignored) that direnv loads automatically on every `cd`:

```bash
# Auto-generated by work — do not edit manually
export PORT=3007
export WORK_TOPIC="my-topic"
export WORK_BRANCH="session/0217-my-topic"
export WORK_PIPELINE_ID=""
export WORK_PIPELINE_STAGE=""
export CLAUDE_SESSION_ID=""   # filled in ~5s after Claude starts
```

`CLAUDE_SESSION_ID` is populated by the background poller after Claude creates its session file. This enables:

- `work resume <topic>` to find the session ID from the worktree's `.envrc` (or the persistent store after cleanup)
- `work status` and `work end` to auto-inject `$WORK_PIPELINE_ID` when no arg is given

## Persistent Session Store (Added Feb 17, 2026)

`.claude-sessions.json` in the main repo root (gitignored) is a durable session index that survives worktree cleanup:

```json
{
  "my-topic": {
    "sessionId": "0a1b62cb-84e6-46ff-b178-9021bb5a09ae",
    "branch": "session/0217-my-topic",
    "baseRef": "main",
    "capturedAt": "2026-02-17T13:00:00Z",
    "clearedAt": null,
    "createdAt": "2026-02-17T12:00:00Z"
  }
}
```

`clearedAt` is set when `work clean` runs — the record is **never deleted**, preserving resume capability indefinitely.

### `work resume` (Upgraded Feb 17, 2026)

```bash
# Resume in current directory (context only)
work resume my-topic

# Resume in a fresh worktree (continue coding)
work resume my-topic --new-worktree
# → creates session/MMDD-my-topic-resume from original baseRef
# → launches claude --resume <id> inside the new worktree
```

Lookup chain: persistent store → session registry fallback. Works after `work clean`.

## Context-Aware Commands (Added Feb 17, 2026)

`work status` and `work end` auto-inject `$WORK_PIPELINE_ID` from the direnv environment when no pipeline ID argument is given:

```bash
# Inside a worktree with WORK_PIPELINE_ID set by direnv:
work status              # → work status 20260217-my-pipeline (printed to stderr)
work status --verbose    # → flag detected, env var still injected correctly
work status 20260216-x   # → explicit ID overrides env var
```

The flag rejection guard (`"${arg:0:2}" != "--"`) prevents `--flags` from being treated as pipeline IDs.

## Session Polling (Upgraded Feb 17, 2026)

`_poll_claude_session_id` runs in the background after `work <topic>` launches Claude. Upgraded from flat 5s polling to two-phase:

- **Phase 1**: 1s interval for first 15s (Claude starts within ~1-2s)
- **Phase 2**: 5s interval for the remainder of `max_wait` (default 120s)

On capture: writes session ID to session registry, persistent store, and `.envrc`.

## `work progress` (Added Feb 16, 2026)

Queries GitHub API and writes a progress report to `PROGRESS.md` (gitignored — never committed):

```bash
work progress              # Write to repo root
work progress --output .   # Write to current directory
```

**Sections generated:**

| Section              | Source                               | Purpose                                       |
| -------------------- | ------------------------------------ | --------------------------------------------- |
| Milestones           | GraphQL milestone query              | Progress toward goals with issue checklists   |
| Now (priority/now)   | `gh issue list -l priority/now`      | Current cycle work                            |
| Next (priority/next) | `gh issue list -l priority/next`     | Up-next items                                 |
| Tracked In           | GraphQL sub-issue query              | Issues that are sub-issues of tracking issues |
| Recent PRs           | `gh pr list --state merged` (7 days) | Recent progress                               |
| Stale                | `gh issue list` (>30 days)           | Items needing attention                       |

Uses ~6 API calls total (GraphQL for milestones and sub-issues, REST for issues and PRs). All loops use `@tsv` extraction for safe parsing.

## `work build` (Manifest Execution)

Reads YAML execution manifests (produced by the `implementation-planning` skill) and launches parallel Zellij sessions:

```bash
work build docs/plans/manifest.yaml           # Launch wave 0 (default)
work build docs/plans/manifest.yaml --wave 1  # Launch wave 1
work build docs/plans/manifest.yaml --yolo    # Skip permissions for all sessions
```

For each session in the wave:

1. Creates a worktree from the manifest's `baseBranch`
2. Installs npm dependencies
3. Writes `.session-context.md` scratchpad
4. Writes `.envrc` with session metadata
5. Generates KDL layout for Zellij tab
6. Registers session in registry with vertical, stage, and wave metadata

Inside Zellij: opens sessions as new tabs. Outside Zellij: generates a layout file to launch.

## How It Fits

The Work Orchestrator is the bridge between methodology and execution:

- **Shape Up** defines the pipeline stages (research → interview → shape → breadboard → plan → build → review → wrap-up)
- **`work <phase>`** creates the right environment for each stage (worktree, Claude session, phase-specific prompt)
- **`work build`** enables parallel execution of implementation plan waves
- **`work progress`** connects GitHub API state to human-readable status
- **`work resume`** enables session continuity across worktree lifetimes
- **`work clean`** handles the full lifecycle cleanup (worktree + Zellij + branch + registry + persistent store `clearedAt`)

## Source

[`scripts/work.sh`](https://github.com/cmbays/mokumo/blob/main/scripts/work.sh) + library files in `scripts/lib/`.
