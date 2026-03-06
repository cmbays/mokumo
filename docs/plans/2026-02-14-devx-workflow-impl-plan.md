# DevX Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current tmux-based `work.sh` with a Zellij-based orchestration system that automates the 8-stage vertical pipeline, manages session cross-referencing, and introduces Ada (secretary agent) with 1:1 check-ins.

**Architecture:** Shell-driven orchestration (`work` CLI) connecting four layers: git worktrees (code), Claude sessions (context), Zellij (workspace view), and KB docs (knowledge). Session registry JSON file is the cross-reference glue. Phase-specific commands auto-wire skills/agents per pipeline stage.

**Tech Stack:** Zsh (work function), Zellij (KDL layouts), Claude Code CLI (sessions), GitHub CLI (issues/PRs), Astro (KB), jq (JSON manipulation)

**Design Doc:** `docs/plans/2026-02-14-devx-workflow-design.md`

---

## Wave 0: Foundation (Serial — Must Complete First)

### Task 0.1: Symlink CLAUDE.md to Worktrees Parent

**Files:**

- Create: `~/Github/mokumo-worktrees/CLAUDE.md` (symlink)

**Step 1: Create symlink**

```bash
ln -s ~/Github/mokumo/CLAUDE.md ~/Github/mokumo-worktrees/CLAUDE.md
```

**Step 2: Verify**

```bash
ls -la ~/Github/mokumo-worktrees/CLAUDE.md
# Expected: symlink pointing to ../mokumo/CLAUDE.md
cat ~/Github/mokumo-worktrees/CLAUDE.md | head -5
# Expected: "# Mokumo — CLAUDE.md"
```

**Step 3: Add to .gitignore at worktrees level**

The worktrees parent is not a git repo, so no gitignore needed. The symlink lives outside any repo. No commit required.

---

### Task 0.2: Fix Permissions (colon→space patterns)

**Files:**

- Modify: `~/.claude/settings.json`

**Step 1: Read current settings**

Read `~/.claude/settings.json`. The `permissions.allow` array has patterns using colons that should be spaces. Also contains stale dbt-project patterns.

**Step 2: Replace the full permissions.allow array**

Replace the `"allow"` array with corrected patterns. Changes:

- `Bash(gh pr:*)` → `Bash(gh pr *)` (and similar for all `gh` subcommands)
- `Bash(npm run lint:*)` → `Bash(npm run lint *)` (and all npm run variants)
- `Bash(npm install:*)` → `Bash(npm install *)`
- `Bash(npm test:*)` → `Bash(npm test *)`
- `Bash(ls:*)` → remove (duplicate of `Bash(ls*)`)
- `Bash(sleep:*)` → `Bash(sleep *)`
- `Bash(echo:*)` → `Bash(echo *)`
- `Bash(jq:*)` → `Bash(jq *)`
- `Bash(z:*)` → `Bash(z *)`
- `Bash(chmod:*)` → `Bash(chmod *)`
- `Bash(open:*)` → `Bash(open *)`
- `Bash(wc:*)` → `Bash(wc *)`
- `Bash(curl:*)` → `Bash(curl *)`
- `Bash(dbt:*)` → remove (dbt not used in mokumo)
- `Bash(python3:*)` → remove (not used in mokumo)
- `Bash(uv:*)` → remove (not used in mokumo)
- `Bash(npx markdownlint-cli2:*)` → `Bash(npx markdownlint-cli2 *)`
- `Bash(coderabbit review:*)` → `Bash(coderabbit review *)`
- `Bash(PYTHONPATH=. uv run pytest:*)` → remove (dbt-specific)
- `Bash(do)` / `Bash(done)` → remove (not valid patterns)
- Remove all dbt-playground-specific Read/Edit paths
- Remove stale `Bash(sed -n ...)` dbt path
- Remove stale `Bash(cat /Users/cmbays/Documents/...)` dbt path
- Add: `Bash(npm run dev *)`, `Bash(npm run build *)`, `Bash(npx astro *)`, `Bash(zellij *)`
- Add: `Bash(tmux *)` (keep for migration period)
- Add: `Bash(mkdir *)`, `Bash(cp *)`, `Bash(mv *)`

