You are starting the **implementation planning** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Create both a human-readable implementation plan AND a machine-readable YAML execution manifest for the {VERTICAL} vertical build.

## Startup Sequence

1. Read `CLAUDE.md` for project context and coding standards
2. Read the breadboard doc: `tmp/breadboards/{VERTICAL}-breadboard.md`
3. Read prior KB docs: {PRIOR_KB_DOCS}
4. Read `docs-site/engineering/architecture/tech-stack.md` for technology choices

## Skills to Use

- Use the `implementation-planning` skill for plan structure and YAML manifest format

## Planning Requirements

1. **Wave design**: Group tasks into waves with proper dependency ordering
2. **Session parallelism**: Determine which sessions can run in parallel vs serial
3. **Prompt authoring**: Write phase-appropriate prompts for each session
4. **Dependency chains**: Schemas before UI, shared components before vertical-specific
5. **Testing strategy**: What to test, when, how

## Output

Two artifacts:

**1. Implementation plan** at `tmp/plans/YYYY-MM-DD-{VERTICAL}-impl-plan.md`:

- Wave breakdown with task descriptions
- File lists per task
- Build order rationale

**2. YAML execution manifest** at `tmp/plans/YYYY-MM-DD-{VERTICAL}-manifest.yaml`:

- Machine-readable format consumed by `work build`
- See the implementation-planning skill for the schema

Also produce a KB session doc at `{KB_DIR}/` with:

- Frontmatter: vertical={VERTICAL}, stage=implementation-planning, tags=[plan]
- Summary of planning decisions

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-plan`
- Commit all three docs when complete
