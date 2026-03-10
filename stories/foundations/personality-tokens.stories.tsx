'use client'

import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta = {
  title: 'Foundations/Personality Tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The personality system transforms how semantic tokens render visually.
Same component, same token names — different visual treatment.

**Composition**: Personality (niji | liquid-metal) × Mode (dark | light) = Theme

**Niji** — Neobrutalist: offset shadows, flat colors, high-contrast accents.
Accent = action blue. No gradient rings. Borders are solid.

**Liquid Metal** — Luxury chrome: metallic conic gradient rings, grain texture,
warm gold accents in dark mode, onyx steel in light mode.

All tokens use the \`ds-\` prefix and are defined as CSS custom properties
that personalities override via CSS class selectors.
        `,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type ComboKey = 'niji-dark' | 'niji-light' | 'liquid-dark' | 'liquid-light'

const COMBOS: { key: ComboKey; label: string; cssClass: string }[] = [
  { key: 'niji-dark', label: 'Niji Dark', cssClass: '' },
  { key: 'niji-light', label: 'Niji Light', cssClass: 'light' },
  { key: 'liquid-dark', label: 'Liquid Metal Dark', cssClass: 'personality-liquid' },
  { key: 'liquid-light', label: 'Liquid Metal Light', cssClass: 'personality-liquid light' },
]

function PersonalityCard({ label, cssClass }: { label: string; cssClass: string }) {
  return (
    <div className={cssClass} style={{ flex: 1, minWidth: 280 }}>
      <div
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          borderRadius: 12,
          padding: 20,
          border: '1px solid var(--border)',
          fontFamily: 'var(--font-sans, system-ui)',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>
          {label}
        </h3>

        {/* Accent emphasis */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Accent Emphasis
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ds-accent-emphasis)',
              textShadow: 'var(--ds-text-shadow)',
            }}
          >
            VIP Customer
          </div>
        </div>

        {/* Neutral emphasis */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Neutral Emphasis
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ds-neutral-emphasis)',
              textShadow: 'var(--ds-text-shadow)',
            }}
          >
            Wholesale · School
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>CTA</div>
          <button
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              backgroundColor: 'var(--ds-cta-bg)',
              color: 'var(--ds-cta-text)',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Quote
          </button>
        </div>

        {/* Surface tiers */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Surface Tiers
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { name: 'Page', var: '--background' },
              { name: 'Card', var: '--card' },
              { name: 'Surface', var: '--surface' },
              { name: 'Inner', var: '--ds-surface-inner' },
              { name: 'Thumb', var: '--ds-surface-thumb' },
            ].map((s) => (
              <div key={s.var} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    backgroundColor: `var(${s.var})`,
                    border: '1px solid var(--border)',
                  }}
                />
                <div style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 2 }}>
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text dim / micro */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Extended Text Hierarchy
          </div>
          <div style={{ color: 'var(--foreground)', fontSize: 14 }}>Foreground</div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Muted</div>
          <div style={{ color: 'var(--ds-text-dim)', fontSize: 14 }}>Dim</div>
          <div style={{ color: 'var(--ds-text-micro)', fontSize: 14 }}>Micro</div>
        </div>

        {/* Gradient ring preview */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Accent Ring
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--ds-accent-ring, var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'var(--card)',
                }}
              />
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--ds-neutral-ring, var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'var(--card)',
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
              {cssClass.includes('personality-liquid')
                ? 'Gradient rings active'
                : 'No rings (solid borders)'}
            </span>
          </div>
        </div>

        {/* Health dot */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Health Dot
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--ds-health-dot)',
                boxShadow: 'var(--ds-health-glow)',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--foreground)' }}>Active</span>
          </div>
        </div>

        {/* Behavior flags */}
        <div
          style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--surface)', borderRadius: 6 }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: 'var(--muted-foreground)',
              marginBottom: 6,
            }}
          >
            Behavior
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'var(--ds-text-dim)',
              lineHeight: 1.8,
            }}
          >
            <div>shadow-offset: var(--ds-shadow-offset)</div>
            <div>gradient-borders: var(--ds-gradient-borders)</div>
            <div>text-shadow: var(--ds-text-shadow)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PersonalityTokensPage() {
  const [selected, setSelected] = useState<ComboKey | 'all'>('all')

  const visibleCombos = selected === 'all' ? COMBOS : COMBOS.filter((c) => c.key === selected)

  return (
    <div
      style={{
        padding: 32,
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        fontFamily: 'system-ui',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
          Personality × Mode
        </h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'all' as const, label: 'All 4' },
            ...COMBOS.map((c) => ({ key: c.key, label: c.label })),
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: selected === opt.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: selected === opt.key ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {visibleCombos.map((combo) => (
          <PersonalityCard key={combo.key} label={combo.label} cssClass={combo.cssClass} />
        ))}
      </div>
    </div>
  )
}

export const Comparison: Story = {
  render: () => <PersonalityTokensPage />,
}