Also fix `permissions.ask` — remove dbt-specific uv patterns. Add:

- `Bash(npm install *)` in ask (new deps should be approved)
- `Bash(git push *)` in ask (pushes should be reviewed)

**Step 3: Verify**

Start a new Claude session and test that previously-prompted operations no longer prompt:

```bash
gh pr list --limit 5
npm run lint
git status
```

**Step 4: Commit**

This is a user config file, not in the repo. No git commit needed.

---

### Task 0.3: Create Session Registry

**Files:**

- Create: `~/Github/mokumo-worktrees/.session-registry.json`

**Step 1: Create initial registry file**

```json
{
  "version": 1,
  "sessions": []
}
```

Write to `~/Github/mokumo-worktrees/.session-registry.json`.

**Step 2: Verify jq can read it**

```bash
jq '.version' ~/Github/mokumo-worktrees/.session-registry.json
# Expected: 1
jq '.sessions | length' ~/Github/mokumo-worktrees/.session-registry.json
# Expected: 0
```

No git commit — this file lives outside any repo.

---

### Task 0.4: Add `vertical/devx` GitHub Label

**Step 1: Create the label**

```bash
gh label create "vertical/devx" --description "Developer experience and workflow tooling" --color "8B5CF6" --repo cmbays/mokumo
```

**Step 2: Verify**

```bash
gh label list --repo cmbays/mokumo | grep devx
# Expected: vertical/devx    Developer experience and workflow tooling    #8B5CF6
```

---

### Task 0.5: Install and Verify Zellij

**Step 1: Check if installed**

```bash
which zellij && zellij --version
```

**Step 2: Install if needed**

```bash
brew install zellij
```

**Step 3: Verify basic operation**

```bash
zellij --version
# Expected: zellij 0.x.x
```

**Step 4: Add Zellij completions** (if not already present)

Check `~/.oh-my-zsh/completions/_zellij` exists. If not:

```bash
mkdir -p ~/.oh-my-zsh/completions
zellij setup --generate-completion zsh > ~/.oh-my-zsh/completions/_zellij
```

---

## Wave 1: Core `work` Function (3 Parallel Sessions)

> **Dependencies:** Wave 0 complete.
> **Output:** Rewritten `work.sh` with Zellij support, session registry CRUD, and core session management commands.

### Task 1.1: Rewrite `work.sh` — Core + Zellij (Session A)

**Files:**

- Modify: `scripts/work.sh` (complete rewrite)

**Context:** Read the current `scripts/work.sh` (495 lines, tmux-based). The rewrite replaces tmux with Zellij while preserving the worktree creation logic. Key changes: Zellij sessions/tabs replace tmux sessions/windows; `command` + `args` in KDL replaces `send-keys`; session registry integration.

**Step 1: Read existing work.sh**

Read `scripts/work.sh` to understand current structure.

**Step 2: Write the new work.sh core**

Replace the full file. The new dispatcher should handle:

```bash
work() {
    case "${1:-}" in
        # Phase commands
        research)   shift; _work_phase "research" "$@" ;;
        interview)  shift; _work_phase "interview" "$@" ;;
        breadboard) shift; _work_phase "breadboard" "$@" ;;
        plan)       shift; _work_phase "plan" "$@" ;;
        build)      shift; _work_build "$@" ;;
        polish)     shift; _work_phase "polish" "$@" ;;
        review)     shift; _work_phase "review" "$@" ;;
        learnings)  shift; _work_phase "learnings" "$@" ;;
        cooldown)   shift; _work_phase "cooldown" "$@" ;;

        # Session management
        sessions)   shift; _work_sessions "$@" ;;
        resume)     shift; _work_resume "$@" ;;
        fork)       shift; _work_fork "$@" ;;
        status)     _work_status ;;
        next)       _work_next ;;
        clean)      shift; _work_clean "$@" ;;

        # Utilities
        list)       _work_list ;;
        help)       shift; _work_help "$@" ;;

        # Legacy: bare topic (creates worktree + Zellij tab)
        --stack)    shift; _work_stack "$@" ;;
        *)          _work_new "$@" ;;
    esac
}
```

