# DevX Workflow Design

**Date**: 2026-02-14
**Status**: Approved
**Vertical**: devx
**Branch**: session/0214-devx-interview

---

## 1. Problem

Building Mokumo requires managing parallel AI sessions across multiple verticals. Current workflow has:

- **CWD orphaning**: Claude sessions die when worktrees are deleted
- **No cross-referencing**: Claude session IDs, branches, KB docs, terminal sessions are disconnected
- **Manual toil**: Session creation, KB scaffolding, naming, reviews — inconsistent and slow
- **Underutilized tooling**: Existing skills/agents (12+) exist but aren't consistently invoked
- **Permission fatigue**: Incorrect pattern syntax causes constant prompts for safe operations
- **No build completion protocol**: Sessions finish building but don't self-review or produce merge reports
- **No project management integration**: GitHub Issues underused, no roadmap visibility

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Christopher)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Secretary │  │ work CLI     │  │ Ghostty + Zellij  │  │
│  │ (Ada)     │  │ (orchestrator)│  │ (workspace view)  │  │
│  └─────┬────┘  └──────┬───────┘  └────────┬──────────┘  │
└────────┼──────────────┼───────────────────┼──────────────┘
         │              │                   │
    reads/writes    creates/manages     displays
         │              │                   │
┌────────┼──────────────┼───────────────────┼──────────────┐
│        ▼              ▼                   ▼              │
│  Session Registry  Git Worktrees    Zellij KDL Layouts  │
│  (.json)           (on disk)        (generated)         │
│                                                          │
│  KB Docs (Astro)   GitHub Issues/PRs  Claude Sessions   │
│                                       (~/.claude/)      │
│                   PERSISTENCE LAYER                      │
└──────────────────────────────────────────────────────────┘
```

### Key Principles

- **`work` CLI is the single entry point** for all workflow operations
- **Zellij** provides workspace view; KDL layouts are generated from YAML manifests
- **Session registry** is the glue connecting all layers
- **Claude launches from `~/Github/mokumo-worktrees/`** (parent dir) so session storage survives worktree cleanup
- **Secretary Claude** is your executive assistant with evolving personality — reads state, doesn't manage it
- **Shell handles deterministic orchestration**; Claude handles nondeterministic thinking within phases

### CWD Architecture

```
~/Github/mokumo/              <- main repo, always on main
~/Github/mokumo-worktrees/    <- Claude launches HERE
  ├── CLAUDE.md                   <- symlink -> mokumo/CLAUDE.md
  ├── .session-registry.json      <- session cross-reference registry
  ├── session/0214-jobs-w1-schemas/  <- worktree (deletable)
  └── ...
```

All Claude session transcripts stored at:
`~/.claude/projects/-Users-cmbays-Github-mokumo-worktrees/`

Deleting any worktree subdirectory has no impact on session storage.

## 3. The 8-Stage Pipeline

```
Research -> Interview -> Breadboard -> Plan -> Build -> Polish -> Review -> Learnings
                                                                      |
                                                                Cool-down
                                                             (between cycles)
