'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Hammer, FileSignature, Users, Receipt, Star, Image } from 'lucide-react'
import { SidebarNavLink } from './SidebarNavLink'

const meta = {
  title: 'Shared/Navigation/NavLink',
  component: SidebarNavLink,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="w-56 bg-sidebar rounded-md border border-sidebar-border p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarNavLink>

export default meta
type Story = StoryObj<typeof meta>

// ─── Active states ────────────────────────────────────────────────────────────

export const Active: Story = {
  args: { label: 'Customers', href: '/customers', icon: Users, isActive: true },
}

export const Inactive: Story = {
  args: { label: 'Customers', href: '/customers', icon: Users, isActive: false },
}

// ─── With entity color ────────────────────────────────────────────────────────

export const WithIconColor: Story = {
  args: {
    label: 'Jobs',
    href: '/jobs/board',
    icon: Hammer,
    iconColor: 'text-purple',
    isActive: true,
    bounceKey: 1,
  },
}

// ─── Indented sub-item ────────────────────────────────────────────────────────

export const Indented: Story = {
  args: {
    label: 'Favorites',
    href: '/garments/favorites',
    icon: Star,
    iconColor: 'text-warning',
    indent: true,
    isActive: true,
    bounceKey: 1,
  },
}

export const IndentedInactive: Story = {
  args: {
    label: 'Favorites',
    href: '/garments/favorites',
    icon: Star,
    iconColor: 'text-warning',
    indent: true,
    isActive: false,
  },
}

// ─── Full nav group ───────────────────────────────────────────────────────────
// Shows how items look together, with Quotes as the active item

export const NavGroup: Story = {
  args: { label: 'Quotes', href: '/quotes', icon: FileSignature, isActive: true },
  render: () => (
    <div className="space-y-0.5">
      <SidebarNavLink
        label="Jobs"
        href="/jobs/board"
        icon={Hammer}
        iconColor="text-purple"
        isActive={false}
      />
      <SidebarNavLink
        label="Quotes"
        href="/quotes"
        icon={FileSignature}
        iconColor="text-magenta"
        isActive={true}
        bounceKey={1}
      />
      <SidebarNavLink label="Customers" href="/customers" icon={Users} isActive={false} />
      <SidebarNavLink
        label="Invoices"
        href="/invoices"
        icon={Receipt}
        iconColor="text-emerald"
        isActive={false}
      />
      <SidebarNavLink
        label="Artwork"
        href="/artwork"
        icon={Image}
        iconColor="text-teal"
        isActive={false}
      />
      <SidebarNavLink
        label="Favorites"
        href="/garments/favorites"
        icon={Star}
        iconColor="text-warning"
        indent
        isActive={false}
      />
    </div>
  ),
}
