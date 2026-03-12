'use client'

import { useRef, useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Home, Moon, Search, Sun, User } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const BUTTON_W = 52
const BUTTON_H = 52
const TOOLBAR_PAD = 6

const TOOLBAR_BG_DARK = 'rgba(14, 13, 18, 0.90)'
const TOOLBAR_BG_LIGHT = 'rgba(246, 243, 237, 0.90)'

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: User, label: 'Profile' },
]

// ─── Keyframes injected once ─────────────────────────────────────────────────
const CSS_KEYFRAMES = `
  @keyframes spin-ring {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes icon-bounce {
    0%   { transform: scale(1); }
    38%  { transform: scale(1.25); }
    65%  { transform: scale(0.94); }
    100% { transform: scale(1); }
  }
  @keyframes icon-rotate-out {
    from { opacity: 1; transform: rotate(0deg)   scale(1);   }
    to   { opacity: 0; transform: rotate(150deg)  scale(0.4); }
  }
  @keyframes icon-rotate-in {
    from { opacity: 0; transform: rotate(-150deg) scale(0.4); }
    to   { opacity: 1; transform: rotate(0deg)   scale(1);   }
  }
  .theme-btn-bounce { animation: icon-bounce 0.52s cubic-bezier(0.34, 1.4, 0.64, 1); }
`

// ─── Conic gradient ───────────────────────────────────────────────────────────
//
// Pattern repeats twice (0-50%, 50-100%) for rotational symmetry.
// Each half: 88% gold tones, 1 white hotspot (3%), 1 pink hint (1.5%), 1 soft blue hint (1.5%)
// Pink approaches the hotspot; blue departs — simulates chromatic aberration / studio light
//
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

// ─── Component ────────────────────────────────────────────────────────────────
function FloatingNavToolbar() {
  const [activeTab, setActiveTab] = useState(0)
  const [isDark, setIsDark] = useState(true)
  const themeBtnRef = useRef<HTMLButtonElement>(null)

  const toolbarBg = isDark ? TOOLBAR_BG_DARK : TOOLBAR_BG_LIGHT
  const iconDefault = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(30,22,10,0.38)'
  const dividerColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)'
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const boxShadow = isDark
    ? '0 10px 36px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 10px 36px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)'

  function handleThemeToggle() {
    setIsDark((d) => !d)
    const btn = themeBtnRef.current
    if (!btn) return
    btn.classList.remove('theme-btn-bounce')
    void btn.offsetWidth // force reflow to restart animation
    btn.classList.add('theme-btn-bounce')
  }

  return (
    <>
      <style>{CSS_KEYFRAMES}</style>

      {/* Stage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: '100%',
          minHeight: 200,
          padding: '40px 0 48px',
          background: isDark
            ? 'radial-gradient(ellipse at 50% 120%, #1a1408 0%, #09090d 60%)'
            : 'radial-gradient(ellipse at 50% 120%, #ede7d6 0%, #f5f1ea 60%)',
          transition: 'background 0.5s ease',
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Film grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: isDark ? 0.32 : 0.18,
            mixBlendMode: isDark ? 'overlay' : 'multiply',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
            backgroundSize: '196px 196px',
          }}
        />

        {/* Radial ambient glow beneath toolbar */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            height: 60,
            background:
              'radial-gradient(ellipse at center, rgba(196,151,70,0.22) 0%, transparent 70%)',
            filter: 'blur(18px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Toolbar ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            padding: `${TOOLBAR_PAD}px`,
            borderRadius: 22,
            background: toolbarBg,
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: `1px solid ${borderColor}`,
            boxShadow,
            transition: 'background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease',
          }}
        >
          {/* Film grain on toolbar surface */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 22,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 10,
              opacity: 0.28,
              mixBlendMode: 'overlay',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }}
          />

          {/* ── Nav buttons + sliding indicator ── */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Sliding indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: BUTTON_W,
                height: BUTTON_H,
                transform: `translateX(${activeTab * BUTTON_W}px)`,
                transition: 'transform 0.46s cubic-bezier(0.34, 1.2, 0.64, 1)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            >
              {/* Layer 1: Glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: -3,
                  borderRadius: 21,
                  background: '#c49746',
                  opacity: 0.15,
                  filter: 'blur(7px)',
                }}
              />

              {/* Layer 2 (clip) + Layer 3 (rotating conic) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 18,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '200%',
                    height: '200%',
                    top: '-50%',
                    left: '-50%',
                    background: RING_GRADIENT,
                    animation: 'spin-ring 4.5s linear infinite',
                  }}
                />
              </div>

              {/* Layer 4: Inner plate */}
              <div
                style={{
                  position: 'absolute',
                  inset: 2,
                  borderRadius: 16,
                  background: toolbarBg,
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  transition: 'background 0.45s ease',
                }}
              />
            </div>

            {/* Nav buttons */}
            {navItems.map(({ icon: Icon, label }, i) => (
              <button
                key={label}
                aria-label={label}
                onClick={() => setActiveTab(i)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: BUTTON_W,
                  height: BUTTON_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 16,
                  color: activeTab === i ? '#e8af48' : iconDefault,
                  transition: 'color 0.28s ease',
                  outline: 'none',
                }}
              >
                <Icon size={20} strokeWidth={1.5} />
              </button>
            ))}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 24,
              background: dividerColor,
              margin: '0 4px',
              flexShrink: 0,
              transition: 'background 0.45s ease',
            }}
          />

          {/* Theme toggle */}
          <button
            ref={themeBtnRef}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={handleThemeToggle}
            style={{
              position: 'relative',
              width: BUTTON_W,
              height: BUTTON_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 16,
              color: iconDefault,
              outline: 'none',
              transition: 'color 0.45s ease',
            }}
          >
            {/* Sun — visible in light mode */}
            <span
              style={{
                position: 'absolute',
                display: 'flex',
                opacity: isDark ? 0 : 1,
                transform: isDark ? 'rotate(150deg) scale(0.4)' : 'rotate(0deg) scale(1)',
                transition: 'opacity 0.38s ease, transform 0.38s ease',
              }}
            >
              <Sun size={18} strokeWidth={1.5} />
            </span>

            {/* Moon — visible in dark mode */}
            <span
              style={{
                position: 'absolute',
                display: 'flex',
                opacity: isDark ? 1 : 0,
                transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-150deg) scale(0.4)',
                transition: 'opacity 0.38s ease, transform 0.38s ease',
              }}
            >
              <Moon size={18} strokeWidth={1.5} />
            </span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Story meta ───────────────────────────────────────────────────────────────
