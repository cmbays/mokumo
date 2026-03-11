---
name: build-session-protocol
description: Completion protocol for build sessions — guides from implementation through self-review, PR, CodeRabbit, and merge-ready state
trigger: Loaded automatically by build sessions via phase prompt. Also invoke manually with "Use the build-session-protocol skill"
prerequisites:
  - Working git worktree with feature branch
  - CLAUDE.md loaded for project context
---

# Build Session Protocol

## Overview

This skill defines the end-to-end completion flow for every build session in Mokumo. It ensures consistent quality by enforcing self-review, structured PR creation, and automated review integration before declaring work merge-ready.

## Process

### Phase 1: Build

1. Read the task prompt carefully — understand what to build
2. Read `CLAUDE.md` for coding standards and design system
3. Read relevant breadboard/plan docs referenced in the prompt
4. Build the feature following TDD principles where applicable
5. Run `npm run build` and `npm test` to verify no regressions
6. Run `npx tsc --noEmit` to verify type safety — if errors, invoke `typescript-safety` skill before proceeding

### Phase 2: Self-Review

After implementation is complete, run automated review orchestration:

7. **Invoke the `review-orchestration` skill** — it runs the full 6-stage pipeline automatically:
   - Stage 1: Normalize (extract PR facts from git diff)
   - Stage 2: Classify (map files to domains, compute risk score)
   - Stage 3: Compose (evaluate dispatch policies → agent manifest)
   - Stage 4: Gap detect (LLM scan for concerns the config missed)
   - Stage 5: Dispatch (launch agents from manifest in parallel)
   - Stage 6: Aggregate (merge findings, compute gate decision)

8. **Act on the gate decision** returned by the skill:
   - `fail`: Fix all critical findings, re-run orchestration from Stage 1
   - `needs_fixes`: Fix all major findings, re-run orchestration from Stage 1
   - `pass_with_warnings`: Proceed to Phase 3; file warning findings as GitHub Issues with labels: `product:<name>` or `domain:<name>`, `type:tech-debt`, `source:review`, `priority:later`
   - `pass`: Proceed directly to Phase 3

9. **Do not proceed to Phase 3** until the gate decision is `pass` or `pass_with_warnings`.

### Phase 3: Create PR

10. Stage and commit changes with a descriptive message
11. Push the branch to origin
12. Create a PR using the merge checklist template:

```bash
gh pr create --title "<type>(<vertical>): <description>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing what was built>

## Merge Checklist

### What was built
- [ ] <Feature/component 1>
- [ ] <Feature/component 2>

### Approach
<Why this approach was chosen, key trade-offs>

### Key decisions
- <Decision 1 and rationale>

### Review summary
- **Agents dispatched**: <list of agent IDs>
- **Gate decision**: <PASS / PASS_WITH_WARNINGS / NEEDS_FIXES resolved>
- **Findings addressed**: <N critical, M major fixed before PR>
- **Warnings deferred**: <X warnings → GitHub Issues #NNN> or "None"
- **Gaps detected**: <Y gaps logged for config improvement> or "None"
- **Deferred items**: Filed as GitHub Issues (linked below)

### Testing
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Manual verification: <what was checked>

### Links
- KB doc: <path or URL>
- Breadboard: <path or URL>
- Plan: <path or URL>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Phase 4: CodeRabbit Review

13. Wait for CodeRabbit automated review (triggers on PR creation)
14. Address all critical and major CodeRabbit comments
15. For remaining items (minor, style, suggestions):
    - Create GitHub Issues with labels:
      - `product:<name>` or `domain:<name>` — which product or domain
      - `type:tech-debt` — deferred review item
      - `source:review` — originated from code review
      - `priority:later` — deferred for future cycle

### Phase 5: Final Check

16. Run a quick spot-check re-review via sub-agent on the final diff
17. Verify all tests still pass after addressing review comments
18. Update the PR description with final status

### Phase 6: Ready for Merge

19. Post a comment on the PR: "Ready for merge. All critical/major review items addressed. Deferred items filed as GitHub Issues."
20. Notify the user that the PR is ready

### Phase 7: Workspace Wrap-up (after PR merges)

Once the PR is merged, close out the pipeline's working artifacts:

21. **Record key decisions** — Commit any important decisions, findings, or architectural context to `PROGRESS.md` or relevant docs-site pages so they persist beyond the ephemeral workspace.

22. **Delete workspace** — Once key decisions are recorded, delete the pipeline's workspace dir:

    ```bash
    rm -rf tmp/workspace/{pipeline-id}/
    ```

23. **Nothing lost** — key decisions must be recorded in persistent docs before the workspace is deleted.

## Rules

- **Never modify tests to make them pass** — fix the implementation
- **Never use floating-point arithmetic for financial data** — use `big.js` via `src/domain/lib/money.ts`
- **Never push directly to main or production** — always branch + PR
- **Never skip self-review** — even for small changes
- **Always apply labels** from the PM label schema when creating GitHub Issues
- **Always run build + test + typecheck** before creating PR
- **Commit message format**: `<type>(<scope>): <description>` where type is feat/fix/docs/refactor/test

## Tips

- Read existing code before writing new code — understand patterns in use
- Check `src/shared/ui/primitives/` for shadcn primitives before creating custom components
- Use `cn()` from `@shared/lib/cn` for all className composition
- Keep PRs focused — one logical change per PR
- If you discover work outside your task's scope, file a GitHub Issue instead of doing it
