'use client'

import * as React from 'react'
import { Image as ImageIcon, UploadCloud, Layers, Star } from 'lucide-react'

import { cn } from '@shared/lib/cn'
import { ArtworkUploadSheet } from './ArtworkUploadSheet'
import {
  initiateArtworkUpload,
  confirmArtworkUpload,
  createArtworkPieceAndVariant,
} from '@/app/(dashboard)/artwork/artwork-upload.actions'
import type { ConfirmResult } from '../hooks/useFileUpload'
import type { ArtworkPiece } from '@db/schema/artworks'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ArtworkLibraryClientProps = {
  initialPieces: ArtworkPiece[]
}

// ---------------------------------------------------------------------------
// Internal status badge
// ---------------------------------------------------------------------------

type InternalStatus = 'received' | 'in_progress' | 'proof_sent' | 'approved'

type StatusBadgeProps = { status: InternalStatus }

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<InternalStatus, { label: string; className: string }> = {
    received: { label: 'Received', className: 'bg-surface text-muted-foreground' },
    in_progress: { label: 'In Progress', className: 'bg-warning/10 text-warning' },
    proof_sent: { label: 'Proof Sent', className: 'bg-action/10 text-action' },
    approved: { label: 'Approved', className: 'bg-success/10 text-success' },
  }
  const { label, className } = styles[status]
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium leading-none', className)}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Piece card
// ---------------------------------------------------------------------------

type PieceCardProps = { piece: ArtworkPiece }

function PieceCard({ piece }: PieceCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border bg-elevated',
        'cursor-pointer transition-colors hover:border-action/30'
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-full bg-surface" style={{ aspectRatio: '1 / 1' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon
            className="text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/50"
            size={32}
            aria-hidden="true"
          />
        </div>

        {/* Favorite star — top-right */}
        {piece.isFavorite && (
          <div className="absolute right-2 top-2">
            <Star className="fill-warning text-warning" size={14} aria-label="Favorited" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3">
        <p className="truncate text-sm font-semibold text-foreground" title={piece.name}>
          {piece.name}
        </p>

        <div className="flex items-center justify-between gap-2">
          <StatusBadge status="received" />
          <span className="shrink-0 text-[11px] text-muted-foreground">0 designs</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Layers className="text-muted-foreground/40" size={32} aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">No artwork yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Upload a file to create your first piece. Files are stored once and reused across quotes.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SHOP_ID = 'shop_4ink'

export function ArtworkLibraryClient({ initialPieces }: ArtworkLibraryClientProps) {
  const [pieces, setPieces] = React.useState<ArtworkPiece[]>(initialPieces)
  const [open, setOpen] = React.useState(false)

  async function handleCreatePieceAndVariant(
    pieceName: string,
    variantName: string,
    colorCount: string
  ) {
    const parsed = colorCount ? parseInt(colorCount, 10) : undefined
    const result = await createArtworkPieceAndVariant({
      shopId: SHOP_ID,
      scope: 'shop',
      pieceName,
      variantName,
      colorCount: parsed && !isNaN(parsed) ? parsed : undefined,
    })
    return { variantId: result.variantId }
  }

  function handleSuccess(_result: ConfirmResult) {
    // Reload to pick up the new piece from the server component query.
    // Optimistic update deferred until we have a full piece shape returned from the action.
    window.location.reload()
  }

  const pieceCount = pieces.length

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Artwork Library</h1>
          <p className="text-sm text-muted-foreground">
            {pieceCount > 0
              ? `${pieceCount} piece${pieceCount === 1 ? '' : 's'} · Shop library`
              : 'Shop library'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            // Mobile: full-width touch target; desktop: auto-width
            'flex w-full items-center justify-center gap-2 md:w-auto',
            'min-h-(--mobile-touch-target) md:min-h-0',
            'rounded-lg bg-action px-4 py-2 text-sm font-medium text-black',
            'shadow-[4px_4px_0px_rgba(0,0,0,0.5)]',
            'transition-all hover:bg-action/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
          )}
        >
          <UploadCloud size={16} aria-hidden="true" />
          Upload Artwork
        </button>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {pieces.length === 0 && <EmptyState />}

      {/* ── Piece grid ──────────────────────────────────────────────────────── */}
      {pieces.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}

      {/* ── Upload sheet ────────────────────────────────────────────────────── */}
      {open && (
        <ArtworkUploadSheet
          open={open}
          onOpenChange={setOpen}
          shopId={SHOP_ID}
          onSuccess={handleSuccess}
          onCreatePieceAndVariant={handleCreatePieceAndVariant}
          onInitiate={initiateArtworkUpload}
          onConfirm={confirmArtworkUpload}
        />
      )}
    </div>
  )
}
