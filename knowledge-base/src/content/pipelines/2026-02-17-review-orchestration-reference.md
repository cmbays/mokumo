---
title: 'Review Orchestration Engine — Reference Guide'
subtitle: 'Living reference for the automated PR quality gate: what it is, why it exists, how it works, and how to extend it'
date: 2026-02-17
phase: 1
pipelineName: 'Review Orchestration Engine'
pipelineType: horizontal
products: []
tools: ['skills-framework', 'agent-system']
stage: wrap-up
tags: [feature, decision, learning]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0217-i342-review-skills-finish'
status: complete
---

> **Living document.** Update this file when the engine's config, pipeline stages, agents, or gate logic change. This is the first place a new agent or developer should read to understand the review system.

---

## Why This Tool Exists

Mokumo uses Claude agents to build features. Those agents finish implementation, run tests, and create PRs. The problem: deciding _which review agents to invoke_, and _what to check_, was left to the building agent itself.

That's the fox guarding the henhouse. The building agent is most likely to overlook its own mistakes. Manual reviewer selection meant:

- Financial code could merge without `finance-sme`
- UI changes could ship without `design-auditor`
- "Small" PRs skipped review entirely
- Coverage was random — dependent on the building agent's memory of what existed

The **Review Orchestration Engine** removes that discretion. Every build PR runs the same 6-stage pipeline. The right agents are dispatched automatically based on what changed. Coverage is consistent by construction.

---

## What It Is

A **skill** — `.claude/skills/review-orchestration/SKILL.md` — that runs inside the building agent's context during `build-session-protocol` Phase 2 (Self-Review). It is not a standalone agent, not a CI job (yet), and not an optional step. It is a required quality gate before any build PR can be created.

The skill runs a 6-stage pipeline:

```
Normalize → Classify → Compose → Gap Detect → Dispatch → Aggregate
```

Each stage has a clear input/output contract, validated by Zod schemas. The final output is a `ReviewReport` with a `GateDecision` that tells the building agent whether to fix things or proceed to PR creation.

---

## The 6 Stages in Plain Language

### Stage 1 — Normalize: _What changed?_

Extracts the raw facts from git: which files changed, how many lines, what the commits say. These facts are **immutable** — every subsequent stage reads them but never changes them.

```
Input:  git state
Output: PRFacts { branch, baseBranch, files, totalAdditions, totalDeletions, commits }
```

**Why immutable?** Following the Rule Engine pattern (Drools/OPA): data (facts) is separated from logic (rules) from execution (actions). Stages cannot corrupt the input.

**Edge case handled:** If `HEAD~1` doesn't exist (first commit, orphan branch), falls back to `git merge-base HEAD origin/main`.

---

### Stage 2 — Classify: _What kind of change is this?_

Runs deterministic glob-to-domain matching against `config/review-domains.json`. No LLM call. Fast.

```
Input:  PRFacts
Output: PRClassification { domains, riskScore, riskLevel, type, scope, filesChanged, linesChanged }
```

**Example mappings** (from `config/review-domains.json`):

- `lib/schemas/**` → `schemas`
- `lib/helpers/money.ts` → `financial`
- `components/features/**` → `ui-components`
- `app/globals.css` → `design-system`
- `config/**` → `infrastructure`

**Risk score** = base 10 + 5 per additional domain (first domain free) + 1 per 50 lines changed. A PR touching 3 domains with 200 lines changed scores 24 (10 + 5×2 + 4).

**PR type** inferred from commit message prefixes (`feat` → `feature`, `fix` → `bugfix`, `refactor` → `refactor`, `docs` → `docs`, `test` → `test`, `chore` → `chore`). When commits mix types, resolves to `mixed`.

**Scope** classifies size: `small` (few files, low lines), `medium`, `large` (many files or high line count).

---

### Stage 3 — Compose: _Which agents should review this?_

Evaluates composition policies from `config/review-composition.json`. Pure function — same input always produces the same output.

