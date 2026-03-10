'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  ChevronLeft,
  FileSignature,
  Hammer,
  Image,
  LayoutDashboard,
  Moon,
  Printer,
  Receipt,
  Search,
  Settings,
  Shirt,
  Star,
  StickyNote,
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
  @keyframes glow-pulse {
    0%   { filter: brightness(1); }
    50%  { filter: brightness(1.3); }
    100% { filter: brightness(1); }
  }
  @keyframes niji-press {
    0%   { transform: scale(1); }
    50%  { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  @keyframes shimmer-slide {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes badge-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes badge-glow {
    0%   { filter: brightness(1) drop-shadow(0 0 0px transparent); }
    50%  { filter: brightness(1.4) drop-shadow(0 0 14px rgba(196,151,70,0.6)); }
    100% { filter: brightness(1) drop-shadow(0 0 0px transparent); }
  }
  @keyframes button-glow {
    0%   { filter: brightness(1) drop-shadow(0 0 0px transparent); }
    30%  { filter: brightness(1.5) drop-shadow(0 0 16px rgba(196,151,70,0.7)); }
    100% { filter: brightness(1) drop-shadow(0 0 0px transparent); }
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
      sidebar: 'rgba(250,248,244,0.92)',
      sidebarFg: 'rgba(30,22,10,0.87)',
      sidebarMuted: 'rgba(30,22,10,0.38)',
      sidebarBorder: 'rgba(0,0,0,0.07)',
      sidebarAccent: 'rgba(0,0,0,0.04)',
      sidebarActive: '#b8860b',
      sidebarActiveBg: 'rgba(184,134,11,0.08)',
      pageBg: '#faf8f4',
      headerBg: 'rgba(250,248,244,0.80)',
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

// ─── Conic gradients for Liquid Metal content (from Paper board G) ────────────

const CONIC_GREEN = `conic-gradient(in oklab from 225deg at 50% 50%, oklab(21.3% -0.034 0.018) 0%, oklab(33.6% -0.055 0.027) 15%, oklab(46.6% -0.080 0.042) 25%, oklab(63.4% -0.114 0.063) 28%, oklab(75.1% -0.129 0.077) 32%, oklab(56.3% -0.100 0.057) 38%, oklab(41.2% -0.077 0.044) 52%, oklab(27.8% -0.050 0.029) 65%, oklab(21.3% -0.034 0.018) 80%, oklab(31.1% -0.045 0.016) 92%, oklab(21.3% -0.034 0.018) 100%)`

// Silver ring — cooler-toned sibling of RING_GRADIENT for neutral badges
const SILVER_RING_GRADIENT = `conic-gradient(
  from 0deg,
  #2a2a32  0%,
  #4a4a56  5%,
  #8a8a9e  12%,
  #d8d8e4  19%,
  #8a8a9e  22%,
  #d0c8dc  22%,
  #d0c8dc  23.5%,
  #ffffff  23.5%,
  #ffffff  26.5%,
  #b8d4e8  26.5%,
  #b8d4e8  28%,
  #8a8a9e  28%,
  #d8d8e4  35%,
  #8a8a9e  42%,
  #4a4a56  48%,
  #2a2a32  50%,
  #4a4a56  55%,
  #8a8a9e  62%,
  #d8d8e4  69%,
  #8a8a9e  72%,
  #d0c8dc  72%,
  #d0c8dc  73.5%,
  #ffffff  73.5%,
  #ffffff  76.5%,
  #b8d4e8  76.5%,
  #b8d4e8  78%,
  #8a8a9e  78%,
  #d8d8e4  85%,
  #8a8a9e  92%,
  #4a4a56  98%,
  #2a2a32  100%
)`

// Onyx ring — dark metallic for Liquid Metal light mode
// Same structure as gold: deep base → mid tones → bright glimmer peaks → back down
const ONYX_RING_GRADIENT = `conic-gradient(
  from 0deg,
  #0c0c10  0%,
  #1c1c26  5%,
  #3a3a4a  12%,
  #8a8a9a  19%,
  #3a3a4a  22%,
  #b0b0be  22%,
  #b0b0be  23.5%,
  #f0f0f4  23.5%,
  #f0f0f4  26.5%,
  #8a9aaa  26.5%,
  #8a9aaa  28%,
  #3a3a4a  28%,
  #8a8a9a  35%,
  #3a3a4a  42%,
  #1c1c26  48%,
  #0c0c10  50%,
  #1c1c26  55%,
  #3a3a4a  62%,
  #8a8a9a  69%,
  #3a3a4a  72%,
  #b0b0be  72%,
  #b0b0be  73.5%,
  #f0f0f4  73.5%,
  #f0f0f4  76.5%,
  #8a9aaa  76.5%,
  #8a9aaa  78%,
  #3a3a4a  78%,
  #8a8a9a  85%,
  #3a3a4a  92%,
  #1c1c26  98%,
  #0c0c10  100%
)`

// ─── Content theme resolver ──────────────────────────────────────────────────────

function getContentTheme(personality: Personality, mode: Mode) {
  const isLiq = personality === 'liquid'
  const isDark = mode === 'dark'

  if (isLiq && isDark) {
    return {
      // Text — bumped contrast
      textHigh: '#FFFFFFF2',
      textMed: '#FFFFFFD9',
      textSec: '#FFFFFF99',
      textLow: '#FFFFFF73',
      textDim: '#FFFFFF52',
      textMicro: '#FFFFFF40',
      // Surfaces
      cardBg: '#1E2028',
      surfaceBg: '#1A1B20',
      innerBg: '#13141A',
      thumbBg: '#181A1C',
      divider: '#FFFFFF0F',
      borderSubtle: '#FFFFFF14',
      // Semantic
      success: '#54CA74E6',
      successBg: '#54CA74',
      linkColor: '#64A0FFD9',
      // Gold (VIP, seasonal note)
      goldGradient: RING_GRADIENT,
      goldText: '#e8af48',
      goldGlow: '#c4974640 0px 0px 12px',
      // Silver (neutral badges, roles, archive, save, CTA)
      silverGradient: SILVER_RING_GRADIENT,
      silverText: '#c0c0d4',
      silverGlow: '#8a8a9e40 0px 0px 10px',
      // CTA
      ctaBg: '#172040',
      ctaText: '#B4D2FFE0',
      // Tab
      tabIndicator: `linear-gradient(in oklab 90deg, oklab(53.4% 0.002 -0.025 / 0%) 0%, oklab(87.3% 0.003 -0.028) 30%, oklab(100% 0 -.0001) 50%, oklab(87.3% 0.003 -0.028) 70%, oklab(53.4% 0.002 -0.025 / 0%) 100%)`,
      // Timeline
      timelineConn: `linear-gradient(in oklab 180deg, oklab(73.8% -0.001 -0.038 / 28%) 0%, oklab(84.7% -0.003 -0.030 / 52%) 50%, oklab(73.8% -0.001 -0.038 / 28%) 100%)`,
      balanceBar: `linear-gradient(in oklab 90deg, oklab(56.1% 0.027 0.110) 0%, oklab(75.2% 0.007 0.138) 40%, oklab(92.2% -0.006 0.114) 70%, oklab(82.9% 0.007 0.149) 100%)`,
      healthDot: `radial-gradient(ellipse 58% 72% at 38% 32% in oklab, oklab(86.4% -0.141 0.081) 0%, oklab(74.9% -0.156 0.095) 20%, oklab(61.9% -0.145 0.094) 42%, oklab(35.3% -0.081 0.050 / 55%) 62%, oklab(0% -.0001 .0001 / 0%) 82%), radial-gradient(ellipse 50% 62% at 62% 60% in oklab, oklab(59.8% -0.135 0.087 / 55%) 0%, oklab(37.9% -0.087 0.056 / 24%) 45%, oklab(0% -.0001 .0001 / 0%) 72%)`,
      healthGlow: '#44CC6A6B 0px 0px 10px 3.8px',
      greenIcon: '#60C878CC',
      goldIcon: '#DCAF37CC',
      neutralIcon: '#B9C0D7B3',
      taxGlow: '#44CC6A4D 0px 0px 10px',
      useGradientBorders: true,
      // Shadow scale (niji only — not used in liquid)
      shadowOffset: '0px',
      textShadow: 'none',
    }
  }
  if (isLiq && !isDark) {
    return {
      textHigh: 'rgba(20,16,8,0.94)',
      textMed: 'rgba(20,16,8,0.82)',
      textSec: 'rgba(20,16,8,0.60)',
      textLow: 'rgba(20,16,8,0.48)',
      textDim: 'rgba(20,16,8,0.34)',
      textMicro: 'rgba(20,16,8,0.22)',
      cardBg: 'rgba(255,255,255,0.72)',
      surfaceBg: 'rgba(255,255,255,0.52)',
      innerBg: '#faf8f4',
      thumbBg: 'rgba(255,255,255,0.42)',
      divider: 'rgba(0,0,0,0.07)',
      borderSubtle: 'rgba(0,0,0,0.09)',
      success: '#059669',
      successBg: '#059669',
      linkColor: '#2563eb',
      goldGradient: RING_GRADIENT,
      goldText: '#6b4f0a',
      goldGlow: '#c4974630 0px 0px 10px',
      silverGradient: ONYX_RING_GRADIENT,
      silverText: '#1a1a28',
      silverGlow: '#0a0a1430 0px 0px 8px',
      ctaBg: '#dbeafe',
      ctaText: '#1d4ed8',
      tabIndicator: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
      timelineConn:
        'linear-gradient(180deg, rgba(184,134,11,0.12), rgba(184,134,11,0.25), rgba(184,134,11,0.12))',
      balanceBar: 'linear-gradient(90deg, #c49746, #e8af48, #feeaa5, #e8af48)',
      healthDot: 'radial-gradient(circle at 38% 32%, #34d399 0%, #059669 50%, transparent 80%)',
      healthGlow: '0 0 8px rgba(52,211,153,0.4)',
      greenIcon: '#059669',
      goldIcon: '#b8860b',
      neutralIcon: '#5a5a6e',
      taxGlow: 'none',
      useGradientBorders: true,
      shadowOffset: '0px',
      textShadow: '0 1px 3px rgba(255,255,255,0.6)',
    }
  }
  if (!isLiq && isDark) {
    return {
      textHigh: 'rgba(255,255,255,0.92)',
      textMed: 'rgba(255,255,255,0.78)',
      textSec: 'rgba(255,255,255,0.56)',
      textLow: 'rgba(255,255,255,0.44)',
      textDim: 'rgba(255,255,255,0.32)',
      textMicro: 'rgba(255,255,255,0.20)',
      cardBg: '#1c1d1e',
      surfaceBg: '#232425',
      innerBg: '#141515',
      thumbBg: '#1a1b1c',
      divider: 'rgba(255,255,255,0.08)',
      borderSubtle: 'rgba(255,255,255,0.10)',
      success: '#54ca74',
      successBg: '#54ca74',
      linkColor: '#2ab9ff',
      goldGradient: 'none',
      goldText: '#2ab9ff',
      goldGlow: 'none',
      silverGradient: 'none',
      silverText: 'rgba(255,255,255,0.56)',
      silverGlow: 'none',
      ctaBg: 'rgba(42,185,255,0.12)',
      ctaText: '#2ab9ff',
      tabIndicator: '#2ab9ff',
      timelineConn: 'rgba(255,255,255,0.08)',
      balanceBar: 'linear-gradient(90deg, #2ab9ff, #8efff3)',
      healthDot:
        'radial-gradient(ellipse 58% 72% at 38% 32%, #86efac 0%, #54ca74 30%, #2d9f56 55%, rgba(22,78,44,0.5) 70%, transparent 85%)',
      healthGlow: '0 0 10px 3px rgba(84,202,116,0.5)',
      greenIcon: '#54ca74',
      goldIcon: '#ffc663',
      neutralIcon: 'rgba(255,255,255,0.44)',
      taxGlow: 'none',
      useGradientBorders: false,
      shadowOffset: '1.5px',
      textShadow: 'none',
    }
  }
  // Niji light
  return {
    textHigh: 'rgba(0,0,0,0.92)',
    textMed: 'rgba(0,0,0,0.78)',
    textSec: 'rgba(0,0,0,0.55)',
    textLow: 'rgba(0,0,0,0.44)',
    textDim: 'rgba(0,0,0,0.32)',
    textMicro: 'rgba(0,0,0,0.16)',
    cardBg: '#ffffff',
    surfaceBg: '#f0f0ee',
    innerBg: '#fafaf9',
    thumbBg: '#f3f3f2',
    divider: 'rgba(0,0,0,0.06)',
    borderSubtle: 'rgba(0,0,0,0.10)',
    success: '#059669',
    successBg: '#059669',
    linkColor: '#0077cc',
    goldGradient: 'none',
    goldText: '#0077cc',
    goldGlow: 'none',
    silverGradient: 'none',
    silverText: 'rgba(0,0,0,0.55)',
    silverGlow: 'none',
    ctaBg: 'rgba(0,119,204,0.10)',
    ctaText: '#0077cc',
    tabIndicator: '#0077cc',
    timelineConn: 'rgba(0,0,0,0.06)',
    balanceBar: 'linear-gradient(90deg, #0077cc, #38bdf8)',
    healthDot: 'radial-gradient(circle at 38% 32%, #34d399 0%, #059669 50%, transparent 80%)',
    healthGlow: '0 0 8px rgba(52,211,153,0.4)',
    greenIcon: '#059669',
    goldIcon: '#d97706',
    neutralIcon: 'rgba(0,0,0,0.34)',
    taxGlow: 'none',
    useGradientBorders: false,
    shadowOffset: '1.5px',
    textShadow: 'none',
  }
}

// ─── Badge wrapper ──────────────────────────────────────────────────────────────

/** Renders a badge with gradient-ring border (Liquid) or solid+shadow border (Niji) */
function Badge({
  gradient,
  innerBg,
  borderColor,
  children,
  outerStyle,
  innerStyle,
  shadow,
  shadowOffset = '2px',
  interactive = false,
  isLiquid = false,
  lightMode = false,
}: {
  gradient: string
  innerBg: string
  borderColor: string
  children: React.ReactNode
  outerStyle?: React.CSSProperties
  innerStyle?: React.CSSProperties
  shadow?: string
  shadowOffset?: string
  interactive?: boolean
  isLiquid?: boolean
  lightMode?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const hoverProps = interactive
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => {
          setHovered(false)
          setClicked(false)
        },
        onClick: () => {
          setClicked(true)
          setTimeout(() => setClicked(false), 600)
        },
      }
    : {}

  const hoverTransform = hovered ? (isLiquid ? 'scale(1.03)' : 'scale(1.06)') : 'scale(1)'

  // Light mode shadow for gradient badges — subtle depth behind the ring
  const lightShadow = lightMode && isLiquid ? '0 1px 4px rgba(0,0,0,0.12)' : undefined

  if (gradient !== 'none' && interactive) {
    // Spinning ring approach — only for interactive elements (buttons, CTAs)
    return (
      <span
        {...hoverProps}
        style={{
          display: 'inline-flex',
          position: 'relative',
          borderRadius: 5,
          overflow: 'hidden',
          flexShrink: 0,
          transform: hoverTransform,
          transition: 'transform 0.2s ease, filter 0.3s ease',
          cursor: 'default',
          animation: clicked ? 'badge-glow 0.6s ease' : undefined,
          boxShadow: lightShadow,
          ...outerStyle,
        }}
      >
        {/* Spinning conic gradient layer */}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 5,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
              backgroundImage: gradient,
              animation: 'badge-spin 4.5s linear infinite',
              animationPlayState: hovered ? 'running' : 'paused',
            }}
          />
        </span>
        {/* Static fallback visible when not spinning */}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 5,
            backgroundImage: gradient,
            pointerEvents: 'none',
            opacity: hovered ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
        />
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 3,
            padding: '2px 9px',
            margin: 2,
            background: innerBg,
            boxShadow: shadow,
            zIndex: 1,
            ...innerStyle,
          }}
        >
          {children}
        </span>
      </span>
    )
  }
  return (
    <span
      {...hoverProps}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 5,
        padding: '2px 9px',
        flexShrink: 0,
        transform: hoverTransform,
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
        cursor: interactive ? 'default' : undefined,
        ...innerStyle,
      }}
    >
      {children}
    </span>
  )
}

