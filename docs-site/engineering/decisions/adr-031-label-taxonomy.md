---
title: 'ADR-031: Label Taxonomy Standardization'
description: 'Adopt colon separator for GitHub labels org-wide, simplify mokumo taxonomy to ~28 labels aligned with ops standard, consolidate product/tool/pipeline/source into domain:* and type:chore.'
category: decision
status: active
adr_status: proposed
adr_number: 031
date: 2026-03-11
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-031: Label Taxonomy Standardization

## Status

Proposed

## Context

A cross-repo documentation audit (2026-03-11) discovered a three-way inconsistency in GitHub label conventions:

1. **Ops canonical standard** (`standards/github-labels.md`): uses colon — `type:bug`, `priority:now`
2. **Mokumo pm.md** (`docs-site/process/pm.md`): documents slash — `type/bug`, `priority/now`
3. **Actual mokumo GitHub labels**: uses both — `type/research` and `product:dashboard` coexist, plus unprefixed labels like `interview` and `testing`

Additionally, the taxonomies diverge in scope:

| Dimension | Ops (org-wide)                     | Mokumo (repo-specific)                            |
| --------- | ---------------------------------- | ------------------------------------------------- |
| Type      | 7 values (`type:*`)                | 8 values (`type/*`)                               |
| Priority  | 3 tiers (`now`, `soon`, `later`)   | 5 tiers (`now`, `next`, `later`, `low`, `icebox`) |
| Status    | 4 values (`status:*`)              | Not used (board fields instead)                   |
| Scope     | `area:*` (3 org-wide) + `domain:*` | `product/*` + `domain/*` + `tool/*` (40+ labels)  |
| Other     | `epic` standalone                  | `pipeline/*`, `phase/*`, `source/*`               |

