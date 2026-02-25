'use client'

import { Separator } from '@shared/ui/primitives/separator'
import { Badge } from '@shared/ui/primitives/badge'
import { StatusBadge } from '@shared/ui/organisms/StatusBadge'
import { DiscountRow } from './DiscountRow'
import { QuoteActions } from './QuoteActions'
import { EmailPreviewModal } from './EmailPreviewModal'
import {
  MockupFilterProvider,
  GarmentMockupThumbnail,
  GarmentMockupModal,
  GarmentMockupCard,
} from '@features/quotes/components/mockup'
import { normalizePosition } from '@domain/constants/print-zones'
import type { MockupView } from '@domain/entities/mockup-template'

/** Canonical positions that belong to the back of the garment. */
const BACK_POSITIONS = new Set(['full-back', 'upper-back', 'back-chest', 'nape'])
/** Canonical positions that belong to the front of the garment. */
const FRONT_POSITIONS = new Set(['front-chest', 'left-chest', 'right-chest', 'full-front'])

/** Maps a normalised print position to the mockup view it belongs to.
 *  Returns undefined for ambiguous positions (sleeve, pocket) so the modal
 *  keeps its front/back toggle. */
function positionToLockedView(position: string): MockupView | undefined {
  if (FRONT_POSITIONS.has(position) || position.startsWith('front-')) return 'front'
  if (BACK_POSITIONS.has(position) || position.startsWith('back-')) return 'back'
  return undefined
}
import { Button } from '@shared/ui/primitives/button'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Copy, DollarSign, Hammer, Info, Pencil, Receipt, Send } from 'lucide-react'
import { toast } from 'sonner'
import { MatrixPeekSheet } from './MatrixPeekSheet'
import { BottomActionBar } from '@shared/ui/layouts/bottom-action-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import type { Quote, QuoteLineItem } from '@domain/entities/quote'
import type { Customer } from '@domain/entities/customer'
import type { Artwork } from '@domain/entities/artwork'
import type { Color } from '@domain/entities/color'
import type { GarmentCatalog } from '@domain/entities/garment'
import { formatDate } from '@shared/lib/format'
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from '@domain/constants'
import { LifecycleBadge } from '@shared/ui/organisms/LifecycleBadge'
import {
  DECORATION_COST_PER_COLOR,
  LOCATION_FEE_PER_UNIT,
  calculateGarmentCost,
  calculateDecorationCost,
  calculateLineItemSetupFee,
  calculateQuoteSetupFee,
} from './LineItemRow'
import { cn } from '@shared/lib/cn'
import { money, round2, toNumber, formatCurrency } from '@domain/lib/money'

type QuoteDetailViewProps = {
  quote: Quote
  customer: Customer | null
  artworks: Artwork[]
  garmentCatalog: GarmentCatalog[]
  colors: Color[]
  mode: 'detail' | 'review'
  onSend?: () => void
}

function getTotalQty(sizes: Record<string, number>): number {
  return Object.values(sizes).reduce((sum, qty) => sum + qty, 0)
}

