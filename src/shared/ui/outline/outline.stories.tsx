import { Meta, StoryObj } from '@storybook/react'
import { CheckCircle, AlertCircle, Clock, Zap, Wrench, Package } from 'lucide-react'
import { Outline, OutlineGroup, OutlineItem } from './index'

const meta: Meta<typeof Outline> = {
  title: 'UI/Outline',
  component: Outline,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Timeline: Story = {
  render: () => (
    <Outline>
      <OutlineGroup label="Feb 24 – Mar 2">
        <OutlineItem icon={CheckCircle} color="success" label="Job #42 completed" />
        <OutlineItem icon={AlertCircle} color="warning" label="Quote #18 pending approval" />
        <OutlineItem icon={Zap} color="action" label="Order #7 shipped" />
      </OutlineGroup>
      <OutlineGroup label="Feb 17 – Feb 23">
        <OutlineItem icon={Clock} color="muted" label="Screen burning started" />
      </OutlineGroup>
    </Outline>
  ),
}

export const DepartmentActivity: Story = {
  render: () => (
    <Outline>
      <OutlineGroup label="Screen Room">
        <OutlineItem icon={CheckCircle} color="success" label="Screen #12 burned" />
        <OutlineItem icon={CheckCircle} color="success" label="Emulsion prep complete" />
      </OutlineGroup>
      <OutlineGroup label="Press Floor">
        <OutlineItem icon={CheckCircle} color="success" label="Job #42 pressed (2,500 units)" />
        <OutlineItem icon={AlertCircle} color="warning" label="Press #4 needs cleaning" />
      </OutlineGroup>
      <OutlineGroup label="Finishing">
        <OutlineItem icon={Package} color="action" label="Job #39 packed (ready to ship)" />
      </OutlineGroup>
    </Outline>
  ),
}

export const StatusDashboard: Story = {
  render: () => (
    <Outline>
      <OutlineGroup label="Completed" accentColor="#54ca74">
        <OutlineItem icon={CheckCircle} color="success" label="Quote #18 (3 days ago)" />
        <OutlineItem icon={CheckCircle} color="success" label="Job #42 (2 days ago)" />
      </OutlineGroup>
      <OutlineGroup label="Pending" accentColor="#ffc663">
        <OutlineItem icon={AlertCircle} color="warning" label="Quote #22 (awaiting approval)" />
        <OutlineItem icon={AlertCircle} color="warning" label="Artwork #5 (under review)" />
      </OutlineGroup>
      <OutlineGroup label="Blocked" accentColor="#d23e08">
        <OutlineItem
          icon={AlertCircle}
          color="error"
          label="Job #40 (waiting on artwork approval)"
        />
      </OutlineGroup>
    </Outline>
  ),
}

export const WithDescriptions: Story = {
  render: () => (
    <Outline>
      <OutlineGroup label="This Week">
        <OutlineItem
          icon={CheckCircle}
          color="success"
          label="Job #42 completed"
          description="2,500 units, 4 colors, 3 locations"
        />
        <OutlineItem
          icon={AlertCircle}
          color="warning"
          label="Quote #18 pending"
          description="Awaiting customer approval on color change"
        />
        <OutlineItem
          icon={Wrench}
          color="action"
          label="Equipment maintenance scheduled"
          description="Press #3 down for 2 hours"
        />
      </OutlineGroup>
    </Outline>
  ),
}

export const AllColorVariants: Story = {
  render: () => (
    <OutlineGroup label="Status Colors">
      <OutlineItem icon={CheckCircle} color="success" label="Success: Job completed" />
      <OutlineItem icon={AlertCircle} color="warning" label="Warning: Review needed" />
      <OutlineItem icon={AlertCircle} color="error" label="Error: Action required" />
      <OutlineItem icon={Zap} color="action" label="Action: Primary call-to-action" />
      <OutlineItem icon={Clock} color="muted" label="Muted: Low priority info" />
    </OutlineGroup>
  ),
}
