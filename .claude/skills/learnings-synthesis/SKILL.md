---
name: learnings-synthesis
description: Synthesize cross-cutting patterns from a vertical's entire build cycle into actionable learnings
trigger: During the learnings phase (`work learnings <vertical>`), or when the user asks to retrospect on a vertical
prerequisites:
  - At least 2 KB docs exist for the target vertical
  - Session registry has entries for the vertical
  - Build work for the vertical is substantially complete
---

# Learnings Synthesis

## Overview

After a vertical's build cycle, this skill reads everything that happened — KB docs, PRs, reviews, registry entries, git history — and extracts patterns that improve future work. The output is a learnings KB doc and updates to `CLAUDE.md` Lessons Learned.

This is not a summary of what was built. It's an extraction of **how** it was built and what that teaches us.

## Process

### Step 1: Gather Sources

Read all available material for the target vertical. Be thorough — the value comes from cross-referencing.

**KB docs** (primary source):

```bash
gh issue list --repo cmbays/mokumo --label "product/{VERTICAL}" --state all --limit 50
```

Read each matching file. Pay attention to: decisions made, Gary questions, blockers encountered, approaches tried.

**Session registry**:

```bash
jq --arg v "{VERTICAL}" '.sessions[] | select(.vertical == $v)' ~/Github/mokumo-worktrees/.session-registry.json
```

Note: how many sessions, how long they ran, which stages were used, any forks.

**Git history**:

```bash
git log --oneline --all --grep="{VERTICAL}" | head -20
gh pr list --repo cmbays/mokumo --state merged --search "{VERTICAL}" --limit 20 --json number,title,additions,deletions,reviews
```

Note: PR sizes, review comments, how many rounds of review.

**PR review comments** (look for patterns in feedback):

```bash
gh pr list --repo cmbays/mokumo --state merged --search "{VERTICAL}" --json number --jq '.[].number' | head -5
```

For each PR, skim reviews: `gh api repos/cmbays/mokumo/pulls/{N}/reviews`

**Open issues** related to the vertical:

```bash
gh issue list --repo cmbays/mokumo --label "product/{VERTICAL}" --state open
# or for domain-scoped work:
gh issue list --repo cmbays/mokumo --label "domain/{VERTICAL}" --state open
```

### Step 2: Extract Patterns

Analyze the gathered material across five dimensions:

**A. What patterns emerged?**
Reusable approaches that worked across multiple screens or sessions:

- Component patterns (shared components that emerged)
- Data flow patterns (how state was managed)
- Schema patterns (Zod schema design choices)
- Testing patterns (what verification approaches worked)

**B. What worked well?**
Techniques, tools, or workflows worth replicating:

- Which skills/agents added the most value?
- Which prompt templates produced the best results?
- Where did the pre-build ritual (breadboard -> plan -> build) pay off?
- What review feedback was most actionable?

**C. What was painful?**
Bottlenecks, confusion, or rework causes:

- Where did sessions get stuck?
- What caused merge conflicts or rework?
- Which review comments pointed to systematic issues?
- Where were the most Gary questions concentrated?

**D. What should change?**
Process improvements for future verticals:

- New skills or agents needed?
- Template changes?
- Workflow adjustments?
- Tool gaps?

**E. Cross-vertical insights**
How this vertical relates to others:

- Shared components that should be extracted
- Patterns that contradicted another vertical's approach
- Dependencies that weren't anticipated
- Knowledge that transfers directly

### Step 3: Draft Learnings Doc

Write the KB doc using the template at `templates/learnings-template.md`.

**Rules for the doc**:

- Every claim is backed by a specific reference (KB doc, PR number, issue number)
- Patterns need at least 2 supporting instances to be called a "pattern"
- Pain points include root causes, not just symptoms
- Recommendations are actionable ("Update CLAUDE.md with X") not vague ("improve documentation")

### Step 4: Update CLAUDE.md

If you discovered patterns that should prevent future mistakes:

1. Read current `CLAUDE.md` Lessons Learned section
2. Draft new entries following the existing format: `**Topic**: Explanation with specifics.`
3. Only add entries that are:
   - Verified across multiple instances (not a one-off)
   - Actionable (tells Claude what to do or avoid)
   - Not already captured
4. Present the proposed additions to the user before editing

### Step 5: Update Memory

If running as part of the secretary agent's context:

- Update `project-pulse.md` with new understanding of this vertical
- Note any personality/narrative developments for `personality.md`

If running standalone:

- Update Claude auto-memory with reusable patterns
- Focus on patterns that apply across verticals, not vertical-specific details

### Step 6: Commit

```bash
git add PROGRESS.md  # learnings recorded in progress
git add CLAUDE.md  # if updated
git commit -m "docs({VERTICAL}): add learnings synthesis"
```

## Tips

- The most valuable learnings are often not in the KB docs themselves but in the _gaps_ — what wasn't documented, what was decided implicitly, what caused confusion later.
- Look for the "second time" pattern — when was something done a second time and done differently? That delta is a learning.
- PRs with many review rounds often contain the richest learnings — the gap between "what was built" and "what reviewers expected" reveals process issues.
- Don't over-synthesize. 5 concrete, actionable learnings are more valuable than 20 vague observations.
- If a pattern applies to all verticals, flag it as a CLAUDE.md update. If it's vertical-specific, keep it in the learnings doc.
