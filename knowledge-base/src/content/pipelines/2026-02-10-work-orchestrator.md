---
title: 'work() — Worktree Orchestrator'
subtitle: 'Single command to create worktrees, tmux sessions, and launch Claude — with Agent Teams integration via tmux hook.'
date: 2026-02-10
phase: 1
pipelineName: devx
pipelineType: horizontal
products: []
tools: [work-orchestrator]
stage: build
tags: [build, feature]
sessionId: 'c2b2fb1b-b94a-4b17-bab0-3616c520c716'
branch: 'session/0210-worktree-migration'
status: complete
---

## Why

Manual worktree setup requires 4-5 commands per session: pull main, create worktree, install deps, find available port, open terminal and launch Claude. There's no grouping of related sessions, no consistent branch naming, and Agent Teams' `split-window` approach destroys tmux layouts at scale ([#23615](https://github.com/anthropics/claude-code/issues/23615)).

## What It Does

A single `work <topic>` shell function handles everything: worktree creation from main repo, npm install, port scanning, tmux session/window creation, Claude launch, and an `after-split-window` hook that auto-converts Agent Teams panes into proper windows.

| Metric | Value         |
| ------ | ------------- |
| 1      | Command       |
| ~220   | Lines of Bash |

## Ghostty + Tmux Architecture

```
Ghostty Quick Terminal (hotkey toggle)
+- Pane 1 (you split manually)
|  +- tmux session: "main"
|      +- window: main Claude (planning)
|
+- Pane 2 (you split manually, Claude gives command)
|  +- tmux session: "invoicing-schema"
|      +- window: invoicing-schema  <- work invoicing-schema
|      +- window: invoicing-ui      <- Claude runs work (stacked)
|      +- window: (auto)            <- Agent Teams (hook)
|      +- window: (auto)            <- Agent Teams (hook)
|
+- Pane 3 (you split manually)
   +- tmux session: "customer-export"
       +- window: customer-export  <- work customer-export
```

**Two modes:**

- **New workstream** (`work <topic>`) → detached tmux session. Claude gives you the command; you attach from a new Ghostty pane.
- **Related work** (`work <topic> <base>`) → new window/tab in parent's tmux session. Claude does this automatically; no pane splitting needed.
- **Agent Teams** → pane splits auto-convert to windows via `after-split-window` hook. All agents appear as tabs in the same session.
- **`--prompt`** → seeds the new Claude with an initial task via `tmux send-keys`.

## Commands Reference

| Command                                     | What It Does                                              |
| ------------------------------------------- | --------------------------------------------------------- |
| `work <topic>`                              | New workstream: detached tmux session + worktree + Claude |
| `work <topic> <base>`                       | Related work: window in parent's tmux session + worktree  |
| `work <topic> --prompt "..."`               | Seed new Claude with an initial task prompt               |
| `work --stack <topic>`                      | Stack from current branch (auto-detects from $PWD)        |
| `work list`                                 | Show sessions, windows, worktrees, ports                  |
| `work focus`                                | Read-only tiled monitor of all windows in current session |
| `work unfocus`                              | Exit focus mode                                           |
| `work clean <topic>`                        | Remove worktree + tmux + branch (with confirmation)       |
| `work build <manifest> [--wave N] [--yolo]` | Execute build from YAML manifest (see below)              |

## Manifest-Driven Builds

`work build` reads a YAML execution manifest (produced by the `implementation-planning` skill) and launches Zellij tabs with Claude sessions for each task in a wave.

```bash
# Wave 0 (foundation, serial — 1 session)
work build docs/plans/2026-02-15-colors-manifest.yaml --yolo

# Wave 1 (parallel — 3 sessions open as Zellij tabs)
work build docs/plans/2026-02-15-colors-manifest.yaml --wave 1 --yolo

# Without --yolo (Claude prompts for permissions)
work build docs/plans/2026-02-15-colors-manifest.yaml --wave 2
```

**What it does per wave:**

1. Pulls latest main
2. Creates a worktree + branch per session (`session/MMDD-<topic>`)
3. Runs `npm install` in each worktree
4. Writes the session prompt to `.session-prompt.md` (gitignored)
5. Generates a Zellij KDL layout and opens tabs (or prints launch command if outside Zellij)

**Flags:**

- `--wave N` — which wave to run (0-indexed, default: 0)
- `--yolo` — passes `--dangerously-skip-permissions` to all Claude sessions
- `--claude-args "..."` — pass arbitrary CLI flags to Claude

**Wave progression is manual** — you review and merge Wave N's PRs before running `--wave N+1`. The script prints the next command at completion.

**Requires:** `yq` (`brew install yq`) for YAML manifest parsing.

## Agent Teams Integration

Claude Code's Agent Teams uses `tmux split-window -h` for each spawned agent. This is buggy at scale. Our fix:

1. Every `work`-created tmux session gets an `after-split-window` hook
2. When Claude's TeamCreate splits a pane for an agent, the hook fires
3. `break-pane` extracts the new pane into its own window (process keeps running)
4. Each agent becomes a navigable window (`Ctrl+b n` to cycle)

The hook is scoped to `work`-created sessions only — doesn't affect other tmux usage.

## Focus / Unfocus

`work focus` creates a **separate read-only tmux session** that mirrors each window's output via `tmux capture-pane`. The original session and all its windows are completely untouched.

- `Ctrl+b z` in focus mode zooms one pane for detailed reading
- `Ctrl+b s` switches back to the original session for interaction
- `work unfocus` kills the focus session and returns

## Workflow Examples

### 1. New workstream (you split the Ghostty pane)

```
# Claude says: "Run this in a new Ghostty pane:"
work invoicing-schema --prompt "Build the Zod schemas per docs/strategy/..."
# Then in a new Ghostty pane:
tmux attach -t invoicing-schema
# Claude is already running with your prompt
```

### 2. Related work (Claude does this automatically)

```
# Claude runs this from within the invoicing-schema session:
work invoicing-ui session/0210-invoicing-schema --prompt "Build UI components"
# New tab appears in the invoicing-schema tmux session
# Navigate: Ctrl+b n (next) or Ctrl+b w (tree)
```

### 3. Agent Teams (fully automatic)

```
# Inside a work-created session, Claude uses TeamCreate
# TeamCreate splits panes -> hook converts to windows
# All agents appear as tabs: Ctrl+b n to cycle
work focus                             # Monitor all agents tiled
```

### 4. Full example — workstream + stacked + Agent Teams

```
# You: split Ghostty pane, run:
work invoicing-schema

# Claude spawns related work (new tabs in same session):
work invoicing-ui session/0210-invoicing-schema --prompt "Build UI"
work invoicing-tests session/0210-invoicing-schema --prompt "Write tests"

# Claude also uses TeamCreate for parallel agents (auto-converted to tabs)
# Session now has: invoicing-schema, invoicing-ui, invoicing-tests, agent-1, agent-2
work focus                             # See all 5 tiled
```

## Tmux Navigation Cheatsheet

| Shortcut       | Action                               |
| -------------- | ------------------------------------ |
| `Ctrl+b s`     | Session picker (all features)        |
| `Ctrl+b n`     | Next window (cycle agents)           |
| `Ctrl+b p`     | Previous window                      |
| `Ctrl+b w`     | Window tree (all sessions + windows) |
| `Ctrl+b z`     | Zoom pane (in focus view)            |
| `work unfocus` | Exit focus mode                      |

## Setup

One-time setup (already done):

```
# Added to ~/.zshrc
[[ -f ~/Github/mokumo/scripts/work.sh ]] && source ~/Github/mokumo/scripts/work.sh
```

The script is sourced (not executed), so it defines the `work()` function in your shell. Uses absolute paths internally, works from any directory.

## Safety Guarantees

- Always operates from main repo (`~/GitHub/mokumo`), never from `$PWD`
- Pulls latest main before branching (skips for stacked PRs)
- Checks branch doesn't already exist before creating
- Enforces max 6 worktrees with warning
- Port scanning finds first available port (3001-3010)
- `work clean` requires `y` confirmation before destructive actions