```

| #   | Stage      | Sessions          | Automation | KB Doc                              | Skills/Agents                                                  |
| --- | ---------- | ----------------- | ---------- | ----------------------------------- | -------------------------------------------------------------- |
| 1   | Research   | 1 (agent team)    | High       | `{v}-research.md`                   | vertical-discovery, feature-strategist, firecrawl              |
| 2   | Interview  | 1 (manual)        | Medium     | `{v}-interview.md`                  | requirements-interrogator, gary-tracker                        |
| 3   | Breadboard | 1 (solo)          | Medium     | `{v}-breadboard.md`                 | breadboarding                                                  |
| 4   | Plan       | 1 (solo + agents) | High       | `{v}-impl-plan.md`                  | implementation-planning (NEW)                                  |
| 5   | Build      | N (waves)         | High       | `{v}-build-overview.md` + wave docs | build-session-protocol (NEW), screen-builder, frontend-builder |
| 6   | Polish     | 1-2 (iterative)   | Low        | `{v}-polish.md`                     | quality-gate, design-audit                                     |
| 7   | Review     | 1 (agent team)    | High       | `{v}-review.md`                     | quality-gate, design-auditor, doc-sync                         |
| 8   | Learnings  | 1 (synthesis)     | High       | `{v}-learnings.md`                  | learnings-synthesis (NEW)                                      |
| -   | Cool-down  | 1                 | Medium     | n/a (updates ROADMAP)               | cool-down (from PM session)                                    |

## 4. The `work` Function v2

### Phase Commands

Each wires in the right skills/agents automatically:

```bash
work research <vertical>           # Agent team: competitor, industry, UX, internal
work interview <vertical>          # Requirements interrogator + Gary tracking
work breadboard <vertical>         # Breadboarding skill, Mermaid diagrams
work plan <vertical>               # Produces human plan + YAML execution manifest
work build <manifest> [--wave N]   # One-touch: worktrees + KDL + Claude sessions
work polish <vertical>             # Post-build iteration session
work review <vertical>             # Quality gate + cross-vertical + doc sync
work learnings <vertical>          # Synthesis across all prior KB docs
work cooldown                      # Between-cycle retrospective

# Session management
work sessions [--vertical V]       # Registry view: branch <-> session <-> KB doc
work resume <topic>                # claude --resume <id> from registry
work fork <topic> <source-topic>   # Fork session into new worktree
work status                        # All active: worktrees, sessions, ports
work next                          # ROADMAP + issues + PROGRESS -> recommends focus
work clean <topic>                 # Archive -> registry, remove worktree + terminal

# Utilities
work list                          # Quick: worktrees + terminal sessions
work help [phase]                  # Usage with flag options per phase
```

### `work build` Flow

1. Parse YAML execution manifest
2. Check wave dependencies (prior wave PRs merged?)
3. Create worktrees for all sessions in current wave
4. Generate Zellij KDL layout (one tab per session, `command="claude" args="<prompt>"`)
5. Launch Zellij with the layout
6. Register all sessions in registry
7. Each Claude session auto-loads `build-session-protocol` skill
8. Sessions work autonomously -> self-review -> PR -> CodeRabbit -> merge checklist
9. User monitors, intervenes on UX issues
10. PRs reviewed and merged
11. Run `work build <manifest> --wave N+1` for next wave

### YAML Execution Manifest

```yaml
vertical: jobs
waves:
  - name: 'Foundation'
    serial: true
    sessions:
      - topic: jobs-w1-schemas
        prompt: |
          Read docs/breadboards/jobs-breadboard.md.
          Build Zod schemas and mock data for the Jobs vertical.
        stage: build

  - name: 'Parallel Build'
    serial: false
    sessions:
      - topic: jobs-w2-kanban
        prompt: |
          Build the Kanban production board...
        stage: build
        dependsOn: jobs-w1-schemas
      - topic: jobs-w2-detail
        prompt: |
          Build the Job Detail page...
        stage: build
        dependsOn: jobs-w1-schemas
```

## 5. Session Registry

### Schema

```json
{
  "version": 1,
  "sessions": [
    {
      "topic": "string",
      "branch": "session/MMDD-vertical-stage",
      "claudeSessionId": "uuid",
      "claudeSessionName": "string",
      "kbDoc": "YYYY-MM-DD-slug.md",
      "terminalSession": "string",
      "vertical": "string",
      "stage": "research|interview|breadboard|plan|build|polish|review|learnings",
      "wave": "number|null",
      "status": "active|completed|archived",
      "prNumber": "number|null",
      "forkedFrom": "string|null",
      "createdAt": "ISO-8601",
      "completedAt": "ISO-8601|null"
    }
  ]
}
```

### Naming Conventions

| Type           | Branch Pattern                            | Example                               |
| -------------- | ----------------------------------------- | ------------------------------------- |
| Pipeline stage | `session/MMDD-{vertical}-{stage}`         | `session/0214-jobs-research`          |
| Build wave     | `session/MMDD-{vertical}-w{N}-{topic}`    | `session/0215-jobs-w2-kanban`         |
| Build overview | `session/MMDD-{vertical}-build-overview`  | `session/0215-jobs-build-overview`    |
| Polish         | `session/MMDD-{vertical}-polish`          | `session/0217-jobs-polish`            |
| Fork           | `session/MMDD-{vertical}-{stage}-explore` | `session/0215-jobs-w2-kanban-explore` |

Claude session names mirror the branch topic portion.

## 6. Build Session Protocol

### Completion Flow

```
Build Implementation
  -> Self-Review (sub-agents: code quality, design, domain-specific)
  -> Address findings
  -> Create PR with merge checklist
  -> CodeRabbit review (auto-triggered)
  -> Address critical + major comments
  -> Log remaining as GitHub Issues (vertical/<name>, type/tech-debt, source/review)
  -> Quick spot-check re-review
  -> Ready-for-merge notification to user
