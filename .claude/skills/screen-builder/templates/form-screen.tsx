// Template: Form Screen
// Use for: New Quote (and future create/edit forms)
// Adapt: fields, validation schema, calculation logic, submit handler
//
// This is structural guidance — adapt to the specific screen's APP_FLOW entry.
// Do NOT copy-paste without reading APP_FLOW for this route.

// Forms always need "use client" (hooks, event handlers)
'use client'

import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/card'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/ui/primitives/breadcrumb'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/primitives/form'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@shared/lib/cn'

// Import mock data for dropdowns
// import data from your domain layer

// Define form schema with Zod (or import from @domain/{vertical}/schemas/)
// const formSchema = z.object({
//   customerId: z.string().min(1, "Select a customer"),
//   lineItems: z.array(z.object({
//     description: z.string().min(1, "Description required"),
//     quantity: z.number().min(1, "Quantity must be at least 1"),
//     colorCount: z.number().min(1),
//     locations: z.number().min(1),
//   })).min(1, "Add at least one line item"),
//   setupFee: z.number().min(0),
// });
// type FormValues = z.infer<typeof formSchema>;

export default function ExampleFormPage() {
  const router = useRouter()

  // const form = useForm<FormValues>({
  //   resolver: zodResolver(formSchema),
  //   defaultValues: {
  //     customerId: "",
  //     lineItems: [{ description: "", quantity: 1, colorCount: 1, locations: 1 }],
  //     setupFee: 0,
  //   },
  // });

  // const { fields, append, remove } = useFieldArray({
  //   control: form.control,
  //   name: "lineItems",
  // });

  // function onSubmit(data: FormValues) {
  //   // Phase 1: Add to mock data (client-side only)
  //   // Navigate to detail page
  //   router.push(`/quotes/${newId}`);
  // }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/quotes">Quotes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Quote</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Quote</h1>
        <p className="text-sm text-muted-foreground">Create a new quote for a customer</p>
      </div>

      {/* Form */}
      {/* <Form {...form}> */}
      {/*   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"> */}

      {/* Customer selector */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <FormField control={form.control} name="customerId" render={...} /> */}
          {/* Use Select component with customers from mock data */}
        </CardContent>
      </Card>

      {/* Dynamic line items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            // onClick={() => append({ description: "", quantity: 1, colorCount: 1, locations: 1 })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* {fields.map((field, index) => ( */}
          {/*   <div key={field.id} className="grid grid-cols-12 gap-4 items-start border rounded-md p-4"> */}
          {/*     <div className="col-span-4"> */}
          {/*       <FormField name={`lineItems.${index}.description`} ... /> */}
          {/*     </div> */}
          {/*     <div className="col-span-2"> */}
          {/*       <FormField name={`lineItems.${index}.quantity`} ... /> */}
          {/*     </div> */}
          {/*     ... */}
          {/*     <div className="col-span-1 flex justify-end"> */}
          {/*       <Button variant="ghost" size="icon" onClick={() => remove(index)}> */}
          {/*         <Trash2 className="h-4 w-4 text-muted-foreground" /> */}
          {/*       </Button> */}
          {/*     </div> */}
          {/*   </div> */}
          {/* ))} */}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{/* calculated */}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Setup Fee</span>
            <span className="font-medium">{/* from form */}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold text-lg">{/* calculated */}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push('/quotes')}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-action text-black font-semibold border-2 border-current shadow-brutal shadow-action hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm transition-all"
        >
          Save as Draft
        </Button>
      </div>

      {/*   </form> */}
      {/* </Form> */}
    </div>
  )
}
