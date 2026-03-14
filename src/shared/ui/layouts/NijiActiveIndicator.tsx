/**
 * NijiActiveIndicator — absolutely-positioned sliding pill that tracks the
 * active nav item. Parent is responsible for measuring DOM positions and
 * passing the resulting `top`/`height`/`color` values.
 *
 * Positioning contract:
 *   - Parent <nav> must be `position: relative`
 *   - `top` is relative to the nav container's top edge (getBoundingClientRect diff)
 *   - `left: 8 / right: 8` matches the nav's `px-2` padding (8px each side)
 */
export type NijiIndicatorPos = {
  top: number
  height: number
  color: string
}

type Props = NijiIndicatorPos & {
  /** When collapsed, indicator shrinks to match icon-only nav width */
  collapsed?: boolean
}

export function NijiActiveIndicator({ top, height, color, collapsed }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: collapsed ? 6 : 8,
        right: collapsed ? 6 : 8,
        top,
        height,
        borderRadius: 6,
        border: `1.5px solid ${color}`,
        borderLeftWidth: 3,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        boxShadow: `3px 3px 0 ${color}33`,
        transition:
          'top 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.2s ease, right 0.2s ease, border-color 0.25s ease, background 0.25s ease',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
