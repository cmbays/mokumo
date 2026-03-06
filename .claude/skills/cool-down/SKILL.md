# cool-down

Structured retrospective and forward planning between build cycles. Synthesizes accumulated feedback, reviews project state, and shapes pitches for the next cycle of work. Based on Shape Up methodology adapted for solo dev + AI agents.

## Trigger

Use between verticals, after demos, or whenever the user wants to step back and plan. Also useful after accumulating feedback, ideas, or bug reports that need triaging.

## Prerequisites

- V1 roadmap exists (resolve path from MEMORY.md Cross-Repo Registry) with current strategic context
- GitHub Issues populated with labels (product/_, domain/_, tool/_, type/_, priority/_, source/_)
- `PROGRESS.md` reflects recent work
- KB sessions exist for recent build work
- Vertical BRIEFs in `docs/verticals/` (create if missing)

## Process

### Step 1: HARVEST (deterministic)

Gather all raw material. Read these sources systematically:

1. **Open GitHub Issues**: `gh issue list --state open --limit 100` — inventory all open work
2. **Recent KB sessions**: Read `knowledge-base/src/content/sessions/` files from the last 2 weeks
3. **PROGRESS.md**: What shipped recently
4. **ROADMAP.md**: Current strategic context, open questions, forward planning items
5. **Vertical BRIEFs**: Read all `docs/verticals/*/BRIEF.md` files for accumulated feedback
6. **Recent PRs**: `gh pr list --state merged --limit 10` — what was built and reviewed

**Output**: Write a harvest summary to `.session-context.md` (gitignored scratchpad) with:

- Total open issues by vertical and type
- Recent completions
- Accumulated feedback themes
- Unresolved questions from BRIEFs

### Step 2: SYNTHESIZE (nondeterministic — use judgment)

Analyze the harvest and find patterns:

1. **Group feedback** into themes (e.g., "3 separate pieces of feedback point to UX confusion in quoting")
2. **Identify cross-vertical dependencies** (e.g., "invoicing and quoting share pricing logic that should be unified")
3. **Surface technical debt patterns** (e.g., "5 issues are about deriving types from Zod schemas")
4. **Flag stale docs** — any canonical doc with `last_verified` older than 2 weeks
5. **Identify architectural questions** that need research before building
6. **Note what's working well** — patterns to preserve and reinforce

**Output**: Synthesis section in `.session-context.md` with:

- 3-5 themes with supporting evidence
- Cross-vertical dependency map
- Tech debt clusters
- Stale doc list
- What's working well

### Step 3: SHAPE CANDIDATES (nondeterministic — use judgment)

Based on synthesis, propose 2-3 shaped pitches for what to work on next:

Each pitch follows this template (see `templates/pitch-template.md`):

- **Problem**: What user pain or project need does this address?
- **Appetite**: How much time is this worth? (small = 1-2 sessions, medium = 3-5, large = 5+)
- **Solution sketch**: High-level approach, not detailed spec
- **Rabbit holes**: What to explicitly avoid or defer
- **Dependencies**: What must be true before this can start?

Include at least one pitch from each category when relevant:

- **New vertical or feature** — forward progress
- **Revisit existing vertical** — based on feedback
- **Infrastructure or tooling** — platform improvements

**Output**: 2-3 shaped pitches written to `.session-context.md`

### Step 4: UPDATE ARTIFACTS (deterministic)

Based on the synthesis, update project artifacts:

1. **ROADMAP.md**: Update "Current Bets" and "Forward Planning" sections
2. **Vertical BRIEFs**: Append new feedback, update pipeline stages
3. **GitHub Issues**:
   - Close issues resolved by recent PRs
   - Re-prioritize (move priority labels based on synthesis)
   - Create new issues for themes that need tracking
   - Add `source/cool-down` label to issues created during this cycle
4. **IMPLEMENTATION_PLAN.md**: Update if step status changed

**Output**: Updated canonical docs + issues

### Step 5: PRESENT TO USER (deterministic)

Present a concise summary to the user:

1. **State of the project**: 2-3 sentences on where things are
2. **Key findings**: Top 3 themes from synthesis
3. **Shaped pitches**: Present the 2-3 options with your recommendation
4. **Open questions**: Anything that needs the user's input
5. **Betting question**: "Which of these should we bet on for the next cycle?"

Wait for user decision before updating ROADMAP.md with the bet.

## Multi-Team Variant (Future)

When invoked with `--teams N`, the cool-down skill spawns N agent teams:

- Each team gets a different perspective lens (e.g., UX, Technical, Business Value)
- Each team independently runs Steps 1-3
- A synthesis agent compares proposals and produces a combined report
- The combined report is presented to the user for betting

**Not yet implemented.** See GitHub issue #83 for tracking.

## Tips

- Run cool-down even when you "know" what's next — the harvest often reveals surprises
- The synthesis step is where Claude adds the most value — give it space to think
- Pitches should be opinionated ("I recommend X because..."), not wishy-washy
- If the user has already expressed a preference for what's next, still run the harvest and synthesis — the findings inform HOW to approach the work, not just WHAT to work on
- The cool-down skill can be run as a quick 15-minute check-in or a deep 45-minute session — scale depth to need