export function QuoteDetailView({
  quote,
  customer,
  artworks,
  garmentCatalog,
  colors: allColors,
  mode,
  onSend,
}: QuoteDetailViewProps) {
  const [peekOpen, setPeekOpen] = useState(false)
  const [peekLineItem, setPeekLineItem] = useState<QuoteLineItem | null>(null)
  const [mobileEmailOpen, setMobileEmailOpen] = useState(false)

  const isDraft = quote.status === 'draft'
  const isAccepted = quote.status === 'accepted'

  const totalDiscounts = toNumber(quote.discounts.reduce((sum, d) => sum.plus(d.amount), money(0)))
  const artworkMap = new Map(artworks.map((a) => [a.id, a]))

  // Compute garment / decoration / setup split from line items
  let garmentTotalBig = money(0)
  let decorationTotalBig = money(0)
  let lineItemSetupFeesBig = money(0)
  quote.lineItems.forEach((item) => {
    const garment = garmentCatalog.find((g) => g.id === item.garmentId)
    const totalQty = getTotalQty(item.sizes)
    garmentTotalBig = garmentTotalBig.plus(calculateGarmentCost(garment, totalQty))
    decorationTotalBig = decorationTotalBig.plus(
      calculateDecorationCost(item.serviceType, item.printLocationDetails, totalQty)
    )
    lineItemSetupFeesBig = lineItemSetupFeesBig.plus(calculateLineItemSetupFee(item.serviceType))
  })
  const garmentTotal = toNumber(round2(garmentTotalBig))
  const decorationTotal = toNumber(round2(decorationTotalBig))
  const quoteSetupFee = calculateQuoteSetupFee(quote.lineItems)
  const setupFeesTotal = toNumber(money(lineItemSetupFeesBig).plus(quoteSetupFee))
  const subtotal = toNumber(money(garmentTotal).plus(decorationTotal).plus(setupFeesTotal))
  const effectiveTotal = quote.total

  const garmentColors = useMemo(
    () =>
      quote.lineItems
        .map((item) => allColors.find((c) => c.id === item.colorId)?.hex)
        .filter(Boolean) as string[],
    [quote.lineItems, allColors]
  )

  return (
    <div className={cn('space-y-6', mode === 'detail' && 'pb-20 md:pb-0')}>
      {garmentColors.length > 0 && <MockupFilterProvider colors={garmentColors} />}
      {/* Header — sticky at top */}
      <div className="sticky top-0 z-10 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{quote.quoteNumber}</h1>
            <StatusBadge status={quote.status} />
          </div>
          {mode === 'detail' ? (
            <QuoteActions quote={quote} customer={customer} />
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground leading-none">Total</p>
                <p className="text-base font-semibold text-foreground leading-tight">
                  {formatCurrency(effectiveTotal)}
                </p>
              </div>
              <Button size="sm" onClick={onSend} className="bg-action text-primary-foreground">
                <Send size={14} />
                Send Quote
              </Button>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Created {formatDate(quote.createdAt)}
          {quote.updatedAt && <span> · Updated {formatDate(quote.updatedAt)}</span>}
          {quote.sentAt && <span> · Sent {formatDate(quote.sentAt)}</span>}
        </p>

        {customer && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <Link
                href={`/customers/${customer.id}`}
                className="text-sm font-medium text-foreground hover:text-action transition-colors"
              >
                {customer.name} — {customer.company}
              </Link>
              <LifecycleBadge stage={customer.lifecycleStage} className="text-xs" />
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.email} · {customer.phone}
            </p>
          </>
        )}
      </div>

      {/* Review mockup preview — lg card shown only in slide-out review mode */}
      {mode === 'review' &&
        (() => {
          const firstItem = quote.lineItems[0]
          const firstGarment = firstItem
            ? garmentCatalog.find((g) => g.id === firstItem.garmentId)
            : undefined
          const firstColor = firstItem
            ? allColors.find((c) => c.id === firstItem.colorId)
            : undefined
          const firstDetail = firstItem?.printLocationDetails[0]
          const firstArtwork = firstDetail?.artworkId
            ? artworkMap.get(firstDetail.artworkId)
            : undefined
          if (!firstGarment || !firstColor) return null
          return (
            <GarmentMockupCard
              size="lg"
              garmentCategory={firstGarment.baseCategory}
              colorHex={firstColor.hex}
              artworkPlacements={
                firstArtwork && firstDetail
                  ? [
                      {
                        artworkUrl: firstArtwork.thumbnailUrl,
                        position: normalizePosition(firstDetail.location),
                      },
                    ]
                  : []
              }
            />
          )
        })()}

      {/* Line Items */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">Line Items</h3>
        {quote.lineItems.map((item, index) => {
          const garment = garmentCatalog.find((g) => g.id === item.garmentId)
          const color = allColors.find((c) => c.id === item.colorId)
          const totalQty = getTotalQty(item.sizes)
          const serviceType = item.serviceType as keyof typeof DECORATION_COST_PER_COLOR
          const garmentUnitCost = garment?.basePrice ?? 0
          const decorationPerUnit = toNumber(
            item.printLocationDetails.reduce(
              (sum, d) =>
                sum
                  .plus(money(d.colorCount).times(DECORATION_COST_PER_COLOR[serviceType]))
                  .plus(LOCATION_FEE_PER_UNIT[serviceType]),
              money(0)
            )
          )
          const unitCostCombined = toNumber(money(garmentUnitCost).plus(decorationPerUnit))
          const itemSetupFee = calculateLineItemSetupFee(serviceType)

          return (
            <div key={index} className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {garment
                        ? `${garment.brand} ${garment.sku} — ${garment.name}`
                        : 'Unknown Garment'}
                    </p>
                    <Badge
                      variant="ghost"
                      className={cn('text-xs', SERVICE_TYPE_COLORS[item.serviceType])}
                    >
                      {SERVICE_TYPE_LABELS[item.serviceType]}
                    </Badge>
                  </div>
                  {color && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className="inline-block size-3.5 rounded-sm border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm text-foreground">{color.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {item.serviceType === 'screen-print' && customer && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-action"
                      onClick={() => {
                        setPeekLineItem(item)
                        setPeekOpen(true)
                      }}
                      aria-label="View pricing matrix"
                    >
                      <DollarSign className="size-3.5" />
                    </Button>
                  )}
                  <p className="text-right text-sm font-medium text-foreground whitespace-nowrap">
                    {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              </div>

              {/* Sizes */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">Sizes:</span>
                {Object.entries(item.sizes).map(([size, qty]) => (
                  <span key={size} className="text-foreground">
                    {size}({qty})
                  </span>
                ))}
                <span className="text-muted-foreground">= {totalQty} total</span>
              </div>

              {/* Print Locations with per-location decoration fee */}
              <div className="space-y-1">
                {item.printLocationDetails.map((detail, di) => {
                  const artwork = detail.artworkId ? artworkMap.get(detail.artworkId) : undefined
                  const locDecorationPerUnit = toNumber(
                    money(detail.colorCount)
                      .times(DECORATION_COST_PER_COLOR[serviceType])
                      .plus(LOCATION_FEE_PER_UNIT[serviceType])
                  )
                  return (
                    <div key={di} className="flex items-center gap-3 text-sm">
                      {color && (
                        <GarmentMockupModal
                          garmentCategory={garment?.baseCategory ?? 't-shirts'}
                          colorHex={color.hex}
                          artworkPlacements={
                            artwork
                              ? [
                                  {
                                    artworkUrl: artwork.thumbnailUrl,
                                    position: normalizePosition(detail.location),
                                  },
                                ]
                              : []
                          }
                          lockedView={positionToLockedView(normalizePosition(detail.location))}
                        >
                          <GarmentMockupThumbnail
                            garmentCategory={garment?.baseCategory ?? 't-shirts'}
                            colorHex={color.hex}
                            view={
                              positionToLockedView(normalizePosition(detail.location)) ?? 'front'
                            }
                            artworkPlacements={
                              artwork
                                ? [
                                    {
                                      artworkUrl: artwork.thumbnailUrl,
                                      position: normalizePosition(detail.location),
                                    },
                                  ]
                                : []
                            }
                            className="shrink-0"
                          />
                        </GarmentMockupModal>
                      )}
                      <div className="flex-1">
                        <span className="text-foreground">{detail.location}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {detail.colorCount} color{detail.colorCount !== 1 ? 's' : ''}
                        </span>
                        {artwork && (
                          <span className="text-muted-foreground"> · {artwork.name}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        +{formatCurrency(locDecorationPerUnit)}/unit
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Formula with setup fee and info tooltip */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>
                  ({formatCurrency(unitCostCombined)} x {totalQty} qty)
                  {itemSetupFee > 0 && <> + {formatCurrency(itemSetupFee)} setup</>} ={' '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </span>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <span className="cursor-default text-muted-foreground hover:text-foreground transition-colors">
                      <Info size={14} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs">
                    <div className="space-y-1.5 text-xs">
                      <p className="font-medium text-foreground">Price Breakdown</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(garmentUnitCost)} garment +{' '}
                        {formatCurrency(decorationPerUnit)} decoration ={' '}
                        {formatCurrency(unitCostCombined)}/unit
                      </p>
                      <div className="border-t border-border pt-1.5 space-y-0.5">
                        <p className="font-medium text-foreground">Setup Fees</p>
                        <p className="text-muted-foreground">Screen Print: $40 per quote</p>
                        <p className="text-muted-foreground">DTF: $0</p>
                        <p className="text-muted-foreground">Embroidery: $20 per design</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pricing */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h3 className="text-base font-semibold text-foreground">Pricing</h3>
        <div className="space-y-1.5 text-sm">
          {/* Cost breakdown */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Garments</span>
            <span className="text-foreground">{formatCurrency(garmentTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Decoration</span>
            <span className="text-foreground">{formatCurrency(decorationTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Setup Fees</span>
            <span className="text-foreground">{formatCurrency(setupFeesTotal)}</span>
          </div>

          <Separator className="my-2" />

          {/* Subtotal */}
          <div className="flex justify-between font-medium">
            <span className="text-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discounts */}
          {quote.discounts.map((discount, i) => (
            <DiscountRow
              key={i}
              label={discount.label}
              amount={discount.amount}
              type={discount.type}
            />
          ))}

          {/* Shipping */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            {quote.shipping === 0 ? (
              <Badge variant="ghost" className="bg-success/10 text-success text-xs">
                FREE
              </Badge>
            ) : (
              <span className="text-foreground">{formatCurrency(quote.shipping)}</span>
            )}
          </div>

          {/* Tax */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span className="text-foreground">{formatCurrency(quote.tax)}</span>
          </div>

          <Separator className="my-2" />

          {/* Grand Total */}
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Grand Total</span>
            <span className="text-foreground">{formatCurrency(effectiveTotal)}</span>
          </div>

          {/* Savings banner */}
          {totalDiscounts > 0 && (
            <div className="mt-2 rounded-md bg-success/10 px-3 py-2 text-center">
              <span className="text-sm font-medium text-success">
                You save {formatCurrency(totalDiscounts)}!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {(quote.internalNotes || quote.customerNotes) && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Notes</h3>
          {quote.internalNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Internal
              </p>
              <p className="text-sm text-foreground">{quote.internalNotes}</p>
            </div>
          )}
          {quote.customerNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </p>
              <p className="text-sm text-foreground">{quote.customerNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Matrix Peek Sheet */}
      {customer && peekLineItem && (
        <MatrixPeekSheet
          open={peekOpen}
          onOpenChange={setPeekOpen}
          customer={customer}
          lineItem={peekLineItem}
          onOverride={() => {
            toast.success('Override mode enabled for this quote')
          }}
        />
      )}

      {/* Mobile Bottom Action Bar */}
      {mode === 'detail' && (
        <BottomActionBar>
          {isAccepted ? (
            <>
              <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)" asChild>
                <Link href="/jobs/board">
                  <Hammer className="size-4" />
                  View Jobs
                </Link>
              </Button>
              <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)" asChild>
                <Link href={`/invoices/new?quoteId=${quote.id}`}>
                  <Receipt className="size-4" />
                  Create Invoice
                </Link>
              </Button>
            </>
          ) : isDraft ? (
            <>
              <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)" asChild>
                <Link href={`/quotes/${quote.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              {customer ? (
                <Button
                  variant="outline"
                  className="flex-1 min-h-(--mobile-touch-target)"
                  onClick={() => setMobileEmailOpen(true)}
                >
                  <Send className="size-4" />
                  Send
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)" asChild>
                  <Link href={`/quotes/new?duplicate=${quote.id}`}>
                    <Copy className="size-4" />
                    Copy as New
                  </Link>
                </Button>
              )}
            </>
          ) : (
            /* sent / declined / revised / expired — primary action is duplicate */
            <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)" asChild>
              <Link href={`/quotes/new?duplicate=${quote.id}`}>
                <Copy className="size-4" />
                Copy as New
              </Link>
            </Button>
          )}
        </BottomActionBar>
      )}

      {/* Mobile email preview modal (separate from QuoteActions modal) */}
      {mobileEmailOpen && customer && (
        <EmailPreviewModal
          open={mobileEmailOpen}
          onOpenChange={setMobileEmailOpen}
          quote={{
            quoteNumber: quote.quoteNumber,
            total: quote.total,
            lineItems: quote.lineItems,
          }}
          customer={{
            name: customer.name,
            email: customer.email,
            company: customer.company,
          }}
        />
      )}
    </div>
  )
}
