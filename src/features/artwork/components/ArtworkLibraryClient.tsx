'use client'

import * as React from 'react'
import NextImage from 'next/image'
import { Image as ImageIcon, UploadCloud } from 'lucide-react'

import { cn } from '@shared/lib/cn'
import { ArtworkUploadModal } from './ArtworkUploadModal'
import {
  initiateArtworkUpload,
  confirmArtworkUpload,
  type ConfirmArtworkUploadResult,
} from '@/app/(dashboard)/artwork/artwork-upload.actions'
import type { ConfirmResult } from '../hooks/useFileUpload'
import type { ArtworkVersion } from '@db/schema/artworks'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ArtworkLibraryClientProps = {
  initialArtworks: ArtworkVersion[]
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type StatusBadgeProps = {
  status: ArtworkVersion['status']
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'ready') {
    return <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs text-success">Ready</span>
  }
  if (status === 'pending') {
    return (
      <span className="rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning">Processing</span>
    )
  }
  if (status === 'error') {
    return <span className="rounded bg-error/10 px-1.5 py-0.5 text-xs text-error">Error</span>
  }
  return (
    <span className="rounded bg-surface px-1.5 py-0.5 text-xs text-muted-foreground">{status}</span>
  )
}

// ---------------------------------------------------------------------------
// Artwork card
// ---------------------------------------------------------------------------

type ArtworkCardProps = {
  artwork: ArtworkVersion
}

function ArtworkCard({ artwork }: ArtworkCardProps) {
  const formattedDate = new Date(artwork.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-elevated p-3">
      {/* Thumbnail */}
      {artwork.thumbUrl ? (
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ aspectRatio: '1 / 1' }}
        >
          <NextImage
            src={artwork.thumbUrl}
            alt={artwork.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-lg bg-surface"
          style={{ aspectRatio: '1 / 1' }}
          aria-hidden="true"
        >
          <ImageIcon className="text-muted-foreground" size={32} />
        </div>
      )}

      {/* Filename */}
      <p className="truncate text-sm font-medium text-foreground" title={artwork.filename}>
        {artwork.filename}
      </p>

      {/* Status + date */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={artwork.status} />
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Adapt ConfirmResult → ArtworkVersion for optimistic update
// ---------------------------------------------------------------------------

function confirmResultToArtworkVersion(
  result: ConfirmArtworkUploadResult,
  shopId: string
): ArtworkVersion {
  return {
    id: result.id,
    shopId,
    originalPath: result.originalPath,
    thumbPath: result.thumbPath,
    previewPath: result.previewPath,
    originalUrl: result.originalUrl,
    thumbUrl: result.thumbUrl,
    previewUrl: result.previewUrl,
    contentHash: result.contentHash,
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    filename: result.filename,
    status: result.status,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SHOP_ID = 'shop_4ink'

export function ArtworkLibraryClient({ initialArtworks }: ArtworkLibraryClientProps) {
  const [artworks, setArtworks] = React.useState<ArtworkVersion[]>(initialArtworks)
  const [open, setOpen] = React.useState(false)

  function handleSuccess(result: ConfirmResult) {
    // The modal's onSuccess receives a ConfirmResult (hook type), but the
    // server action actually returns a full ArtworkVersion. Cast safely via
    // the exported ConfirmArtworkUploadResult alias which IS ArtworkVersion.
    const fullArtwork = confirmResultToArtworkVersion(result as ConfirmArtworkUploadResult, SHOP_ID)
    setArtworks((prev) => [fullArtwork, ...prev])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Artwork Library</h1>
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
      {artworks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-elevated py-20">
          <ImageIcon className="text-muted-foreground" size={40} aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No artwork yet</p>
          <p className="text-xs text-muted-foreground">
            Upload your first artwork file to get started
          </p>
        </div>
      )}

      {/* Grid */}
      {artworks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}

      {/* Upload modal — conditionally rendered to reset state on close */}
      {open && (
        <ArtworkUploadModal
          open={open}
          onOpenChange={setOpen}
          shopId={SHOP_ID}
          onSuccess={handleSuccess}
          onInitiate={initiateArtworkUpload}
          onConfirm={confirmArtworkUpload}
        />
      )}
    </div>
  )
}
