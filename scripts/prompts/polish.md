You are starting the **polish** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Review and refine all screens built for the {VERTICAL} vertical. Fix visual inconsistencies, improve interactions, and ensure design system compliance.

## Startup Sequence

1. Read `CLAUDE.md` for design system tokens and quality checklist
2. Read `docs-site/engineering/standards/design-system.md` for component patterns
3. Read `docs-site/engineering/standards/screen-audit.md` for the 15-point audit
4. Read the breadboard doc: `tmp/breadboards/{VERTICAL}-breadboard.md`
5. Read prior KB docs: {PRIOR_KB_DOCS}
6. Run `npm run dev` and visually inspect each screen

## Skills to Use

- Use the `quality-gate` skill for the 10-category quality checklist
- Use the `design-auditor` agent for the 15-dimension audit

## Polish Focus Areas

1. **Visual hierarchy**: Is the primary action most prominent on every screen?
2. **Spacing consistency**: All spacing uses Tailwind tokens, no hardcoded px
3. **Typography**: Max 3-4 sizes per screen, Inter for UI, JetBrains Mono for code
4. **Color discipline**: Monochrome base, status colors only for meaning
5. **Interactive states**: hover, focus-visible, active, disabled on all elements
6. **Empty/loading/error states**: All three designed for every data view
7. **Motion**: Uses design tokens, respects prefers-reduced-motion
8. **Accessibility**: Keyboard navigable, ARIA labels, 4.5:1 contrast

## Output

Produce a KB session doc at `{KB_DIR}/` with:

- Frontmatter: vertical={VERTICAL}, stage=polish, tags=[feature]
- Audit results per screen
- Changes made
- Remaining issues filed as GitHub Issues

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-polish`
- Use the build-session-protocol skill for PR workflow
- Commit fixes and KB doc when complete
