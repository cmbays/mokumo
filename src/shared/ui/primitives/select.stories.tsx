import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ComponentProps } from 'react'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

const meta = {
  title: 'Shared/Primitives/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

function ProductionMethodSelect(props: ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a production method" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Production</SelectLabel>
          <SelectItem value="screen-print">Screen print</SelectItem>
          <SelectItem value="dtf">Direct to film</SelectItem>
          <SelectItem value="embroidery">Embroidery</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Specialty</SelectLabel>
          <SelectItem value="foil">Foil</SelectItem>
          <SelectItem value="puff">Puff ink</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const Placeholder: Story = {
  render: function Render() {
    return <ProductionMethodSelect />
  },
}

export const Selected: Story = {
  render: function Render() {
    return <ProductionMethodSelect defaultValue="screen-print" />
  },
}

export const MenuOpen: Story = {
  render: function Render() {
    return <ProductionMethodSelect defaultValue="dtf" defaultOpen />
  },
}

export const Disabled: Story = {
  render: function Render() {
    return <ProductionMethodSelect defaultValue="embroidery" disabled />
  },
}
