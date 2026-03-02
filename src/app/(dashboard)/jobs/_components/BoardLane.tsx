'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { LANE_LABELS, LANE_COLORS } from '@domain/constants'
import type { Lane } from '@domain/entities/job'
import type { BoardCard } from '@domain/entities/board-card'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type BoardLaneProps = {
  lane: Lane
  section: 'quotes' | 'jobs' | 'combined'
  cards: BoardCard[]
  renderCard: (card: BoardCard) => React.ReactNode
  onAddScratchNote?: () => void
  /** Extra element rendered after cards (e.g. ScratchNoteCapture input) */
  footer?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardLane({
  lane,
  section,
  cards,
  renderCard,
  onAddScratchNote,
  footer,
}: BoardLaneProps) {
  const isDone = lane === 'done'
  const [collapsed, setCollapsed] = useState(isDone)
  const count = cards.length

  // Droppable — unique ID per section + lane
  const droppableId = `${section}:${lane}`
  const { isOver, setNodeRef } = useDroppable({ id: droppableId })

  // Show + button for scratch note capture in Quotes Ready lane
  const showAddButton = section === 'quotes' && lane === 'ready' && onAddScratchNote

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[200px] flex-1 flex-col rounded-lg',
        'bg-background border border-border/50',
        'transition-all duration-200',
        isOver && 'border-action bg-action/5 motion-safe:animate-lane-glow'
      )}
    >
      {/* Lane header — sticky below the board toolbar */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2',
          'sticky top-[var(--board-toolbar-h,6rem)] z-10',
          'rounded-t-lg border-b border-border/50 bg-background',
          'transition-colors',
          isOver && 'border-b-action/40'
        )}
        aria-label={`${LANE_LABELS[lane]} lane, ${count} card${count !== 1 ? 's' : ''}`}
      >
        {/* Label + count — clickable only for Done lane */}
        {isDone ? (
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              'flex flex-1 items-center justify-between gap-2',
              'hover:bg-surface/50 -m-1 rounded-md p-1 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-expanded={!collapsed}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn('text-xs font-semibold uppercase tracking-wider', LANE_COLORS[lane])}
              >
                {LANE_LABELS[lane]}
              </span>
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {count}
              </span>
            </div>
            {collapsed ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={cn('text-xs font-semibold uppercase tracking-wider', LANE_COLORS[lane])}
            >
              {LANE_LABELS[lane]}
            </span>
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {count}
            </span>
          </div>
        )}

        {/* Add scratch note button (separate from any button ancestor) */}
        {showAddButton && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-action"
            onClick={onAddScratchNote}
            aria-label="Add scratch note"
          >
            <Plus className="size-3" />
          </Button>
        )}
      </div>

      {/* Card list */}
      {!collapsed && (
        <div className="flex flex-col gap-2 p-2">
          {count === 0 && !footer ? (
            <div className="flex items-center justify-center rounded-md border border-dashed border-border/50 py-8 text-xs text-muted-foreground">
              No cards
            </div>
          ) : (
            <>
              {cards.map((card) => (
                <div key={card.type === 'quote' ? card.quoteId : card.id}>{renderCard(card)}</div>
              ))}
              {footer}
            </>
          )}
        </div>
      )}

      {/* Collapsed Done lane summary */}
      {collapsed && count > 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {count} completed card{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
