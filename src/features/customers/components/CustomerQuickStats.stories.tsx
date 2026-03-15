import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CustomerQuickStats } from './CustomerQuickStats'
import type { CustomerStats } from '@features/customers/lib/customer-stats.schema'

const meta = {
  title: 'Features/Customers/CustomerQuickStats',
  component: CustomerQuickStats,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CustomerQuickStats>

export default meta
type Story = StoryObj<typeof meta>

const baseStats: CustomerStats = {
  lifetimeRevenue: 28460000, // $284,600
  totalOrders: 12,
  avgOrderValue: 2371667,
  lastOrderDate: new Date(Date.now() - 3 * 86_400_000).toISOString(),
}

const statsWithCredit: CustomerStats = {
  ...baseStats,
  creditLimit: 800000,
  outstandingBalance: 125000,
  referralCount: 3,
}

const emptyStats: CustomerStats = {
  lifetimeRevenue: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  lastOrderDate: null,
}

// ─── Cells variant (used in Customer Detail header) ───────────────────────────

export const Cells: Story = {
  args: { stats: baseStats, variant: 'cells' },
}

export const CellsWithCreditBar: Story = {
  args: { stats: statsWithCredit, variant: 'cells' },
}

export const CellsEmpty: Story = {
  args: { stats: emptyStats, variant: 'cells' },
}

// ─── Header (inline dot-separated) variant ────────────────────────────────────

export const Header: Story = {
  args: { stats: baseStats, variant: 'header' },
}

export const HeaderWithReferrals: Story = {
  args: { stats: statsWithCredit, variant: 'header' },
}

// ─── Bar (icon+label) variant ─────────────────────────────────────────────────

export const Bar: Story = {
  args: { stats: baseStats, variant: 'bar' },
}

// ─── Side-by-side comparison ──────────────────────────────────────────────────

export const AllVariants: Story = {
  args: { stats: statsWithCredit, variant: 'cells' },
  render: () => (
    <div className="flex flex-col gap-8 p-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">cells</p>
        <CustomerQuickStats stats={statsWithCredit} variant="cells" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">header</p>
        <CustomerQuickStats stats={statsWithCredit} variant="header" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">bar</p>
        <CustomerQuickStats stats={statsWithCredit} variant="bar" />
      </div>
    </div>
  ),
}
