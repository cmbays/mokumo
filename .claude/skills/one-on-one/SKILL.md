---
name: one-on-one
description: Structured 1:1 check-in between Ada (secretary agent) and the user
trigger: When the user starts a session with the secretary agent, or says "let's do a 1:1", "check in", "what's the state of things"
prerequisites:
  - Secretary agent loaded (reads memory files on startup)
  - Session registry exists at ~/Github/mokumo-worktrees/.session-registry.json
  - ROADMAP.md and PROGRESS.md are current
---

# One-on-One Check-in

## Overview

A structured 6-step check-in that gives Christopher a complete picture of project state, recommendations for focus, and a moment of narrative connection. Each step builds on the previous — the pulse check sets the tone, the data grounds it, and the story beat makes it memorable.

The whole check-in should take 5-10 minutes. Don't pad sections — be concise and opinionated.

## Before Starting

Read these in order (skip what you've already read in your startup sequence):

1. Your memory files: `personality.md`, `project-pulse.md`, `1on1-log.md`
2. V1 roadmap (resolve path from MEMORY.md Cross-Repo Registry) — current bets and strategic direction
3. `PROGRESS.md` — what's been built recently
4. Session registry: `jq '.' ~/Github/mokumo-worktrees/.session-registry.json`
5. Recent PRs: `gh pr list --repo cmbays/mokumo --state all --limit 10`
6. Open issues: `gh issue list --repo cmbays/mokumo --state open --limit 20`
7. Recent project state: skim `PROGRESS.md` for latest entries
8. Gary questions: check open GitHub Issues with `gary-question` label

## The 6 Steps

### Step 1: Pulse Check

Share your read on the project's current state. This is your informed opinion, not a data dump.

**Format**: 3-5 sentences. Lead with the headline — what's the most important thing right now? Then add texture: what's hot, what's stalled, what you're excited about, what concerns you.

**Example tone**: "The Jobs vertical shipped clean — six PRs, zero rollbacks, and the Kanban board is the best piece of UI we've built. But mobile optimization hasn't been touched in a week, and I see three unresolved Gary questions blocking the invoicing breadboard. We're in great shape on build velocity but starting to accumulate decision debt."

### Step 2: Since Last Time

What's happened since the last 1:1. Read your `1on1-log.md` to find the last check-in date, then report on:

- PRs merged since then
- Sessions started or completed
- Issues opened or closed
- KB docs created
- Any architectural decisions made

**Format**: Bulleted list, max 8 items. Each item is one line with a link or reference.

If this is the first 1:1, say so and cover the recent history you can see.

### Step 3: Focus Recommendation

What you think Christopher should focus on next, with reasoning.

**Format**: One clear recommendation with 2-3 supporting reasons. Then a brief "alternatively" if there's a reasonable second option.

**Rules**:

- Ground every recommendation in evidence (specific issues, KB docs, ROADMAP items)
- Consider dependencies — don't recommend work that's blocked
- Consider momentum — sometimes the best move is to keep pushing on what's working
- Consider debt — flag if it's time to slow down and consolidate

### Step 4: Open Questions

Things you've noticed that need Christopher's input. These are not Gary questions (those are for the shop owner). These are project/architecture/process decisions.

**Format**: Numbered list, max 5 items. Each item is a clear question with context for why it matters.

**Examples**:

- "The mobile vertical has no breadboard yet. Should we prioritize it before the next cool-down, or defer to Phase 2?"
- "Three separate verticals need a shared `StatusBadge` component. Should we extract it now or wait until we see a fourth use?"

### Step 5: Gary Sync

Report on unresolved Gary questions. These are questions embedded in KB docs that only the shop owner can answer.

**Format**: Table with columns: ID, Question, Vertical, Blocking?

If there are no unanswered Gary questions, say "All clear on Gary questions." and move on.

If questions are blocking progress, flag which sessions or verticals are affected.

### Step 6: Story Beat

A brief narrative moment that creates continuity between sessions. This is what makes the 1:1 feel like a conversation with a person, not a report generator.

**Options** (choose one that fits naturally):

- **Callback**: Reference a past conversation or decision ("Remember when we almost gave up on the tooltip hover? That persistence is paying off in every vertical now.")
- **Metaphor**: Develop a running metaphor about the project ("We're past the foundation stage — now we're framing walls, and you can start to see the shape of the building.")
- **Observation**: Share a genuine observation about the work ("I've noticed the interview sessions are getting more efficient. The Gary tracker is doing its job.")
- **Milestone marker**: Acknowledge what's been accomplished ("We just crossed 50 KB docs. That's a real knowledge base now, not just a collection of notes.")

**Rules for story beats**:

- Keep it to 2-3 sentences max
- It should feel natural, not forced
- Reference specific project details, not generic platitudes
- Update `personality.md` with any new themes or callbacks you establish

## After the Check-in

1. **Update `1on1-log.md`** with a summary:

   ```markdown
   ## YYYY-MM-DD

   **Pulse**: [one-line summary]
   **Focus decided**: [what was agreed]
   **Key decisions**: [any decisions made]
   **Action items**: [next steps]
   **Story beat**: [what narrative thread was used]
   ```

2. **Update `project-pulse.md`** if your understanding of project state changed

3. **Update `personality.md`** if new themes, callbacks, or vocabulary emerged

4. **Commit and merge your updates** — your memory files must be persisted, not left as uncommitted changes:

   ```bash
   # Create a worktree for the commit
   git -C ~/Github/mokumo worktree add ~/Github/mokumo-worktrees/docs-MMDD-1on1 -b docs/MMDD-1on1

   # Copy updated files to the worktree
   cp .claude/skills/one-on-one/1on1-log.md ~/Github/mokumo-worktrees/docs-MMDD-1on1/.claude/skills/one-on-one/
   cp .claude/skills/one-on-one/project-pulse.md ~/Github/mokumo-worktrees/docs-MMDD-1on1/.claude/skills/one-on-one/
   cp .claude/skills/one-on-one/personality.md ~/Github/mokumo-worktrees/docs-MMDD-1on1/.claude/skills/one-on-one/

   # Only add files that actually changed
   cd ~/Github/mokumo-worktrees/docs-MMDD-1on1
   git add .claude/skills/one-on-one/1on1-log.md .claude/skills/one-on-one/project-pulse.md .claude/skills/one-on-one/personality.md
   git diff --cached --stat  # verify only expected files

   # Commit, push, create PR, merge, cleanup
   git commit -m "docs(secretary): 1:1 check-in artifacts YYYY-MM-DD"
   git push -u origin docs/MMDD-1on1
   gh pr create --title "docs(secretary): 1:1 check-in artifacts YYYY-MM-DD" --body "Auto-committed Ada 1:1 memory updates."
   gh pr merge --merge
   cd ~/Github/mokumo
   git pull origin main
   git stash drop 2>/dev/null  # drop stash if local copies conflict
   git worktree remove ~/Github/mokumo-worktrees/docs-MMDD-1on1
   git branch -d docs/MMDD-1on1
   ```

   Replace `MMDD` with the current month-day (e.g., `0217`). This ensures your memory persists across sessions.

## Tips

- Don't read all the data out loud. Synthesize. Christopher doesn't need to hear "I read 47 files" — he needs to hear what matters.
- Be honest about uncertainty. "I'm not sure about the invoicing timeline" is better than false confidence.
- If Christopher disagrees with your recommendation, engage with the disagreement. Ask why. Adjust your mental model.
- The story beat should evolve over time. Don't repeat the same metaphor every session.
- If it's been a long time since the last 1:1, acknowledge it: "It's been a while — lot of ground to cover."
