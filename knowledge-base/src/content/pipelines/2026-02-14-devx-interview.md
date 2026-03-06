---
title: 'DevX Vertical — Workflow Interview'
subtitle: 'Comprehensive interview on parallel AI workflow, session management, automation, and developer experience optimization'
date: 2026-02-14
phase: 1
pipelineName: devx
pipelineType: horizontal
products: []
tools: [work-orchestrator, skills-framework, agent-system, knowledge-base, ci-pipeline]
stage: interview
tags: [decision, plan]
sessionId: '52e1d723-fdca-4d58-8f13-3393cf803335'
branch: 'session/0214-devx-interview'
status: complete
---

| Metric | Value                        |
| ------ | ---------------------------- |
| 4      | Interview Rounds             |
| 25+    | Decisions Made               |
| 8      | Pipeline Stages Defined      |
| 12+    | New Skills/Agents Identified |

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Pipeline Design](#3-pipeline-design)
4. [Terminal Architecture](#4-terminal-architecture)
5. [Session Management](#5-session-management)
6. [The `work` Function v2](#6-the-work-function-v2)
7. [Knowledge Base Strategy](#7-knowledge-base-strategy)
8. [Skills & Agents Gap Analysis](#8-skills--agents-gap-analysis)
9. [Build Session Protocol](#9-build-session-protocol)
10. [Project Management](#10-project-management)
11. [Context Management Strategy](#11-context-management-strategy)
12. [Permissions Optimization](#12-permissions-optimization)
13. [Key Decisions Log](#13-key-decisions-log)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Executive Summary

The DevX vertical focuses on optimizing how we develop Mokumo — the parallel AI workflow, session management, automation, and tooling that enables building verticals faster with better quality and traceability.

**Core insight**: Separate concerns across four layers:

- **Git worktrees** = code storage (on disk, deletable, recreatable)
- **Claude sessions** = conversation context (in `~/.claude/projects/`, persistent)
- **Terminal sessions** = workspace view (ephemeral, recreatable from layouts)
- **KB docs** = human + AI knowledge (permanent record)

The `work` shell function becomes the orchestration layer connecting all four, with phase-specific commands that wire in the right skills, agents, and automation for each pipeline stage.

## 2. Problem Statement

### Pain Points Identified

1. **CWD orphaning**: Claude launches inside worktrees; deleting worktree kills Claude's working directory and makes session resume find nothing
2. **Session management chaos**: No cross-referencing between Claude session IDs, git branches, KB docs, and terminal sessions
3. **Manual toil**: Creating sessions, naming things, scaffolding KB docs, running reviews — all manual and inconsistent
4. **Underutilized skills/agents**: Existing tooling (feature-strategist, requirements-interrogator, screen-builder, etc.) not consistently invoked because nobody remembers to use them
5. **Permission fatigue**: Constantly prompted for safe operations due to incorrect pattern syntax in settings.json
6. **No build completion protocol**: Claude finishes building but doesn't self-review, create PRs, or produce merge checklists
7. **Context bloat**: Long sessions accumulate irrelevant context; unclear when to compact vs. split
8. **No project management integration**: GitHub Issues not used consistently; no roadmap visibility; no "what's next?" capability
9. **Send-keys broken**: Can't reliably spawn Claude in new terminal windows with initial prompts
10. **No learnings capture**: Knowledge gets lost between sessions; no synthesis mechanism

### Current State

- 2-4 parallel Claude sessions + 1 scratchpad/"secretary" session typical
- Using tmux (but switching to Zellij)
- `work.sh` function exists but is tmux-only, no session registry, no phase awareness
- KB docs created per session but not consistently linked to sessions/branches
- Vertical pipeline: research → interview → breadboard → impl plan → build (waves) → review → learnings
- Reviews happen but inconsistently; Code Rabbit used but not automated into workflow
- Claude Max plan ($200/mo), ~75-80% weekly usage, 64% at time of interview

## 3. Pipeline Design

### The 8-Stage Vertical Pipeline

| #   | Stage          | Sessions                       | Automation Level                                  | KB Doc                                     |
| --- | -------------- | ------------------------------ | ------------------------------------------------- | ------------------------------------------ |
| 1   | **Research**   | 1 (agent team: 4+ sub-agents)  | High — agents run autonomously                    | `{vertical}-research.md`                   |
| 2   | **Interview**  | 1 (manual with user)           | Medium — interrogator + auto Gary tracking        | `{vertical}-interview.md`                  |
| 3   | **Breadboard** | 1 (solo, runs to full context) | Medium — follows breadboarding skill              | `{vertical}-breadboard.md`                 |
| 4   | **Plan**       | 1 (solo + agents)              | High — produces YAML execution manifest           | `{vertical}-impl-plan.md`                  |
| 5   | **Build**      | N (waves, parallel sessions)   | High — `work execute` + build protocol            | `{vertical}-build-overview.md` + wave docs |
| 6   | **Polish**     | 1-2 (iterative with user)      | Low — user-driven smoke testing + fixes           | `{vertical}-polish.md`                     |
| 7   | **Review/QA**  | 1 (agent team)                 | High — quality gate + cross-vertical + doc sync   | `{vertical}-review.md`                     |
| 8   | **Learnings**  | 1 (synthesis)                  | High — reads all prior KB docs, extracts patterns | `{vertical}-learnings.md`                  |

### Stage Characteristics

- **Research**: 4+ parallel agents: competitor analysis, industry best practices, consumer pain points, internal repo integration analysis, UI/UX patterns. Feature strategist + fire crawl + explore agents. Autonomous.
- **Interview**: Requirements interrogator skill. User is full-focus. Any "I don't know" automatically tagged for Gary Tracker. Produces structured artifact with decisions.
- **Breadboard**: Solo Claude with breadboarding skill. Architecture mapping: places, affordances, wiring, component boundaries. Produces Mermaid diagrams. Usually fills full context.
- **Plan**: Produces both human-readable implementation plan AND machine-readable YAML execution manifest. Defines waves, parallelization, session prompts, dependencies.
- **Build**: `work execute <manifest>` spawns waves. Each session follows build session protocol (build → self-review → PR → CodeRabbit → address → merge checklist). Multiple waves, each potentially with multiple parallel sessions.
- **Polish**: User smoke tests on dev server. Iterative UX gap-finding. Unpredictable duration. New session to avoid build context bloat.
- **Review/QA**: Formal quality gate (15-dimension design audit). Cross-vertical analysis. Doc sync. Issue filing for remaining items. Comprehensive final check.
- **Learnings**: Dedicated synthesis session reads all prior KB docs for the vertical. Extracts cross-cutting patterns, gotchas, improvements for the canonical pipeline. Updates memory files.

## 4. Terminal Architecture

### Decision: Zellij over tmux

**Rationale**: Zellij's native KDL layout files enable declarative one-touch execution. Each build wave generates a KDL file that Zellij launches directly with `command` + `args` per pane — no send-keys timing hacks. Better UX for someone new to terminal multiplexers.

**Key Zellij features leveraged**:

- KDL layout files: version-controllable, generated from YAML manifests
- `command` + `args` per pane: direct process launch, bypasses TUI interaction issues
- Floating panes: monitoring without layout disruption
- `zellij action`: programmatic pane/tab manipulation
- Named sessions with persistence

**Migration**: Rewrite `work.sh` from tmux to Zellij. Keep tmux installed as fallback.

### CWD Architecture

**Decision**: Launch Claude from worktrees parent directory.

```
~/Github/mokumo-worktrees/    ← Claude launches HERE
  ├── CLAUDE.md                   ← symlink → mokumo/CLAUDE.md
  ├── .session-registry.json      ← session cross-reference registry
  ├── session/0214-jobs-w1-schemas/  ← worktree (deletable)
  └── ...
```

All Claude sessions store transcripts at: `~/.claude/projects/-Users-cmbays-Github-mokumo-worktrees/`

Deleting any worktree subdirectory has no impact on session storage. `claude --resume <id>` works from the parent dir anytime.

## 5. Session Management

### Session Registry

JSON file at `~/Github/mokumo-worktrees/.session-registry.json`:

```json
{
  "sessions": [
    {
      "topic": "jobs-w2-kanban",
      "branch": "session/0215-jobs-w2-kanban",
      "claudeSessionId": "uuid-here",
      "claudeSessionName": "jobs-w2-kanban",
      "kbDoc": "2026-02-15-jobs-build-wave2.md",
      "terminalSession": "jobs-w2-kanban",
      "vertical": "jobs",
      "stage": "build",
      "wave": 2,
      "status": "active",
      "prNumber": null,
      "parentSessionId": null,
      "forkedFrom": null,
      "createdAt": "2026-02-15T10:00:00Z",
      "completedAt": null
    }
  ]
}
```

### Naming Conventions

| Type                   | Pattern                                   | Example                               |
| ---------------------- | ----------------------------------------- | ------------------------------------- |
| Pipeline stage         | `session/MMDD-{vertical}-{stage}`         | `session/0214-jobs-research`          |
| Build wave             | `session/MMDD-{vertical}-w{N}-{topic}`    | `session/0215-jobs-w2-kanban`         |
| Build overview         | `session/MMDD-{vertical}-build-overview`  | `session/0215-jobs-build-overview`    |
| Polish                 | `session/MMDD-{vertical}-polish`          | `session/0217-jobs-polish`            |
| Fork (experimentation) | `session/MMDD-{vertical}-{stage}-explore` | `session/0215-jobs-w2-kanban-explore` |

Claude session names mirror the branch topic portion (e.g., `jobs-w2-kanban`).

### Forking

Using `claude --resume <id> --fork-session`:

- Creates a NEW session ID with old conversation history preserved
- Original session unchanged
- Integrated via `work fork <topic> <source-session-id>`
- Use case: experimentation, debugging alternative approaches
- Convention: append `-explore` to topic name
- Discard forks freely; only the chosen path gets a KB doc

### Session Resume

- `work resume <topic>` — looks up session ID in registry, runs `claude --resume <id>`
- Works from worktrees parent dir regardless of whether original worktree still exists
- Session transcripts persist at `~/.claude/projects/` independently of worktrees

## 6. The `work` Function v2

### Phase-Specific Commands

Each command is a shortcut that resolves to a manifest + automation under the hood:

```bash
# Phase commands
work research <vertical>              # Launch research agent team
work interview <vertical>             # Launch requirements interrogator
work breadboard <vertical>            # Launch breadboarding session
work plan <vertical>                  # Launch implementation planning session
work execute <manifest> [--wave N]    # One-touch build execution
work polish <vertical>                # Launch polish session
work review <vertical>                # Launch quality gate + review
work learnings <vertical>             # Launch synthesis session

# Session management
work sessions                         # Show registry: branch ↔ session ↔ KB doc
work resume <topic>                   # Resume Claude session from registry
work fork <topic> <source-id>         # Fork a session into new worktree
work status                           # Global dashboard: all active work
work next                             # What should I focus on next?
work clean <topic>                    # Archive → registry, remove worktree + terminal

# Utilities
work list                             # Show worktrees + terminal sessions + ports
work help                             # Usage reference
```

### `work execute` Flow

1. Read YAML execution manifest
2. Check wave dependencies (prior wave PRs merged?)
3. Create worktrees for all sessions in the wave
4. Generate Zellij KDL layout from manifest
5. Launch Zellij with the layout (Claude starts per tab with prompt)
6. Register all sessions in the registry
7. Claude sessions follow build session protocol autonomously
8. User monitors, intervenes on UX issues
9. PRs created, reviewed, merged
10. Run `work execute <manifest> --wave N+1` for next wave

### Phase Command Automation

Each `work <phase>` command:

1. Creates worktree + Zellij tab
2. Invokes the right skills/agents for that phase
3. Scaffolds KB doc with frontmatter
4. Registers session in registry
5. Passes phase-specific prompt to Claude

Example: `work research jobs` →

- Creates worktree `session/0214-jobs-research`
- Opens Zellij tab
- Starts Claude with prompt: "You are researching the Jobs vertical. Use the vertical-discovery skill. Launch agent team: competitor analysis, industry best practices, consumer research, internal repo analysis, UI/UX patterns. Use fire crawl for web research. Read docs/PRD.md for scope. Produce research KB doc."
- Registers in session registry
- Claude runs autonomously

## 7. Knowledge Base Strategy

### Doc Structure Per Vertical

```
sessions/
  YYYY-MM-DD-{vertical}-research.md
  YYYY-MM-DD-{vertical}-interview.md
  YYYY-MM-DD-{vertical}-breadboard.md
  YYYY-MM-DD-{vertical}-impl-plan.md
  YYYY-MM-DD-{vertical}-build-overview.md    ← header: summary + links to wave docs
  YYYY-MM-DD-{vertical}-build-wave1.md       ← only if wave is substantial
  YYYY-MM-DD-{vertical}-build-wave2.md
  YYYY-MM-DD-{vertical}-polish.md
  YYYY-MM-DD-{vertical}-review.md
  YYYY-MM-DD-{vertical}-learnings.md
```

### Build Overview Doc

The build overview is a summary/header document that:

- Lists all waves with brief descriptions of what each accomplished
- Links to wave-specific KB docs
- Lists all PRs, Claude session IDs, and branch names
- Records key architectural decisions made during build
- Created/updated by a synthesis session after all waves complete

### Gary Tracker Integration

During interview stage, any question where user says "I don't know" or "need to ask Gary":

- Claude automatically tags it using the Gary question HTML block format
- Questions stay in the vertical's interview KB doc
- Gary Tracker on KB site aggregates across all verticals

### Context Handoff Between Stages

Each new stage session reads:

1. The KB doc from the immediately prior stage
2. `PROGRESS.md` for overall project state
3. Links/artifacts referenced in the prior KB doc (breadboard, spike docs, etc.)
4. Claude memory files for persistent patterns

KB docs are written for both humans AND Claude — clear structure, explicit decisions, linked artifacts.

## 8. Skills & Agents Gap Analysis

### Existing (5 agents, 8 skills)

| Name                        | Type          | Pipeline Stage | Status                |
| --------------------------- | ------------- | -------------- | --------------------- |
| `vertical-discovery`        | Skill         | Research       | Active, underutilized |
| `feature-strategist`        | Agent         | Research       | Active, underutilized |
| `requirements-interrogator` | Agent         | Interview      | Active, underutilized |
| `breadboarding`             | Skill         | Breadboard     | Active, used          |
| `pre-build-interrogator`    | Skill         | Interview      | Active, underutilized |
| `frontend-builder`          | Agent         | Build          | Active, used          |
| `screen-builder`            | Skill         | Build          | Active, underutilized |
| `quality-gate`              | Skill         | Review/QA      | Active, used          |
| `design-audit`              | Skill         | Review/QA      | Active, underutilized |
| `design-auditor`            | Agent         | Review/QA      | Active, underutilized |
| `doc-sync`                  | Agent + Skill | Review         | Active, underutilized |
| `feature-strategy`          | Skill         | Research       | Active, underutilized |

**Key issue**: Most skills/agents exist but aren't consistently invoked. The `work` function v2 solves this by automatically wiring them into phase commands.

### New Skills Needed

| Skill                     | Pipeline Stage | Purpose                                                                               |
| ------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `implementation-planning` | Plan           | Produce YAML execution manifest + human-readable plan                                 |
| `build-session-protocol`  | Build          | Standardized completion flow: build → self-review → PR → CodeRabbit → merge checklist |
| `merge-checklist`         | Build          | Generate ready-for-merge report on PR                                                 |
| `learnings-synthesis`     | Learnings      | Read all prior KB docs, extract patterns, update memory                               |
| `gary-tracker`            | Interview      | Auto-tag "I don't know" answers for Gary                                              |

### New Agents Needed

| Agent            | Pipeline Stage           | Purpose                                                                                            |
| ---------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `secretary`      | All (scratchpad)         | Executive assistant: reads registry, issues, PROGRESS.md; recommends focus; answers "what's next?" |
| `finance-sme`    | Build (review sub-agent) | Specialized reviewer for financial calculations (big.js, floating-point safety)                    |
| `build-reviewer` | Build (review sub-agent) | Multi-agent code review: quality, design, domain-specific                                          |

### Cross-Stage Gaps

- No validation bridge between planning artifacts and build (breadboard says components exist but no verification)
- No feedback loop from QA back to design
- No schema/component registry verification pre-build
- No automated pipeline orchestration between stages

## 9. Build Session Protocol

### Completion Flow

Every build session follows this protocol:

```
Build Implementation
  ↓
Self-Review (launch sub-agents: code quality, design, domain-specific)
  ↓
Address Self-Review Findings
  ↓
Create PR with merge checklist
  ↓
CodeRabbit Review (triggered automatically)
  ↓
Address Critical + Major CodeRabbit Comments
  ↓
Log Remaining Items as GitHub Issues
  ↓
Quick Re-Review (sub-agent spot-check)
  ↓
Ready for Merge → Notify User
```

### Merge Checklist (on PR)

Lives on the PR itself (description or comment). Contains:

- **What was built**: Brief summary of changes
- **Why this approach**: Philosophy and reasoning behind design decisions
- **Tech stack choices**: Any new dependencies or patterns introduced, with rationale
- **Key decisions**: Architectural choices made during build
- **Review summary**: What self-review and CodeRabbit found; what was addressed vs. deferred
- **Known pitfalls**: Potential issues, edge cases, areas of concern
- **GitHub Issues created**: Links to issues logged for deferred items
- **Testing notes**: What was tested, how to verify
- **Links**: KB doc, breadboard, implementation plan references

**Purpose**: Give the user confidence to approve without being deeply involved in the build. Build trust over time by consistently producing accurate, thorough checklists.

## 10. Project Management

### Approach: GitHub-Native, Lightweight

- **GitHub Issues** with labels for verticals, types, priorities
- **GitHub Milestones** for major phases
- **No external PM tools** — avoid bending workflow to fit tooling

### Label Schema

| Category | Labels                                                             |
| -------- | ------------------------------------------------------------------ |
| Vertical | `vertical:jobs`, `vertical:invoicing`, `vertical:devx`, etc.       |
| Type     | `type:bug`, `type:enhancement`, `type:tech-debt`, `type:ux-polish` |
| Priority | `priority:high`, `priority:medium`, `priority:low`                 |
| Phase    | `phase:1-frontend`, `phase:2-backend`                              |

### `work next` Command

Reads:

1. Session registry (what's active, what's done)
2. GitHub Issues (open, sorted by priority)
3. `PROGRESS.md` (current state)
4. `IMPLEMENTATION_PLAN.md` (pending steps)

Recommends what to focus on with reasoning. First step toward Claude as proactive project partner.

### Roadmap Vision

Long-term: Claude should see the full roadmap, identify gaps, recommend next verticals, and think about how today's work fits the bigger picture. Start with `work next`, iterate toward comprehensive project awareness.

## 11. Context Management Strategy

| Situation                                   | Action                                   | Why                                        |
| ------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| Transitioning pipeline stages               | **New session**                          | Different focus, different KB doc          |
| Mid-build, same task, running long (2+ hrs) | **Compact** at logical breakpoints       | Preserve context, reduce latency           |
| "What if" exploration / debugging           | **Fork** (`--resume --fork-session`)     | Explore without polluting main session     |
| Post-build polish                           | **New session**, reference build KB doc  | Build context is stale; polish is distinct |
| Review/QA                                   | **New session**, reads all prior KB docs | Fresh systematic perspective               |
| Learnings                                   | **New session**, synthesis task          | Reads artifacts, not conversation history  |

**Rule of thumb**: One Claude session = one KB doc = one distinct phase. If the work shifts focus, start a new session.

**Secretary/scratchpad session**: Long-running, compacted periodically. Used for executive decisions, quick lookups, project management. Not an orchestrator — uses `work` CLI commands for orchestration.

## 12. Permissions Optimization

### Diagnosis

Current `~/.claude/settings.json` uses colon syntax in Bash patterns that doesn't match correctly:

```json
// BROKEN — colons don't match spaces:
"Bash(gh pr:*)"        // matches "gh pr:view" not "gh pr view"
"Bash(npm run lint:*)"  // matches "npm run lint:fix" not "npm run lint"

// FIXED — spaces match commands:
"Bash(gh pr *)"
"Bash(npm run lint *)"
```

### Action Items

1. Fix all colon→space patterns in `~/.claude/settings.json`
2. Remove dbt-project-specific patterns (not relevant to mokumo)
3. Add missing patterns for common Mokumo operations
4. Review `defaultMode: "delegate"` — consider if this is optimal per-phase
5. Test permission behavior after fixes

## 13. Key Decisions Log

| #   | Decision                             | Rationale                                                                             |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| D1  | Zellij over tmux                     | KDL layouts enable declarative one-touch execution; better UX for new users           |
| D2  | Launch Claude from worktrees parent  | Decouples session storage from worktree lifecycle; enables resume after cleanup       |
| D3  | Session registry (JSON)              | Cross-references branch ↔ session ↔ KB doc ↔ terminal; extensible schema              |
| D4  | 8-stage pipeline                     | Research → Interview → Breadboard → Plan → Build → Polish → Review → Learnings        |
| D5  | Phase-specific `work` commands       | Auto-wire skills/agents per stage; reduce manual toil and inconsistency               |
| D6  | YAML execution manifests             | Machine-readable build plans that generate Zellij layouts                             |
| D7  | Merge checklist on PR                | Build user trust for autonomous builds; guide approval decisions                      |
| D8  | `devx` as vertical slug              | Captures "developer experience optimization" — distinct from `meta` (random captures) |
| D9  | Build overview + wave docs           | Header summarizes; wave docs capture details per parallel batch                       |
| D10 | Fork via `--fork-session`            | Experimentation branches; append `-explore` to topic; discard freely                  |
| D11 | Secretary session (not orchestrator) | Human scratchpad + executive assistant; orchestration lives in `work` CLI             |
| D12 | GitHub-native PM                     | Issues + labels + milestones; no external tools; start light, iterate                 |
| D13 | One session = one KB doc             | Clean context boundaries; KB docs serve both humans and Claude                        |
| D14 | Build session protocol as skill      | Standardized completion flow loaded by every build session                            |
| D15 | Auto Gary tracking                   | "I don't know" in interviews → auto-tagged Gary question in KB doc                    |

## 14. Implementation Roadmap

### Wave 0: Foundation (Serial)

| Item                                          | Effort | Impact                        |
| --------------------------------------------- | ------ | ----------------------------- |
| Symlink CLAUDE.md to worktrees parent         | 5 min  | Fixes CWD orphaning           |
| Fix permissions (colon→space patterns)        | 30 min | Eliminates permission fatigue |
| Add `devx` + `polish` to KB schema            | 5 min  | Enables devx KB docs          |
| Create session registry schema + initial file | 1 hr   | Cross-referencing foundation  |

### Wave 1: Core `work` Function (Parallel)

| Item                                               | Sessions | Effort  |
| -------------------------------------------------- | -------- | ------- |
| Rewrite `work.sh` for Zellij (core commands)       | 1        | 3-4 hrs |
| Session registry CRUD (create/read/update in work) | 1        | 2-3 hrs |
| `work resume`, `work fork`, `work sessions`        | 1        | 2-3 hrs |

### Wave 2: Phase Commands + Skills (Parallel)

| Item                                            | Sessions | Effort  |
| ----------------------------------------------- | -------- | ------- |
| `work research` + wiring to vertical-discovery  | 1        | 2-3 hrs |
| `work interview` + Gary tracker automation      | 1        | 2-3 hrs |
| `work execute` + YAML manifest → KDL generation | 1        | 3-4 hrs |
| `implementation-planning` skill                 | 1        | 2-3 hrs |
| `build-session-protocol` skill                  | 1        | 2-3 hrs |
| `merge-checklist` skill                         | 1        | 1-2 hrs |

### Wave 3: Automation + Review (Parallel)

| Item                                        | Sessions | Effort  |
| ------------------------------------------- | -------- | ------- |
| Auto self-review pipeline in build protocol | 1        | 2-3 hrs |
| CodeRabbit integration into build protocol  | 1        | 1-2 hrs |
| `learnings-synthesis` skill                 | 1        | 1-2 hrs |
| `secretary` agent definition                | 1        | 2-3 hrs |
| `work next` + `work status` commands        | 1        | 2-3 hrs |

### Wave 4: Polish & PM (Parallel)

| Item                                                            | Sessions | Effort  |
| --------------------------------------------------------------- | -------- | ------- |
| GitHub Issue label schema setup                                 | 1        | 1 hr    |
| Domain-specific review agents (finance-sme)                     | 1        | 2-3 hrs |
| `work review` + quality gate wiring                             | 1        | 2-3 hrs |
| `work polish`, `work learnings`, `work breadboard`, `work plan` | 1        | 3-4 hrs |

### Wave 5: Integration & Testing (Serial)

| Item                                                  | Sessions | Effort  |
| ----------------------------------------------------- | -------- | ------- |
| End-to-end test: run full pipeline on a test vertical | 1        | 3-4 hrs |
| Iterate on friction points found during E2E           | 1        | 2-3 hrs |
| DevX vertical review + learnings KB docs              | 1        | 1-2 hrs |

---

<div class="gary-question" data-question-id="devx-q1" data-pipeline="devx" data-status="unanswered">
  <p class="gary-question-text">How do you currently manage parallel tasks in the shop? Do you use any software for job tracking or is it all manual/whiteboard?</p>
  <p class="gary-question-context">Understanding Gary's current workflow management helps us design the app's production board and potentially inform our own DevX pipeline design for managing parallel work.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