Key internal functions:

- `_work_new <topic> [base] [--prompt "..."]` — Creates worktree + Zellij tab. Uses `zellij action new-tab --name <topic> --cwd <worktree> -- claude "<prompt>"` if Zellij is running, or creates a new Zellij session if not.
- `_work_phase <phase> <vertical> [--prompt "..."]` — Wrapper around `_work_new` that auto-generates the topic name (`<vertical>-<phase>`), constructs phase-specific prompt, and registers in session registry.
- `_work_build <manifest> [--wave N]` — Reads YAML manifest, creates worktrees per session, generates KDL layout, launches Zellij.
- `_work_registry_add <entry-json>` — Adds session to registry using jq.
- `_work_registry_update <topic> <field> <value>` — Updates registry entry.
- `_work_registry_get <topic>` — Reads registry entry.

**Step 3: Test core worktree creation**

```bash
source scripts/work.sh
work test-zellij
# Expected: Creates worktree session/MMDD-test-zellij, opens Zellij tab, starts Claude
work list
# Expected: Shows the new worktree
work clean test-zellij
# Expected: Removes worktree, Zellij tab, branch
```

**Step 4: Commit**

```bash
git add scripts/work.sh
git commit -m "feat(devx): rewrite work.sh for Zellij + session registry"
```

---

### Task 1.2: Session Registry CRUD Functions (Session B)

**Files:**

- Create: `scripts/lib/registry.sh`
- Modify: `scripts/work.sh` (source the lib)

**Context:** The registry lives at `~/Github/mokumo-worktrees/.session-registry.json`. All operations use `jq` for JSON manipulation. Functions are sourced by `work.sh`.

**Step 1: Create registry library**

Write `scripts/lib/registry.sh` with these functions:

```bash
REGISTRY_FILE="${PRINT4INK_WORKTREES}/.session-registry.json"

# Add a session to the registry
_registry_add() {
    local topic="$1" branch="$2" vertical="$3" stage="$4"
    local wave="${5:-null}" claude_id="${6:-}" claude_name="${7:-}"
    local kb_doc="${8:-}" terminal="${9:-}"

    local entry
    entry=$(jq -n \
        --arg topic "$topic" \
        --arg branch "$branch" \
        --arg cid "$claude_id" \
        --arg cname "$claude_name" \
        --arg kb "$kb_doc" \
        --arg term "$terminal" \
        --arg vert "$vertical" \
        --arg stage "$stage" \
        --argjson wave "$wave" \
        --arg created "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{
            topic: $topic,
            branch: $branch,
            claudeSessionId: $cid,
            claudeSessionName: $cname,
            kbDoc: $kb,
            terminalSession: $term,
            vertical: $vert,
            stage: $stage,
            wave: $wave,
            status: "active",
            prNumber: null,
            forkedFrom: null,
            createdAt: $created,
            completedAt: null
        }')

    jq --argjson entry "$entry" '.sessions += [$entry]' "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" \
        && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"
}

# Get a session by topic
_registry_get() {
    local topic="$1"
    jq --arg t "$topic" '.sessions[] | select(.topic == $t)' "$REGISTRY_FILE"
}

# Update a field
_registry_update() {
    local topic="$1" field="$2" value="$3"
    jq --arg t "$topic" --arg f "$field" --arg v "$value" \
        '(.sessions[] | select(.topic == $t))[$f] = $v' \
        "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" \
        && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"
}

# List all sessions (formatted)
_registry_list() {
    local filter="${1:-.sessions[]}"
    jq -r "$filter | \"\(.topic)\t\(.status)\t\(.vertical)\t\(.stage)\t\(.branch)\t\(.kbDoc // \"-\")\"" \
        "$REGISTRY_FILE" | column -t -s $'\t'
}

# Archive a session (set status, completedAt)
_registry_archive() {
    local topic="$1"
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    jq --arg t "$topic" --arg now "$now" \
        '(.sessions[] | select(.topic == $t)) |= (.status = "archived" | .completedAt = $now)' \
        "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" \
        && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"
}
```

