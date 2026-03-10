'use client'

import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  FileSignature,
  Hammer,
  Image,
  LayoutDashboard,
  Printer,
  Receipt,
  Shirt,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const meta = {
  title: 'Foundations/Entity Palette',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Each domain entity and service type has a permanent categorical color assignment.
These colors appear in sidebar nav icons, left borders, outline badges, and charts.

**Entity colors are stable across personalities.** Purple always means Jobs,
regardless of whether the UI is in Niji or Liquid Metal mode. Personalities
change *how* the color is rendered (flat vs gradient ring) but not *which* color.
        `,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type EntityDef = {
  name: string
  token: string
  icon: LucideIcon
  fillIcon?: boolean
  pool: 'entity' | 'service' | 'channel'
  description: string
}

const ENTITIES: EntityDef[] = [
  {
    name: 'Home',
    token: 'cyan',
    icon: LayoutDashboard,
    pool: 'entity',
    description: 'Dashboard / overview',
  },
  { name: 'Jobs', token: 'purple', icon: Hammer, pool: 'entity', description: 'Production jobs' },
  {
    name: 'Quotes',
    token: 'magenta',
    icon: FileSignature,
    pool: 'entity',
    description: 'Price quotes',
  },
  {
    name: 'Customers',
    token: 'amber',
    icon: Users,
    pool: 'entity',
    description: 'Customer accounts',
  },
  {
    name: 'Invoices',
    token: 'emerald',
    icon: Receipt,
    pool: 'entity',
    description: 'Billing invoices',
  },
  {
    name: 'Garments',
    token: 'graphite',
    icon: Shirt,
    fillIcon: true,
    pool: 'entity',
    description: 'Blank garment catalog',
  },
  {
    name: 'Artwork',
    token: 'teal',
    icon: Image,
    pool: 'entity',
    description: 'Design artwork files',
  },
  {
    name: 'Screens',
    token: 'action',
    icon: Printer,
    pool: 'service',
    description: 'Screen print production',
  },
]

const SERVICES: EntityDef[] = [
  {
    name: 'Screen Print',
    token: 'teal',
    icon: Printer,
    pool: 'service',
    description: 'Primary decoration method',
  },
  {
    name: 'Embroidery',
    token: 'lime',
    icon: Printer,
    pool: 'service',
    description: 'Thread-based decoration',
  },
  {
    name: 'DTF',
    token: 'brown',
    icon: Printer,
    pool: 'service',
    description: 'Direct-to-film transfers',
  },
]

function EntityRow({ entity }: { entity: EntityDef }) {
  const Icon = entity.icon
  const color = `var(--${entity.token})`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          size={20}
          color={color}
          fill={entity.fillIcon ? color : 'none'}
          strokeWidth={entity.fillIcon ? 0 : 2}
        />
      </div>

      {/* Name + description */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
          {entity.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{entity.description}</div>
      </div>

      {/* Token */}
      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>
        {entity.token}
      </div>

      {/* Color swatches */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: `var(--${entity.token})`,
            border: '1px solid rgba(128,128,128,0.2)',
          }}
          title={`--${entity.token}`}
        />
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: `var(--${entity.token}-hover)`,
            border: '1px solid rgba(128,128,128,0.2)',
          }}
          title={`--${entity.token}-hover`}
        />
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: `var(--${entity.token}-bold)`,
            border: '1px solid rgba(128,128,128,0.2)',
          }}
          title={`--${entity.token}-bold`}
        />
      </div>

      {/* Badge preview */}
      <div
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
          color: color,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {entity.name}
      </div>
    </div>
  )
}

function EntityPalettePage() {
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
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Entity Palette
          </h1>
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

        {/* Entities */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Domain Entities</h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Primary navigation items. Each entity has a permanent color.
          </p>
          <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {ENTITIES.map((e) => (
              <EntityRow key={e.name} entity={e} />
            ))}
          </div>
        </section>

        {/* Services */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Service Types</h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Decoration methods. Used in service type badges and production views.
          </p>
          <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {SERVICES.map((e) => (
              <EntityRow key={e.name} entity={e} />
            ))}
          </div>
        </section>

        {/* Encoding rules */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Encoding Rules</h2>
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 8,
              padding: 20,
              fontSize: 13,
              lineHeight: 1.8,
              color: 'var(--muted-foreground)',
            }}
          >
            <div>
              <strong style={{ color: 'var(--foreground)' }}>Entity identity</strong> → Categorical
              color + outline badge or left border
            </div>
            <div>
              <strong style={{ color: 'var(--foreground)' }}>Service type</strong> → Categorical
              color + outline badge
            </div>
            <div>
              <strong style={{ color: 'var(--foreground)' }}>Status/state</strong> → Status palette
              + filled badge (never categorical)
            </div>
            <div>
              <strong style={{ color: 'var(--foreground)' }}>Customer type</strong> → Monochrome
              pill (bg-muted)
            </div>
            <div>
              <strong style={{ color: 'var(--foreground)' }}>Lifecycle</strong> → Status color dot +
              text label
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export const AllEntities: Story = {
  render: () => <EntityPalettePage />,
}
