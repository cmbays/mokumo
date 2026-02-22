'use client'

import { useState, useMemo, useCallback, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { MockupFilterProvider } from '@features/quotes/components/mockup'
import { Button } from '@shared/ui/primitives/button'
import { CapacitySummaryBar } from '../../_components/CapacitySummaryBar'
import {
  BoardFilterBar,
  useFiltersFromURL,
  useCardTypeFromURL,
} from '../../_components/BoardFilterBar'
import { BoardSection } from '../../_components/BoardSection'
import { JobBoardCard } from '../../_components/JobBoardCard'
import { QuoteBoardCard } from '../../_components/QuoteBoardCard'
import { ScratchNoteCard } from '../../_components/ScratchNoteCard'
import { DraggableCard } from '../../_components/DraggableCard'
import { BlockReasonDialog } from '../../_components/BlockReasonDialog'
import { MobileKanbanBoard } from '../../_components/MobileKanbanBoard'
import { ScratchNoteCapture } from '../../_components/ScratchNoteCapture'
import { LANE_LABELS } from '@domain/constants'
import { computeCapacitySummary, computeFilteredCards } from '@domain/rules/job.rules'
import { projectJobToCard, projectScratchNoteToCard } from '@domain/rules/board.rules'
import {
  parseDragId,
  parseDroppableId,
  getCardLabel,
  getCardSortDate,
} from '@domain/rules/board.rules'
import type {
  BoardCard,
  JobCard,
  QuoteCard,
  ScratchNoteCard as ScratchNoteCardType,
} from '@domain/entities/board-card'
import type { Lane, Job } from '@domain/entities/job'
import type { ScratchNote } from '@domain/entities/scratch-note'
import { getCustomersMutable } from '@infra/repositories/customers'
import { getInvoicesMutable } from '@infra/repositories/invoices'
import { getGarmentCatalogMutable } from '@infra/repositories/garments-phase1'
import { getColorsMutable } from '@infra/repositories/colors'
import { getArtworksMutable } from '@infra/repositories/artworks'

// ---------------------------------------------------------------------------
// Drag overlay wrapper — module-scoped to keep stable reference across renders
// ---------------------------------------------------------------------------

function DragOverlayWrapper({
  children,
  prefersReducedMotion,
}: {
  children: React.ReactNode
  prefersReducedMotion: boolean | null
}) {
  return (
    <div
      className="w-50 scale-[1.03] rotate-2 opacity-90 shadow-xl transition-transform duration-200"
      style={
        prefersReducedMotion
          ? undefined
          : { transitionTimingFunction: 'var(--transition-timing-spring)' }
      }
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ProductionBoardProps = {
  initialJobs: Job[]
  initialQuoteCards: QuoteCard[]
  initialScratchNotes: ScratchNote[]
}

// ---------------------------------------------------------------------------
// Inner board (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

const springDropAnimation: DropAnimation = {
  sideEffects({ active, dragOverlay }) {
    active.node.style.opacity = '0'
    dragOverlay.node.animate(
      [
        { transform: 'scale(1.03) rotate(2deg)', opacity: 0.9 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      ],
      {
        duration: 250,
        easing: SPRING_EASING,
      }
    )
    return () => {
      active.node.style.opacity = ''
    }
  },
  duration: 250,
  easing: SPRING_EASING,
  keyframes({ transform }) {
    return [
      { ...transform.initial },
      {
        ...transform.final,
        scale: '1',
        rotate: '0deg',
      },
    ]
  },
}

function ProductionBoardInner({
  initialJobs,
  initialQuoteCards,
  initialScratchNotes,
}: ProductionBoardProps) {
  const filters = useFiltersFromURL()
  const cardType = useCardTypeFromURL()
  const prefersReducedMotion = useReducedMotion()

  // ---- Sticky toolbar height → CSS var for lane headers ----
  const toolbarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = toolbarRef.current
    if (!el) return
    const sync = () => {
      el.parentElement?.style.setProperty('--board-toolbar-h', `${el.offsetHeight}px`)
    }
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- Mutable state (Phase 1 client-side only) ----
  const [jobCards, setJobCards] = useState<JobCard[]>(() => {
    const customers = getCustomersMutable()
    const invoices = getInvoicesMutable()
    const garmentCatalog = getGarmentCatalogMutable()
    const colors = getColorsMutable()
    const artworks = getArtworksMutable()
    return initialJobs
      .filter((j) => !j.isArchived)
      .map((job) => projectJobToCard(job, customers, invoices, garmentCatalog, colors, artworks))
  })
  const [quoteCardState, setQuoteCardState] = useState<QuoteCard[]>(() => [...initialQuoteCards])
  const [scratchNoteCards, setScratchNoteCards] = useState<ScratchNoteCardType[]>(() =>
    initialScratchNotes.filter((n) => !n.isArchived).map(projectScratchNoteToCard)
  )

  // ---- DnD state ----
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null)
  const [dropAnnouncement, setDropAnnouncement] = useState('')

  // ---- Block dialog state ----
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean
    card: BoardCard | null
  }>({ open: false, card: null })

  // ---- Scratch note capture state ----
  const [showScratchCapture, setShowScratchCapture] = useState(false)

  // ---- Sensors ----
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 3 },
  })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, keyboardSensor)

  // ---- Combine quote-row cards ----
  const quoteRowCards: BoardCard[] = useMemo(
    () => [...quoteCardState, ...scratchNoteCards],
    [quoteCardState, scratchNoteCards]
  )

  // ---- Apply filters ----
  const filteredJobCards = useMemo(
    () => computeFilteredCards(jobCards, filters),
    [jobCards, filters]
  )
  const filteredQuoteCards = useMemo(
    () => computeFilteredCards(quoteRowCards, filters),
    [quoteRowCards, filters]
  )

  // ---- Merge + filter by card type + sort by due date ----
  const visibleCards: BoardCard[] = useMemo(() => {
    let cards: BoardCard[]
    if (cardType === 'jobs') cards = [...filteredJobCards]
    else if (cardType === 'quotes') cards = [...filteredQuoteCards]
    else cards = [...filteredJobCards, ...filteredQuoteCards]
    return cards.sort((a, b) => getCardSortDate(a).localeCompare(getCardSortDate(b)))
  }, [cardType, filteredJobCards, filteredQuoteCards])

  // ---- Capacity summary ----
  const allFilteredCards: BoardCard[] = useMemo(
    () => [...filteredJobCards, ...filteredQuoteCards],
    [filteredJobCards, filteredQuoteCards]
  )
  const summary = useMemo(() => computeCapacitySummary(allFilteredCards), [allFilteredCards])

  // ---- Garment colors for mockup filter ----
  const garmentColors = useMemo(() => {
    return jobCards.map((card) => card.garmentColorHex).filter(Boolean) as string[]
  }, [jobCards])

  const isEmpty = allFilteredCards.length === 0

  // ---- Find a card by drag ID ----
  const findCard = useCallback(
    (dragId: string): BoardCard | undefined => {
      const parsed = parseDragId(dragId)
      if (!parsed) return undefined
      const { cardType, cardId } = parsed
      if (cardType === 'job') return jobCards.find((c) => c.id === cardId)
      if (cardType === 'quote') return quoteCardState.find((c) => c.quoteId === cardId)
      if (cardType === 'scratch') return scratchNoteCards.find((c) => c.id === cardId)
      return undefined
    },
    [jobCards, quoteCardState, scratchNoteCards]
  )

  // ---- Move card to a new lane in state ----
  const moveCard = useCallback((card: BoardCard, newLane: Lane, blockReason?: string) => {
    switch (card.type) {
      case 'job':
        setJobCards((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? {
                  ...c,
                  lane: newLane,
                  blockReason: newLane === 'blocked' ? blockReason : undefined,
                }
              : c
          )
        )
        break
      case 'quote':
        setQuoteCardState((prev) =>
          prev.map((c) => (c.quoteId === card.quoteId ? { ...c, lane: newLane } : c))
        )
        break
      // scratch_note cards are always in "ready" — they can't be moved
    }
  }, [])

  // ===========================================================================
  // Drag handlers
  // ===========================================================================

  function handleDragStart(event: DragStartEvent) {
    const card = findCard(event.active.id as string)
    if (card) {
      setActiveCard(card)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over || !active) {
      return
    }

    const dragParsed = parseDragId(active.id as string)
    if (!dragParsed) return
    const { cardType: draggedCardType } = dragParsed
    const dropTarget = parseDroppableId(over.id as string)
    if (!dropTarget) return
    const { lane: targetLane } = dropTarget

    // Scratch notes can't be moved
    if (draggedCardType === 'scratch') {
      return
    }

    const card = findCard(active.id as string)
    if (!card || card.lane === targetLane) {
      return
    }

    // If target is blocked → open block reason dialog
    if (targetLane === 'blocked') {
      setBlockDialog({ open: true, card })
      return
    }

    // Direct move
    moveCard(card, targetLane)
    setDropAnnouncement(`${getCardLabel(card)} moved to ${LANE_LABELS[targetLane]}`)
  }

  function handleDragCancel() {
    setActiveCard(null)
  }

  // ===========================================================================
  // Block dialog handlers
  // ===========================================================================

  function confirmBlock(reason: string) {
    if (blockDialog.card) {
      moveCard(blockDialog.card, 'blocked', reason)
    }
    setBlockDialog({ open: false, card: null })
  }

  function cancelBlock() {
    setBlockDialog({ open: false, card: null })
  }

  // ===========================================================================
  // Scratch note CRUD
  // ===========================================================================

  function createScratchNote(content: string) {
    const newNote: ScratchNoteCardType = {
      type: 'scratch_note',
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      isArchived: false,
      lane: 'ready',
    }
    setScratchNoteCards((prev) => [newNote, ...prev])
    setShowScratchCapture(false)
  }

  const dismissScratchNote = useCallback((noteId: string) => {
    setScratchNoteCards((prev) => prev.filter((n) => n.id !== noteId))
  }, [])

  const editScratchNote = useCallback((noteId: string, newContent: string) => {
    setScratchNoteCards((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content: newContent } : n))
    )
  }, [])

  // ===========================================================================
  // Card renderer (dispatches by type, wraps in DraggableCard)
  // ===========================================================================

  const renderCard = useCallback(
    (card: BoardCard): React.ReactNode => {
      switch (card.type) {
        case 'job': {
          const dragId = `job:${card.id}`
          return (
            <DraggableCard
              dragId={dragId}
              data={{ cardType: 'job', cardId: card.id, section: 'jobs' }}
            >
              <JobBoardCard card={card} />
            </DraggableCard>
          )
        }
        case 'quote': {
          const dragId = `quote:${card.quoteId}`
          return (
            <DraggableCard
              dragId={dragId}
              data={{ cardType: 'quote', cardId: card.quoteId, section: 'quotes' }}
            >
              <QuoteBoardCard card={card} />
            </DraggableCard>
          )
        }
        case 'scratch_note':
          return (
            <ScratchNoteCard
              card={card}
              onDismiss={() => dismissScratchNote(card.id)}
              onEdit={editScratchNote}
            />
          )
      }
    },
    [dismissScratchNote, editScratchNote]
  )

  // ===========================================================================
  // Drag overlay renderer
  // ===========================================================================

  function renderDragOverlay() {
    if (!activeCard) return null
    switch (activeCard.type) {
      case 'job':
        return (
          <DragOverlayWrapper prefersReducedMotion={prefersReducedMotion}>
            <JobBoardCard card={activeCard} />
          </DragOverlayWrapper>
        )
      case 'quote':
        return (
          <DragOverlayWrapper prefersReducedMotion={prefersReducedMotion}>
            <QuoteBoardCard card={activeCard} />
          </DragOverlayWrapper>
        )
      case 'scratch_note':
        return (
          <DragOverlayWrapper prefersReducedMotion={prefersReducedMotion}>
            <ScratchNoteCard card={activeCard} />
          </DragOverlayWrapper>
        )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <MockupFilterProvider colors={garmentColors} />
      {/* Desktop board — hidden on mobile */}
      <div className="hidden md:block">
        {/* Accessibility: DnD instructions (visually hidden) */}
        <div id="dnd-instructions" className="sr-only">
          Press space bar to start dragging a card. While dragging, use arrow keys to move. Press
          space bar again to drop the card in the current lane, or press escape to cancel.
        </div>
        {/* Accessibility: drop announcements */}
        <div aria-live="polite" className="sr-only">
          {dropAnnouncement}
        </div>

        {/* Sticky toolbar: capacity summary + filter bar */}
        <div ref={toolbarRef} className="sticky top-0 z-10 bg-background pb-3">
          <CapacitySummaryBar summary={summary} />
          <div className="mt-3">
            <BoardFilterBar />
          </div>
        </div>

        {/* Board content */}
        <div className="mt-1">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16 text-center">
              <p className="text-sm text-muted-foreground">No cards match the current filters.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting or clearing your filters.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <BoardSection
                label={
                  cardType === 'jobs' ? 'Jobs' : cardType === 'quotes' ? 'Quotes' : 'All Cards'
                }
                section="combined"
                cards={visibleCards}
                renderCard={renderCard}
                onAddScratchNote={
                  cardType !== 'jobs' ? () => setShowScratchCapture(true) : undefined
                }
                readyLaneFooter={
                  showScratchCapture ? (
                    <ScratchNoteCapture
                      onSubmit={createScratchNote}
                      onCancel={() => setShowScratchCapture(false)}
                    />
                  ) : undefined
                }
              />

              <DragOverlay dropAnimation={prefersReducedMotion ? undefined : springDropAnimation}>
                {renderDragOverlay()}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Mobile board — uses same state as desktop */}
      <MobileKanbanBoard
        jobCards={jobCards}
        quoteCards={quoteCardState}
        scratchNotes={scratchNoteCards}
        onMoveCard={moveCard}
        onAddScratchNote={() => setShowScratchCapture(true)}
      />

      {/* Block Reason Dialog — shared between desktop and mobile */}
      {blockDialog.card && (
        <BlockReasonDialog
          open={blockDialog.open}
          onOpenChange={(open) => {
            if (!open) cancelBlock()
          }}
          cardLabel={getCardLabel(blockDialog.card)}
          onConfirm={confirmBlock}
          onCancel={cancelBlock}
        />
      )}

      {/* Scratch Note Capture — mobile FAB triggers this */}
      {showScratchCapture && (
        <div className="md:hidden">
          <ScratchNoteCapture
            onSubmit={createScratchNote}
            onCancel={() => setShowScratchCapture(false)}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outer wrapper — accepts initial data as props, owns header + Suspense boundary
// ---------------------------------------------------------------------------

export function ProductionBoard({
  initialJobs,
  initialQuoteCards,
  initialScratchNotes,
}: ProductionBoardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <h1 className="text-lg font-semibold text-foreground">Production Board</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-md border border-border/50 p-0.5"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="bg-surface text-foreground"
              aria-label="Board view"
              aria-pressed="true"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="List view"
              aria-pressed="false"
              asChild
            >
              <Link href="/jobs">
                <List className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* New Quote */}
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/quotes/new">
              <Plus className="size-3.5" />
              New Quote
            </Link>
          </Button>
        </div>
      </div>

      {/* Board (wrapped in Suspense for useSearchParams) */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading board…
          </div>
        }
      >
        <ProductionBoardInner
          initialJobs={initialJobs}
          initialQuoteCards={initialQuoteCards}
          initialScratchNotes={initialScratchNotes}
        />
      </Suspense>
    </div>
  )
}