**Step 2: Test registry operations**

```bash
source scripts/lib/registry.sh
_registry_add "test-topic" "session/0214-test" "devx" "build" "1" "" "" "" ""
_registry_get "test-topic"
# Expected: JSON object with topic "test-topic"
_registry_list
# Expected: formatted table with test-topic row
_registry_update "test-topic" "status" "completed"
_registry_get "test-topic" | jq '.status'
# Expected: "completed"
# Clean up:
jq 'del(.sessions[] | select(.topic == "test-topic"))' "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"
```

**Step 3: Commit**

```bash
git add scripts/lib/registry.sh
git commit -m "feat(devx): add session registry CRUD library"
```

---

### Task 1.3: Session Management Commands (Session C)

**Files:**

- Modify: `scripts/work.sh` (add resume, fork, sessions, status commands)

**Dependencies:** Task 1.2 (registry.sh must exist)

**Step 1: Implement `work resume`**

```bash
_work_resume() {
    local topic="$1"
    [[ -z "$topic" ]] && { echo "Usage: work resume <topic>"; return 1; }

    local session_id
    session_id=$(_registry_get "$topic" | jq -r '.claudeSessionId // empty')

    if [[ -z "$session_id" ]]; then
        echo "Error: No session found for topic '$topic'"
        echo "  Run 'work sessions' to see registered sessions"
        return 1
    fi

    echo "Resuming Claude session for '$topic'..."
    echo "  Session ID: $session_id"
    claude --resume "$session_id"
}
```

**Step 2: Implement `work fork`**

```bash
_work_fork() {
    local new_topic="$1"
    local source_topic="$2"
    [[ -z "$new_topic" || -z "$source_topic" ]] && {
        echo "Usage: work fork <new-topic> <source-topic>"
        return 1
    }

    local source_id
    source_id=$(_registry_get "$source_topic" | jq -r '.claudeSessionId // empty')

    if [[ -z "$source_id" ]]; then
        echo "Error: No session found for source topic '$source_topic'"
        return 1
    fi

    # Create worktree for the fork
    _work_new "${new_topic}" "main" ""

    # Register with forkedFrom reference
    _registry_update "$new_topic" "forkedFrom" "$source_topic"

    echo "Fork created. Resume with forked context:"
    echo "  claude --resume $source_id --fork-session"
}
```

**Step 3: Implement `work sessions`**

```bash
_work_sessions() {
    local vertical_filter=""
    [[ "${1:-}" == "--vertical" ]] && vertical_filter="$2"

    echo "=== Session Registry ==="
    if [[ -n "$vertical_filter" ]]; then
        _registry_list ".sessions[] | select(.vertical == \"$vertical_filter\")"
    else
        _registry_list
    fi
}
```

**Step 4: Implement `work status`**

```bash
_work_status() {
    echo "=== Active Sessions ==="
    _registry_list '.sessions[] | select(.status == "active")'
    echo ""

    echo "=== Worktrees ==="
    git -C "$PRINT4INK_REPO" worktree list
    echo ""

    echo "=== Zellij Sessions ==="
    zellij list-sessions 2>/dev/null || echo "  No Zellij sessions running"
    echo ""

    echo "=== Dev Server Ports ==="
    for port in $(seq $PRINT4INK_PORT_MIN $PRINT4INK_PORT_MAX); do
        pid=$(lsof -iTCP:$port -sTCP:LISTEN -t 2>/dev/null)
        [[ -n "$pid" ]] && echo "  :$port  IN USE (pid $pid)"
    done
}
```

**Step 5: Test all commands**

