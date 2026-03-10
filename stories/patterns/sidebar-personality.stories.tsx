'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  ChevronLeft,
  FileSignature,
  Hammer,
  Image,
  LayoutDashboard,
  Layers,
  Moon,
  Printer,
  Receipt,
  Search,
  Settings,
  Shirt,
  Star,
  Sun,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────────

type Personality = 'niji' | 'liquid'
type Mode = 'dark' | 'light'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  iconColor?: string
  indent?: boolean
  section?: 'main' | 'settings'
}

// ─── Nav items ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, section: 'main' },
  { label: 'Jobs', href: '/jobs', icon: Hammer, iconColor: 'purple', section: 'main' },
  { label: 'Quotes', href: '/quotes', icon: FileSignature, iconColor: 'magenta', section: 'main' },
  { label: 'Customers', href: '/customers', icon: Users, section: 'main' },
  { label: 'Invoices', href: '/invoices', icon: Receipt, iconColor: 'emerald', section: 'main' },
  { label: 'Screens', href: '/screens', icon: Printer, iconColor: 'action', section: 'main' },
  { label: 'Artwork', href: '/artwork', icon: Image, iconColor: 'teal', section: 'main' },
  { label: 'Garments', href: '/garments', icon: Shirt, section: 'main' },
  {
    label: 'Favorites',
    href: '/garments/favorites',
    icon: Star,
    iconColor: 'warning',
    indent: true,
    section: 'main',
  },
  { label: 'Pricing', href: '/settings/pricing', icon: Settings, section: 'settings' },
]

const mainNav = NAV_ITEMS.filter((i) => i.section === 'main')
const settingsNav = NAV_ITEMS.filter((i) => i.section === 'settings')

// ─── Keyframes ──────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes spin-ring {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes nav-bounce {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.08); }
    70%  { transform: scale(0.96); }
    100% { transform: scale(1); }
  }
  @keyframes niji-pop {
    0%   { transform: scale(0.85); opacity: 0.5; }
    50%  { transform: scale(1.18); }
    100% { transform: scale(1.12); opacity: 1; }
  }
  @keyframes icon-rotate-out {
    from { opacity: 1; transform: rotate(0deg) scale(1); }
    to   { opacity: 0; transform: rotate(90deg) scale(0.5); }
  }
  @keyframes icon-rotate-in {
    from { opacity: 0; transform: rotate(-90deg) scale(0.5); }
    to   { opacity: 1; transform: rotate(0deg) scale(1); }
  }
