import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from '@shared/ui/primitives/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/primitives/card'

const meta = {
  title: 'Foundations/Visual Language',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const colorRoles = [
  { label: 'Primary', className: 'bg-primary text-primary-foreground' },
  { label: 'Secondary', className: 'bg-secondary text-secondary-foreground' },
  { label: 'Muted', className: 'bg-muted text-muted-foreground border border-border' },
  { label: 'Surface', className: 'bg-card text-card-foreground border border-border' },
  { label: 'Success', className: 'bg-[color:var(--success)] text-black' },
  { label: 'Warning', className: 'bg-[color:var(--warning)] text-black' },
  { label: 'Error', className: 'bg-destructive text-white' },
]

const typeScale = [
  {
    label: 'Display',
    className: 'text-4xl font-semibold tracking-tight',
    sample: 'Production calm with clear hierarchy',
  },
  {
    label: 'Section title',
    className: 'text-2xl font-semibold tracking-tight',
    sample: 'Shared UI and system patterns',
  },
  {
    label: 'Body',
    className: 'text-base leading-7',
    sample: 'Body copy should be calm, specific, and operationally useful.',
  },
  {
    label: 'Supporting',
    className: 'text-sm text-muted-foreground',
    sample: 'Use subdued language for secondary context and helper copy.',
  },
]

export const Overview: Story = {
  render: function Render() {
    return (
      <div className="bg-background text-foreground min-h-screen p-8 md:p-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="outline">Foundations</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Visual language starts with stable roles, not ad hoc styling
              </h1>
              <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
                These stories are reference surfaces for agents and humans. The canonical contract
                still lives in the design-system docs, but Storybook makes the visual vocabulary
                concrete.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Color roles</CardTitle>
                <CardDescription>
                  Use semantic roles first. Specialty accents should remain additive, not
                  foundational.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {colorRoles.map((role) => (
                    <div
                      key={role.label}
                      className={`${role.className} flex min-h-20 items-end rounded-lg p-4 text-sm font-medium shadow-sm`}
                    >
                      {role.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Surface rhythm</CardTitle>
                <CardDescription>
                  The system relies on restrained surfaces, border definition, and controlled
                  contrast.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
                    Base card
                  </div>
                  <div className="bg-secondary rounded-xl p-4">Secondary surface</div>
                  <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
                    Muted surface for helper context
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Type hierarchy</CardTitle>
              <CardDescription>
                Typography should communicate operational priority without decorative noise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                {typeScale.map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-1 border-b border-border pb-4 last:border-b-0"
                  >
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.14em]">
                      {item.label}
                    </span>
                    <p className={item.className}>{item.sample}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  },
}
