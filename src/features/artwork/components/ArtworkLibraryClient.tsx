'use client'

import * as React from 'react'
import { Image as ImageIcon, UploadCloud, Layers } from 'lucide-react'

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
// Internal status badge (shown when piece has variant data in future)
// ---------------------------------------------------------------------------

type InternalStatusBadgeProps = {
  status: 'received' | 'in_progress' | 'proof_sent' | 'approved'
}

function InternalStatusBadge({ status }: InternalStatusBadgeProps) {
  const map: Record<InternalStatusBadgeProps['status'], { label: string; className: string }> = {
    received: { label: 'Received', className: 'bg-surface text-muted-foreground' },
    in_progress: { label: 'In Progress', className: 'bg-warning/10 text-warning' },
    proof_sent: { label: 'Proof Sent', className: 'bg-action/10 text-action' },
    approved: { label: 'Approved', className: 'bg-success/10 text-success' },
  }
  const { label, className } = map[status]
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-xs', className)}>{label}</span>
  )
}

// ---------------------------------------------------------------------------
// Piece card
// ---------------------------------------------------------------------------

type PieceCardProps = {
  piece: ArtworkPiece
}

function PieceCard({ piece }: PieceCardProps) {
  const formattedDate = new Date(piece.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-elevated p-3">
      {/* Thumbnail placeholder — will show first variant's preview once versions are linked */}
      <div
        className="flex w-full items-center justify-center rounded-lg bg-surface"
        style={{ aspectRatio: '1 / 1' }}
        aria-hidden="true"
      >
        <ImageIcon className="text-muted-foreground" size={32} />
      </div>

      {/* Piece name */}
      <p className="truncate text-sm font-medium text-foreground" title={piece.name}>
        {piece.name}
      </p>

      {/* Status + date */}
      <div className="flex items-center justify-between gap-2">
        <InternalStatusBadge status="received" />
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
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

  async function handleCreatePieceAndVariant(pieceName: string, variantName: string) {
    const result = await createArtworkPieceAndVariant({
      shopId: SHOP_ID,
      scope: 'shop',
      pieceName,
      variantName,
    })
    return { variantId: result.variantId }
  }

  function handleSuccess(_result: ConfirmResult) {
    // Upload succeeded — refetch or optimistically add. For now we re-fetch by
    // triggering a router refresh. The server component will re-query pieces.
    // TODO: optimistic update once we have the full piece shape from the action.
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold text-foreground">Artwork Library</h1>
          <p className="text-sm text-muted-foreground">
            {pieces.length > 0
              ? `${pieces.length} piece${pieces.length === 1 ? '' : 's'}`
              : 'No artwork yet'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-action px-4 py-2 text-sm font-medium text-black',
            'shadow-[4px_4px_0px_rgba(0,0,0,0.5)]',
            'transition-colors hover:bg-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
          )}
        >
          <UploadCloud size={16} aria-hidden="true" />
          Upload
        </button>
      </div>

      {/* Empty state */}
      {pieces.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-elevated py-20">
          <Layers className="text-muted-foreground" size={40} aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No artwork yet</p>
          <p className="text-xs text-muted-foreground">
            Upload your first artwork file to get started
          </p>
        </div>
      )}

      {/* Piece grid */}
      {pieces.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}

      {/* Upload sheet — conditionally rendered to reset state on close */}
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
