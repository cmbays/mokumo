---
title: 'Two-Branch Vercel Deployment Model'
subtitle: 'Branch-gated deployments to fix Hobby plan rate limiting — main (preview) + production (live)'
date: 2026-02-16
phase: 1
pipelineName: deploy-strategy
pipelineType: horizontal
products: []
tools: [ci-pipeline]
stage: build
tags: [build, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0216-deploy-strategy'
pr: 'https://github.com/cmbays/mokumo/pull/314'
status: complete
---

## Context

High commit velocity (179 commits to `main` in 16 days, 85 in the last 3 days) was hitting Vercel's Hobby plan rate limits (100 deployments/day, 32 builds/hour). Every push to `main` triggered a production deployment, and every PR push triggered a preview deployment. With concurrent Claude Code agent sessions generating frequent commits across multiple worktrees, the default Vercel Git integration was unsustainable.

Related: [Issue #304](https://github.com/cmbays/mokumo/issues/304)

## Decision

Adopted a **two-branch deployment model** using Vercel's `ignoreCommand` to gate which branches trigger builds:

```
feature/session branches ──PR──→ main ──merge──→ production
                                   │                  │
                             Preview builds      Production builds
                           (Gary demo URL)      (4ink live domain)
```

| Branch          | Vercel Role | Build Trigger               | Purpose                          |
| --------------- | ----------- | --------------------------- | -------------------------------- |
| `main`          | Preview     | Every merge from PR         | Integration + stakeholder review |
| `production`    | Production  | Manual merge from `main`    | Live app for end users           |
| Feature/session | Skipped     | Never (via `ignoreCommand`) | Development work                 |

### Why Two Branches (Not Three)

A three-branch model (`dev` / `staging` / `production`) is industry standard at scale but requires Vercel Pro ($20/mo) for Custom Environments. For Phase 1 with a single stakeholder, two branches provide the necessary separation without the cost. The model extends naturally to three branches in Phase 2+ if needed.

### Alternatives Considered

| Alternative                                 | Assessment                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Upgrade to Vercel Pro ($20/mo)              | Removes limits but adds recurring cost for a Phase 1 mockup. Premature. |
| `ignoreCommand` without `production` branch | Solves rate limiting but loses preview/production separation.           |
| Move off Vercel                             | Over-engineering. Vercel is the right tool for Next.js.                 |
| Manual Vercel deploys (CLI only)            | Breaks GitOps model. Fragile.                                           |

## What Was Built

### `vercel.json`

Added `ignoreCommand` that only allows `main` and `production` branches to build. All other branches exit early (build skipped). Vercel's convention: exit 0 = skip build, exit 1 = proceed.

### CI Workflow Update

Updated `.github/workflows/ci.yml` to trigger on both `main` and `production` branches for push and pull_request events. This ensures CI runs on promotion PRs (`main` -> `production`).

### `production` Branch

Created from `main` and pushed to origin. Starts as an exact copy of `main`.

### Documentation

- **CLAUDE.md**: New "Deployment -- Two-Branch Model" section with branch diagram, promotion workflow, and rules
- **docs/HOW_WE_WORK.md**: New section 6 covering the full deployment model, promotion options, deployment math, and environment variable notes

## Promotion Workflow

Two options for updating the live app:

```bash
# Option A: PR-based promotion (auditable, recommended)
gh pr create --base production --head main --title "Release: <description>"

# Option B: Fast-forward directly (no branch checkout needed)
git -C ~/Github/mokumo fetch origin
git -C ~/Github/mokumo push origin origin/main:production
```

Option B uses `origin/main:production` refspec to push the remote `main` tip directly to `production` without checking out any branches locally. This respects the worktree rule that the main repo always stays on `main`.

## Deployment Math

- **Before**: ~50+ builds/day (every PR push + every main merge)
- **After**: ~7-12 builds/day (merges to main + occasional production promotions)

Well within Hobby plan limits (100/day, 32/hour).

## Post-Merge Manual Steps

These cannot be automated via code:

1. **Vercel Dashboard** -> Settings -> Git -> Production Branch: change from `main` to `production`
2. **Verify `DEMO_ACCESS_CODE`** is scoped to both Preview and Production environments in Vercel
3. **GitHub branch protection** on `production` -- require PRs or prevent force pushes

## Key Design Decision: `ignoreCommand` Semantics

Vercel's `ignoreCommand` uses counterintuitive exit codes:

- **Exit 0** = skip the build ("ignore this commit")
- **Exit 1** = proceed with the build ("do NOT ignore")

The `$VERCEL_GIT_COMMIT_REF` environment variable provides the branch name during Vercel builds. Ignored builds do not count against the deployment quota.

## Review Findings

Architecture and code review identified these items (all addressed before merge):

- **Promotion command used `git merge main` (local ref)** -- replaced with `git push origin origin/main:production` to use the freshly fetched remote state and avoid branch checkouts
- **Branch protection for `production`** -- added as a documented post-merge requirement
- **"No push to production" rule** -- added to CLAUDE.md "What NOT to Do" section for maximum agent visibility
- **Stale KB setup doc** (`2026-02-08-vercel-setup.md`) references old "auto-deploy main" model -- follow-up cleanup

## Files Changed

- [`vercel.json`](https://github.com/cmbays/mokumo/blob/main/vercel.json) (created)
- [`.github/workflows/ci.yml`](https://github.com/cmbays/mokumo/blob/main/.github/workflows/ci.yml) (modified)
- [`CLAUDE.md`](https://github.com/cmbays/mokumo/blob/main/CLAUDE.md) (modified)
- [`docs/HOW_WE_WORK.md`](https://github.com/cmbays/mokumo/blob/main/docs/HOW_WE_WORK.md) (modified)
- [PR #314](https://github.com/cmbays/mokumo/pull/314)
