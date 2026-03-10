/**
 * Personality Registry
 *
 * Central registry of all available personalities. Adding a new personality:
 * 1. Add CSS override block in globals.css
 * 2. Add manifest entry here
 * 3. Done — all components automatically support it
 */

import type { PersonalityManifest, PersonalityName } from './types'

export const PERSONALITIES: Record<PersonalityName, PersonalityManifest> = {
  niji: {
    name: 'niji',
    label: 'Niji',
    description: 'Neobrutalist — bold shadows, flat surfaces, high-contrast accents',
    cssClass: '', // Default personality — no class needed
    modes: ['dark', 'light'] as const,
  },
  'liquid-metal': {
    name: 'liquid-metal',
    label: 'Liquid Metal',
    description: 'Luxury chrome — metallic gradient rings, grain texture, warm gold accents',
    cssClass: 'personality-liquid',
    modes: ['dark', 'light'] as const,
  },
}

/** Default personality */
export const DEFAULT_PERSONALITY: PersonalityName = 'niji'

/** Default mode */
export const DEFAULT_MODE = 'dark' as const

/**
 * Get the CSS classes to apply on the root element for a given personality + mode.
 * Returns a string like "personality-liquid light" or "" (for niji dark).
 */
export function getPersonalityClasses(
  personality: PersonalityName,
  mode: 'dark' | 'light'
): string {
  const manifest = PERSONALITIES[personality]
  const classes: string[] = []
  if (manifest.cssClass) classes.push(manifest.cssClass)
  if (mode === 'light') classes.push('light')
  return classes.join(' ')
}
