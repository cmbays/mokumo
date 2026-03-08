import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from './badge'

const meta = {
  title: 'Shared/Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: function Render() {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="destructive">Error</Badge>
      </div>
    )
  },
}

export const MixedUsage: Story = {
  render: function Render() {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Badge>In progress</Badge>
        <Badge variant="outline">Screen print</Badge>
        <Badge variant="secondary">Internal</Badge>
      </div>
    )
  },
}