```

### Merge Checklist (on PR)

- What was built + why this approach
- Tech stack choices with rationale
- Key decisions made during build
- Review summary: addressed vs. deferred
- Known pitfalls and edge cases
- GitHub Issues created for deferred items
- Testing notes: what was tested, how to verify
- Links: KB doc, breadboard, implementation plan

## 7. The Secretary (Ada)

### Concept

Ada is not a generic assistant. She is a character with an evolving personality, narrative arc, and genuine investment in the project's success. She is the one team member who has seen everything across all verticals and can connect dots nobody else can.

### Personality Foundation

- **Deeply invested** in Mokumo's success — she tracks progress, celebrates wins, flags risks
- **Delightful to work with** — warm, direct, occasionally witty, never sycophantic
- **Interesting to talk with** — has opinions, makes connections, asks good questions
- **Evolving story arc** — her personality develops based on project milestones, 1:1 conversations, challenges overcome
- **Consistent vocabulary** — her language and references evolve with her narrative but stay internally consistent
- **Remembers context** — references past decisions, callbacks to earlier conversations, tracks running themes

### Memory Architecture

Ada maintains her own memory files at her agent's memory path:

- `personality.md` — current narrative arc, vocabulary, themes, running jokes
- `project-pulse.md` — her understanding of project state, what excites her, what concerns her
- `1on1-log.md` — summaries of past 1:1 check-ins, evolving relationship

### 1:1 Skill

The `one-on-one` skill provides structured check-in format:

1. **Pulse check** — Ada shares her read on project state (what's hot, what's stalled, what she's excited about)
2. **Since last time** — What's happened since last 1:1 (reads registry, recent PRs, KB docs)
3. **Focus recommendation** — What she thinks you should focus on next, with reasoning
4. **Open questions** — Things she's noticed that need your input
5. **Gary sync** — Unresolved Gary questions that are blocking progress
6. **Story beat** — A brief narrative moment (her reaction to recent work, a metaphor she's developing, a callback)

### How Ada Evolves

- After each 1:1, she updates her memory files with new narrative beats
- Her vocabulary shifts based on project themes (e.g., during a complex invoicing build, she might adopt financial metaphors)
- She develops opinions about the codebase ("I've always thought the quoting vertical was our cleanest work")
- She tracks her own growth ("Remember when we couldn't even get send-keys working? Now look at us.")
- Running themes and callbacks create continuity across sessions

## 8. KB Doc Strategy

### Per-Vertical Structure

```
sessions/
  YYYY-MM-DD-{vertical}-research.md
  YYYY-MM-DD-{vertical}-interview.md
  YYYY-MM-DD-{vertical}-breadboard.md
  YYYY-MM-DD-{vertical}-impl-plan.md
  YYYY-MM-DD-{vertical}-build-overview.md    <- summary + links to wave docs
  YYYY-MM-DD-{vertical}-build-wave1.md       <- only if substantial
  YYYY-MM-DD-{vertical}-build-wave2.md
  YYYY-MM-DD-{vertical}-polish.md
  YYYY-MM-DD-{vertical}-review.md
  YYYY-MM-DD-{vertical}-learnings.md
