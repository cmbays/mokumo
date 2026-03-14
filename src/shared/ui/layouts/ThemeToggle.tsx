'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@shared/lib/cn'

type Props = {
  /** Icon-only mode used when sidebar is collapsed */
  collapsed?: boolean
}

/**
 * Horizontal light switch — two halves in a pill container.
 * The active side appears physically depressed (inset shadow, darker bg).
 * Springs between states with cubic-bezier(0.34, 1.56, 0.64, 1).
 *
 * When `collapsed`, renders as a single icon-only toggle button showing the
 * current theme. Clicking it switches to the opposite theme.
 */
export function ThemeToggle({ collapsed = false }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) {
    return <div className={cn(collapsed ? 'h-9 w-full' : 'mx-3 h-9')} aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          // px-3 matches SidebarNavLink so the icon aligns to the same left column
          'relative z-10 flex w-full items-center px-3 py-2',
          'rounded-md text-muted-foreground transition-colors hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
        )}
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
    )
  }

  return (
    <div
      role="group"
      aria-label="Color scheme"
      className="mx-3 my-1 grid grid-cols-2 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent"
    >
      {/* Dark side */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        aria-label="Dark mode"
        className={cn(
          'flex items-center justify-center gap-1.5 py-[7px] text-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action',
          isDark ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
        )}
        style={{
          // Depressed: darker bg + inset shadow when active
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
        <span>Dark</span>
      </button>

      {/* Light side */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        aria-label="Light mode"
        className={cn(
          'flex items-center justify-center gap-1.5 py-[7px] text-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action',
          !isDark ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
        )}
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
        <span>Light</span>
      </button>
    </div>
  )
}
