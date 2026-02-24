'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Badge } from '@shared/ui/primitives/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@shared/ui/primitives/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/primitives/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/primitives/form'
import { listPricingOverrides, savePricingOverride, removePricingOverride } from '../actions'
import type { PricingOverride, PricingOverrideRules } from '@domain/entities/pricing-override'

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const overrideFormSchema = z
  .object({
    entityType: z.enum(['style', 'brand', 'category']),
    entityId: z.string().optional(),
    ruleType: z.enum(['markup_percent', 'discount_percent', 'fixed_price']),
    ruleValue: z.string().min(1, 'Value is required'),
    priority: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.entityType !== 'category') {
      if (!data.entityId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entityId'],
          message: 'Entity ID is required for style and brand overrides',
        })
      } else if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.entityId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entityId'],
          message: 'Must be a valid UUID',
        })
      }
    }
    const num = parseFloat(data.ruleValue)
    if (isNaN(num) || num < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ruleValue'],
        message: 'Must be a non-negative number',
      })
    } else if (
      data.ruleType === 'fixed_price' &&
      !/^\d+(\.\d{1,2})?$/.test(data.ruleValue)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ruleValue'],
        message: 'Fixed price must be a decimal with up to 2 places (e.g. 14.99)',
      })
    }
  })

type OverrideFormValues = z.infer<typeof overrideFormSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRule(rules: PricingOverrideRules): string {
  if (rules.fixed_price !== undefined) return `$${rules.fixed_price}`
  if (rules.markup_percent !== undefined) return `+${rules.markup_percent}%`
  if (rules.discount_percent !== undefined) return `−${rules.discount_percent}%`
  return '—'
}

function formatEntity(override: PricingOverride): string {
  if (override.entityType === 'category') return 'All Garments'
  return override.entityId ? `${override.entityId.slice(0, 8)}…` : '—'
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  style: 'Style',
  brand: 'Brand',
  category: 'Category',
}

const ENTITY_TYPE_BADGE_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'outline'
> = {
  style: 'default',
  brand: 'secondary',
  category: 'outline',
}

function ruleTypeFromRules(rules: PricingOverrideRules): OverrideFormValues['ruleType'] {
  if (rules.fixed_price !== undefined) return 'fixed_price'
  if (rules.markup_percent !== undefined) return 'markup_percent'
  return 'discount_percent'
}

