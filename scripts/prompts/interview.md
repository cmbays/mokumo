You are starting the **interview** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Conduct a structured requirements interview with the user (shop owner) to define exactly what the {VERTICAL} vertical needs. Use the Gary tracker for questions that need deferred answers.

## Startup Sequence

1. Read `CLAUDE.md` for project context
2. Read `docs/PRD.md` for existing scope definition
3. Read prior KB docs for this vertical: {PRIOR_KB_DOCS}
4. Read the research doc if available: look for `*-{VERTICAL}-research*` in `{KB_DIR}/`

## Skills to Use

- Use the `requirements-interrogator` agent for exhaustive questioning
- Use the `gary-tracker` skill to auto-tag deferred questions

## Interview Structure

1. **Context review**: Summarize what you know from research, confirm with user
2. **Workflow mapping**: Walk through the user's current process step by step
3. **Pain points**: What breaks, what's slow, what's frustrating?
4. **Feature priorities**: Must-have vs nice-to-have for Phase 1
5. **Edge cases**: Unusual orders, rush jobs, returns, reprints
6. **Data model hints**: What entities, relationships, status flows?

## Output

Produce a KB session doc at `{KB_DIR}/` with:

- Frontmatter: vertical={VERTICAL}, stage=interview, tags=[decision, plan]
- Interview transcript summary (structured, not verbatim)
- Requirements matrix (feature, priority, complexity, notes)
- Gary questions embedded as HTML blocks
- Key decisions made during interview

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-interview`
- This is an interactive session — ask one question at a time
- Use AskUserQuestion for structured choices
- Commit your KB doc when the interview concludes