const meta = {
  title: 'Patterns/FloatingNavToolbar',
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
    docs: {
      description: {
        component:
          'Glassmorphism floating nav with a 4-layer gold conic-gradient active ring, sliding indicator, and dark/light theme toggle.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (Interactive)',
  render: () => <FloatingNavToolbar />,
}

export const LightModePreview: Story = {
  name: 'Light Mode Preview',
  render: function LightPreview() {
    // Pre-seeded in light mode for documentation purposes
    const [activeTab, setActiveTab] = useState(1)
    const [isDark] = useState(false)
    const toolbarBg = TOOLBAR_BG_LIGHT

    return (
      <>
        <style>{CSS_KEYFRAMES}</style>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            width: '100%',
            minHeight: 200,
            padding: '40px 0 48px',
            background: 'radial-gradient(ellipse at 50% 120%, #ede7d6 0%, #f5f1ea 60%)',
            borderRadius: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 320,
              height: 60,
              background:
                'radial-gradient(ellipse at center, rgba(196,151,70,0.16) 0%, transparent 70%)',
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              padding: `${TOOLBAR_PAD}px`,
              borderRadius: 22,
              background: toolbarBg,
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 10px 36px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: BUTTON_W,
                  height: BUTTON_H,
                  transform: `translateX(${activeTab * BUTTON_W}px)`,
                  transition: 'transform 0.46s cubic-bezier(0.34, 1.2, 0.64, 1)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: 21,
                    background: '#c49746',
                    opacity: 0.15,
                    filter: 'blur(7px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '200%',
                      height: '200%',
                      top: '-50%',
                      left: '-50%',
                      background: RING_GRADIENT,
                      animation: 'spin-ring 4.5s linear infinite',
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 2,
                    borderRadius: 16,
                    background: toolbarBg,
                    backdropFilter: 'blur(28px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  }}
                />
              </div>
              {navItems.map(({ icon: Icon, label }, i) => (
                <button
                  key={label}
                  aria-label={label}
                  onClick={() => setActiveTab(i)}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: BUTTON_W,
                    height: BUTTON_H,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 16,
                    color:
                      activeTab === i
                        ? '#e8af48'
                        : isDark
                          ? 'rgba(255,255,255,0.42)'
                          : 'rgba(30,22,10,0.38)',
                    transition: 'color 0.28s ease',
                    outline: 'none',
                  }}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <div
              style={{
                width: 1,
                height: 24,
                background: 'rgba(0,0,0,0.10)',
                margin: '0 4px',
                flexShrink: 0,
              }}
            />
            <button
              style={{
                width: BUTTON_W,
                height: BUTTON_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 16,
                color: 'rgba(30,22,10,0.38)',
                outline: 'none',
              }}
            >
              <Sun size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </>
    )
  },
}

export const RingDetail: Story = {
  name: 'Ring Detail (Slow spin)',
  render: function RingDetailRender() {
    return (
      <>
        <style>{`
          @keyframes spin-ring-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            padding: '40px',
            background: '#09090d',
            borderRadius: 12,
          }}
        >
          <p
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Gold ring — slow spin (15s) for inspection
          </p>
          {/* Large ring for inspection */}
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <div
              style={{
                position: 'absolute',
                inset: -6,
                borderRadius: 30,
                background: '#c49746',
                opacity: 0.18,
                filter: 'blur(12px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 28,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '200%',
                  height: '200%',
                  top: '-50%',
                  left: '-50%',
                  background: RING_GRADIENT,
                  animation: 'spin-ring-slow 15s linear infinite',
                }}
              />
            </div>
            {/* Inner plate */}
            <div
              style={{
                position: 'absolute',
                inset: 4,
                borderRadius: 24,
                background: TOOLBAR_BG_DARK,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Home size={28} strokeWidth={1.5} color="#e8af48" />
            </div>
          </div>
          <p
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 11,
              margin: 0,
              maxWidth: 280,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            4px ring with 2 white hotspots at 25% and 75°, flanked by 1.5% pink (chromatic approach)
            and 1.5% soft blue (departure). 88% gold tones total.
          </p>
        </div>
      </>
    )
  },
}
