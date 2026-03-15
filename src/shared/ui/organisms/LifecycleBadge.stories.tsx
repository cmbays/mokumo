import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TooltipProvider } from '@shared/ui/primitives/tooltip'
import { LifecycleBadge } from './LifecycleBadge'

const meta = {
  title: 'Shared/Organisms/LifecycleBadge',
  component: LifecycleBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof LifecycleBadge>

export default meta
type Story = StoryObj<typeof meta>

export const AllStages: Story = {
  args: { stage: 'prospect' },
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <LifecycleBadge stage="prospect" />
      <LifecycleBadge stage="new" />
      <LifecycleBadge stage="repeat" />
      <LifecycleBadge stage="vip" />
      <LifecycleBadge stage="at-risk" />
      <LifecycleBadge stage="archived" />
    </div>
  ),
}

export const Compact: Story = {
  args: { stage: 'vip', compact: true },
  render: () => (
    <div className="flex items-center gap-4 p-4">
      <LifecycleBadge stage="vip" compact />
      <LifecycleBadge stage="at-risk" compact />
      <LifecycleBadge stage="prospect" compact />
    </div>
  ),
}

export const Prospect: Story = {
  args: { stage: 'prospect' },
}

export const VIP: Story = {
  args: { stage: 'vip' },
}

export const AtRisk: Story = {
  args: { stage: 'at-risk' },
}
