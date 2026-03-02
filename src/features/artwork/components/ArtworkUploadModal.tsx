'use client'

import * as React from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'

import { cn } from '@shared/lib/cn'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@shared/ui/primitives/dialog'
import { useFileUpload, type UseFileUploadProps, type ConfirmResult } from '../hooks/useFileUpload'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ArtworkUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  onSuccess: (artwork: ConfirmResult) => void
  onInitiate: UseFileUploadProps['onInitiate']
  onConfirm: UseFileUploadProps['onConfirm']
}

// ---------------------------------------------------------------------------
// Accepted file types hint
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES_LABEL = 'PNG, JPEG, WebP, SVG, TIFF, GIF, PDF — max 50 MB'
const ACCEPTED_TYPES_ATTR = '.png,.jpg,.jpeg,.webp,.svg,.tif,.tiff,.gif,.pdf'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArtworkUploadModal({
  open,
  onOpenChange,
  shopId,
  onSuccess,
  onInitiate,
  onConfirm,
}: ArtworkUploadModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const { state, progress, error, artwork, upload } = useFileUpload({
    shopId,
    onInitiate,
    onConfirm,
  })

  // When upload completes successfully, call onSuccess and close modal after a
  // brief delay so the user can see the success state.
  React.useEffect(() => {
    if (state === 'done' && artwork !== null) {
      const timer = setTimeout(() => {
        onSuccess(artwork)
        onOpenChange(false)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [state, artwork, onSuccess, onOpenChange])

  // ---------------------------------------------------------------------------
  // Drag-and-drop handlers
  // ---------------------------------------------------------------------------

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      void upload(file)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      void upload(file)
    }
    // Reset input so the same file can be re-selected after an error
    e.target.value = ''
  }

  function handleDropZoneClick() {
    if (state === 'idle' || state === 'error') {
      fileInputRef.current?.click()
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state flags
  // ---------------------------------------------------------------------------

  const isActive = ['hashing', 'validating', 'uploading', 'confirming'].includes(state)
  const isDone = state === 'done'
  const isError = state === 'error'
  const isUploading = state === 'uploading'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-elevated border-border max-w-md"
        // Prevent closing while upload is in-flight
        onInteractOutside={(e) => {
          if (isActive) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isActive) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Artwork</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Drop a file or click to browse
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload artwork file"
          onClick={handleDropZoneClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleDropZoneClick()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
            isDragging && 'border-action bg-action/5',
            !isDragging && !isDone && !isError && 'border-border hover:border-action/50',
            isDone && 'border-success bg-success/5 cursor-default',
            isError && 'border-error bg-error/5',
            isActive && 'cursor-not-allowed'
          )}
        >
          {/* Success state */}
          {isDone && (
            <>
              <CheckCircle className="text-success" size={24} aria-hidden="true" />
              <p className="text-success text-sm font-medium">Upload complete</p>
            </>
          )}

          {/* Error state */}
          {isError && (
            <>
              <AlertCircle className="text-error" size={24} aria-hidden="true" />
              <p className="text-error text-sm font-medium">{error}</p>
              <p className="text-muted-foreground text-xs">Click to try again</p>
            </>
          )}

          {/* Idle / uploading state */}
          {!isDone && !isError && (
            <>
              <Upload
                className={cn(
                  'size-6 transition-colors',
                  isDragging ? 'text-action' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />

              {/* Status label */}
              {state === 'idle' && (
                <>
                  <p className="text-foreground text-sm font-medium">
                    Drop file here or{' '}
                    <span className="text-action underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-muted-foreground text-xs text-center">
                    {ACCEPTED_TYPES_LABEL}
                  </p>
                </>
              )}

              {state === 'hashing' && (
                <p className="text-muted-foreground text-sm">Computing checksum…</p>
              )}

              {state === 'validating' && (
                <p className="text-muted-foreground text-sm">Validating…</p>
              )}

              {state === 'confirming' && (
                <p className="text-muted-foreground text-sm">Confirming upload…</p>
              )}

              {/* Progress bar — only during XHR upload phase */}
              {isUploading && (
                <div className="w-full space-y-2">
                  <p className="text-muted-foreground text-sm text-center">
                    Uploading… {progress}%
                  </p>
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Upload progress"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
                  >
                    <div
                      className="h-full rounded-full bg-action transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES_ATTR}
          className="sr-only"
          onChange={handleFileInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </DialogContent>
    </Dialog>
  )
}
