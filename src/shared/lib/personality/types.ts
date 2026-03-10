/**
 * Personality System — Type Definitions
 *
 * Personalities are visual treatment layers that transform semantic tokens
 * into distinct visual identities. The same component renders differently
 * under Niji (neobrutalist) vs Liquid Metal (luxury chrome) without
 * changing any component code.
 *
 * Composition: Personality × Mode = Theme resolution
 * - Personality controls: gradient rings, shadow style, grain overlays
 * - Mode controls: light/dark color values
 * - Both are delivered via CSS custom properties on the root element
 */

/** Available personality identifiers */
export type PersonalityName = 'niji' | 'liquid-metal'

/** Light/dark mode */
export type Mode = 'dark' | 'light'

/**
 * Personality manifest — metadata for each personality.
 * Used for UI selectors, validation, and documentation.
 */
export type PersonalityManifest = {
  /** Unique identifier */
  name: PersonalityName
  /** Human-readable label */
  label: string
  /** Short description of the visual direction */
  description: string
  /** CSS class applied to root element (empty string for default personality) */
  cssClass: string
  /** Supported modes */
  modes: readonly Mode[]
}

/**
 * Full list of ds- CSS custom properties that each personality × mode
 * combination must define. Used for build-time validation.
 */
export const DS_TOKEN_NAMES = [
  // Surface tiers (beyond shadcn's background/card/surface)
  '--ds-surface-inner',
  '--ds-surface-thumb',
  // Text hierarchy (beyond shadcn's foreground/muted-foreground)
  '--ds-text-dim',
  '--ds-text-micro',
  // Accent system (personality-dependent emphasis)
  '--ds-accent-emphasis',
  '--ds-accent-glow',
  '--ds-neutral-emphasis',
  '--ds-neutral-glow',
  // Call-to-action
  '--ds-cta-bg',
  '--ds-cta-text',
  // Dividers
  '--ds-divider',
  '--ds-border-subtle',
  // Personality behavior
  '--ds-shadow-offset',
  '--ds-text-shadow',
  '--ds-gradient-borders',
  // Complex treatments (gradients as CSS vars)
  '--ds-accent-ring',
  '--ds-neutral-ring',
  '--ds-health-dot',
  '--ds-health-glow',
] as const

export type DsTokenName = (typeof DS_TOKEN_NAMES)[number]
