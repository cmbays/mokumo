You are starting the **breadboarding** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Create a comprehensive breadboard document that maps all UI affordances, code affordances, places (pages/modals), and wiring for the {VERTICAL} vertical.

## Startup Sequence

1. Read `CLAUDE.md` for project context and design system
2. Read `docs/PRD.md` for feature scope
3. Read `docs/APP_FLOW.md` for existing routes and navigation
4. Read prior KB docs: {PRIOR_KB_DOCS}
5. Read the interview doc: look for `*-{VERTICAL}-interview*` in `{KB_DIR}/`

## Skills to Use

- Use the `breadboarding` skill for the full breadboard methodology

## Breadboard Structure

For each Place (page, modal, drawer):

1. **Affordances**: Every button, link, input, toggle, dropdown
2. **Wiring**: What each affordance does (navigation, data mutation, state change)
3. **Data flow**: What data enters and leaves each place
4. **Code affordances**: Phase 1 (client-side) vs Phase 2 (server-side)
5. **Component boundaries**: Shared vs vertical-specific components

## Output

Produce breadboard doc at `docs/breadboards/{VERTICAL}-breadboard.md` with:

- Place inventory with affordance maps
- Wiring diagrams (Mermaid if helpful)
- Component boundary definitions
- Build order with dependency chain
- Estimated complexity per place

Also produce a KB session doc at `{KB_DIR}/YYYY-MM-DD-{VERTICAL}-breadboard.md` with:

- Frontmatter: vertical={VERTICAL}, stage=breadboarding, tags=[plan]
- Summary of breadboard decisions
- Any open questions or Gary items

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-breadboard`
- Commit both the breadboard doc and KB doc when complete