// ─── Customer detail content (from Paper board G) ───────────────────────────────

function CustomerDetailContent({
  personality,
  mode,
  isLiquid,
}: {
  personality: Personality
  mode: Mode
  isLiquid: boolean
  sidebarTheme: ThemeValues
}) {
  const ct = getContentTheme(personality, mode)

  // Tab state
  const [activeTab, setActiveTab] = useState(0)
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const [tabIndicatorPos, setTabIndicatorPos] = useState({ left: 0, width: 0 })
  const [noteHovered, setNoteHovered] = useState(false)
  const [clickedNode, setClickedNode] = useState<number | null>(null)

  // Update tab indicator position
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = tabContainerRef.current
      const activeEl = tabRefs.current.get(activeTab)
      if (container && activeEl) {
        const cRect = container.getBoundingClientRect()
        const aRect = activeEl.getBoundingClientRect()
        setTabIndicatorPos({ left: aRect.left - cRect.left, width: aRect.width })
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [activeTab])

  const isDark = mode === 'dark'

  // Gold badge (VIP, seasonal)
  const goldBadge = (text: string) => (
    <Badge
      gradient={ct.goldGradient}
      innerBg={ct.innerBg}
      borderColor={ct.borderSubtle}
      shadowOffset={ct.shadowOffset}
      isLiquid={isLiquid}
      lightMode={!isDark}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: isLiquid ? 500 : 600,
          color: ct.goldText,
          lineHeight: '14px',
        }}
      >
        {text}
      </span>
    </Badge>
  )

  // Silver badge (neutral — School, Wholesale, roles)
  const silverBadge = (text: string, innerPad?: string) => (
    <Badge
      gradient={ct.silverGradient}
      innerBg={ct.innerBg}
      borderColor={ct.borderSubtle}
      shadowOffset={ct.shadowOffset}
      isLiquid={isLiquid}
      lightMode={!isDark}
      innerStyle={innerPad ? { padding: innerPad } : undefined}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: isLiquid ? 500 : 600,
          color: ct.silverText,
          lineHeight: '14px',
        }}
      >
        {text}
      </span>
    </Badge>
  )

  // Money text: green $ + theme-appropriate number color
  const money = (amount: string, size = 19) => (
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span
        style={{
          fontSize: size,
          letterSpacing: '-0.02em',
          color: ct.success,
          fontWeight: isLiquid ? 500 : 600,
        }}
      >
        $
      </span>
      <span
        style={{
          fontSize: size,
          letterSpacing: '-0.02em',
          color: ct.textHigh,
          fontWeight: isLiquid ? 500 : 600,
        }}
      >
        {amount}
      </span>
    </span>
  )

  // Stat cell
  const stat = (value: React.ReactNode, label: string, hasBorder = true) => (
    <div
      style={{
        paddingRight: hasBorder ? 24 : 0,
        borderRight: hasBorder ? `1px solid ${ct.divider}` : 'none',
      }}
    >
      <div style={{ lineHeight: '24px' }}>{value}</div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          marginTop: 1,
          color: ct.textDim,
          fontWeight: isLiquid ? 500 : 600,
        }}
      >
        {label}
      </div>
    </div>
  )

  // Timeline node icon + color mapping
  type TimelineType = 'job' | 'invoice' | 'note' | 'quote'
  const TIMELINE_ICONS: Record<TimelineType, { icon: LucideIcon; nijiColor: string }> = {
    job: { icon: Hammer, nijiColor: isDark ? '#a855f7' : '#7c3aed' }, // purple — matches sidebar
    invoice: { icon: Receipt, nijiColor: isDark ? '#10b981' : '#059669' }, // emerald
    note: { icon: StickyNote, nijiColor: isDark ? '#ffc663' : '#d97706' }, // burnt orange/warning
    quote: { icon: FileSignature, nijiColor: isDark ? '#ff50da' : '#d946c7' }, // magenta
  }

  // Interactive timeline dot with icon
  const TimelineDot = ({ type, index }: { type: TimelineType; index: number }) => {
    const isSelected = clickedNode === index
    const [dotHover, setDotHover] = useState(false)
    const { icon: Icon, nijiColor } = TIMELINE_ICONS[type]

    if (isLiquid) {
      // Liquid Metal: onyx/silver ring when unselected (icon shows its own color), gold ring when selected
      const dotGradient = isSelected
        ? RING_GRADIENT
        : isDark
          ? SILVER_RING_GRADIENT
          : ONYX_RING_GRADIENT
      const iconColor = isSelected ? ct.goldText : nijiColor
      return (
        <div
          onClick={() => setClickedNode(isSelected ? null : index)}
          onMouseEnter={() => setDotHover(true)}
          onMouseLeave={() => setDotHover(false)}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            flexShrink: 0,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease',
            animation: isSelected ? 'badge-glow 0.6s ease' : undefined,
            boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.10)' : undefined,
          }}
        >
          {/* Spinning ring */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                top: '-50%',
                left: '-50%',
                backgroundImage: dotGradient,
                animation: 'badge-spin 4.5s linear infinite',
                animationPlayState: dotHover || isSelected ? 'running' : 'paused',
              }}
            />
          </span>
          {/* Static fallback */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundImage: dotGradient,
              pointerEvents: 'none',
              opacity: dotHover || isSelected ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 30,
              height: 30,
              margin: 2,
              borderRadius: '50%',
              background: ct.innerBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              size={14}
              strokeWidth={1.5}
              style={{ color: iconColor, transition: 'color 0.3s ease' }}
            />
          </div>
        </div>
      )
    }
    // Niji timeline dot — icon colored to match sidebar nav icon colors
    const isClicked = clickedNode === index
    return (
      <div
        onClick={() => {
          setClickedNode(index)
          setTimeout(() => setClickedNode(null), 800)
        }}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          flexShrink: 0,
          cursor: 'pointer',
          transition: 'transform 0.2s ease, filter 0.3s ease',
          border: `1.5px solid ${nijiColor}`,
          boxShadow: isClicked
            ? `0 0 10px ${nijiColor}, ${ct.shadowOffset} ${ct.shadowOffset} 0 ${nijiColor}33`
            : `${ct.shadowOffset} ${ct.shadowOffset} 0 ${nijiColor}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} strokeWidth={2} style={{ color: nijiColor }} />
      </div>
    )
  }

  // Timeline connector
  const connector = () => (
    <div
      style={{
        width: isLiquid ? 2 : 1.5,
        height: 13,
        marginLeft: 16,
        flexShrink: 0,
        background: isLiquid ? undefined : ct.timelineConn,
        backgroundImage: isLiquid ? ct.timelineConn : undefined,
        borderRadius: 1,
      }}
    />
  )

  // Interactive button
  const InteractiveButton = ({
    children,
    variant,
    onClick,
    style: btnStyle,
  }: {
    children: React.ReactNode
    variant: 'cta' | 'secondary'
    onClick?: () => void
    style?: React.CSSProperties
  }) => {
    const [hover, setHover] = useState(false)
    const [pressed, setPressed] = useState(false)
    const isCta = variant === 'cta'

    if (isLiquid) {
      // CTA (Edit Customer) = gold, secondary (Archive) = silver/onyx
      const gradient = isCta ? RING_GRADIENT : isDark ? SILVER_RING_GRADIENT : ONYX_RING_GRADIENT
      const textColor = isCta ? ct.goldText : ct.silverText
      // Light mode: subtle shadow behind gradient ring
      const lightShadow = !isDark ? '0 1px 4px rgba(0,0,0,0.12)' : undefined
      return (
        <span
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => {
            setHover(false)
            setPressed(false)
          }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onClick={onClick}
          style={{
            display: 'inline-flex',
            borderRadius: 7,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: pressed ? 'scale(0.96)' : hover ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.15s ease, filter 0.3s ease',
            animation: pressed ? 'button-glow 0.5s ease' : undefined,
            boxShadow: lightShadow,
          }}
        >
          {/* Spinning ring */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 7,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                top: '-50%',
                left: '-50%',
                backgroundImage: gradient,
                animation: 'badge-spin 4.5s linear infinite',
                animationPlayState: hover ? 'running' : 'paused',
              }}
            />
          </span>
          {/* Static fallback */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 7,
              backgroundImage: gradient,
              pointerEvents: 'none',
              opacity: hover ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
          />
          <button
            style={{
              position: 'relative',
              zIndex: 1,
              borderRadius: 5,
              padding: '5px 16px',
              margin: 2,
              cursor: 'pointer',
              fontFamily: 'inherit',
              border: 'none',
              background: ct.innerBg,
              fontSize: 13,
              fontWeight: 500,
              color: textColor,
              ...btnStyle,
            }}
          >
            {children}
          </button>
        </span>
      )
    }
    // Niji
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false)
          setPressed(false)
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onClick={onClick}
        style={{
          borderRadius: 6,
          padding: '6px 16px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          border: isCta ? 'none' : `1.5px solid ${ct.borderSubtle}`,
          background: isCta ? ct.ctaBg : 'transparent',
          fontSize: 13,
          fontWeight: 600,
          color: isCta ? ct.ctaText : ct.textLow,
          boxShadow: isCta
            ? `${ct.shadowOffset} ${ct.shadowOffset} 0 ${ct.ctaBg}`
            : `${ct.shadowOffset} ${ct.shadowOffset} 0 ${ct.borderSubtle}33`,
          transform: pressed ? 'scale(0.93)' : hover ? 'scale(1.06)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
          animation: pressed ? 'niji-press 0.25s ease' : undefined,
          ...btnStyle,
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        textShadow: ct.textShadow,
      }}
    >
      {/* ── Header section ── */}
      <div style={{ padding: '20px 28px 0', borderBottom: `1px solid ${ct.divider}` }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 12, fontSize: 12, letterSpacing: '0.01em', color: ct.textDim }}>
          Customers
          <span style={{ margin: '0 5px', opacity: 0.4 }}>/</span>
          Westside Cheer Academy
        </div>

        {/* Customer name + badges row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 14,
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontSize: 26,
              letterSpacing: '-0.02em',
              lineHeight: '32px',
              margin: 0,
              color: ct.textHigh,
              fontWeight: isLiquid ? 500 : 700,
              flexShrink: 0,
            }}
          >
            Westside Cheer Academy
          </h1>

          {goldBadge('VIP')}

          {/* Health indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                flexShrink: 0,
                background:
                  typeof ct.healthDot === 'string' && ct.healthDot.startsWith('#')
                    ? ct.healthDot
                    : undefined,
                backgroundImage:
                  typeof ct.healthDot === 'string' && !ct.healthDot.startsWith('#')
                    ? ct.healthDot
                    : undefined,
                boxShadow: ct.healthGlow,
              }}
            />
            <span style={{ fontSize: 12, color: ct.textLow }}>Healthy</span>
          </div>

          {silverBadge('School')}
          {silverBadge('Wholesale')}
          {goldBadge('Orders typically Aug\u2013Oct')}

          {/* Action buttons — pushed right */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <InteractiveButton variant="secondary">Archive</InteractiveButton>
            <InteractiveButton variant="cta">Edit Customer</InteractiveButton>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 24 }}>
          {stat(money('284.6K'), 'lifetime')}
          {stat(money('23.7K'), 'avg order')}
          {stat(
            <span
              style={{
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: ct.textHigh,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              12
            </span>,
            'orders'
          )}
          {stat(
            <span
              style={{
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: ct.textHigh,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              3d
            </span>,
            'last order'
          )}
          {stat(
            <span
              style={{
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: ct.textHigh,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              3
            </span>,
            'referrals'
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: ct.textDim }}>Balance</span>
            <div style={{ width: 120, height: 4, borderRadius: 2, background: ct.divider }}>
              <div
                style={{
                  width: '56%',
                  height: '100%',
                  borderRadius: 2,
                  backgroundImage: ct.balanceBar,
                }}
              />
            </div>
            {money('8,400', 12)}
            <span style={{ fontSize: 12, color: ct.textDim }}>/</span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: ct.success, opacity: 0.7 }}>$</span>
              <span style={{ fontSize: 12, color: ct.textLow }}>15K</span>
            </span>
          </div>
        </div>

        {/* Contacts — single-row columnar layout */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16, gap: 6 }}>
          {[
            {
              star: true,
              name: 'Tom Davies',
              role: 'Purchasing Manager',
              email: 'tom@westsidecheer.com',
              phone: '(555) 234-5678',
            },
            {
              star: false,
              name: 'Sarah Chen',
              role: 'Billing Contact',
              email: 'sarah@westsidecheer.com',
              phone: '(555) 234-5679',
            },
          ].map((c) => (
            <div key={c.email} style={{ display: 'flex', alignItems: 'center', height: 28 }}>
              <div style={{ width: 20, flexShrink: 0, fontSize: 12, color: ct.goldText }}>
                {c.star ? <Star size={12} fill={ct.goldText} stroke="none" /> : null}
              </div>
              <div
                style={{
                  width: 130,
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: isLiquid ? 500 : 600,
                  color: c.star ? ct.textMed : ct.textSec,
                }}
              >
                {c.name}
              </div>
              <div style={{ width: 170, flexShrink: 0 }}>{silverBadge(c.role, '1px 7px')}</div>
              <div
                style={{
                  width: 210,
                  flexShrink: 0,
                  fontSize: 12,
                  paddingLeft: 12,
                  color: ct.textLow,
                }}
              >
                {c.email}
              </div>
              <div style={{ fontSize: 12, color: ct.textDim }}>{c.phone}</div>
            </div>
          ))}
        </div>

        {/* Tab bar — with sliding indicator */}
        <div
          ref={tabContainerRef}
          style={{ display: 'flex', position: 'relative', paddingBottom: isLiquid ? 0 : 0 }}
        >
          {/* Sliding tab indicator */}
          {isLiquid ? (
            /* Liquid: gold gradient underline */
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                height: 2,
                borderRadius: 1,
                left: tabIndicatorPos.left,
                width: tabIndicatorPos.width,
                transition:
                  'left 0.38s cubic-bezier(0.16, 1, 0.3, 1), width 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundImage: ct.tabIndicator.startsWith('linear') ? ct.tabIndicator : undefined,
                background: !ct.tabIndicator.startsWith('linear') ? ct.tabIndicator : undefined,
              }}
            />
          ) : (
            /* Niji: full badge indicator — like sidebar NijiActiveIndicator */
            <div
              style={{
                position: 'absolute',
                top: 2,
                height: tabIndicatorPos.width > 0 ? 'calc(100% - 4px)' : 0,
                left: tabIndicatorPos.left,
                width: tabIndicatorPos.width,
                borderRadius: 6,
                background: isDark ? 'rgba(42,185,255,0.10)' : 'rgba(0,119,204,0.08)',
                border: `1.5px solid ${ct.tabIndicator}`,
                boxShadow: `2px 2px 0px ${ct.tabIndicator}33`,
                transition:
                  'left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 0,
              }}
            />
          )}

          {['Overview', 'Activity', 'Preferences', 'Artwork'].map((tab, i) => {
            const isActive = activeTab === i
            return (
              <button
                key={tab}
                ref={(el) => {
                  if (el) tabRefs.current.set(i, el)
                }}
                onClick={() => setActiveTab(i)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginRight: 4,
                  padding: '8px 16px',
                  fontSize: 13,
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                  color: isActive ? (isLiquid ? ct.goldText : ct.textHigh) : ct.textLow,
                  fontWeight: isActive ? (isLiquid ? 500 : 600) : 400,
                  transform: !isLiquid && isActive ? 'scale(1.08)' : 'scale(1)',
                  transformOrigin: 'center center',
                  transition:
                    'color 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), font-weight 0.15s ease',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content area — 2 columns ── */}
      <div style={{ flex: 1, display: 'flex', padding: '24px 28px', gap: 24, overflow: 'auto' }}>
        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
          {/* Section: Recent Activity */}
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: ct.textDim,
              fontWeight: isLiquid ? 500 : 600,
            }}
          >
            Recent Activity
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Timeline item 1 — Job */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '3px 0', gap: 14 }}>
              <TimelineDot type="job" index={0} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <span style={{ color: ct.textMed }}>Job </span>
                <span style={{ color: ct.textLow }}>#2847</span>
                <span style={{ color: ct.textMed }}> moved to </span>
                <span style={{ color: ct.textHigh, fontWeight: isLiquid ? 500 : 600 }}>
                  Finishing
                </span>
              </div>
              <span style={{ fontSize: 11, color: ct.textDim, flexShrink: 0 }}>2 hours ago</span>
            </div>
            {connector()}

            {/* Timeline item 2 — Invoice */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '3px 0', gap: 14 }}>
              <TimelineDot type="invoice" index={1} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <span style={{ color: ct.textMed }}>Invoice </span>
                <span style={{ color: ct.textLow }}>#1156</span>
                <span style={{ color: ct.textMed }}> sent — </span>
                {money('23,400', 13)}
                <span style={{ color: ct.textMed }}> due</span>
              </div>
              <span style={{ fontSize: 11, color: ct.textDim, flexShrink: 0 }}>1 day ago</span>
            </div>
            {connector()}

            {/* Timeline item 3 — Note */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '3px 0', gap: 14 }}>
              <TimelineDot type="note" index={2} />
              <div style={{ flex: 1, fontSize: 13, color: ct.textSec, fontStyle: 'italic' }}>
                &ldquo;Tom mentioned they want custom hoodies for the upcoming season&rdquo;
              </div>
              <span style={{ fontSize: 11, color: ct.textDim, flexShrink: 0 }}>3 days ago</span>
            </div>
            {connector()}

            {/* Timeline item 4 — Quote */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '3px 0', gap: 14 }}>
              <TimelineDot type="quote" index={3} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <span style={{ color: ct.textMed }}>Quote </span>
                <span style={{ color: ct.textLow }}>#1892</span>
                <span style={{ color: ct.textMed }}> accepted — </span>
                {money('27,600', 13)}
              </div>
              <span style={{ fontSize: 11, color: ct.textDim, flexShrink: 0 }}>Aug 15, 2025</span>
            </div>
            {connector()}

            {/* Timeline item 5 — Job (faded) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '3px 0',
                gap: 14,
                opacity: 0.5,
              }}
            >
              <TimelineDot type="job" index={4} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <span style={{ color: ct.textSec }}>Job </span>
                <span style={{ color: ct.textLow }}>#2641</span>
                <span style={{ color: ct.textSec }}> completed</span>
              </div>
              <span style={{ fontSize: 11, color: ct.textMicro, flexShrink: 0 }}>Aug 3, 2025</span>
            </div>
          </div>

          {/* Section: Most Used Artwork */}
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: ct.textDim,
              fontWeight: isLiquid ? 500 : 600,
            }}
          >
            Most Used Artwork
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { name: 'WCA Cheer Logo', jobs: '4 jobs', type: 'AI', typeColor: ct.greenIcon },
              { name: 'WCA Banner Print', jobs: '2 jobs', type: 'PDF', typeColor: ct.greenIcon },
              { name: 'Spirit Week 2025', jobs: '1 job', type: 'PNG', typeColor: ct.linkColor },
              { name: 'Hoodie Front 2024', jobs: '1 job', type: 'AI', typeColor: ct.greenIcon },
            ].map((art) => (
              <div key={art.name} style={{ flex: 1, minWidth: 0 }}>
                {isLiquid ? (
                  <div
                    style={{
                      borderRadius: 8,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'filter 0.3s ease, transform 0.2s ease',
                      boxShadow: !isDark ? '0 1px 4px rgba(0,0,0,0.12)' : undefined,
                    }}
                  >
                    {/* Static gradient border */}
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 8,
                        backgroundImage: CONIC_GREEN,
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        borderRadius: 6,
                        margin: 2,
                        overflow: 'hidden',
                        background: ct.cardBg,
                      }}
                    >
                      <div
                        style={{
                          height: 96,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: ct.thumbBg,
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: `1.5px solid ${ct.borderSubtle}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: ct.divider,
                            }}
                          />
                        </div>
                        <span style={{ position: 'absolute', top: 6, right: 6 }}>
                          <Badge
                            gradient={CONIC_GREEN}
                            innerBg={ct.innerBg}
                            borderColor={ct.borderSubtle}
                            innerStyle={{ padding: '1px 5px', borderRadius: 3 }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 500,
                                color: art.typeColor,
                                lineHeight: '12px',
                              }}
                            >
                              {art.type}
                            </span>
                          </Badge>
                        </span>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 2,
                            color: ct.textMed,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {art.name}
                        </div>
                        <div style={{ fontSize: 11, color: ct.textMicro }}>{art.jobs}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: `1.5px solid ${ct.borderSubtle}`,
                      boxShadow: `${ct.shadowOffset} ${ct.shadowOffset} 0 ${ct.borderSubtle}33`,
                      background: ct.cardBg,
                      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <div
                      style={{
                        height: 96,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: ct.thumbBg,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          border: `1.5px solid ${ct.borderSubtle}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: ct.divider,
                          }}
                        />
                      </div>
                      <span style={{ position: 'absolute', top: 6, right: 6 }}>
                        <Badge
                          gradient="none"
                          innerBg={ct.innerBg}
                          borderColor={ct.borderSubtle}
                          shadowOffset={ct.shadowOffset}
                          innerStyle={{ padding: '1px 5px', borderRadius: 3 }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: art.typeColor,
                              lineHeight: '12px',
                            }}
                          >
                            {art.type}
                          </span>
                        </Badge>
                      </span>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 2,
                          color: ct.textMed,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {art.name}
                      </div>
                      <div style={{ fontSize: 11, color: ct.textMicro }}>{art.jobs}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar — 316px */}
        <div
          style={{
            width: 316,
            minWidth: 316,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Quick Note — textarea + save on surface */}
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: ct.textDim,
                marginBottom: 10,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              Quick Note
            </div>
            {isLiquid ? (
              /* Liquid Metal: silver ring border box + separate Save button below */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    borderRadius: 7,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'filter 0.3s ease',
                    boxShadow: !isDark ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
                  }}
                >
                  {/* Spinning ring border */}
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 7,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        width: '200%',
                        height: '200%',
                        top: '-50%',
                        left: '-50%',
                        backgroundImage: isDark ? SILVER_RING_GRADIENT : ONYX_RING_GRADIENT,
                        animation: 'badge-spin 4.5s linear infinite',
                        animationPlayState: 'paused',
                      }}
                    />
                  </span>
                  {/* Static fallback */}
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 7,
                      backgroundImage: isDark ? SILVER_RING_GRADIENT : ONYX_RING_GRADIENT,
                      pointerEvents: 'none',
                      opacity: 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      minHeight: 56,
                      borderRadius: 5,
                      margin: 2,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: ct.textMicro,
                      background: isDark ? ct.cardBg : ct.innerBg,
                    }}
                  >
                    Add a note about this customer...
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <InteractiveButton
                    variant="secondary"
                    style={{ padding: '4px 14px', fontSize: 12 }}
                  >
                    Save
                  </InteractiveButton>
                </div>
              </div>
            ) : (
              /* Niji: bordered textarea + Save button with notes color (burnt orange) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    minHeight: 56,
                    borderRadius: 6,
                    padding: '10px 12px',
                    border: `1.5px solid ${ct.borderSubtle}`,
                    boxShadow: `${ct.shadowOffset} ${ct.shadowOffset} 0 ${ct.borderSubtle}33`,
                    background: ct.surfaceBg,
                    fontSize: 13,
                    color: ct.textMicro,
                    transition: 'transform 0.2s ease',
                    transform: 'scale(1)',
                  }}
                >
                  Add a note about this customer...
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <InteractiveButton
                    variant="secondary"
                    style={{
                      padding: '4px 14px',
                      fontSize: 12,
                      borderColor: TIMELINE_ICONS.note.nijiColor,
                      color: TIMELINE_ICONS.note.nijiColor,
                      boxShadow: `${ct.shadowOffset} ${ct.shadowOffset} 0 ${TIMELINE_ICONS.note.nijiColor}33`,
                    }}
                  >
                    Save
                  </InteractiveButton>
                </div>
              </div>
            )}
          </div>

          {/* Addresses — direct on surface */}
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: ct.textLow,
                marginBottom: 10,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              Addresses
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    marginBottom: 4,
                    color: ct.textMicro,
                    fontWeight: isLiquid ? 500 : 600,
                  }}
                >
                  Shipping
                </div>
                <div style={{ fontSize: 13, color: ct.textMed }}>
                  123 Athletic Blvd, Portland OR 97201
                </div>
              </div>
              <div style={{ height: 1, background: ct.divider }} />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    marginBottom: 4,
                    color: ct.textMicro,
                    fontWeight: isLiquid ? 500 : 600,
                  }}
                >
                  Billing
                </div>
                <div style={{ fontSize: 13, color: ct.textLow }}>Same as shipping</div>
              </div>
            </div>
          </div>

          {/* Financial — direct on surface */}
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: ct.textLow,
                marginBottom: 10,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              Financial
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                {
                  label: 'Payment Terms',
                  value: (
                    <span style={{ color: ct.textMed, fontWeight: isLiquid ? 500 : 600 }}>
                      Net 30
                    </span>
                  ),
                },
                { label: 'Pricing Tier', value: silverBadge('Wholesale') },
                { label: 'Discount', value: <span style={{ color: ct.textDim }}>&mdash;</span> },
                {
                  label: 'Tax Exempt',
                  value: (
                    <span
                      style={{
                        color: ct.success,
                        fontWeight: isLiquid ? 500 : 600,
                        textShadow: ct.taxGlow !== 'none' ? ct.taxGlow : undefined,
                      }}
                    >
                      Yes
                    </span>
                  ),
                },
              ].map((row, i) => (
                <div key={row.label}>
                  {i > 0 && <div style={{ height: 1, background: ct.divider }} />}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                    }}
                  >
                    <span style={{ fontSize: 13, color: ct.textLow }}>{row.label}</span>
                    <span style={{ fontSize: 13 }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referred By */}
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: ct.textLow,
                marginBottom: 10,
                fontWeight: isLiquid ? 500 : 600,
              }}
            >
              Referred By
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: isLiquid ? 500 : 600, color: ct.linkColor }}>
                Pioneer High School
              </span>
              <span style={{ fontSize: 13, color: ct.textDim }}>&middot; Mark Johnson</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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

  const sidebarWidth = collapsed ? 64 : 216
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

          {/* ── Header / Logo ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              height: collapsed ? 56 : 60,
              padding: collapsed ? '0 8px' : '0 8px',
              borderBottom: `1px solid ${theme.sidebarBorder}`,
              transition: `height ${transitionDuration} ${transitionTiming}, border-color 0.4s ease, padding ${transitionDuration} ease`,
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            {/* Ink cloud mark */}
            <img
              src="/mokumo-cloud.png"
              alt="Mokumo"
              style={{
                height: collapsed ? 34 : 44,
                width: 'auto',
                flexShrink: 0,
                objectFit: 'contain',
                transition: `height ${transitionDuration} ${transitionTiming}, filter 0.4s ease`,
                filter: mode === 'dark' ? 'invert(1) contrast(1.5)' : 'none',
              }}
            />
            {/* "MOKUMO SOFTWARE" wordmark — hidden when collapsed */}
            <img
              src="/mokumo-name.png"
              alt="Mokumo Software"
              style={{
                height: collapsed ? 0 : 30,
                width: 'auto',
                objectFit: 'contain',
                opacity: collapsed ? 0 : 1,
                flexShrink: 0,
                transition: `height ${transitionDuration} ${transitionTiming}, opacity ${transitionDuration} ease, filter 0.4s ease`,
                filter: mode === 'dark' ? 'invert(1) contrast(1.5)' : 'none',
              }}
            />
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
                      transformOrigin: 'left center',
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

          {/* Customer detail content — themed per personality */}
          <CustomerDetailContent
            personality={personality}
            mode={mode}
            isLiquid={isLiquid}
            sidebarTheme={theme}
          />
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
