import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TypeTagBadges } from './TypeTagBadges'

const meta = {
  title: 'Shared/Organisms/TypeTagBadges',
  component: TypeTagBadges,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TypeTagBadges>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  args: { tags: ['retail'] },
}

export const Multiple: Story = {
  args: { tags: ['sports-school', 'nonprofit'] },
}

export const AllTags: Story = {
  args: { tags: ['retail'] },
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <TypeTagBadges tags={['retail']} />
      <TypeTagBadges tags={['sports-school']} />
      <TypeTagBadges tags={['corporate']} />
      <TypeTagBadges tags={['wholesale']} />
      <TypeTagBadges tags={['nonprofit']} />
      <TypeTagBadges tags={['sports-school', 'nonprofit']} />
    </div>
  ),
}

export const Empty: Story = {
  args: { tags: [] },
}