```bash
source scripts/work.sh
work sessions
# Expected: empty table or existing sessions
work status
# Expected: worktrees + ports listed, no Zellij sessions
```

**Step 6: Commit**

```bash
git add scripts/work.sh
git commit -m "feat(devx): add work resume, fork, sessions, status commands"
```

---

## Wave 2: Phase Commands + Skills (4 Parallel Sessions)

> **Dependencies:** Wave 1 complete.
> **Output:** Phase-specific `work` commands wired to skills/agents. New skills: implementation-planning, build-session-protocol, merge-checklist, gary-tracker.

### Task 2.1: Phase Command Engine + `work build` (Session A)

**Files:**

- Modify: `scripts/work.sh` (add `_work_phase` and `_work_build`)
- Create: `scripts/lib/kdl-generator.sh` (generates Zellij KDL from YAML manifest)
- Create: `scripts/templates/wave-layout.kdl.tmpl` (KDL template)

**Context:** `_work_phase` is the generic wrapper that all phase commands use. It constructs the topic name, generates a phase-appropriate prompt, creates the worktree, and registers the session. `_work_build` is special — it reads a YAML manifest and generates a Zellij KDL layout for the wave.

Read the design doc section 4 for the full `work build` flow. The KDL generator needs to produce a valid Zellij layout with one tab per session, each running `claude "<prompt>"` with the worktree as cwd.

The YAML manifest is parsed with `yq` (install: `brew install yq`). Each session entry produces a Zellij tab in the KDL.

**Prompt templates per phase** (stored in `scripts/prompts/`):

- `research.md` — Agent team prompt for vertical research
- `interview.md` — Requirements interrogator prompt
- `breadboard.md` — Breadboarding skill prompt
- `plan.md` — Implementation planning prompt
- `polish.md` — Post-build polish prompt
- `review.md` — Quality gate + doc sync prompt
- `learnings.md` — Synthesis prompt

Each prompt template includes: what to read first (KB docs, breadboard, ROADMAP), what skills to use, what to produce (KB doc, artifacts), and the session protocol.

**Commit:**

```bash
git add scripts/work.sh scripts/lib/kdl-generator.sh scripts/templates/ scripts/prompts/
git commit -m "feat(devx): add phase command engine, work build, KDL generator"
```

---

### Task 2.2: `build-session-protocol` Skill (Session B)

**Files:**

- Create: `.claude/skills/build-session-protocol/SKILL.md`
- Create: `.claude/skills/build-session-protocol/templates/merge-checklist.md`

**Context:** This skill is auto-loaded by every build session (via the prompt generated by `work build`). It defines the completion flow: build → self-review → PR → CodeRabbit → merge checklist.

Read existing skills for format reference: `.claude/skills/quality-gate/SKILL.md` and `.claude/skills/screen-builder/SKILL.md`.

The `SKILL.md` should define:

- **Trigger:** Loaded automatically by build sessions via phase prompt
- **Process:**
  1. Complete the build task as described in the prompt
  2. Self-review: Launch sub-agents for code quality + design review
  3. Address findings that are critical or high-impact
  4. Create PR with merge checklist from template
  5. Wait for CodeRabbit review
  6. Address critical + major CodeRabbit comments
  7. File GitHub Issues for remaining items (use labels: `vertical/<name>`, `type/tech-debt`, `source/review`)
  8. Quick spot-check re-review via sub-agent
  9. Update PR with final merge checklist
  10. Notify user: ready for merge
- **Merge checklist template:** Markdown template with sections for: what was built, why this approach, tech stack choices, key decisions, review summary, known pitfalls, GitHub issues created, testing notes, links to KB/breadboard/plan
- **Rules:**
  - Never modify tests to make them pass — fix the implementation
  - Never use floating-point arithmetic for financial data — use big.js
  - Never push directly to main
  - Always apply labels from PM label schema when creating issues

**Commit:**

```bash
git add .claude/skills/build-session-protocol/
git commit -m "feat(devx): add build-session-protocol skill"
```

---