```
Input:  PRClassification
Output: AgentManifestEntry[] { agentId, reason, scope, priority, rules, triggeredBy }
```

**Three trigger types:**

- `always` — dispatch regardless of what changed (currently: `build-reviewer`)
- `domain` — dispatch when matched domains overlap policy's domain list
- `risk` — dispatch when `PRClassification.riskLevel` meets or exceeds `trigger.riskLevel` (enum order: `low` < `medium` < `high` < `critical`)

**Current composition policies:**

| Policy ID                   | Trigger                                   | Dispatches       |
| --------------------------- | ----------------------------------------- | ---------------- |
| `universal-build-reviewer`  | always                                    | `build-reviewer` |
| `financial-domain-reviewer` | domains: `financial`, `dtf-optimization`  | `finance-sme`    |
| `design-domain-reviewer`    | domains: `ui-components`, `design-system` | `design-auditor` |

---

### Stage 4 — Gap Detect: _Did we miss anything?_

The LLM layer. The building agent (not a sub-agent) reads the full diff and asks: _"Are there concerns in this diff that none of the dispatched agents are specialized to catch?"_

```
Input:  full git diff + AgentManifest[]
Output: amended AgentManifest[] + GapLog[]
```

**Examples of gaps it catches:**

- A `+` operator on a money value in a file that didn't match the `financial` glob
- A new `<input>` element in a TypeScript utility file (UI concern outside `components/`)
- A hardcoded API URL in a config file that no security reviewer would see
- Schema changes with downstream implications not covered by existing agents

**If a gap is found:**

