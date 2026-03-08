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
        <Input defaultValue="Focused state preview" autoFocus />
        <Input aria-invalid="true" defaultValue="Validation error" />
        <Input disabled defaultValue="Disabled input" />
      </div>
    )
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