`

// ─── Conic gradient (from floating-nav-toolbar) ─────────────────────────────────

const RING_GRADIENT = `conic-gradient(
  from 0deg,
  #533517  0%,
  #7a5530  5%,
  #c49746  12%,
  #feeaa5  19%,
  #c49746  22%,
  #ffc0cb  22%,
  #ffc0cb  23.5%,
  #ffffff  23.5%,
  #ffffff  26.5%,
  #b8d4e8  26.5%,
  #b8d4e8  28%,
  #c49746  28%,
  #feeaa5  35%,
  #c49746  42%,
  #7a5530  48%,
  #533517  50%,
  #7a5530  55%,
  #c49746  62%,
  #feeaa5  69%,
  #c49746  72%,
  #ffc0cb  72%,
  #ffc0cb  73.5%,
  #ffffff  73.5%,
  #ffffff  76.5%,
  #b8d4e8  76.5%,
  #b8d4e8  78%,
  #c49746  78%,
  #feeaa5  85%,
  #c49746  92%,
  #7a5530  98%,
  #533517  100%
)`

// ─── Personality + mode theme values ────────────────────────────────────────────

const THEMES = {
  niji: {
    dark: {
      sidebar: '#111213',
      sidebarFg: 'rgba(255,255,255,0.87)',
      sidebarMuted: 'rgba(255,255,255,0.50)',
      sidebarBorder: 'rgba(255,255,255,0.08)',
      sidebarAccent: '#232425',
      sidebarActive: '#2ab9ff',
      sidebarActiveBg: 'rgba(42,185,255,0.10)',
      pageBg: '#141515',
      headerBg: '#1c1d1e',
    },
    light: {
      sidebar: '#f8f8f7',
      sidebarFg: 'rgba(0,0,0,0.87)',
      sidebarMuted: 'rgba(0,0,0,0.45)',
      sidebarBorder: 'rgba(0,0,0,0.08)',
      sidebarAccent: '#eeeeec',
      sidebarActive: '#0077cc',
      sidebarActiveBg: 'rgba(0,119,204,0.08)',
      pageBg: '#fafaf9',
      headerBg: '#ffffff',
    },
  },
  liquid: {
    dark: {
      sidebar: 'rgba(14,13,18,0.92)',
      sidebarFg: 'rgba(255,255,255,0.87)',
      sidebarMuted: 'rgba(255,255,255,0.42)',
      sidebarBorder: 'rgba(255,255,255,0.07)',
      sidebarAccent: 'rgba(255,255,255,0.06)',
      sidebarActive: '#e8af48',
      sidebarActiveBg: 'rgba(232,175,72,0.08)',
      pageBg: '#09090d',
      headerBg: 'rgba(14,13,18,0.80)',
    },
    light: {
      sidebar: 'rgba(246,243,237,0.92)',
      sidebarFg: 'rgba(30,22,10,0.87)',
      sidebarMuted: 'rgba(30,22,10,0.38)',
      sidebarBorder: 'rgba(0,0,0,0.07)',
      sidebarAccent: 'rgba(0,0,0,0.04)',
      sidebarActive: '#b8860b',
      sidebarActiveBg: 'rgba(184,134,11,0.08)',
      pageBg: '#f5f1ea',
      headerBg: 'rgba(246,243,237,0.80)',
    },
  },
} as const

type ThemeValues = {
  sidebar: string
  sidebarFg: string
  sidebarMuted: string
  sidebarBorder: string
  sidebarAccent: string
  sidebarActive: string
  sidebarActiveBg: string
  pageBg: string
  headerBg: string
}

// Icon color map (resolved per mode)
const ICON_COLORS: Record<Mode, Record<string, string>> = {
  dark: {
    purple: '#a855f7',
    magenta: '#ff50da',
    emerald: '#10b981',
    action: '#2ab9ff',
    teal: '#2dd4bf',
    warning: '#ffc663',
  },
  light: {
    purple: '#7c3aed',
    magenta: '#d946c7',
    emerald: '#059669',
    action: '#0077cc',
    teal: '#0d9488',
    warning: '#d97706',
  },
}

function getIconColor(color: string | undefined, mode: Mode): string | undefined {
  if (!color) return undefined
  return ICON_COLORS[mode][color]
}

/** Resolve the accent color for the active nav item (Niji indicator border) */
function getActiveAccentColor(href: string, mode: Mode, fallback: string): string {
  const item = NAV_ITEMS.find((i) => i.href === href)
  if (!item?.iconColor) return fallback
  return ICON_COLORS[mode][item.iconColor] || fallback
}

/** Resolve an accent background (10% opacity version) for Niji indicator fill */
function accentToBg(hex: string): string {
  // Convert hex to rgba at 10%
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.10)`
}

