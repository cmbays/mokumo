'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Props = {
  /** Icon-only mode used when sidebar is collapsed */
  collapsed?: boolean
}

/**
 * Theme toggle with two visual states that crossfade in-place.
 *
 * Both states — a single icon button (collapsed) and an icon-only pill (expanded) —
 * are rendered simultaneously in the same `relative mx-3 my-1 h-8` wrapper using
 * `position: absolute, inset: 0`. Opacity transitions between them so there is no
 * position jump when the sidebar collapses. `pointerEvents` and `tabIndex` ensure
 * only the visible state is interactive.
 *
 * Icon alignment: the collapsed button uses `justify-center` inside the mx-3 wrapper,
 * which centers the icon at sidebar-center (36px from left edge at 72px width) —
 * matching the centering used by SidebarNavLink in collapsed mode.
 */
export function ThemeToggle({ collapsed = false }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) {
    return <div className="mx-3 my-1 h-8" aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="relative mx-3 my-1 h-8">
      {/* Collapsed: single icon toggle — fades in as sidebar narrows */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-hidden={!collapsed}
        tabIndex={collapsed ? 0 : -1}
        className="absolute inset-0 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        style={{
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? 'auto' : 'none',
          transition: 'opacity 0.18s ease',
        }}
      >
        {isDark ? (
          <Moon
            className="h-4 w-4 shrink-0"
            style={{
              transform: 'rotate(-15deg)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        ) : (
          <Sun
            className="h-4 w-4 shrink-0"
            style={{
              transform: 'rotate(15deg)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        )}
      </button>

      {/* Expanded: icon-only two-button pill — fades in as sidebar widens */}
      <div
        role="group"
        aria-label="Color scheme"
        aria-hidden={collapsed}
        className="absolute inset-0 grid grid-cols-2 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent"
        style={{
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: 'opacity 0.18s ease',
        }}
      >
        {/* Dark side */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={isDark}
          aria-label="Dark mode"
          tabIndex={collapsed ? -1 : 0}
          className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action"
          style={{
            background: isDark ? 'rgba(0,0,0,0.22)' : 'transparent',
            boxShadow: isDark
              ? 'inset 0 2px 5px rgba(0,0,0,0.45), inset 0 1px 2px rgba(0,0,0,0.3)'
              : 'none',
            transform: isDark ? 'scale(0.97)' : 'scale(1)',
            transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            borderRadius: '9999px 0 0 9999px',
          }}
        >
          <Moon
            className="h-3.5 w-3.5 shrink-0"
            style={{
              transform: isDark ? 'rotate(-15deg) scale(1.1)' : 'rotate(0deg) scale(1)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </button>

        {/* Light side */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={!isDark}
          aria-label="Light mode"
          tabIndex={collapsed ? -1 : 0}
          className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action"
          style={{
            background: !isDark ? 'rgba(0,0,0,0.22)' : 'transparent',
            boxShadow: !isDark
              ? 'inset 0 2px 5px rgba(0,0,0,0.45), inset 0 1px 2px rgba(0,0,0,0.3)'
              : 'none',
            transform: !isDark ? 'scale(0.97)' : 'scale(1)',
            transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            borderRadius: '0 9999px 9999px 0',
          }}
        >
          <Sun
            className="h-3.5 w-3.5 shrink-0"
            style={{
              transform: !isDark ? 'rotate(15deg) scale(1.1)' : 'rotate(0deg) scale(1)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </button>
      </div>
    </div>
  )
}
