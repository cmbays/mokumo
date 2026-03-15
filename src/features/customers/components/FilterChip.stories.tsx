import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FilterChip } from './FilterChip'

const meta = {
  title: 'Features/Customers/FilterChip',
  component: FilterChip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FilterChip>

export default meta
type Story = StoryObj<typeof meta>

export const Inactive: Story = {
  args: { label: 'Notes', active: false, onClick: () => {} },
}

export const Active: Story = {
  args: { label: 'Notes', active: true, onClick: () => {} },
}

export const ActivityFilters: Story = {
  args: { label: 'All', active: true, onClick: () => {} },
  render: function Render() {
    const options = ['All', 'Notes', 'System', 'Email', 'SMS', 'Portal'] as const
    const [active, setActive] = useState<string>('All')
    return (
      <div className="flex flex-wrap gap-2 p-4">
        {options.map((opt) => (
          <FilterChip
            key={opt}
            label={opt}
            active={active === opt}
            onClick={() => setActive(opt)}
          />
        ))}
      </div>
    )
  },
}
