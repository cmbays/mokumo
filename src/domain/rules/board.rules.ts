import { laneEnum } from '@domain/entities/job'
import type { Lane } from '@domain/entities/job'
import type { BoardCard } from '@domain/entities/board-card'
import type { JobCard, ScratchNoteCard } from '@domain/entities/board-card'
import type { Job } from '@domain/entities/job'
import type { Customer } from '@domain/entities/customer'
import type { Invoice } from '@domain/entities/invoice'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { Artwork } from '@domain/entities/artwork'
import { computeTaskProgress } from '@domain/rules/job.rules'

/** Drag IDs are "job:{uuid}", "quote:{quoteId}", "scratch:{uuid}" */
export function parseDragId(dragId: string): { cardType: string; cardId: string } | null {
  const idx = dragId.indexOf(':')
  if (idx === -1) return null
  return { cardType: dragId.slice(0, idx), cardId: dragId.slice(idx + 1) }
}

/** Droppable IDs are "{section}:{lane}" */
export function parseDroppableId(droppableId: string): { section: string; lane: Lane } | null {
  const idx = droppableId.indexOf(':')
  if (idx === -1) return null
  const parsed = laneEnum.safeParse(droppableId.slice(idx + 1))
  if (!parsed.success) return null
  return {
    section: droppableId.slice(0, idx),
    lane: parsed.data,
  }
}

/** Map card type to section for same-row constraint */
export function cardTypeToSection(cardType: string): string {
  if (cardType === 'job') return 'jobs'
  return 'quotes' // quote and scratch are in quotes section
}

/** Get display label for a card (used in dialogs) */
export function getCardLabel(card: BoardCard): string {
  switch (card.type) {
    case 'job':
      return `${card.jobNumber}: ${card.customerName}`
    case 'quote':
      return `Quote: ${card.customerName}`
    case 'scratch_note':
      return `Note: ${card.content.slice(0, 40)}`
  }
}

/** Get due date for sorting (scratch notes have no due date → sort to top) */
export function getCardSortDate(card: BoardCard): string {
  if (card.type === 'scratch_note') return '0000-00-00' // sort to top
  if (card.type === 'job') return card.dueDate
  return card.dueDate ?? '9999-99-99' // quotes without due date sort to bottom
}

// ---------------------------------------------------------------------------
// Projection: Job → JobCard view model
// ---------------------------------------------------------------------------

export function projectJobToCard(
  job: Job,
  customers: Customer[],
  invoices: Invoice[],
  garmentCatalog: GarmentCatalog[],
  artworks: Artwork[]
): JobCard {
  const customer = customers.find((c) => c.id === job.customerId)
  const progress = computeTaskProgress(job.tasks)
  const invoice = job.invoiceId ? invoices.find((inv) => inv.id === job.invoiceId) : undefined

  return {
    type: 'job',
    id: job.id,
    jobNumber: job.jobNumber,
    title: job.title,
    customerId: job.customerId,
    customerName: customer?.company ?? 'Unknown',
    lane: job.lane,
    serviceType: job.serviceType,
    quantity: job.quantity,
    locationCount: job.complexity.locationCount,
    colorCount: job.printLocations.reduce((sum, loc) => sum + loc.colorCount, 0),
    startDate: job.startDate,
    dueDate: job.dueDate,
    riskLevel: job.riskLevel,
    priority: job.priority,
    taskProgress: { completed: progress.completed, total: progress.total },
    tasks: [...job.tasks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => ({ label: t.label, isCompleted: t.isCompleted })),
    assigneeInitials: job.assigneeInitials,
    sourceQuoteId: job.sourceQuoteId,
    invoiceId: job.invoiceId,
    invoiceStatus: invoice?.status,
    blockReason: job.blockReason,
    orderTotal: job.orderTotal,
    garmentCategory: (() => {
      const garmentId = job.garmentDetails[0]?.garmentId
      const garment = garmentCatalog.find((g) => g.id === garmentId)
      return garment?.baseCategory
    })(),
    primaryArtworkUrl: (() => {
      const artworkId = job.artworkIds?.[0]
      const artwork = artworks.find((a) => a.id === artworkId)
      return artwork?.thumbnailUrl
    })(),
  }
}

// ---------------------------------------------------------------------------
// Projection: ScratchNote → ScratchNoteCard view model
// ---------------------------------------------------------------------------

export function projectScratchNoteToCard(note: {
  id: string
  content: string
  createdAt: string
  isArchived: boolean
}): ScratchNoteCard {
  return {
    type: 'scratch_note',
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    isArchived: note.isArchived,
    lane: 'ready',
  }
}