### Task 2.3: `implementation-planning` Skill (Session C)

**Files:**

- Create: `.claude/skills/implementation-planning/SKILL.md`
- Create: `.claude/skills/implementation-planning/templates/execution-manifest.yaml`
- Create: `.claude/skills/implementation-planning/templates/impl-plan-template.md`

**Context:** This skill produces both a human-readable implementation plan AND a machine-readable YAML execution manifest. The manifest is consumed by `work build`.

Read the design doc section 4 for the YAML manifest format. The skill should:

- Read the breadboard doc and interview doc for the vertical
- Design waves with proper dependency ordering
- Determine which sessions can be parallel vs. serial
- Write phase-appropriate prompts for each session
- Produce both artifacts
- Register the plan in the KB

**Commit:**

```bash
git add .claude/skills/implementation-planning/
git commit -m "feat(devx): add implementation-planning skill with YAML manifest"
```

---

### Task 2.4: `gary-tracker` Skill + Interview Automation (Session D)

**Files:**

- Create: `.claude/skills/gary-tracker/SKILL.md`
- Create: `.claude/skills/gary-tracker/templates/gary-question-block.html`

**Context:** During interview sessions, when the user says "I don't know", "need to ask Gary", "that's a Gary question", or similar, Claude should automatically insert a Gary question block into the KB doc. Read the existing Gary question format in KB docs (see `knowledge-base/src/content/sessions/` for examples with `gary-question` HTML blocks).

The skill should:

- Define trigger phrases that indicate a Gary question
- Provide the HTML block template with proper attributes
- Auto-increment question IDs within the vertical
- Include instructions for Claude to proactively suggest Gary-tagging when user uncertainty is detected

Also wire the `requirements-interrogator` agent into the interview phase prompt (in `scripts/prompts/interview.md`).

**Commit:**

```bash
git add .claude/skills/gary-tracker/
git commit -m "feat(devx): add gary-tracker skill for auto-tagging interview questions"
```

---

## Wave 3: Ada + Automation (3 Parallel Sessions)

> **Dependencies:** Wave 2 complete.
> **Output:** Secretary agent with 1:1 skill, work next/status, learnings-synthesis skill.

### Task 3.1: Ada — Secretary Agent + Memory (Session A)

**Files:**

- Create: `.claude/agents/secretary.md`
- Create: `.claude/skills/one-on-one/SKILL.md`
- Create: `.claude/skills/one-on-one/templates/1on1-template.md`

**Context:** Ada is a Claude agent with a persistent personality. Read the design doc section 7 for her full spec. She needs:

**Agent definition (`.claude/agents/secretary.md`):**

- System prompt that establishes her character: warm, direct, invested, witty
- Instructions to read her memory files on startup
- Instructions to read session registry, ROADMAP.md, PROGRESS.md, recent KB docs
- Instructions to update her memory files after meaningful interactions
- Preloaded skills: `one-on-one`, `cool-down`

**1:1 Skill (`.claude/skills/one-on-one/SKILL.md`):**

- 6-step structured check-in:
  1. Pulse check — her read on project state
  2. Since last time — what happened (reads registry, PRs, KB)
  3. Focus recommendation — what to work on next
  4. Open questions — things needing user input
  5. Gary sync — unresolved Gary questions
  6. Story beat — narrative moment (callback, metaphor, reaction)
- After each 1:1, updates `personality.md`, `project-pulse.md`, `1on1-log.md`

**Memory files** (created on first run, updated by Ada):

- These live in Ada's auto-memory directory. The agent definition should reference them.
- Initial `personality.md`: Seed with Ada's founding narrative — she's the first team member of Mokumo's development team, she's watched the project grow from a blank Next.js scaffold, she cares about craft and hates when corners are cut.
- Initial `project-pulse.md`: Current project state (Phase 1 frontend, 5+ verticals built, devx vertical in progress)
- Initial `1on1-log.md`: Empty, first entry created after first 1:1

**Commit:**

