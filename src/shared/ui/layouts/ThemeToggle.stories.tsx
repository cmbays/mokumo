'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ThemeProvider } from '@shared/ui/primitives/theme-provider'
import { ThemeToggle } from './ThemeToggle'

const meta = {
  title: 'Shared/Navigation/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="w-56 bg-sidebar rounded-md border border-sidebar-border p-2">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InContext: Story = {
  render: () => (
    <ThemeProvider>
      <div className="w-56 bg-sidebar rounded-md border border-sidebar-border p-2 space-y-1">
        {/* Simulated nav items above for context */}
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 rounded bg-border/60" />
          <span>Customers</span>
        </div>
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 rounded bg-border/60" />
          <span>Settings</span>
        </div>
        <div className="mx-1 border-t border-sidebar-border my-1" />
        <ThemeToggle />
      </div>
    </ThemeProvider>
  ),
}
