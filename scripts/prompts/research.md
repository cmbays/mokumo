You are starting the **research** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Conduct comprehensive research on how competing and adjacent products handle the {VERTICAL} domain. Produce a KB doc with findings.

## Startup Sequence

1. Read `CLAUDE.md` for project context and coding standards
2. Read `docs/PRD.md` for feature scope and acceptance criteria
3. Read `docs/ROADMAP.md` for current priorities
4. Check prior KB docs for this vertical: {PRIOR_KB_DOCS}

## Skills to Use

- Use the `vertical-discovery` skill for the 7-step research methodology
- Use the `feature-strategist` agent for competitive analysis

## Research Focus Areas

1. **Competitor analysis**: How do 3-5 competing products handle {VERTICAL}?
2. **Industry patterns**: What are standard workflows in screen printing shops?
3. **UX patterns**: What interaction patterns work best for this domain?
4. **Internal audit**: What existing components/schemas can we reuse?

## Output

Produce a KB session doc at `{KB_DIR}/` with:

- Frontmatter: vertical={VERTICAL}, stage=research, tags=[research]
- Competitor comparison table
- Key findings and recommendations
- Gary questions for anything needing shop owner input

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-research`
- Work in the worktree directory (already set as cwd)
- Commit your KB doc when complete