```bash
git add .claude/agents/secretary.md .claude/skills/one-on-one/
git commit -m "feat(devx): add Ada secretary agent with 1:1 skill and memory"
```

---

### Task 3.2: `work next` + `work status` Enhancement (Session B)

**Files:**

- Create: `scripts/prompts/next.md` (prompt template for work next)
- Modify: `scripts/work.sh` (implement `_work_next`)

**Context:** `work next` launches a quick Claude session that reads project state and recommends focus. It should:

1. Read `ROADMAP.md`, `PROGRESS.md`, session registry
2. List open GitHub Issues sorted by priority
3. Check for unresolved Gary questions across KB docs
4. Produce a short recommendation (3-5 sentences) on what to focus on next
5. Exit (non-interactive, print mode)

Implementation: `_work_next` runs `claude -p "$(cat scripts/prompts/next.md)"` in print mode. The prompt template includes instructions to read the above files and format the recommendation.

**Commit:**

```bash
git add scripts/prompts/next.md scripts/work.sh
git commit -m "feat(devx): add work next command with project state analysis"
```

---

### Task 3.3: `learnings-synthesis` Skill (Session C)

**Files:**

- Create: `.claude/skills/learnings-synthesis/SKILL.md`
- Create: `.claude/skills/learnings-synthesis/templates/learnings-template.md`

**Context:** This skill is used in the learnings phase (`work learnings <vertical>`). It reads all prior KB docs for a vertical and extracts cross-cutting patterns.

Process:

1. Read all KB docs matching the vertical slug in `knowledge-base/src/content/sessions/`
2. Read the session registry entries for the vertical
3. Read git log for all branches related to the vertical
4. Read PR review comments for merged PRs
5. Synthesize: What patterns emerged? What worked well? What was painful? What should change?
6. Update `CLAUDE.md` lessons-learned if applicable
7. Update Claude memory files with new patterns
8. Produce KB doc: `{vertical}-learnings.md`

**Commit:**

```bash
git add .claude/skills/learnings-synthesis/
git commit -m "feat(devx): add learnings-synthesis skill"
```

---

## Wave 4: Integration + Polish (2 Parallel Sessions)

> **Dependencies:** Wave 3 complete.
> **Output:** End-to-end tested pipeline, domain-specific review agents, remaining phase prompt templates.

### Task 4.1: Remaining Phase Prompts + Wiring (Session A)

**Files:**

- Create: `scripts/prompts/research.md`
- Create: `scripts/prompts/interview.md`
- Create: `scripts/prompts/breadboard.md`
- Create: `scripts/prompts/plan.md`
- Create: `scripts/prompts/polish.md`
- Create: `scripts/prompts/review.md`
- Create: `scripts/prompts/learnings.md`
- Create: `scripts/prompts/cooldown.md`

**Context:** Each prompt template is a markdown file that gets interpolated by `_work_phase`. Variables like `{VERTICAL}`, `{PRIOR_KB_DOCS}`, `{BREADBOARD_PATH}` get replaced by the shell function.

Each prompt should:

1. Tell Claude what phase it's in and what skills to load
2. Tell it what docs to read first (prior KB docs, ROADMAP, BRIEFs)
3. Tell it what to produce (KB doc, artifacts)
4. Tell it what agents/teams to spawn if applicable
5. Include the session naming convention for `claude session rename`

Also update `_work_phase` in `work.sh` to resolve the right prompt template and interpolate variables.

**Commit:**

```bash
git add scripts/prompts/ scripts/work.sh
git commit -m "feat(devx): add all phase prompt templates and wiring"
```

---

### Task 4.2: Domain-Specific Review Agents (Session B)

**Files:**

- Create: `.claude/agents/finance-sme.md`
- Create: `.claude/agents/build-reviewer.md`

**Context:** These agents are spawned as sub-agents during the self-review step of the build session protocol.

**finance-sme agent:**