This inconsistency blocks PM automation (the `ticket-creator` and `label-manager` skills can't know which convention to use), breaks the ops label sync script, and confuses agents that read pm.md but encounter different labels on GitHub.

## Decision

### 1. Adopt colon (`:`) as the org-wide separator

All labels across all repos use `namespace:value` format.

**Rationale:**

- Matches the ops canonical standard (single source of truth for org governance)
- Standard convention for `actions/labeler` and GitHub ecosystem tooling
- Avoids visual confusion with file paths (`domain/pricing` looks like a path)
- Already in use by the `.github` org templates (fixed to `type:bug` etc. in this session)

**Rejected alternative — slash (`/`):**

- More labels currently use `/` in mokumo (~25 vs ~8 with `:`)
- Has a "hierarchical" feel that some find intuitive
- Rejected because migration cost is a one-time event, while inconsistency is ongoing friction

### 2. Adopt ops 3-tier priority

Replace mokumo's 5-tier priority with the ops 3-tier:

| Old (mokumo)      | New (ops standard)  | Migration                        |
| ----------------- | ------------------- | -------------------------------- |
| `priority/now`    | `priority:now`      | Rename                           |
| `priority/next`   | `priority:soon`     | Rename (semantically equivalent) |
| `priority/later`  | `priority:later`    | Rename                           |
| `priority/low`    | `priority:later`    | Merge into `later`               |
| `priority/icebox` | _(close the issue)_ | Close or remove label            |

**Rationale:** Per ops standard — "if it's not worth doing, close the issue." Three tiers reduce decision fatigue. `low` and `later` are indistinguishable in practice for a solo dev. `icebox` items should be closed with a comment explaining why they're parked.

### 3. Register mokumo's `domain:*` labels as per-repo extensions

Mokumo's `domain:*` labels (10 values derived from `src/domain/` entities) are registered as per-repo extensions of the ops-standard `domain:*` namespace. The ops standard's `area:*` namespace (ci, docs, deps) remains org-wide. Mokumo adds `area:mobile` as a repo-specific `area:*` extension.

### 4. Adopt `status:*` labels from ops standard

Mokumo currently uses project board fields for status. We will also create the org-wide `status:*` labels (`status:triage`, `status:blocked`, `status:needs-input`, `status:in-progress`) for use alongside board fields.

**Rationale:** Labels are queryable via `gh issue list -l status:blocked` — useful for automation and PM skills. Board fields are better for visual kanban but not CLI-accessible. Both can coexist — labels for automation, board for humans.

### 5. Deprecate unprefixed labels

All unprefixed labels that have namespaced equivalents will be deprecated:

| Deprecated         | Replacement                             |
| ------------------ | --------------------------------------- |
| `interview`        | Remove (source namespace removed)       |
| `testing`          | Remove (source namespace removed)       |
| `cool-down`        | Remove (source namespace removed)       |
| `idea`             | Remove (source namespace removed)       |
| `review`           | Remove (source namespace removed)       |
| `infrastructure`   | `type:chore` + `area:ci`                |
| `low-priority`     | `priority:later`                        |
| `pipeline-type`    | Remove (pipeline type tracked on board) |
| `good first issue` | Remove (no external contributors)       |
| `github_actions`   | `area:ci`                               |

### 6. Align `type:*` with ops 7-type standard

Replace mokumo's 8 ad-hoc type labels with the ops canonical 7 types:

| Old (mokumo)     | New (ops standard) | Migration                               |
| ---------------- | ------------------ | --------------------------------------- |
| `type:feature`   | `type:feature`     | Keep                                    |
| `type:bug`       | `type:bug`         | Keep                                    |
| `type:tech-debt` | `type:chore`       | Merge — maintenance work is a chore     |
| `type:refactor`  | `type:chore`       | Merge — restructuring is maintenance    |
| `type:tooling`   | `type:chore`       | Merge — tooling is maintenance          |
| `type:feedback`  | `type:polish`      | Rename — feedback drives polish         |
| `type:ux-review` | `type:design`      | Rename — UX review is a design activity |
| `type:research`  | `type:research`    | Keep                                    |
| _(new)_          | `type:docs`        | New — documentation-only work           |

**Rationale:** Fewer type labels reduce decision fatigue. `chore` is a well-understood convention (conventional commits) that naturally absorbs tech-debt, refactoring, and tooling. `design` covers both architecture and UX decisions. `polish` covers feedback-driven refinements.

### 7. Consolidate `product:*` into `domain:*`

Product areas (`product:quotes`, `product:jobs`, etc.) map 1:1 to domain entities from the codebase. Maintaining separate `product:*` and `domain:*` namespaces creates a "where does it go?" decision that slows agents down.

**Decision:** Remove the `product:*` namespace entirely. All scope labels use `domain:*`, derived from `src/domain/` entities:

`domain:customers`, `domain:garments`, `domain:colors`, `domain:screens`, `domain:pricing`, `domain:artwork`, `domain:dtf`, `domain:quotes`, `domain:jobs`, `domain:invoices`

**Rationale:** The product areas ARE the domains. A quote issue touches `src/domain/quotes/` — one label, one namespace, no ambiguity.

### 8. Remove `tool:*`, `pipeline:*`, `source:*` namespaces

These namespaces added complexity without proportional value:

- **`tool:*`** (6 labels) — developer infrastructure labels. Tooling work is now `type:chore` with an optional `area:*` label.
- **`pipeline:*`** (4 labels) — pipeline types are tracked on the project board's Pipeline Stage field, not labels.
- **`source:*`** (5 labels) — provenance tracking was rarely used and not actionable.

**Rationale:** 15 fewer labels. Agents had to choose between `product:*`, `domain:*`, and `tool:*` — now there's one scope namespace (`domain:*`) plus org-wide `area:*` for cross-cutting concerns.

## Migration Plan

### Phase 1: Create new labels (non-breaking)

Run `ops/scripts/sync-labels.sh` to create all canonical labels with `:` separator on mokumo. This adds new labels without removing old ones.

### Phase 2: Re-label existing issues

For each open issue, add the `:` version and remove the `/` version:

```bash
# Example: migrate type/feature to type:feature
gh issue list -l "type/feature" --json number --jq '.[].number' | while read num; do
  gh issue edit "$num" --add-label "type:feature" --remove-label "type/feature"
done
```

Repeat for all label pairs. The `label-manager` skill can generate this migration script.

### Phase 3: Remove deprecated labels

After all issues are migrated, delete the old labels:

```bash
gh label delete "type/feature" --yes
gh label delete "priority/next" --yes
# ... etc
```

### Phase 4: Update documentation

- Update `docs-site/process/pm.md` to use `:` throughout
- Update `docs-site/process/how-we-work.md` label references
- Update `.claude/skills/build-session-protocol/SKILL.md` label references
- Update `ops/standards/github-labels.md` per-repo matrix to include mokumo extensions

## Consequences

### Positive

- Single label convention across all repos and documentation
- PM skills (`ticket-creator`, `label-manager`) can operate without ambiguity
- Ops label sync script works correctly on mokumo
- `.github` org templates align with repo labels
- Simplified priority model reduces decision fatigue
- One scope namespace (`domain:*`) eliminates the "product vs domain vs tool" decision
- ~28 total labels (down from ~55+) — less cognitive load for agents and humans
- `type:*` aligns with conventional commits vocabulary (`feat`, `fix`, `chore`, `docs`)

### Negative

- One-time migration cost for ~50 existing issues
- `priority:soon` replaces the more intuitive `priority/next` — minor naming loss
- Closing `icebox` items requires human review to avoid losing valid deferred work
- Provenance tracking (`source:*`) is lost — if needed later, can be re-added

### Neutral

- `status:*` labels coexist with board fields — slight redundancy, but different access patterns (CLI vs UI)
- Pipeline type tracking moves from labels to board fields — same data, different mechanism
- Pure infrastructure issues may only have `type:chore` + `priority:*` without a `domain:*` label — this is intentional
