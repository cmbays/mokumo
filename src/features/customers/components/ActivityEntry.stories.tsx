import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ActivityEntry } from './ActivityEntry'
import type { CustomerActivity } from '@domain/ports/customer-activity.port'

const meta = {
  title: 'Features/Customers/ActivityEntry',
  component: ActivityEntry,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ActivityEntry>

export default meta
type Story = StoryObj<typeof meta>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeActivity(overrides: Partial<CustomerActivity>): CustomerActivity {
  return {
    id: crypto.randomUUID(),
    customerId: '10000000-0000-4000-8000-000000000001',
    shopId: '00000000-0000-4000-8000-000000000001',
    source: 'manual',
    direction: 'internal',
    actorType: 'staff',
    actorId: '00000000-0000-4000-8000-000000000099',
    content: 'Placeholder activity content.',
    externalRef: null,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    ...overrides,
  }
}

const noteActivity = makeActivity({
  source: 'manual',
  direction: 'internal',
  content:
    'Confirmed order for 2025–26 athletic uniforms. Football and soccer programs, ~400 units. Sent kickoff questionnaire.',
})

const systemActivity = makeActivity({
  source: 'system',
  direction: 'internal',
  actorType: 'system',
  actorId: null,
  content: 'Customer record created.',
  createdAt: new Date('2025-06-06T10:00:00Z').toISOString(),
})

const emailInbound = makeActivity({
  source: 'email',
  direction: 'inbound',
  content:
    'Re: Athletic Uniform Quote — "Looks great, can you add a hat option?" received from coach@school.edu.',
  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
})

const emailOutbound = makeActivity({
  source: 'email',
  direction: 'outbound',
  content: 'Sent revised quote for athletic uniforms with embroidered hat option.',
  createdAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
})

const smsActivity = makeActivity({
  source: 'sms',
  direction: 'inbound',
  content: '"Artwork approved. Go ahead." — Coach Johnson via SMS.',
  createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
})

const withRelatedEntity = makeActivity({
  source: 'system',
  direction: 'internal',
  actorType: 'system',
  actorId: null,
  content: 'Quote created.',
  relatedEntityType: 'quote',
  relatedEntityId: '20000000-0000-4000-8000-000000000001',
})

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Note: Story = {
  args: { activity: noteActivity, isLast: true },
}

export const System: Story = {
  args: { activity: systemActivity, isLast: true },
}

export const EmailInbound: Story = {
  args: { activity: emailInbound, isLast: true },
}

export const EmailOutbound: Story = {
  args: { activity: emailOutbound, isLast: true },
}

export const SMS: Story = {
  args: { activity: smsActivity, isLast: true },
}

export const WithRelatedEntity: Story = {
  args: { activity: withRelatedEntity, isLast: true },
}

export const WithStatusLabel: Story = {
  args: {
    activity: withRelatedEntity,
    statusLabel: 'Paid',
    statusColorClass: 'text-success',
    formattedAmount: '$1,234.00',
    entityLabel: 'Invoice #2024-0042',
    isLast: true,
  },
}

export const Timeline: Story = {
  args: { activity: noteActivity, isLast: false },
  render: () => (
    <div className="p-4 max-w-lg">
      <ActivityEntry activity={noteActivity} isLast={false} />
      <ActivityEntry activity={emailInbound} isLast={false} />
      <ActivityEntry activity={emailOutbound} isLast={false} />
      <ActivityEntry activity={smsActivity} isLast={false} />
      <ActivityEntry activity={systemActivity} isLast={true} />
    </div>
  ),
}
