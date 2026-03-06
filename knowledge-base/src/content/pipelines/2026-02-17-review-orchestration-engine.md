---
title: 'Review Orchestration Engine'
subtitle: 'Automated quality gate — classifies PRs, dispatches review agents, aggregates findings, gates merge'
date: 2026-02-17
phase: 1
pipelineName: 'Developer Experience Infrastructure'
pipelineType: horizontal
products: []
tools: ['agent-system', 'ci-pipeline']
stage: wrap-up
tags: [feature, build, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0217-i342-review-skills-finish'
status: complete
---

## What Is the Review Orchestration Engine?

The Review Orchestration Engine is an automated quality gate built into the Mokumo developer workflow. Every time a build session finishes implementation, the engine automatically analyzes the diff, determines which review agents are needed, runs them in parallel, aggregates their findings into a unified report, and makes a pass/fail gate decision — all without the building agent manually selecting reviewers or deciding what to check.

It lives as a skill at `.claude/skills/review-orchestration/SKILL.md` and is automatically invoked by `build-session-protocol` Phase 2 on every build PR.

---

## The Problem It Solves

Before this engine existed, PR reviews were manual and inconsistent:

- **Random coverage**: Some PRs got thorough multi-agent reviews; others got a quick self-review
- **Missing specialized checks**: Financial calculations could merge without `finance-sme`; UI changes could slip through without `design-auditor`
- **Growing technical debt**: Hard-coded values, repeated logic, and unextracted patterns slipped through because no systematic check caught them
- **The fox guarding the henhouse**: `build-session-protocol` relied on the _building agent itself_ to decide which reviewers to invoke — the person most likely to overlook their own mistakes

As the project scaled (7+ verticals, 529+ tests, stacked PRs across concurrent worktrees), manual review orchestration became a bottleneck and a consistency risk. The engine replaces human judgment about reviewer selection with deterministic, config-driven dispatch.

---

## Architecture: The 6-Stage Pipeline

```
Building agent finishes implementation
       │
       ▼
build-session-protocol Phase 2 triggers
       │
       ▼
┌─────────────────────────────────────┐
│ Stage 1: NORMALIZE                  │
│ git diff → PRFacts (immutable)      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Stage 2: CLASSIFY                   │
│ Glob→domain matching + risk score   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Stage 3: COMPOSE                    │
│ Dispatch policies → agent manifest  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Stage 4: GAP DETECT (LLM)           │
│ Review diff for uncovered concerns  │
│ Amend manifest + log gaps           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Stage 5: DISPATCH (parallel)        │
│ Launch agents → ReviewFinding[] JSON│
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Stage 6: AGGREGATE                  │
│ Merge findings → ReviewReport       │
│ Severity counts → gate decision     │
└─────────────────────────────────────┘
```

### Stage 1: Normalize

Extracts an immutable `PRFacts` object from the git diff: files changed, lines added/removed, commit messages, branch name. This is the single source of truth that all subsequent stages read without mutating.

### Stage 2: Classify

Runs deterministic glob-to-domain pattern matching using `config/review-domains.json`. Maps each changed file to a domain (e.g., `financial`, `ui-components`, `design-system`). Computes a risk score based on domain count and lines changed. Infers PR type (`feature`, `fix`, `refactor`, `config`).

**No LLM call in Stage 2.** It's fast and deterministic.

### Stage 3: Compose

Evaluates composition policies from `config/review-composition.json` against the classification. Three trigger types:

- `always` — dispatch regardless (e.g., `build-reviewer` always runs)
- `domain` — dispatch when matched domains intersect the policy's domain list
- `risk` — dispatch when risk score exceeds a threshold

Produces an `AgentManifest[]` specifying which agents to dispatch, why, and which files to focus on.

### Stage 4: Gap Detect

This is the LLM layer. The building agent itself (not a sub-agent) reads the full diff and the current manifest, then asks: _"Are there patterns in this diff that none of the dispatched agents are specialized to catch?"_

Examples of gaps it might find:

- A financial calculation in a file that didn't match the financial domain glob
- A new UI component buried in a config-only change
- Security-sensitive input handling with no security reviewer dispatched

If a gap is found, the manifest is amended. The gap is logged to a `GapLog[]` for later — each gap entry becomes a GitHub Issue to improve `config/review-domains.json` or `config/review-rules.json`.

**This is the self-improving feedback loop.** Gaps found today become rules that prevent tomorrow's misses.

### Stage 5: Dispatch

Launches all agents from the manifest in parallel (single message, multiple Task tool calls). Each agent receives a structured prompt with the diff for its focus files and instructions to return `ReviewFinding[]` JSON.

All three review agents were migrated from markdown output to structured JSON in issue #341. This makes Stage 6 agent-agnostic — the aggregator doesn't need to know which agent produced which finding.

### Stage 6: Aggregate

Merges all `ReviewFinding[]` arrays, deduplicates by file+line+category (keeping highest severity), sorts by severity, and computes the gate decision:

| Condition      | Decision             |
| -------------- | -------------------- |
| `critical > 0` | `fail`               |
| `major > 0`    | `needs_fixes`        |
| `warning > 0`  | `pass_with_warnings` |
| all clean      | `pass`               |

Conditions are evaluated top-to-bottom — first match wins. This is **metric-based** (SonarQube pattern), not rule-based, so the gate automatically adapts as new rules are added to config.

---

## Gate Decision Response

The building agent acts on the gate decision immediately:

| Decision             | Action                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| `fail`               | Fix all critical findings, re-run from Stage 1                                    |
| `needs_fixes`        | Fix all major findings, re-run from Stage 1                                       |
| `pass_with_warnings` | File warnings as GitHub Issues (`type/tech-debt`, `source/review`), proceed to PR |
| `pass`               | Proceed directly to PR creation                                                   |

Re-runs always start from Stage 1 — not Stage 6 — so the PRFacts are fresh after fixes.

---

## How to Use It

The engine runs automatically. A building agent doesn't invoke it directly — `build-session-protocol` Phase 2 triggers it.

**If you're a building agent following build-session-protocol**:

Phase 2 now reads:

```
7. Invoke the review-orchestration skill
8. Act on the gate decision (fix → re-run, or proceed)
9. Do not proceed to Phase 3 until gate is pass or pass_with_warnings
```

That's it. The skill handles everything else.

**If you want to understand what's being checked**, see:

- `config/review-rules.json` — ~60 rules across all agents
- `config/review-composition.json` — dispatch policies (what triggers which agent)
- `config/review-domains.json` — glob→domain mappings
- `config/review-agents.json` — agent registry

---

## Review Agents

Three agents are registered in the engine:

| Agent            | Triggered When                                               | What It Checks                                                                               |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `build-reviewer` | Always (universal policy)                                    | DRY, type safety, Tailwind tokens, naming, component patterns, Zod-first types, shadcn usage |
| `finance-sme`    | When diff touches `financial` or `dtf-optimization` domains  | big.js usage, monetary arithmetic, rounding, equality checks                                 |
| `design-auditor` | When diff touches `ui-components` or `design-system` domains | Visual hierarchy, color tokens, mobile responsiveness, interaction states, spacing           |

All three now output structured `ReviewFinding[]` JSON. When invoked directly (not via orchestration), they still produce human-readable audit reports.

---

## Config Files

The engine is entirely config-driven. Adding a new rule or agent requires only a JSON change — no orchestration code changes.

| File                             | Schema                       | Purpose                                     |
| -------------------------------- | ---------------------------- | ------------------------------------------- |
| `config/review-rules.json`       | `reviewRuleSchema[]`         | ~60 rules consumed by agents and aggregator |
| `config/review-composition.json` | `compositionPolicySchema[]`  | When to dispatch which agent                |
| `config/review-agents.json`      | `agentRegistryEntrySchema[]` | Agent registry (IDs, capabilities)          |
| `config/review-domains.json`     | `domainMappingSchema[]`      | Glob patterns → domain names                |

Schemas live in `lib/schemas/review-config.ts` (config) and `lib/schemas/review-pipeline.ts` (pipeline data). Config loaders are in `lib/review/load-config.ts` — all consumers go through validated loaders.

Tests in `lib/schemas/__tests__/review-config.test.ts` verify:

- All rule IDs are unique
- All agent references resolve to registered agents
- All severity values are valid
- No orphan rules (rules without a policy dispatching their agent)
- Universal policies exist

---

## Design Decisions

| Decision           | Choice                                      | Rationale                                                            |
| ------------------ | ------------------------------------------- | -------------------------------------------------------------------- |
| Invocation model   | Auto via build-session-protocol             | Quality gate on every build PR, not a manual command                 |
| Classifier layers  | Config base + LLM gap detector + gap logger | Deterministic for speed, LLM for coverage, gaps for self-improvement |
| Gate logic         | Severity metric counts                      | Self-maintaining as rules are added — no gate changes needed         |
| Agent output       | Structured `ReviewFinding[]` JSON           | Enables machine aggregation; aggregator is agent-agnostic            |
| Stage 4 invocation | Building agent's own LLM context            | No additional agent spawn — lightweight, leverages existing context  |
| Config format      | JSON (not YAML)                             | Strict parsing; `description` fields are validated documentation     |

---

## Example: A Financial + UI PR

Imagine a PR that touches `lib/schemas/quote.ts` (financial domain) and `components/features/QuoteCard.tsx` (ui-components domain):

**Stage 2 output**: domains = `["financial", "ui-components"]`, riskScore = 25

**Stage 3 output**: manifest = `[build-reviewer, finance-sme, design-auditor]` (all three triggered)

**Stage 4**: LLM scans diff, finds no additional concerns

**Stage 5**: Three agents run in parallel. finance-sme finds a `+` operator on a money value. build-reviewer finds no issues. design-auditor finds a hardcoded px value.

**Stage 6**: 1 critical (money arithmetic), 1 warning (hardcoded px). Gate = `fail`.

**Gate response**: Building agent fixes the `+` → `money()` call, re-runs from Stage 1. On second pass: 0 critical, 1 warning. Gate = `pass_with_warnings`. Agent files a GitHub Issue for the px value, proceeds to PR.

---

## PR Body Review Summary

Every PR created after review orchestration includes this section:

```markdown
### Review summary

- **Agents dispatched**: build-reviewer, finance-sme, design-auditor
- **Gate decision**: PASS_WITH_WARNINGS (resolved from FAIL on attempt 1)
- **Findings addressed**: 1 critical fixed (monetary arithmetic in QuoteCard)
- **Warnings deferred**: 1 warning → GitHub Issue #NNN (hardcoded px value)
- **Gaps detected**: None
```

---

## What's Next

This engine covers **build-phase PR quality gates** (sub-issues #337–#342). Future phases:

- **#308** — CI/GitHub Action integration (run on push, not just agent invocation)
- **#310** — New agent types (security-reviewer, architecture-reviewer)
- **#312** — Pipeline review stage (holistic review before main merge, not just per-PR)
- **#313** — TDD evaluation integration

---

## Session Links

- **Design doc**: https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-16-review-orchestration-design.md
- **Skill**: https://github.com/cmbays/mokumo/blob/main/docs/.claude/skills/review-orchestration/SKILL.md
- **PR #407**: https://github.com/cmbays/mokumo/pull/407
- **Epic #302**: https://github.com/cmbays/mokumo/issues/302
- **Issue #342**: https://github.com/cmbays/mokumo/issues/342
- Resume: `claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1`