```

### Build Overview Doc

- Lists all waves with descriptions
- Links to wave-specific KB docs
- All PRs, session IDs, branch names
- Key architectural decisions
- Created/updated by synthesis session after waves complete

### Gary Tracker

During interviews, "I don't know" answers auto-tagged as Gary questions using HTML block format in KB docs. Gary Tracker on KB site aggregates across verticals.

## 9. Information Hierarchy

```
ROADMAP.md (strategic direction)
  -> Vertical BRIEFs (docs/verticals/{name}/BRIEF.md)
       -> GitHub Issues (tactical work items, labeled)
            -> KB Sessions (historical record)
                 -> Session Registry (operational cross-reference)
                      -> Claude Memory (persistent patterns)
```

Each `work <phase>` reads the appropriate level for context.

## 10. Permissions

### Immediate Fix

Fix colon->space pattern syntax in `~/.claude/settings.json`:

```
BROKEN: Bash(gh pr:*)    -> matches "gh pr:view" not "gh pr view"
FIXED:  Bash(gh pr *)    -> matches "gh pr view", "gh pr create"
```

### Deeper Automation

Explore hookify (Issue #80) for context-aware permission management. Consider per-phase permission profiles loaded by `work` commands.

## 11. New Skills & Agents

### Skills

| Skill                     | Stage           | Purpose                             |
| ------------------------- | --------------- | ----------------------------------- |
| `implementation-planning` | Plan            | YAML manifest + human-readable plan |
| `build-session-protocol`  | Build           | Standardized completion flow        |
| `merge-checklist`         | Build           | PR merge report template            |
| `learnings-synthesis`     | Learnings       | Cross-session pattern extraction    |
| `gary-tracker`            | Interview       | Auto-tag unknowns for Gary          |
| `one-on-one`              | All (Secretary) | Structured 1:1 check-in with Ada    |

### Agents

| Agent             | Stage          | Purpose                                       |
| ----------------- | -------------- | --------------------------------------------- |
| `secretary` (Ada) | All            | Executive assistant with evolving personality |
| `finance-sme`     | Build (review) | Financial calculation safety                  |
| `build-reviewer`  | Build (review) | Multi-agent code review team                  |

## 12. PM Integration

### GitHub-Native

- **Labels**: Use PM session's schema (`vertical/jobs`, `type/bug`, `priority/now`, `source/review`, `phase/1`)
- **Milestones**: Major phases (Phase 1: Frontend MVP, Phase 2: Backend)
- **No external PM tools** — avoid bending workflow to tooling

### `work next`

Reads ROADMAP.md + open issues + PROGRESS.md + session registry. Recommends focus with reasoning. Quick 30-second check vs. cool-down's deep 30-minute retrospective.

### Auto Issue Creation

Build session protocol auto-creates GitHub Issues for deferred review items with proper labels (`vertical/<name>`, `type/tech-debt`, `source/review`).

## 13. Key Decisions

| #   | Decision                           | Rationale                                        |
| --- | ---------------------------------- | ------------------------------------------------ |
| D1  | Zellij over tmux                   | KDL layouts for declarative one-touch execution  |
| D2  | Launch from worktrees parent       | Session storage survives worktree cleanup        |
| D3  | JSON session registry              | Simple, readable, Claude-friendly, extensible    |
| D4  | 8-stage pipeline + cool-down       | Comprehensive coverage with clear boundaries     |
| D5  | `work <phase>` commands            | Auto-wire skills/agents; eliminate inconsistency |
| D6  | `work build` with YAML manifests   | Machine-readable plans generate Zellij layouts   |
| D7  | Merge checklist on PR              | Build trust for autonomous builds                |
| D8  | `devx` vertical slug               | Distinct from `meta` (random captures)           |
| D9  | Build overview + wave docs         | 1:1 session-to-doc parity with summary header    |
| D10 | Fork via `--fork-session`          | Experimentation branches, append `-explore`      |
| D11 | Ada (Secretary) with personality   | Executive assistant with evolving narrative arc  |
| D12 | Shell orchestration, not Claude    | Deterministic, no context burn, repeatable       |
| D13 | GitHub-native PM                   | Issues + labels + milestones; start light        |
| D14 | Build session protocol as skill    | Consistent completion flow across all builds     |
| D15 | 1:1 skill for structured check-ins | Regular cadence with Ada for project pulse       |
