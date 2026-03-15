import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TooltipProvider } from '@shared/ui/primitives/tooltip'
import { HealthBadge } from './HealthBadge'

const meta = {
  title: 'Shared/Organisms/HealthBadge',
  component: HealthBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof HealthBadge>

export default meta
type Story = StoryObj<typeof meta>

export const AllStatuses: Story = {
  args: { status: 'active' },
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <HealthBadge status="active" />
      <HealthBadge status="potentially-churning" />
      <HealthBadge status="churned" />
    </div>
  ),
}

export const Compact: Story = {
  args: { status: 'active', compact: true },
  render: () => (
    <div className="flex items-center gap-4 p-4">
      <HealthBadge status="active" compact />
      <HealthBadge status="potentially-churning" compact />
      <HealthBadge status="churned" compact />
    </div>
  ),
}

export const Active: Story = {
  args: { status: 'active' },
}

export const PotentiallyChurning: Story = {
  args: { status: 'potentially-churning' },
}

export const Churned: Story = {
  args: { status: 'churned' },
}
