'use client'

import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta = {
  title: 'Foundations/Color Tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
All color tokens across the design system, shown in both dark and light modes.

**Two isolated color pools** prevent semantic collision:
- **Status Palette** — state, urgency, feedback (action, success, error, warning)
- **Categorical Palette** — entity/service identity (purple, magenta, emerald, etc.)

**Rule**: A status color must never identify an entity. A categorical color must never represent a state.
        `,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type ColorDef = {
  name: string
  token: string
  role: string
}

const STATUS_COLORS: ColorDef[] = [
  { name: 'Action', token: 'action', role: 'Primary CTAs, active/in-progress' },
  { name: 'Success', token: 'success', role: 'Completions, approved, healthy' },
  { name: 'Warning', token: 'warning', role: 'Cautions, pending, needs attention' },
  { name: 'Error', token: 'error', role: 'Failures, rejected, destructive' },
]

const CATEGORICAL_COLORS: ColorDef[] = [
  { name: 'Purple', token: 'purple', role: 'Jobs' },
  { name: 'Magenta', token: 'magenta', role: 'Quotes' },
  { name: 'Emerald', token: 'emerald', role: 'Invoices' },
  { name: 'Teal', token: 'teal', role: 'Screen Print (service)' },
  { name: 'Lime', token: 'lime', role: 'Embroidery (service)' },
  { name: 'Brown', token: 'brown', role: 'DTF (service)' },
  { name: 'Yellow', token: 'yellow', role: 'Communication channels' },
  { name: 'Amber', token: 'amber', role: 'Customers' },
  { name: 'Graphite', token: 'graphite', role: 'Garments' },
  { name: 'Cyan', token: 'cyan', role: 'Home / Dashboard' },
]

function ColorSwatch({ token, variant }: { token: string; variant: 'base' | 'hover' | 'bold' }) {
  const varName = variant === 'base' ? `--${token}` : `--${token}-${variant}`
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: `var(${varName})`,
        border: '1px solid rgba(128,128,128,0.2)',
      }}
      title={varName}
    />
  )
}

function ColorRow({ color }: { color: ColorDef }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <ColorSwatch token={color.token} variant="base" />
        <ColorSwatch token={color.token} variant="hover" />
        <ColorSwatch token={color.token} variant="bold" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: `var(--${color.token})` }}>
          {color.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{color.role}</div>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--muted-foreground)',
            opacity: 0.7,
          }}
        >
          text-{color.token} · bg-{color.token} · border-{color.token}
        </div>
      </div>
    </div>
  )
}

function DsTokenRow({
  name,
  varName,
  description,
}: {
  name: string
  varName: string
  description: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          backgroundColor: `var(${varName})`,
          border: '1px solid rgba(128,128,128,0.2)',
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{description}</div>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--muted-foreground)',
            opacity: 0.7,
          }}
        >
          {varName}
        </div>
      </div>
    </div>
  )
}

function ColorTokensPage() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark')

  return (
    <div className={mode === 'light' ? 'light' : ''} style={{ minHeight: '100vh' }}>
      <div
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          padding: 32,
          fontFamily: 'var(--font-sans, system-ui)',
          minHeight: '100vh',
        }}
      >
        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Color Tokens</h1>
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {mode === 'dark' ? '☀ Light' : '● Dark'}
          </button>
        </div>

        {/* Status Palette */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Status Palette
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            State, urgency, feedback. Each has base, hover, and bold variants.
          </p>
          {STATUS_COLORS.map((c) => (
            <ColorRow key={c.token} color={c} />
          ))}
        </section>

        {/* Categorical Palette */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Categorical Palette
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Entity/service identity. Never use for state.
          </p>
          {CATEGORICAL_COLORS.map((c) => (
            <ColorRow key={c.token} color={c} />
          ))}
        </section>

        {/* Surface Tokens */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Surface Tiers
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Layered backgrounds from page to thumbnail.
          </p>
          <DsTokenRow
            name="Background (page)"
            varName="--background"
            description="Main page background — lowest tier"
          />
          <DsTokenRow
            name="Card / Elevated"
            varName="--card"
            description="Cards, panels, modals — floats above page"
          />
          <DsTokenRow
            name="Surface"
            varName="--surface"
            description="Interactive surfaces, toolbar backgrounds"
          />
          <DsTokenRow
            name="Inner"
            varName="--ds-surface-inner"
            description="Nested content areas within cards"
          />
          <DsTokenRow
            name="Thumb"
            varName="--ds-surface-thumb"
            description="Thumbnails, swatches, small previews"
          />
        </section>

        {/* Text Hierarchy */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Text Hierarchy
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            4 standard levels + 2 specialist levels for fine print.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 600 }}>
                Foreground — primary content, headings
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--muted-foreground)',
                  marginLeft: 12,
                }}
              >
                text-foreground
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted-foreground)', fontSize: 16 }}>
                Muted — secondary labels, hints
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--muted-foreground)',
                  marginLeft: 12,
                }}
              >
                text-muted-foreground
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--ds-text-dim)', fontSize: 16 }}>
                Dim — placeholders, disabled
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--muted-foreground)',
                  marginLeft: 12,
                }}
              >
                text-ds-text-dim
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--ds-text-micro)', fontSize: 16 }}>
                Micro — fine print, counters
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--muted-foreground)',
                  marginLeft: 12,
                }}
              >
                text-ds-text-micro
              </span>
            </div>
          </div>
        </section>

        {/* DS Semantic Tokens */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Personality Semantic Tokens (ds-)
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            These change per personality. In Niji, accent = blue. In Liquid Metal, accent = gold.
          </p>
          <DsTokenRow
            name="Accent Emphasis"
            varName="--ds-accent-emphasis"
            description="Featured/VIP text (blue in Niji, gold in Liquid Metal)"
          />
          <DsTokenRow
            name="Neutral Emphasis"
            varName="--ds-neutral-emphasis"
            description="Utility/secondary text (muted in Niji, silver in Liquid Metal)"
          />
          <DsTokenRow
            name="CTA Background"
            varName="--ds-cta-bg"
            description="Call-to-action background fill"
          />
          <DsTokenRow
            name="CTA Text"
            varName="--ds-cta-text"
            description="Call-to-action text color"
          />
          <DsTokenRow
            name="Divider"
            varName="--ds-divider"
            description="Section separators (softer than border)"
          />
          <DsTokenRow
            name="Border Subtle"
            varName="--ds-border-subtle"
            description="Light structural borders"
          />
        </section>
      </div>
    </div>
  )
}

export const AllTokens: Story = {
  render: () => <ColorTokensPage />,
}
