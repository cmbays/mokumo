---
title: 'Work DevX — Session Persistence + Per-Worktree Environment'
subtitle: 'direnv integration, persistent Claude session store, and work resume --new-worktree'
date: 2026-02-17
phase: 1
pipelineName: 'work-devx-session-persistence'
pipelineType: horizontal
products: []
tools: [work-orchestrator]
stage: build
tags: [build, decision]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0217-work-devx-session-persistence'
status: complete
---

## Goal

Make worktree sessions fully resumable after cleanup, with rich per-worktree environment auto-loaded via direnv. Three complementary layers:

1. **Per-worktree `.envrc`** — written at creation time so every `cd` gives you session context
2. **Persistent session store** (`.claude-sessions.json`) — lives in main repo root, survives worktree cleanup
3. **`work resume --new-worktree`** — reconstitutes a working session against a fresh worktree using Claude's `--resume` flag

## What Shipped

**PR [#458](https://github.com/cmbays/mokumo/pull/458)** — 7 commits, 3 files changed (`scripts/work.sh`, `scripts/lib/registry.sh`, `.gitignore`)

| Task | Change                                            | Key Design                                                                         |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1    | `.gitignore` — `.envrc` + `.claude-sessions.json` | Global ignore (all `.envrc` are generated artifacts)                               |
| 2    | `_work_new` writes per-worktree `.envrc`          | Unquoted `<<ENVRC` so variables expand at write-time                               |
| 3    | Two-phase polling in `_poll_claude_session_id`    | 1s for first 15s (fast window) → 5s after; all `local` before loop                 |
| 4    | Persistent store (`_sessions_persistent_*`)       | `mktemp+mv` atomic writes; `\|=` merge preserves existing sessionId on topic reuse |
| 5    | `work resume` rewrite + `--new-worktree` flag     | Persistent store lookup first; collision check on resume branch                    |
| 6    | Context-aware `work status`/`work end`            | `$WORK_PIPELINE_ID` auto-injected; `${arg:0:2} != "--"` rejects flag-shaped args   |

## Key Design Decisions

**Why per-worktree `.envrc` (not shell profile)?**
direnv is scoped to the directory — `WORK_TOPIC`, `PORT`, and `CLAUDE_SESSION_ID` load automatically on `cd` and unload when you leave. No global state pollution between concurrent worktrees.

**Why a second persistent store?**
The worktree registry (`.session-registry.json`) can be wiped when `~/Github/mokumo-worktrees/` is cleaned. `.claude-sessions.json` in the main repo root (gitignored) is durable metadata — `sessionId`, `branch`, `baseRef`, `capturedAt`, `clearedAt`. Survives any worktree cleanup.

**`--resume` + positional prompt approach**
`_kdl_render_tab` already uses `claude $claude_args 'message'` — this pattern is consistent. The prompt goes to `.session-prompt.md` in the new worktree; Claude receives it as the first new message in the resumed conversation.

**Accepted tradeoff: no advisory lock on persistent store**
The registry uses `_registry_lock` (mkdir advisory). The persistent store uses `mktemp+mv` only — atomic file replacement but no read-modify-write lock. Race between poller and `work clean` is theoretically possible; a lost write is recoverable metadata. Documented in code.

**`|=` merge vs `=` replace in `_sessions_persistent_add`**
If a topic is reused after a prior cleanup, the existing `sessionId` and `clearedAt` are preserved. Only mutable fields (`branch`, `baseRef`, `createdAt`) are updated.

## Architecture After This PR

```
work <topic>
  └─ _work_new
       ├─ writes .session-context.md (existing)
       ├─ writes .envrc  ← NEW (PORT, WORK_TOPIC, WORK_BRANCH, CLAUDE_SESSION_ID="")
       ├─ _registry_add → _sessions_persistent_add  ← NEW
       └─ _poll_claude_session_id (background)  ← FASTER
            ├─ _registry_update (existing)
            ├─ _sessions_persistent_set_id  ← NEW
            └─ sed update to .envrc  ← NEW (CLAUDE_SESSION_ID filled in)

work clean <topic>
  └─ step 3c: _sessions_persistent_clear  ← NEW (sets clearedAt, keeps record)

work resume <topic>
  └─ _sessions_persistent_get_id → _registry_get fallback  ← UPGRADED
       └─ without --new-worktree: claude --resume <id>
       └─ with --new-worktree: _work_new + --resume <id>  ← NEW

work status / work end
  └─ $WORK_PIPELINE_ID injected when no arg given  ← NEW
```

## Verification Recipe

```bash
# 1. Create a worktree (no Zellij)
work test-flow --no-launch

# 2. Check .envrc written
cat ~/Github/mokumo-worktrees/session-$(date +%m%d)-test-flow/.envrc

# 3. cd in — env auto-loads
cd ~/Github/mokumo-worktrees/session-$(date +%m%d)-test-flow
echo $PORT $WORK_TOPIC $CLAUDE_SESSION_ID  # CLAUDE_SESSION_ID empty until Claude starts

# 4. Check persistent store initialized
jq '.["test-flow"]' ~/Github/mokumo/.claude-sessions.json

# 5. After Claude starts (wait ~5s): CLAUDE_SESSION_ID populated
grep CLAUDE_SESSION_ID .envrc

# 6. Clean and verify durability
cd ~/Github/mokumo
work clean test-flow
jq '.["test-flow"]' .claude-sessions.json  # clearedAt set, sessionId still there

# 7. Resume after cleanup
work resume test-flow  # works because persistent store has sessionId

# 8. Context-aware status
export WORK_PIPELINE_ID="20260217-test"
work status   # (using $WORK_PIPELINE_ID: 20260217-test) shown on stderr
```

## Files Modified

- [`scripts/work.sh`](https://github.com/cmbays/mokumo/blob/main/scripts/work.sh) — `_work_new`, `_work_resume`, `work()` dispatcher, `_work_pipeline_id_arg`
- [`scripts/lib/registry.sh`](https://github.com/cmbays/mokumo/blob/main/scripts/lib/registry.sh) — `_poll_claude_session_id`, all `_sessions_persistent_*` helpers
- [`.gitignore`](https://github.com/cmbays/mokumo/blob/main/.gitignore) — `.envrc`, `.claude-sessions.json`