- An existing agent can cover it → add to manifest with `reason: "gap-detect"`
- No existing agent covers it → log to `GapLog[]` (don't invent agents)

**Gap log** entries become GitHub Issues during wrap-up. Each gap closes the feedback loop — it either updates `config/review-domains.json` (so Stage 2 catches it next time) or `config/review-rules.json` (so an agent checks for it explicitly). The system self-improves.

---

### Stage 5 — Dispatch: _Run the agents._

Launches all agents from the final manifest **in parallel** (single message, multiple Task tool calls).

```
Input:  AgentManifest[]
Output: ReviewFinding[] from each agent (merged flat)
```

Each agent receives:

1. List of files to review (`scope` from manifest)
2. Git diff filtered to those files
3. Instruction to output `ReviewFinding[]` JSON only — no prose, no markdown tables
4. Reference to `config/review-rules.json` for rule IDs to check against

**Finding schema** (uniform across all agents):

```json
{
  "ruleId": "rule-id-from-config",
  "agent": "build-reviewer | finance-sme | design-auditor",
  "severity": "critical | major | warning | info",
  "category": "type-safety | financial-arithmetic | design-system | ...",
  "file": "relative/path/to/file.ts",
  "line": 42,
  "message": "What is wrong",
  "fix": "How to fix it",
  "dismissible": false
}
```

For file-level findings (e.g., "this file is missing tests"), omit the `line` field entirely — do not set it to `null`. The schema uses `.optional()`, not `.nullable()`.

**Failure handling:** If an agent returns invalid JSON or times out, a `GapLogEntry` is created with `concern: "agent-dispatch-failure"` and the pipeline continues.

---

### Stage 6 — Aggregate: _What's the verdict?_

Merges all findings, deduplicates, sorts, counts by severity, and computes the gate decision.

```
Input:  ReviewFinding[] (all agents)
Output: ReviewReport + GateDecision
```

**Deduplication:** Same `ruleId` + `file` + `line` → keep higher severity. For file-level findings where `line` is absent, same `ruleId` + `file` (both with no `line` field) → keep higher severity.

**Gate decision** (conditions evaluated top-to-bottom, first match wins):

| Condition              | Decision             | What happens                    |
| ---------------------- | -------------------- | ------------------------------- |
| `metrics.critical > 0` | `fail`               | Must fix, re-run from Stage 1   |
| `metrics.major > 0`    | `needs_fixes`        | Should fix, re-run from Stage 1 |
| `metrics.warning > 0`  | `pass_with_warnings` | File as GitHub Issues, proceed  |
| otherwise              | `pass`               | Proceed immediately             |

**Metric-based, not rule-based** (SonarQube pattern). Adding new rules to config automatically makes the gate stricter without changing any gate logic code.

---

## The Gate Decision Flow

```
Stage 6 returns gate decision
         │
         ├─ fail ──────────────────────────────┐
         │                                     │
         ├─ needs_fixes ───────────────────┐   │
         │                                 │   ▼
         ├─ pass_with_warnings ────┐    Fix critical/major findings
         │                        │    Re-run from Stage 1
         ├─ pass ─────────────┐   │
                              │   │
                              ▼   ▼
                      Proceed to Phase 3
                      (PR creation)
```

For `pass_with_warnings`: create GitHub Issues with labels:

- `vertical/<name>` — which vertical owns the deferred item
- `type/tech-debt` — it's deferred technical debt
- `source/review` — originated from review, not a feature request
- `priority/low` or `priority/medium` — based on impact

---

## PR Body Review Summary

Every PR created after orchestration includes this block:

```markdown
### Review summary

- **Agents dispatched**: build-reviewer, finance-sme
- **Gate decision**: PASS (clean on first run)
- **Findings addressed**: 0
- **Warnings deferred**: None
- **Gaps detected**: None
```

Or after a fix cycle:

```markdown
### Review summary

- **Agents dispatched**: build-reviewer, finance-sme, design-auditor
- **Gate decision**: PASS_WITH_WARNINGS (resolved from FAIL on attempt 1)
- **Findings addressed**: 2 critical fixed (big.js arithmetic in QuoteRow, QuoteTotal)
- **Warnings deferred**: 1 → GitHub Issue #NNN (hardcoded px value in QuoteCard)
- **Gaps detected**: 1 → will file config improvement issue in wrap-up
```

---

## Worked Examples

### Example 1: Pure Config Change

**PR**: Adds a new entry to `config/review-composition.json`

**Stage 2**: domains = `["config"]`, riskScore = 10 (base 10, single domain, <50 lines changed)

**Stage 3**: Only `build-reviewer` dispatched (universal policy; no `domain`-triggered agents match `config`)

**Stage 4**: LLM scans diff — the new entry adds a `risk` trigger with a very low threshold. No concern for an existing agent. No gap logged.

**Stage 5**: `build-reviewer` runs. Finds no issues.

**Stage 6**: 0 findings. Gate = `pass`. PR created immediately.

---

### Example 2: Financial Code Change

**PR**: Modifies `lib/schemas/quote.ts` and `components/features/QuoteRow.tsx`

**Stage 2**: domains = `["financial", "ui-components"]`, riskScore = 27

**Stage 3**: `build-reviewer` (universal) + `finance-sme` (financial domain) + `design-auditor` (ui-components domain)

**Stage 4**: LLM scans diff. Notices a `+` operator on a `subtotal` variable in `QuoteRow.tsx` — this file matched `ui-components` in Stage 2, but `finance-sme`'s `scope` will include it because Stage 3 set `scope` based on capabilities. No manifest amendment needed, no gap logged.

**Stage 5**: Three agents run in parallel.

- `finance-sme` finds: `+` operator on `subtotal` (critical, `fin-bigjs-01`)
- `build-reviewer` finds: no issues
- `design-auditor` finds: `mt-[14px]` hardcoded value (warning, `ds-spacing-01`)

**Stage 6**: 1 critical, 1 warning. Gate = `fail`.

**Building agent**: Fixes `subtotal + tax` → `money(subtotal).plus(tax)`. Re-runs from Stage 1.

**Second pass**: 0 critical, 1 warning. Gate = `pass_with_warnings`.

**Building agent**: Files GitHub Issue for the px value. Proceeds to PR with review summary noting 1 critical fixed, 1 warning deferred.

---

### Example 3: Gap Detect Catches a Miss

**PR**: Adds a new utility function `lib/helpers/dtf-waste-calc.ts` for DTF cost calculations

**Stage 2**: `lib/helpers/` doesn't match any financial glob (it matches `lib/helpers/money*` but not `lib/helpers/dtf-*`). domains = `[]`. riskScore = 10.

**Stage 3**: Only `build-reviewer` dispatched.

**Stage 4**: LLM reads the diff. Sees arithmetic like `wastage * pricePerSheet` directly in the utility. `finance-sme` isn't in the manifest. Gap logged:

```json
{
  "concern": "Monetary arithmetic operators found in lib/helpers/dtf-waste-calc.ts not covered by finance-sme",
  "recommendation": "Add glob 'lib/helpers/dtf-*' to financial domain in config/review-domains.json",
  "confidence": 0.95,
  "suggestedAgent": "finance-sme"
}
```

`finance-sme` added to manifest with `reason: "gap-detect"`.

**Stage 5**: `build-reviewer` + `finance-sme` run in parallel. `finance-sme` finds the raw multiplication on a money value (critical).

**Stage 6**: 1 critical. Gate = `fail`. Building agent fixes it.

**Wrap-up**: Gap log issue filed → `config/review-domains.json` updated to add `lib/helpers/dtf-*` to the financial domain. This gap will never happen again.

---

## Config Files Reference

All four config files live at the project root. All changes are validated by Zod at import time via `lib/review/load-config.ts`.

### `config/review-agents.json`

The agent registry. Every agent that can be dispatched must be registered here.

```json
{
  "id": "build-reviewer",
  "name": "Code Quality Reviewer",
  "tools": ["Read", "Grep", "Glob"],
  "capabilities": ["type-safety", "dry", "tailwind", "naming", ...],
  "description": "...",
  "outputFormat": "json"
}
```

To add a new agent: add an entry here, then add composition policies referencing the new `id`.

### `config/review-domains.json`

Maps file glob patterns to domain names. Used in Stage 2 classification.

```json
{
  "pattern": "lib/schemas/**",
  "domain": "financial",
  "description": "Zod schemas often define monetary field shapes"
}
```

To fix a gap (Stage 4 found something Stage 2 missed): add a glob entry here.

### `config/review-composition.json`

Dispatch policies. Controls which agents run for which domains/risks.

```json
{
  "id": "financial-domain-reviewer",
  "trigger": { "type": "domain", "domains": ["financial"] },
  "dispatch": "finance-sme",
  "priority": 80,
  "description": "..."
}
```

To dispatch a new agent for a domain: add a policy entry referencing the agent's registered `id`.

### `config/review-rules.json`

~60 rules defining what each agent checks. Consumed by: (1) agents as their checklist, (2) Stage 6 aggregator to enrich findings with context.

```json
{
  "id": "fin-bigjs-01",
  "name": "Financial arithmetic uses big.js",
  "concern": "Monetary arithmetic without big.js causes silent IEEE 754 rounding errors",
  "severity": "critical",
  "agent": "finance-sme",
  "category": "financial-arithmetic",
  "scope": "local",
  "description": "IEEE 754 causes silent rounding errors in JavaScript floating-point arithmetic",
  "detection": "Arithmetic operators (+, -, *, /) on monetary variables outside big.js wrapper",
  "recommendation": "Use money(), round2(), toNumber() from lib/helpers/money.ts"
}
```

---

## How to Extend the Engine

### Add a new review domain

1. Add glob patterns to `config/review-domains.json`
2. Add a composition policy to `config/review-composition.json` pointing to the relevant agent
3. Run `npm test` — schema tests verify all policy references resolve

### Add a new review agent

1. Create the agent in `.claude/agents/your-agent.md` with structured JSON output format
2. Register it in `config/review-agents.json`
3. Add rules to `config/review-rules.json` with `"agent": "your-agent"`
4. Add composition policies to `config/review-composition.json`
5. Run `npm test` — schema tests catch orphan rules and unresolved references

### Add a new rule to an existing agent

1. Add the rule to `config/review-rules.json`
2. If the rule needs a new domain, add the domain mapping too
3. Run `npm test` to verify

### Change the gate thresholds

The gate is metric-based — you can't change "thresholds" without changing the severity of rules. To make the gate stricter: upgrade a `warning` rule to `major`. To relax: downgrade a `major` rule to `warning`.

---

## Schema Reference

### Config schemas (`lib/schemas/review-config.ts`)

| Schema                     | Fields                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `reviewRuleSchema`         | id, name, concern, severity, agent, category, scope, description, detection, recommendation, goodExample? |
| `compositionPolicySchema`  | id, trigger (type, domains?, riskLevel?, pattern?), dispatch, priority, description                       |
| `agentRegistryEntrySchema` | id, name, tools, capabilities, description, outputFormat                                                  |
| `domainMappingSchema`      | pattern, domain, description                                                                              |

### Pipeline schemas (`lib/schemas/review-pipeline.ts`)

| Schema                     | Stage      | Key fields                                                                                        |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `prFactsSchema`            | 1 output   | branch, baseBranch, files, totalAdditions, totalDeletions, commits                                |
| `prClassificationSchema`   | 2 output   | domains, riskScore, riskLevel, type, scope, filesChanged, linesChanged                            |
| `agentManifestEntrySchema` | 3/4 output | agentId, reason, scope, priority, rules, triggeredBy                                              |
| `gapLogEntrySchema`        | 4 output   | concern, recommendation, confidence, suggestedRule?, suggestedAgent?                              |
| `reviewFindingSchema`      | 5 output   | ruleId, agent, severity, category, file, line?, message, fix?, dismissible                        |
| `reviewReportSchema`       | 6 output   | agentResults, findings, gaps, metrics, agentsDispatched, agentsCompleted, deduplicated, timestamp |
| `gateDecisionSchema`       | 6 output   | decision, metrics {critical, major, warning, info}, summary                                       |

---

## Review Agents

| Agent            | Capabilities                                                                                | Triggered When                           | Output                 |
| ---------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------- |
| `build-reviewer` | type-safety, dry, modularity, tailwind, naming, patterns, accessibility, schema-consistency | Always (universal)                       | `ReviewFinding[]` JSON |
| `finance-sme`    | big-js, money-arithmetic, rounding, currency, financial-invariants                          | `financial`, `dtf-optimization` domains  | `ReviewFinding[]` JSON |
| `design-auditor` | design-system, visual-hierarchy, mobile-responsive, accessibility, color-tokens, spacing    | `ui-components`, `design-system` domains | `ReviewFinding[]` JSON |

When invoked **directly** (outside review orchestration), all three return human-readable audit reports in `agent-outputs/`.

---

## What's Coming Next

This engine handles **build-phase PR quality gates** (issues #337–#342 in epic #302). Future phases extend it without changing the core pipeline:

| Issue | What                                                                                     | When    |
| ----- | ---------------------------------------------------------------------------------------- | ------- |
| #308  | CI/GitHub Actions integration — run on `git push`, not just agent invocation             | Phase 2 |
| #310  | New agents: security-reviewer, architecture-reviewer                                     | Phase 2 |
| #312  | Pipeline review stage — holistic review before `main` merge (different from per-PR gate) | Phase 2 |
| #313  | TDD evaluation integration — gate on test coverage metrics                               | TBD     |

---

## Related Sessions

- **Build session** (this epic's final sub-issue): https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/pipelines/2026-02-17-review-orchestration-engine.md
- **Skill file**: `.claude/skills/review-orchestration/SKILL.md`
- **Design doc**: `docs/plans/2026-02-16-review-orchestration-design.md`
- **Epic #302**: https://github.com/cmbays/mokumo/issues/302
- **PR #407**: https://github.com/cmbays/mokumo/pull/407
