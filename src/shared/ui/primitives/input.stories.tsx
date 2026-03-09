import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from './input'

const meta = {
  title: 'Shared/Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: function Render() {
    return (
      <div className="grid max-w-xl gap-4 p-4">
        <Input placeholder="Default input" />
        <Input defaultValue="Ready for focus interaction" />
        <Input aria-invalid="true" defaultValue="Validation error" />
        <Input disabled defaultValue="Disabled input" />
      </div>
    )
  },
}

export const Focused: Story = {
  render: function Render() {
    return (
      <div className="grid max-w-xl gap-4 p-4">
        <Input data-testid="focus-target" defaultValue="Focused state preview" />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('[data-testid="focus-target"]')
    input?.focus()
  },
}

export const Types: Story = {
  render: function Render() {
    return (
      <div className="grid max-w-xl gap-4 p-4">
        <Input type="email" placeholder="Email address" />
        <Input type="search" placeholder="Search quotes" />
        <Input type="number" placeholder="0" />
      </div>
    )
  },
}