function ruleValueFromRules(rules: PricingOverrideRules): string {
  if (rules.fixed_price !== undefined) return rules.fixed_price
  if (rules.markup_percent !== undefined) return String(rules.markup_percent)
  if (rules.discount_percent !== undefined) return String(rules.discount_percent)
  return ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogPricingOverrides() {
  const [overrides, setOverrides] = useState<PricingOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingOverride, setEditingOverride] = useState<PricingOverride | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PricingOverride | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideFormSchema),
    defaultValues: {
      entityType: 'category',
      entityId: '',
      ruleType: 'markup_percent',
      ruleValue: '',
      priority: 0,
    },
  })

  const entityType = form.watch('entityType')

  // Fetch overrides on mount
  useEffect(() => {
    listPricingOverrides().then((result) => {
      if (Array.isArray(result)) {
        setOverrides(result)
      } else {
        toast.error('Failed to load pricing overrides')
      }
      setLoading(false)
    })
  }, [])

  const openAddSheet = useCallback(() => {
    setEditingOverride(null)
    form.reset({
      entityType: 'category',
      entityId: '',
      ruleType: 'markup_percent',
      ruleValue: '',
      priority: 0,
    })
    setSheetOpen(true)
  }, [form])

  const openEditSheet = useCallback(
    (override: PricingOverride) => {
      setEditingOverride(override)
      form.reset({
        entityType: override.entityType,
        entityId: override.entityId ?? '',
        ruleType: ruleTypeFromRules(override.rules),
        ruleValue: ruleValueFromRules(override.rules),
        priority: override.priority,
      })
      setSheetOpen(true)
    },
    [form]
  )

  const handleSave = useCallback(
    async (data: OverrideFormValues) => {
      setSaving(true)

      const ruleType = data.ruleType
      const ruleValue = parseFloat(data.ruleValue)
      const rules =
        ruleType === 'fixed_price'
          ? { fixed_price: parseFloat(data.ruleValue).toFixed(2) }
          : ruleType === 'markup_percent'
            ? { markup_percent: ruleValue }
            : { discount_percent: ruleValue }

      const result = await savePricingOverride({
        entityType: data.entityType,
        entityId: data.entityType === 'category' ? null : (data.entityId ?? null),
        scopeType: 'shop',
        rules,
        priority: data.priority,
      })

      setSaving(false)

      if (!result.success) {
        toast.error(result.error ?? "Couldn't save override — try again")
        return
      }

      setOverrides((prev) => {
        const idx = prev.findIndex((o) => o.id === result.override.id)
        return idx >= 0
          ? prev.map((o) => (o.id === result.override.id ? result.override : o))
          : [...prev, result.override]
      })
      setSheetOpen(false)
      toast.success(editingOverride ? 'Override updated' : 'Override added')
    },
    [editingOverride]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)

    const result = await removePricingOverride(deleteTarget.id)
    setDeleting(false)

    if (!result.success) {
      toast.error(result.error ?? "Couldn't delete override — try again")
      return
    }

    setOverrides((prev) => prev.filter((o) => o.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success('Override removed')
  }, [deleteTarget])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Catalog Pricing Overrides</h2>
          <p className="text-xs text-muted-foreground">
            Control how supplier base prices are marked up for your shop.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openAddSheet}
          className="bg-action text-black font-semibold border-2 border-current shadow-brutal shadow-action hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm transition-all"
        >
          <Plus className="size-4" />
          Add Override
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading overrides…
          </div>
        ) : overrides.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ShoppingBag className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No pricing overrides yet</p>
            <p className="text-xs text-muted-foreground/60">
              Add an override to mark up or discount supplier base prices
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated">
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Type
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Entity
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rule
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Priority
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((override, i) => (
                <tr
                  key={override.id}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-elevated/40'}
                >
                  <td className="px-3 py-2">
                    <Badge variant={ENTITY_TYPE_BADGE_VARIANTS[override.entityType] ?? 'outline'}>
                      {ENTITY_TYPE_LABELS[override.entityType]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {formatEntity(override)}
                  </td>
                  <td className="px-3 py-2 font-medium tabular-nums">
                    {formatRule(override.rules)}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {override.priority}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Edit override`}
                        onClick={() => openEditSheet(override)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Delete override`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(override)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingOverride ? 'Edit Override' : 'Add Override'}</SheetTitle>
            <SheetDescription>
              {editingOverride
                ? 'Update the pricing rule for this override.'
                : 'Define a markup, discount, or fixed price rule for a style, brand, or all garments.'}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="flex flex-col gap-4 px-4 py-6"
            >
              {/* Entity Type */}
              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        // Clear entityId when switching to category
                        if (v === 'category') form.setValue('entityId', '')
                      }}
                      disabled={!!editingOverride}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="category">Category (all garments)</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                        <SelectItem value="style">Style</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entity ID — only for style / brand */}
              {entityType !== 'category' && (
                <FormField
                  control={form.control}
                  name="entityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {entityType === 'brand' ? 'Brand ID' : 'Style ID'}{' '}
                        <span className="text-xs text-muted-foreground">(UUID)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          disabled={!!editingOverride}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Rule type */}
              <FormField
                control={form.control}
                name="ruleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="markup_percent">Markup %</SelectItem>
                        <SelectItem value="discount_percent">Discount %</SelectItem>
                        <SelectItem value="fixed_price">Fixed price</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rule value */}
              <FormField
                control={form.control}
                name="ruleValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Value{' '}
                      <span className="text-xs text-muted-foreground">
                        {form.watch('ruleType') === 'fixed_price' ? '(dollars)' : '(percent)'}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={form.watch('ruleType') === 'fixed_price' ? '0.01' : '1'}
                        min="0"
                        placeholder={form.watch('ruleType') === 'fixed_price' ? '14.99' : '40'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Priority{' '}
                      <span className="text-xs text-muted-foreground">
                        (higher wins when multiple overrides match)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="mt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save override'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the{' '}
              <strong>{deleteTarget ? ENTITY_TYPE_LABELS[deleteTarget.entityType] : ''}</strong>{' '}
              override ({deleteTarget ? formatRule(deleteTarget.rules) : ''}). The supplier base
              price will apply going forward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
