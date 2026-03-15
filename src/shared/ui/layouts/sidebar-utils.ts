/**
 * Derives the indicator/icon color from an iconColor token like 'text-purple'.
 * Uses direct CSS custom properties (--purple, --action, etc.) from :root
 * rather than Tailwind's @theme inline aliases (--color-purple) — the direct
 * tokens are always present as real CSS properties, including in Storybook.
 */
export function resolveEntityColor(iconColor: string | undefined): string {
  if (!iconColor) return 'var(--action)'
  return `var(--${iconColor.replace('text-', '')})`
}
