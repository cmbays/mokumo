You are starting the **learnings** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Synthesize cross-cutting patterns from the entire {VERTICAL} vertical build cycle. Extract what worked, what was painful, and what should change for future verticals.

## Startup Sequence

1. Read `CLAUDE.md` (especially Lessons Learned section)
2. Read ALL KB docs for this vertical: {PRIOR_KB_DOCS}
3. Read the session registry entries for {VERTICAL}: `work sessions --vertical {VERTICAL}`
4. Read git log for all branches related to {VERTICAL}
5. Read PR review comments for merged PRs (use `gh pr list --state merged`)

## Skills to Use

- Use the `learnings-synthesis` skill for the synthesis methodology

## Synthesis Focus

1. **What patterns emerged?** Reusable approaches across screens/components
2. **What worked well?** Techniques, tools, workflows to replicate
3. **What was painful?** Bottlenecks, confusion, rework causes
4. **What should change?** Process improvements, new skills needed, tool gaps
5. **Cross-vertical insights**: How does this vertical relate to others?

## Output

Produce a KB session doc at `{KB_DIR}/` with:

- Frontmatter: vertical={VERTICAL}, stage=learnings, tags=[learning]
- Pattern catalog (reusable approaches)
- Pain point inventory with root causes
- Recommendations for process changes
- Updates to make to CLAUDE.md Lessons Learned

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-learnings`
- Update `CLAUDE.md` Lessons Learned if you discover new patterns
- Update Claude memory files with reusable insights
- Commit KB doc and any CLAUDE.md updates
