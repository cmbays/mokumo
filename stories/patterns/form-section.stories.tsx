import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@shared/ui/primitives/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/ui/primitives/card'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import { Textarea } from '@shared/ui/primitives/textarea'

const meta = {
  title: 'Patterns/Form Section',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const QuoteIntake: Story = {
  render: function Render() {
    return (
      <div className="bg-background text-foreground min-h-screen p-8 md:p-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Quote intake</CardTitle>
              <CardDescription>
                Group related fields into one surface, keep labels direct, and reserve helper text
                for operational context.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-name">Customer name</Label>
                  <Input id="customer-name" placeholder="Acme Athletics" />
                  <p className="text-muted-foreground text-sm">
                    Use the billing or storefront name that will appear on the quote.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Production method</Label>
                  <Select defaultValue="screen-print">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screen-print">Screen print</SelectItem>
                      <SelectItem value="dtf">Direct to film</SelectItem>
                      <SelectItem value="embroidery">Embroidery</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-sm">
                    Pick the primary method first. Specialty treatments should remain secondary.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="project-notes">Project notes</Label>
                <Textarea
                  id="project-notes"
                  placeholder="Rush date, garment constraints, ink notes, artwork requirements..."
                />
                <p className="text-muted-foreground text-sm">
                  Put time-sensitive operational details here, not in the customer-facing title.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:justify-between sm:items-center">
              <p className="text-muted-foreground text-sm">
                Primary action should stay obvious. Secondary actions should not compete visually.
              </p>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline">Save draft</Button>
                <Button>Create quote</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  },
}