// ─── Noise SVG (for Liquid Metal grain) ─────────────────────────────────────────

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`

// ─── Active indicator components ────────────────────────────────────────────────

function NijiActiveIndicator({
  top,
  height,
  collapsed,
  accentColor,
  accentBg,
}: {
  top: number
  height: number
  collapsed: boolean
  accentColor: string
  accentBg: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: collapsed ? 6 : 8,
        right: collapsed ? 6 : 8,
        height,
        borderRadius: 6,
        background: accentBg,
        border: `1.5px solid ${accentColor}`,
        boxShadow: `3px 3px 0px ${accentColor}33`,
        transition:
          'top 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.2s ease, right 0.2s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
        zIndex: 0,
      }}
    />
  )
}

function LiquidActiveIndicator({
  top,
  height,
  theme,
  collapsed,
  glowing,
  spinning,
}: {
  top: number
  height: number
  theme: ThemeValues
  collapsed: boolean
  glowing: boolean
  spinning: boolean
}) {
  // When `spinning` goes false (hover ended), keep running until the
  // current cycle completes, then pause. This prevents freezing mid-rotation.
  // Uses direct DOM manipulation to avoid setState-in-effect lint issues.
  const ringRef = useRef<HTMLDivElement>(null)
  const wantsPause = useRef(false)

  // Start immediately on hover; on hover-end, flag for pause at cycle boundary
  useEffect(() => {
    const el = ringRef.current
    if (!el) return
    if (spinning) {
      wantsPause.current = false
      el.style.animationPlayState = 'running'
    } else {
      wantsPause.current = true
      // If not currently animating (e.g., first render), just stay paused
    }
  }, [spinning])

  const handleIteration = useCallback(() => {
    // Fires at the end of each full 360° cycle
    if (wantsPause.current && ringRef.current) {
      ringRef.current.style.animationPlayState = 'paused'
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: collapsed ? 4 : 6,
        right: collapsed ? 4 : 6,
        height,
        zIndex: 0,
        transition: 'top 0.38s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s ease, right 0.3s ease',
      }}
    >
      {/* Glow — pulses brighter on selection, subtle at rest */}
      <div
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 14,
          background: '#c49746',
          opacity: glowing ? 0.28 : 0.1,
          filter: glowing ? 'blur(10px)' : 'blur(6px)',
          transition: 'opacity 0.15s ease-out, filter 0.15s ease-out',
        }}
      />
      {/* Ring clip + conic gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          ref={ringRef}
          onAnimationIteration={handleIteration}
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: RING_GRADIENT,
            animation: 'spin-ring 4.5s linear infinite',
            animationPlayState: 'paused',
          }}
        />
      </div>
      {/* Inner plate */}
      <div
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: 10,
          background: theme.sidebar,
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      />
    </div>
  )
}

// ─── Main sidebar component ─────────────────────────────────────────────────────

function SidebarPrototype() {
  const [personality, setPersonality] = useState<Personality>('liquid')
  const [mode, setMode] = useState<Mode>('dark')
  const [collapsed, setCollapsed] = useState(false)
  const [activeHref, setActiveHref] = useState('/')
  const navRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const navContainerRef = useRef<HTMLDivElement>(null)
  const [bounceKey, setBounceKey] = useState(0)
  const [liquidGlow, setLiquidGlow] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const theme = THEMES[personality][mode]
  const isLiquid = personality === 'liquid'

  // Calculate active indicator position relative to nav container
  const getIndicatorPosition = useCallback(() => {
    const container = navContainerRef.current
    const activeEl = navRefs.current.get(activeHref)
    if (!container || !activeEl) return { top: 0, height: 36 }
    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    return {
      top: activeRect.top - containerRect.top,
      height: activeRect.height,
    }
  }, [activeHref])

  const [indicatorPos, setIndicatorPos] = useState({ top: 0, height: 36 })

  // Update indicator position when active changes or collapse toggles
  const updateIndicator = useCallback(() => {
    requestAnimationFrame(() => {
      setIndicatorPos(getIndicatorPosition())
    })
  }, [getIndicatorPosition])

  // Update indicator position on mount and when active/collapsed changes
  useEffect(() => {
    const timer = setTimeout(updateIndicator, 50)
    return () => clearTimeout(timer)
  }, [activeHref, collapsed, updateIndicator])

  function handleNavClick(href: string) {
    setActiveHref(href)
    setBounceKey((k) => k + 1)

    // Liquid metal: brief glow pulse on selection
    if (glowTimer.current) clearTimeout(glowTimer.current)
    setLiquidGlow(true)
    glowTimer.current = setTimeout(() => setLiquidGlow(false), 600)
  }

  function handleModeToggle() {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  }

  const sidebarWidth = collapsed ? 64 : 240
  const transitionDuration = isLiquid ? '0.38s' : '0.22s'
  const transitionTiming = isLiquid
    ? 'cubic-bezier(0.16, 1, 0.3, 1)'
    : 'cubic-bezier(0.34, 1.56, 0.64, 1)'

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          display: 'flex',
          width: '100%',
          minHeight: 640,
          background: theme.pageBg,
          borderRadius: 12,
          overflow: 'hidden',
          fontFamily: isLiquid
            ? '"Red Hat Display", system-ui, sans-serif'
            : '"Poppins", system-ui, sans-serif',
          transition: 'background 0.4s ease',
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{
            position: 'relative',
            width: sidebarWidth,
            minWidth: sidebarWidth,
            display: 'flex',
            flexDirection: 'column',
            background: theme.sidebar,
            borderRight: `1px solid ${theme.sidebarBorder}`,
            transition: `width ${transitionDuration} ${transitionTiming}, min-width ${transitionDuration} ${transitionTiming}, background 0.4s ease, border-color 0.4s ease`,
            overflow: 'hidden',
            ...(isLiquid
              ? {
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  boxShadow:
                    mode === 'dark'
                      ? '2px 0 12px rgba(0,0,0,0.3), inset -1px 0 0 rgba(255,255,255,0.04)'
                      : '2px 0 12px rgba(0,0,0,0.06)',
                }
              : {}),
          }}
        >
          {/* Grain overlay (liquid metal only) */}
          {isLiquid && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 10,
                opacity: mode === 'dark' ? 0.22 : 0.12,
                mixBlendMode: 'overlay',
                backgroundImage: GRAIN_SVG,
                backgroundSize: '196px 196px',
              }}
            />
          )}

          {/* ── Header ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              height: 56,
              padding: collapsed ? '0 16px' : '0 16px',
              borderBottom: `1px solid ${theme.sidebarBorder}`,
              transition: 'padding 0.2s ease, border-color 0.4s ease',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: isLiquid ? 10 : 8,
                background: theme.sidebarActive,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isLiquid
                  ? '0 2px 8px rgba(0,0,0,0.2)'
                  : `2px 2px 0 ${theme.sidebarActive}44`,
                transition: 'background 0.3s ease, box-shadow 0.3s ease, border-radius 0.3s ease',
              }}
            >
              <Layers
                size={18}
                strokeWidth={isLiquid ? 1.5 : 2}
                color={mode === 'dark' ? '#000' : '#fff'}
              />
            </div>
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 160,
                transition: `opacity ${transitionDuration} ease, max-width ${transitionDuration} ${transitionTiming}`,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: isLiquid ? 500 : 600,
                  color: theme.sidebarFg,
                  letterSpacing: isLiquid ? '0.01em' : '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                Mokumo Print
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: theme.sidebarMuted,
                  letterSpacing: isLiquid ? '0.03em' : '0.01em',
                }}
              >
                Production
              </div>
            </div>
          </div>

          {/* ── Search ── */}
          <div
            style={{
              padding: collapsed ? '8px 12px' : '8px 12px',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <button
              style={{
                width: '100%',
                height: 36,
                borderRadius: isLiquid ? 10 : 6,
                border: `1px solid ${theme.sidebarBorder}`,
                background: theme.sidebarAccent,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: collapsed ? '0' : '0 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                color: theme.sidebarMuted,
                fontSize: 13,
                fontFamily: 'inherit',
                transition: `background 0.15s ease, border-color 0.4s ease, border-radius 0.3s ease, padding ${transitionDuration} ease`,
                outline: 'none',
              }}
            >
              <Search size={15} strokeWidth={isLiquid ? 1.5 : 2} style={{ flexShrink: 0 }} />
              <span
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: collapsed ? 0 : 1,
                  maxWidth: collapsed ? 0 : 120,
                  transition: `opacity ${transitionDuration} ease, max-width ${transitionDuration} ${transitionTiming}`,
                }}
              >
                Search
              </span>
            </button>
          </div>

          {/* ── Nav ── */}
          <nav
            ref={navContainerRef}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '4px 8px',
              position: 'relative',
              zIndex: 1,
              overflow: 'clip',
            }}
          >
            {/* Sliding indicator */}
            {(() => {
              const nijiAccent = getActiveAccentColor(activeHref, mode, theme.sidebarActive)
              return isLiquid ? (
                <LiquidActiveIndicator
                  top={indicatorPos.top}
                  height={indicatorPos.height}
                  theme={theme}
                  collapsed={collapsed}
                  glowing={liquidGlow}
                  spinning={sidebarHovered}
                />
              ) : (
                <NijiActiveIndicator
                  top={indicatorPos.top}
                  height={indicatorPos.height}
                  collapsed={collapsed}
                  accentColor={nijiAccent}
                  accentBg={accentToBg(nijiAccent)}
                />
              )
            })()}

            {/* Main nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              {mainNav.map((item) => {
                const isActive = activeHref === item.href
                const iconClr = getIconColor(item.iconColor, mode)
                return (
                  <button
                    key={item.href}
                    ref={(el) => {
                      if (el) navRefs.current.set(item.href, el)
                    }}
                    onClick={() => handleNavClick(item.href)}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      height: item.indent ? 32 : 36,
                      padding: item.indent
                        ? collapsed
                          ? '0'
                          : '0 10px 0 36px'
                        : collapsed
                          ? '0'
                          : '0 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: isLiquid ? 10 : 6,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: isActive
                        ? isLiquid
                          ? theme.sidebarActive
                          : getIconColor(item.iconColor, mode) || theme.sidebarActive
                        : theme.sidebarMuted,
                      fontSize: item.indent ? 12 : 13,
                      fontWeight: isActive ? (isLiquid ? 500 : 600) : 400,
                      fontFamily: 'inherit',
                      letterSpacing: isLiquid ? '0.01em' : '0em',
                      transform: !isLiquid && isActive ? 'scale(1.12)' : 'scale(1)',
                      transition:
                        'color 0.2s ease, padding 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      outline: 'none',
                      animation:
                        isActive && bounceKey > 0
                          ? isLiquid
                            ? 'nav-bounce 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)'
                            : 'niji-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          : 'none',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      size={item.indent ? 14 : 17}
                      strokeWidth={isLiquid ? 1.5 : 2}
                      style={{
                        flexShrink: 0,
                        color: isActive
                          ? isLiquid
                            ? theme.sidebarActive
                            : iconClr || theme.sidebarActive
                          : iconClr || theme.sidebarMuted,
                        transition: 'color 0.2s ease',
                      }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        opacity: collapsed ? 0 : 1,
                        maxWidth: collapsed ? 0 : 160,
                        transition: `opacity ${transitionDuration} ease, max-width ${transitionDuration} ${transitionTiming}`,
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}

              <div style={{ flex: 1, minHeight: 16 }} />

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  margin: collapsed ? '4px 12px' : '4px 8px',
                  background: theme.sidebarBorder,
                  transition: 'margin 0.2s ease, background 0.4s ease',
                }}
              />

              {/* Settings section label */}
              {!collapsed && (
                <div
                  style={{
                    padding: '6px 10px 2px',
                    fontSize: 10,
                    fontWeight: isLiquid ? 500 : 600,
                    textTransform: 'uppercase',
                    letterSpacing: isLiquid ? '0.08em' : '0.12em',
                    color: theme.sidebarMuted,
                    opacity: collapsed ? 0 : 0.7,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  Settings
                </div>
              )}

              {/* Settings nav items */}
              {settingsNav.map((item) => {
                const isActive = activeHref === item.href
                return (
                  <button
                    key={item.href}
                    ref={(el) => {
                      if (el) navRefs.current.set(item.href, el)
                    }}
                    onClick={() => handleNavClick(item.href)}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      height: 36,
                      padding: collapsed ? '0' : '0 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: isLiquid ? 10 : 6,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: isActive ? theme.sidebarActive : theme.sidebarMuted,
                      fontSize: 13,
                      fontWeight: isActive ? (isLiquid ? 500 : 600) : 400,
                      fontFamily: 'inherit',
                      transition: 'color 0.2s ease',
                      outline: 'none',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      size={17}
                      strokeWidth={isLiquid ? 1.5 : 2}
                      style={{ flexShrink: 0, transition: 'color 0.2s ease' }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        opacity: collapsed ? 0 : 1,
                        maxWidth: collapsed ? 0 : 160,
                        transition: `opacity ${transitionDuration} ease, max-width ${transitionDuration} ${transitionTiming}`,
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* ── Footer ── */}
          <div
            style={{
              padding: '8px 8px',
              borderTop: `1px solid ${theme.sidebarBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
              transition: 'border-color 0.4s ease',
            }}
          >
            {/* Theme toggle */}
            <button
              onClick={handleModeToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                height: 36,
                padding: collapsed ? '0' : '0 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: isLiquid ? 10 : 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: theme.sidebarMuted,
                fontSize: 13,
                fontFamily: 'inherit',
                transition: 'color 0.2s ease',
                outline: 'none',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'relative',
                  width: 17,
                  height: 17,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sun
                  size={17}
                  strokeWidth={isLiquid ? 1.5 : 2}
                  style={{
                    position: 'absolute',
                    opacity: mode === 'light' ? 1 : 0,
                    transform:
                      mode === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}
                />
                <Moon
                  size={17}
                  strokeWidth={isLiquid ? 1.5 : 2}
                  style={{
                    position: 'absolute',
                    opacity: mode === 'dark' ? 1 : 0,
                    transform:
                      mode === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}
                />
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: collapsed ? 0 : 1,
                  maxWidth: collapsed ? 0 : 120,
                  transition: `opacity ${transitionDuration} ease, max-width ${transitionDuration} ${transitionTiming}`,
                }}
              >
                Switch mode
              </span>
            </button>

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                height: 36,
                padding: collapsed ? '0' : '0 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: isLiquid ? 10 : 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: theme.sidebarMuted,
                fontSize: 13,
                fontFamily: 'inherit',
                transition: 'color 0.2s ease',
                outline: 'none',
              }}
            >
              <ChevronLeft
                size={17}
                strokeWidth={isLiquid ? 1.5 : 2}
                style={{
                  flexShrink: 0,
                  transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: `transform ${transitionDuration} ${transitionTiming}`,
                }}
              />
              <span
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: collapsed ? 0 : 1,
                  maxWidth: collapsed ? 0 : 120,
                  transition: `opacity ${transitionDuration} ease, max-width ${transitionDuration} ${transitionTiming}`,
                }}
              >
                Collapse
              </span>
            </button>
          </div>
        </aside>

        {/* ── Page content area ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            transition: 'background 0.4s ease',
          }}
        >
          {/* Top bar with personality switcher */}
          <div
            style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              borderBottom: `1px solid ${theme.sidebarBorder}`,
              background: theme.headerBg,
              transition: 'background 0.4s ease, border-color 0.4s ease',
              ...(isLiquid
                ? {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }
                : {}),
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: isLiquid ? 500 : 600,
                color: theme.sidebarFg,
                letterSpacing: isLiquid ? '0.01em' : '-0.01em',
              }}
            >
              {NAV_ITEMS.find((i) => i.href === activeHref)?.label || 'Page'}
            </div>

            {/* Personality selector */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 3,
                borderRadius: isLiquid ? 10 : 6,
                background: theme.sidebarAccent,
                border: `1px solid ${theme.sidebarBorder}`,
              }}
            >
              {(['niji', 'liquid'] as Personality[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPersonality(p)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: personality === p ? 600 : 400,
                    fontFamily: 'inherit',
                    borderRadius: isLiquid ? 7 : 4,
                    border: 'none',
                    cursor: 'pointer',
                    background:
                      personality === p
                        ? p === 'liquid'
                          ? 'linear-gradient(135deg, #c4974622, #e8af4822)'
                          : theme.sidebarActiveBg
                        : 'transparent',
                    color: personality === p ? theme.sidebarActive : theme.sidebarMuted,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  {p === 'niji' ? 'Niji' : 'Liquid Metal'}
                </button>
              ))}
            </div>
          </div>

          {/* Placeholder page content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                maxWidth: 400,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isLiquid ? 500 : 600,
                  textTransform: 'uppercase',
                  letterSpacing: isLiquid ? '0.08em' : '0.12em',
                  color: theme.sidebarMuted,
                  marginBottom: 8,
                }}
              >
                {personality === 'liquid' ? 'Liquid Metal' : 'Niji'} /{' '}
                {mode === 'dark' ? 'Dark' : 'Light'}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: isLiquid ? 500 : 600,
                  color: theme.sidebarFg,
                  letterSpacing: isLiquid ? '0em' : '-0.02em',
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                {NAV_ITEMS.find((i) => i.href === activeHref)?.label || 'Page'}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: theme.sidebarMuted,
                  lineHeight: 1.6,
                }}
              >
                Select pages in the sidebar to see the active indicator animate. Toggle mode with
                the sun/moon button. Switch personalities above. Collapse the sidebar with the
                chevron button.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Story meta ─────────────────────────────────────────────────────────────────

const meta = {
  title: 'Patterns/SidebarPersonality',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
    docs: {
      description: {
        component: [
          'Interactive sidebar prototype demonstrating the personality token system.',
          '',
          '**Niji** — Flat surfaces, neobrutalist offset-shadow active indicator,',
          'springy motion (200ms), Poppins + Hind fonts.',
          '',
          '**Liquid Metal** — Glassmorphic surfaces with film grain, gold conic-gradient',
          'ring active indicator (from FloatingNavToolbar), smooth glide motion (380ms),',
          'Red Hat Display + Fira Code fonts.',
          '',
          'Both personalities support light and dark modes independently.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Interactive',
  render: () => <SidebarPrototype />,
}
