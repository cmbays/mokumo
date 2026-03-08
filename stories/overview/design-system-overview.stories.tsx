import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from '@shared/ui/primitives/badge'
import { Button } from '@shared/ui/primitives/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/primitives/card'

const meta = {
  title: 'Overview/Design System',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render() {
    return (
      <div className="bg-background text-foreground min-h-screen p-8 md:p-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Badge variant="outline">Mokumo UI System</Badge>
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Calm by default, explicit in state, consistent in behavior
              </h1>
              <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
                This overview story exists to show the shape of the system at a glance. It is not
                the design system contract. It is the visual entry point into the shared UI surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Create quote</Button>
              <Button variant="outline">Review patterns</Button>
              <Button variant="ghost">Inspect states</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Foundations</CardTitle>
                <CardDescription>Color, type, spacing, motion, and system states.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Action</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shared UI</CardTitle>
                <CardDescription>
                  Stable primitives and reusable cross-domain components.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Component stories should live next to the source component whenever possible.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patterns</CardTitle>
                <CardDescription>
                  Reusable flows such as forms, tables, and state handling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Pattern stories belong at the root level when they describe cross-component
                  behavior instead of one source file.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  },
}
