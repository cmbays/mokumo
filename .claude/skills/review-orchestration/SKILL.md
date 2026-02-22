---
name: review-orchestration
description: Automated quality gate — classifies PR, dispatches review agents, aggregates findings, gates merge
trigger: Invoked automatically by build-session-protocol Phase 2
prerequisites:
  - Working git worktree with feature branch
  - Changes committed (diff available)
  - CLAUDE.md loaded
---

# Review Orchestration Skill

## Purpose

Automated quality gate for every build-phase PR. Runs a deterministic 6-stage pipeline that classifies the diff, dispatches the appropriate review agents in parallel, aggregates their structured findings, and produces a gate decision before any PR can be created.

No manual agent selection. No guessing which reviewers are needed. Consistent coverage on every PR.

## Config References

All config is in the `tools/orchestration/config/` directory. Load via `tools/orchestration/review/load-config.ts` — never import raw JSON directly.

| File                                                 | Contents                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `tools/orchestration/config/review-domains.json`     | Glob→domain mappings for Stage 2                                        |
| `tools/orchestration/config/review-composition.json` | Dispatch policies for Stage 3                                           |
| `tools/orchestration/config/review-agents.json`      | Agent registry (IDs: `build-reviewer`, `finance-sme`, `design-auditor`) |
| `tools/orchestration/config/review-rules.json`       | Rule definitions consumed by Stage 6 aggregator                         |

All schemas are in `src/domain/entities/review-config.ts` (config schemas) and `tools/orchestration/review/schemas.ts` (pipeline data schemas).

## Pipeline Execution

Run all 6 stages in sequence. Each stage's output is the next stage's input. Do not skip stages.

---

### Stage 1: NORMALIZE — Extract PR Facts

**Goal**: Produce an immutable `PRFacts` object from the current git diff.

**Instructions**:

1. Determine the comparison base:
   - Run `git rev-parse --verify HEAD~1` — if it succeeds, use `HEAD~1`
   - Otherwise (first commit, orphan branch): fall back to `git merge-base HEAD origin/main`
   - Store the result as `$BASE`
2. Run `git diff $BASE --stat` to get file list and line counts
3. Run `git diff $BASE --name-only` to get the changed files
4. Run `git log --oneline -5` to capture commit metadata
5. Produce a `PRFacts` object conforming to `prFactsSchema` from `lib/schemas/review-pipeline.ts`:
   - `branch`: current branch name from `git branch --show-current`
   - `baseBranch`: `"main"` (or `"HEAD~1"` for local-only runs)
   - `files`: array of `fileChangeSchema` objects (`path`, `additions`, `deletions`, `status`)
   - `totalAdditions`, `totalDeletions`: totals from git stat
   - `commits`: array of `commitInfoSchema` objects (`sha`, `message`, `author`)

**Output**: `PRFacts` (immutable — stages 2-6 read but never mutate it)

---

### Stage 2: CLASSIFY — Deterministic Domain Mapping

**Goal**: Map changed files to domains and compute a risk score.

**Instructions**:

1. Load `tools/orchestration/config/review-domains.json` (via `tools/orchestration/review/load-config.ts` — call `loadDomainMappings()`)
2. For each file in `PRFacts.files`, match against glob patterns in the domain config
3. Collect the unique set of matched domains
4. Compute risk score: base 10 + 5 per additional domain + 1 per 50 lines changed
5. Infer PR type: `feature` | `bugfix` | `refactor` | `docs` | `test` | `chore` | `mixed` based on commit messages and file patterns
6. Derive `riskLevel` from `riskScore`: `low` (<20), `medium` (20-39), `high` (40-69), `critical` (≥70)
7. Produce `PRClassification` conforming to `prClassificationSchema`:
   - `domains`: array of matched domain strings
   - `riskScore`: numeric score (0-100)
   - `riskLevel`: derived risk level (reviewRiskLevelEnum)
   - `type`: inferred PR type (prTypeEnum)
   - `scope`: `small` | `medium` | `large` (prScopeEnum)
   - `filesChanged`: count of files in `PRFacts.files`
   - `linesChanged`: `PRFacts.totalAdditions + PRFacts.totalDeletions`

**Output**: `PRClassification`

---

### Stage 3: COMPOSE — Policy Evaluation

**Goal**: Produce the agent manifest — the list of agents to dispatch and their scope.

**Instructions**:

