import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArrowRight } from 'lucide-react'

import { Button } from './button'

const meta = {
  title: 'Shared/Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: function Render() {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    )
  },
}

export const Sizes: Story = {
  render: function Render() {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Continue">
          <ArrowRight />
        </Button>
      </div>
    )
  },
}

export const Disabled: Story = {
  render: function Render() {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled outline
        </Button>
      </div>
    )
  },
}
