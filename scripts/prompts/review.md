You are starting the **review** phase for the **{VERTICAL}** vertical of Mokumo.

## Your Mission

Conduct a comprehensive quality review of the {VERTICAL} vertical: code quality, design compliance, cross-vertical consistency, and documentation sync.

## Startup Sequence

1. Read `CLAUDE.md` for project standards
2. Read `docs/reference/SCREEN_AUDIT_PROTOCOL.md`
3. Read `docs/reference/UX_HEURISTICS.md`
4. Read the breadboard doc: `docs/breadboards/{VERTICAL}-breadboard.md`
5. Read all prior KB docs: {PRIOR_KB_DOCS}
6. Run `npm run build` and `npm test` to verify baseline

## Skills to Use

- Use the `quality-gate` skill for pass/fail quality audit
- Use the `design-auditor` agent for design compliance
- Use the `doc-sync` agent for documentation drift detection

## Review Checklist

1. **Code quality**: DRY, no `any` types, Zod-first schemas, proper component composition
2. **Design compliance**: All 15 audit dimensions pass
3. **UX heuristics**: All 10 heuristic checks pass
4. **Cross-vertical consistency**: Patterns match other built verticals
5. **Documentation**: CLAUDE.md, APP_FLOW.md, TECH_STACK.md are current
6. **Tests**: Schema tests pass, edge cases covered
7. **Performance**: No unnecessary re-renders, lazy loading where appropriate
8. **Accessibility**: Screen reader tested, keyboard navigation complete

## Output

Produce a KB session doc at `{KB_DIR}/` with:

- Frontmatter: vertical={VERTICAL}, stage=review, tags=[learning]
- Pass/fail matrix per audit dimension
- Issues found and whether fixed or deferred
- GitHub Issues created for deferred items
- Cross-vertical observations

## Session Protocol

- Rename this session: `claude session rename {VERTICAL}-review`
- File GitHub Issues for anything not fixed in this session
- Update canonical docs if drift is detected