1. Load `tools/orchestration/config/review-composition.json` (via `tools/orchestration/review/load-config.ts` — call `loadCompositionPolicies()`)
2. For each composition policy:
   - If `trigger.type === "always"` → include the agent
   - If `trigger.type === "domain"` → include the agent if any `trigger.domains` intersect `PRClassification.domains`
   - If `trigger.type === "risk"` → include the agent if `PRClassification.riskLevel` meets or exceeds `trigger.riskLevel` (order: `low` < `medium` < `high` < `critical`)
3. Sort dispatched agents by priority (highest first)
4. For each dispatched agent, include scope context:
   - Which files they should focus on (filtered by their capabilities)
   - Which domains triggered their inclusion
5. Produce `AgentManifest[]` conforming to `agentManifestEntrySchema`:
   - `agentId`: agent ID from registry
   - `reason`: why this agent was dispatched
   - `scope`: files relevant to this agent's capabilities
   - `priority`: numeric priority from composition policy
   - `rules`: array of rule IDs from `tools/orchestration/config/review-rules.json` this agent should check
   - `triggeredBy`: ID of the composition policy that triggered this entry

**Output**: `AgentManifest[]`

---

### Stage 4: GAP DETECT — LLM Coverage Check

**Goal**: Identify concerns in the diff that the config-based classifier may have missed. Amend the manifest if needed.

**Instructions** (you are the LLM performing this step — no sub-agent spawned):

1. Read the full diff using the same base established in Stage 1: `git diff $BASE` (where `$BASE` is `HEAD~1` or the merge-base fallback determined in Stage 1)
2. Review the diff against the current `AgentManifest[]`
3. Ask yourself: "Are there patterns in this diff that none of the dispatched agents are specialized to catch?"
4. Examples of gaps to look for:
   - A financial calculation in a file that didn't match the financial domain glob
   - A new UI component in a config-only change
   - A schema change with downstream implications not covered by existing agents
   - Security-sensitive patterns (hardcoded values, input handling) with no security reviewer dispatched
