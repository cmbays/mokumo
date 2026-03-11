---
title: 'ADR-031: Label Taxonomy Standardization'
description: 'Adopt colon separator for GitHub labels org-wide, align mokumo taxonomy with ops canonical standard, and define per-repo extension rules.'
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

### 3. Register mokumo's per-repo extensions in ops standard

Mokumo's `product:*`, `domain:*`, and `tool:*` labels are valid per-repo extensions of the org-wide `area:*` and `domain:*` namespaces. They should be formally registered.

**Mapping to ops namespaces:**

| Mokumo namespace | Ops namespace                        | Rationale                                                          |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------ |
| `product:*`      | New: `product:*` (mokumo-specific)   | More granular than `area:*` — represents user-facing product areas |
| `domain:*`       | `domain:*` (already in ops standard) | Same concept, same namespace                                       |
| `tool:*`         | New: `tool:*` (mokumo-specific)      | Developer infrastructure, more specific than `area:*`              |

The ops standard's `area:*` namespace (ci, docs, deps) remains org-wide. `product:*` and `tool:*` are registered as mokumo-specific extensions.

### 4. Adopt `status:*` labels from ops standard

Mokumo currently uses project board fields for status. We will also create the org-wide `status:*` labels (`status:triage`, `status:blocked`, `status:needs-input`, `status:in-progress`) for use alongside board fields.

**Rationale:** Labels are queryable via `gh issue list -l status:blocked` — useful for automation and PM skills. Board fields are better for visual kanban but not CLI-accessible. Both can coexist — labels for automation, board for humans.

### 5. Deprecate unprefixed labels

All unprefixed labels that have namespaced equivalents will be deprecated:

| Deprecated         | Replacement                              |
| ------------------ | ---------------------------------------- |
| `interview`        | `source:interview`                       |
| `testing`          | `source:testing`                         |
| `cool-down`        | `source:cool-down`                       |
| `idea`             | `source:idea`                            |
| `review`           | `source:review`                          |
| `infrastructure`   | `tool:ci-pipeline` or `area:ci`          |
| `low-priority`     | `priority:later`                         |
| `pipeline-type`    | Remove (use `pipeline:*` labels instead) |
| `good first issue` | Remove (no external contributors)        |
| `github_actions`   | `area:ci`                                |

### 6. Add `type:ux-review` to ops standard

Mokumo's pm.md defines `type/ux-review` which is not in the ops standard. Propose adding `type:ux-review` as an org-wide type label — UX review items are relevant across products.

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

### Negative

- One-time migration cost for ~50 existing issues
- `priority:soon` replaces the more intuitive `priority/next` — minor naming loss
- Closing `icebox` items requires human review to avoid losing valid deferred work

### Neutral

- `product:*` and `tool:*` become mokumo-specific extensions — other repos don't need them
- `status:*` labels coexist with board fields — slight redundancy, but different access patterns (CLI vs UI)
