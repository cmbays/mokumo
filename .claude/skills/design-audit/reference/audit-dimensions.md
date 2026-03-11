# Design Audit Dimensions

15 dimensions to evaluate every screen against. Each dimension has specific criteria and examples of pass/fail.

## 1. Visual Hierarchy

- Does the eye land where it should?
- Is the most important element the most prominent?
- Can a user understand the screen's state in 5 seconds?
- Is the primary action unmissable? Do secondary actions support without competing?
- If everything is bold, nothing is bold.

**Pass**: Clear focal point, primary CTA stands out, information flows top-to-bottom in order of importance.
**Fail**: Multiple competing elements, unclear what to do first, CTA buried or indistinguishable.

## 2. Spacing & Rhythm

- Is whitespace consistent and intentional?
- Do elements breathe or are they cramped?
- Is the vertical rhythm harmonious?
- Does spacing use Tailwind tokens only (no hardcoded px)?

**Pass**: Consistent gaps, `space-y-6` for sections, `gap-4` for grids, breathing room between cards.
**Fail**: Inconsistent gaps, cramped elements, mixed spacing values.

## 3. Typography

- Are type sizes establishing clear hierarchy (max 3-4 sizes per screen)?
- Are there too many font weights or sizes competing?
- Does the type feel calm or chaotic?
- Is Inter used for UI and JetBrains Mono only for code?

**Pass**: Clear heading/body/label hierarchy, consistent weights, calm reading experience.
**Fail**: 5+ type sizes, competing weights, JetBrains Mono used for non-code text.

## 4. Color Usage

- Is color used with restraint and purpose?
- Do colors guide attention or scatter it?
- Is contrast sufficient for accessibility (4.5:1 minimum)?
- Are status colors used only for meaning, not decoration?
- Are all colors from the design token palette?

**Pass**: Monochrome base, `text-action` for CTAs, `text-success`/`text-error`/`text-warning` for states only.
**Fail**: Random color accents, status colors used decoratively, hardcoded hex values.

## 5. Alignment & Grid

- Do elements sit on a consistent grid?
- Is anything off by 1-2 pixels?
- Does every element feel locked into the layout with precision?

**Pass**: Consistent left edges, aligned columns, grid-based layout.
**Fail**: Misaligned elements, inconsistent margins, ragged edges.

## 6. Components

- Are similar elements styled identically across screens?
- Are interactive elements obviously interactive?
- Are disabled states, hover states, and focus states all accounted for?

**Pass**: Consistent badge styling, consistent card patterns, all buttons have hover/focus/active/disabled.
**Fail**: Two different badge styles for the same concept, buttons without hover states.

## 7. Iconography

- Are icons from Lucide React only?
- Are sizes consistent (h-4 w-4 / h-5 w-5 / h-6 w-6)?
- Do icons support meaning or just decorate?
- Are they from one cohesive set?

**Pass**: All Lucide, consistent 16/20/24px sizes, icons clarify meaning.
**Fail**: Mixed icon libraries, inconsistent sizes, decorative icons adding clutter.

## 8. Motion & Transitions

- Do transitions feel natural and purposeful?
- Is there motion that exists for no reason?
- Does the app feel responsive to interaction?
- Is `prefers-reduced-motion` respected?
- Are durations within range (150-300ms for most interactions)?
- Are only `transform` and `opacity` animated (GPU-composited)?

**Reference**: `docs-site/engineering/standards/animation.md` for duration scale, easing presets, and anti-patterns.

**Pass**: Spring transitions on modals/drawers, hover transitions on cards, reduced-motion media query, GPU-only properties.
**Fail**: Jarring animations, motion for decoration only, no reduced-motion support, animating layout properties.

## 9. Empty States

- What does every screen look like with no data?
- Do blank screens feel intentional or broken?
- Is the user guided toward their first action?

**Pass**: Icon + message + optional CTA for empty states, as defined in APP_FLOW State Definitions.
**Fail**: Blank white space, "No data" text with no guidance, missing empty state entirely.

## 10. Loading States

- Are skeleton screens, spinners, or placeholders consistent?
- Does the app feel alive while waiting or frozen?

**Note**: Phase 1 uses synchronous mock data. Loading states are not required but should be considered in component design for Phase 3 readiness.

## 11. Error States

- Are error messages styled consistently?
- Do they feel helpful and clear or hostile and technical?
- Is there a "not found" state for detail pages with invalid IDs?

**Pass**: Consistent error styling, helpful messages, link back to list view.
**Fail**: Raw error text, no recovery path, technical jargon.

## 12. Dark Mode / Theming

- Does the UI respect the user's system preference (via next-themes)?
- Do all tokens, shadows, and contrast ratios hold up in both dark and light modes?
- Are backgrounds using the correct scale (`bg-background` → `bg-card` → `bg-surface`)?
- Are all colors from design system tokens (no hardcoded hex)?

**Pass**: Consistent theming in both modes, proper background layering, readable text at all levels.
**Fail**: Hardcoded colors that break in one mode, incorrect background layer usage.

## 13. Density (Jobs Filter)

- Can anything be removed without losing meaning?
- Are there redundant elements saying the same thing twice?
- Is every element earning its place on screen?

**Pass**: Every element serves a purpose, no redundant labels, clean layout.
**Fail**: Duplicate information, labels that restate obvious context, unnecessary decorative elements.

## 14. Responsiveness (Mobile-First)

- Is the base layout (no breakpoint prefix) designed for mobile (375px)?
- Does content stack single-column on mobile and expand to multi-column at `md:`/`lg:`?
- Are touch targets >= 44x44px with >= 8px spacing between them?
- Are primary actions within thumb reach zone (bottom of viewport) on mobile?
- Do data tables have a mobile alternative (card list, stacked view)?
- Are forms single-column on mobile?
- Does the layout work at 320px without horizontal overflow?
- Is body text >= 16px (prevents iOS auto-zoom)?

**Reference**: `.claude/skills/mobile-first-design/reference/mobile-standards.md` for full breakpoint map, touch target rules, and responsive patterns.

**Pass**: Mobile-first markup, clean breakpoint transitions from 320px to 1440px+, thumb-friendly actions.
**Fail**: Desktop-only layout, tiny touch targets, hover-only interactions, horizontal scroll on mobile.

## 15. Accessibility

- Keyboard navigation works for all interactive elements
- Focus states are visible (`focus-visible` ring)
- ARIA labels on icon-only buttons
- Color contrast meets 4.5:1 minimum
- Screen reader flow makes sense

**Pass**: Tab order follows visual flow, focus rings visible, ARIA labels present, contrast passes.
**Fail**: Tab traps, invisible focus states, missing ARIA on icon buttons, low contrast text.
