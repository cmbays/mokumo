import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from './badge'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

const meta = {
  title: 'Shared/Primitives/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Triggered: Story = {
  render: function Render() {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-8">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open approval dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve artwork for production</DialogTitle>
              <DialogDescription>
                Confirm that the proof is approved, pricing is final, and the customer can no longer
                edit art placement.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button>Approve proof</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  },
}

export const OpenConfirm: Story = {
  render: function Render() {
    return (
      <div className="bg-background min-h-screen p-8">
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <Badge variant="outline">Destructive action</Badge>
              <DialogTitle>Archive this quote?</DialogTitle>
              <DialogDescription>
                Archived quotes are removed from the active queue. You can restore them later, but
                they will disappear from day-to-day production views immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button variant="destructive">Archive quote</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  },
}
