import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QuickNoteRail } from './QuickNoteRail'
import type { CustomerActivity } from '@domain/ports/customer-activity.port'

const meta = {
  title: 'Features/Customers/QuickNoteRail',
  component: QuickNoteRail,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof QuickNoteRail>

export default meta
type Story = StoryObj<typeof meta>

const savedActivity: CustomerActivity = {
  id: crypto.randomUUID(),
  customerId: '10000000-0000-4000-8000-000000000001',
  shopId: '00000000-0000-4000-8000-000000000001',
  source: 'manual',
  direction: 'internal',
  actorType: 'staff',
  actorId: '00000000-0000-4000-8000-000000000099',
  content: 'Note saved.',
  externalRef: null,
  relatedEntityType: null,
  relatedEntityId: null,
  createdAt: new Date().toISOString(),
}

export const Default: Story = {
  args: {
    customerId: '10000000-0000-4000-8000-000000000001',
    onNoteSaved: () => {},
    onSave: async () => ({ ok: true, value: savedActivity }),
  },
}

export const SaveError: Story = {
  args: {
    customerId: '10000000-0000-4000-8000-000000000001',
    onNoteSaved: () => {},
    onSave: async () => ({ ok: false, error: 'INTERNAL_ERROR' as const }),
  },
}

export const Saving: Story = {
  args: {
    customerId: '10000000-0000-4000-8000-000000000001',
    onNoteSaved: () => {},
    // Simulate a long-running save
    onSave: () => new Promise(() => {}),
  },
}