- Scans for financial calculations (invoicing, quoting, pricing)
- Verifies all monetary arithmetic uses `big.js` via `lib/helpers/money.ts`
- Checks for floating-point operations on money values
- Flags any `+`, `-`, `*`, `/` on variables that could be monetary
- References the lessons-learned entry about IEEE 754 errors

**build-reviewer agent:**

- General code quality review
- Checks for DRY violations, unused imports, `any` types
- Verifies Tailwind usage (no hardcoded px, uses design tokens)
- Checks component composition (proper use of `cn()`, shadcn patterns)
- Verifies Zod-first types (no separate interfaces)

**Commit:**

```bash
git add .claude/agents/finance-sme.md .claude/agents/build-reviewer.md
git commit -m "feat(devx): add finance-sme and build-reviewer agents"
```

---

## Wave 5: End-to-End Test + DevX Review (Serial)

> **Dependencies:** Wave 4 complete.
> **Output:** Verified working pipeline, DevX review KB doc, learnings KB doc.

### Task 5.1: End-to-End Pipeline Test

**No files created.** This is a manual test.

Test the full pipeline on a small scope:

1. Run `work research devx` — verify it creates worktree, Zellij tab, starts Claude with research prompt, registers in registry
2. Run `work sessions` — verify registry shows the session
3. Run `work clean devx-research` — verify cleanup works
4. Create a minimal YAML manifest with 2 sessions
5. Run `work build <manifest>` — verify KDL generated, Zellij launches, both sessions start
6. Run `work resume <topic>` — verify it resumes the right session
7. Run `work next` — verify it reads project state and recommends
8. Run `work status` — verify all layers shown
9. Start Ada: test 1:1 check-in flow

Document issues found. Create GitHub Issues for bugs with `vertical/devx` label.

---

### Task 5.2: DevX Review + Learnings KB Docs

**Files:**

- Create: `knowledge-base/src/content/sessions/2026-02-XX-devx-review.md`
- Create: `knowledge-base/src/content/sessions/2026-02-XX-devx-learnings.md`

Run the review and learnings phases on the devx vertical itself:

1. `work review devx` — quality gate on the work function, skills, agents
2. `work learnings devx` — synthesize what we learned building the devx vertical
3. Verify KB docs are created and build validates: `cd knowledge-base && npm run build`

**Commit:**

```bash
git add knowledge-base/src/content/sessions/
git commit -m "docs(devx): add review and learnings KB docs"
```

---

## Implementation Notes

### For All Sessions

- **Read the design doc first:** `docs/plans/2026-02-14-devx-workflow-design.md`
- **Existing work.sh:** `scripts/work.sh` (495 lines, tmux-based — reference for logic but replace tmux with Zellij)
- **Existing skills:** `.claude/skills/` — follow the same SKILL.md format with trigger, prerequisites, process, tips sections
- **Existing agents:** `.claude/agents/` — follow the same YAML frontmatter + system prompt format
- **KB schema:** `knowledge-base/src/content.config.ts` — verticals include `devx`, stages include `polish`
- **PM labels:** Already created on GitHub: `vertical/*`, `type/*`, `priority/*`, `source/*`, `phase/*`
- **Registry:** `~/Github/mokumo-worktrees/.session-registry.json`
- **Session naming:** `session/MMDD-{vertical}-{stage}` for pipeline, `session/MMDD-{vertical}-w{N}-{topic}` for build waves

### Testing Shell Functions

Shell functions don't have traditional unit tests. Test each command manually after implementation:

1. Run the command with valid args — verify expected output
2. Run with missing args — verify error message
3. Run with invalid args — verify graceful failure
4. Check registry state after CRUD operations with `jq`
5. Verify Zellij sessions/tabs created and Claude starts

### Zellij Commands Reference

```bash
zellij --layout <file.kdl>           # Launch with layout
zellij list-sessions                  # List active sessions
zellij attach <session-name>          # Attach to session
zellij kill-session <session-name>    # Kill session
zellij action new-tab --name <name>   # Add tab to current session
zellij action close-tab               # Close current tab
zellij action rename-tab <name>       # Rename current tab
```