5. If a gap is found:
   - If an existing agent could catch it: add it to the manifest with `reason: "gap-detect"`
   - If no existing agent covers it: log the gap (do NOT dispatch an agent that isn't in the registry)
6. Produce amended `AgentManifest[]` and `GapLog[]`:
   - Each `GapLogEntry` conforming to `gapLogEntrySchema`:
     - `concern`: what was found
     - `recommendation`: which new rule or agent would catch this in future
     - `confidence`: 0.0–1.0 float indicating how certain you are this is a real gap
     - `suggestedRule`: (optional) rule ID that should be added to `tools/orchestration/config/review-rules.json`
     - `suggestedAgent`: (optional) agent ID that should cover this concern

**Output**: Amended `AgentManifest[]` + `GapLog[]`

---

### Stage 5: DISPATCH — Parallel Agent Execution

**Goal**: Launch all agents from the manifest in parallel. Collect `ReviewFinding[]` from each.

**Instructions**:

1. For each agent in the amended `AgentManifest[]`, spawn a Task with:
   - `subagent_type`: the agent ID (e.g., `"build-reviewer"`, `"finance-sme"`, `"design-auditor"`)
   - `prompt`: structured prompt including:
     - List of files to review (`scope` from manifest)
     - The diff output for those files
     - Instruction to output structured JSON conforming to `ReviewFinding[]`
     - Reference to `tools/orchestration/config/review-rules.json` for the rule IDs to check against
2. Agents run in parallel (use a single message with multiple Task tool calls)
3. Each agent returns `ReviewFinding[]` JSON. Parse and validate against `reviewFindingSchema` from `lib/schemas/review-pipeline.ts`.
4. If an agent returns invalid JSON or times out: log as a `GapLogEntry` with `concern: "agent-dispatch-failure"` and continue

**Agent prompt template**:

```
You are the [agent name] agent performing a structured code review.

Review the following changed files for issues:
[scope list]

Git diff:
[filtered diff for scope]

Output ONLY a JSON array of findings conforming to reviewFindingSchema:
{
  "ruleId": "<rule-id from tools/orchestration/config/review-rules.json>",
  "agent": "<your agent ID>",
  "severity": "critical" | "major" | "warning" | "info",
  "category": "<category string>",
  "file": "<relative file path>",
  "line": <line number — omit this field entirely for file-level findings>,
  "message": "<clear description of the finding>",
  "fix": "<how to fix it>",
  "dismissible": false
}

Return [] if no findings. Return only the JSON array — no markdown, no prose.
```

**Output**: `ReviewFinding[]` from each agent (merged into a flat array)

---

### Stage 6: AGGREGATE — Report + Gate Decision

**Goal**: Merge all findings, dedupe, compute gate decision, produce the final `ReviewReport`.

**Instructions**:

1. Merge all `ReviewFinding[]` arrays from Stage 5 into one flat array
2. Dedupe: if two findings have the same `ruleId` + `file` + `line`, keep the one with higher severity. For file-level findings where `line` is absent/omitted, deduplicate when `ruleId` + `file` match and both have no `line` field
3. Sort by severity: `critical` → `major` → `warning` → `info`
4. Build `metrics` (severityMetricsSchema): `{ critical, major, warning, info }` counts
5. Compute gate decision (evaluate conditions in priority order — first match wins):
   - `metrics.critical > 0` → `fail`
   - `metrics.major > 0` → `needs_fixes`
   - `metrics.warning > 0` → `pass_with_warnings`
   - else → `pass`
6. Produce `ReviewReport` conforming to `reviewReportSchema`:
   - `agentResults`: per-agent result objects from Stage 5
   - `findings`: sorted, deduplicated finding array
   - `gaps`: `GapLogEntry[]` from Stage 4
   - `metrics`: severity counts object
   - `agentsDispatched`: count of agents dispatched
   - `agentsCompleted`: count of agents that returned results
   - `deduplicated`: count of findings merged
   - `timestamp`: ISO timestamp
7. Produce `GateDecision` conforming to `gateDecisionSchema`:
   - `decision`: gate value from step 5
   - `metrics`: same severity counts object
   - `summary`: human-readable one-liner ("3 critical, 2 major, 1 warning — FAIL")

**Output**: `ReviewReport` + `GateDecision`

---

## Gate Decision Response

After Stage 6, act on the gate decision:

### `fail` — Critical findings present

1. Do NOT proceed to Phase 3 (PR creation)
2. Display all critical findings to yourself (not the user unless they're watching)
3. Fix every critical finding in the code
4. Re-run the full review orchestration pipeline from Stage 1
5. Repeat until gate is `pass` or `pass_with_warnings`

### `needs_fixes` — Major findings present

1. Do NOT proceed to Phase 3 (PR creation)
2. Fix all major findings
3. Re-run the review orchestration pipeline from Stage 1
4. Repeat until gate is `pass` or `pass_with_warnings`

### `pass_with_warnings` — Only warnings/info

1. Proceed to Phase 3 (PR creation)
2. For each warning finding, create a GitHub Issue with labels:
   - `vertical/<name>`, `type/tech-debt`, `source/review`, `priority/low` or `priority/medium`
3. Include warning count and issue links in the PR body

### `pass` — No findings

1. Proceed immediately to Phase 3 (PR creation)
2. Include the clean review result in the PR body

---

## PR Body Review Summary Block

Include this block in every PR body under `### Review summary`:

```
### Review summary
- **Agents dispatched**: [list of agent IDs]
- **Gate decision**: [PASS / PASS_WITH_WARNINGS / NEEDS_FIXES / FAIL]
- **Findings addressed**: [N critical, M major fixed before PR]
- **Warnings deferred**: [X warnings → GitHub Issues #NNN, #NNN]
- **Gaps detected**: [Y gaps logged for config improvement] or "None"
```

If any gaps were logged in Stage 4, add a note:

```
- **Review gaps**: [N concerns logged — will create config improvement issues in wrap-up]
```

---

## Gap Log Handling

After the PR is merged (or during wrap-up), for each `GapLogEntry`:

1. Create a GitHub Issue with:
   - Title: `review: add rule for [concern]`
   - Labels: `type/tooling`, `vertical/devx`, `priority/low`
   - Body: gap entry's `concern`, `recommendation`, and `confidence` fields (plus `suggestedRule`/`suggestedAgent` if present)
2. These issues feed back into `tools/orchestration/config/review-rules.json` and `tools/orchestration/config/review-domains.json` updates

This closes the feedback loop — the system self-improves as gaps are found and codified.

---

## Rules

- **Never skip stages** — run all 6, even if Stage 2 returns no domains
- **Never dispatch agents not in `tools/orchestration/config/review-agents.json`** — log gaps instead
- **Stage 4 is synchronous** — it runs in the current agent's context, not a sub-agent
- **Stage 5 is parallel** — dispatch all manifest agents in a single message
- **Gate conditions are priority-ordered** — first match wins, do not OR conditions
- **Never modify tests to make the gate pass** — fix the implementation
- **Re-run from Stage 1 after fixes** — not just Stage 6
