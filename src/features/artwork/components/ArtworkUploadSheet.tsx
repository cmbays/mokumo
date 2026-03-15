'use client'

import * as React from 'react'
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

import { cn } from '@shared/lib/cn'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/ui/primitives/sheet'
import { useFileUpload, type UseFileUploadProps, type ConfirmResult } from '../hooks/useFileUpload'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ArtworkUploadSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  onSuccess: (result: ConfirmResult) => void
  /**
   * Creates the artwork_piece + artwork_variant before the file upload starts.
   * Returns { pieceId, variantId } which is threaded into onInitiate.
   * colorCount is optional — blank means Gary will confirm after upload.
   */
  onCreatePieceAndVariant: (
    pieceName: string,
    variantName: string,
    colorCount: string
  ) => Promise<{ variantId: string }>
  onInitiate: UseFileUploadProps['onInitiate']
  onConfirm: UseFileUploadProps['onConfirm']
}

// ---------------------------------------------------------------------------
// Step 1: Metadata form
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared field styles
// ---------------------------------------------------------------------------

const fieldInput = cn(
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground',
  'placeholder:text-muted-foreground/60',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:border-transparent',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors'
)

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Metadata form
// ---------------------------------------------------------------------------

type MetadataFormProps = {
  onSubmit: (pieceName: string, variantName: string, colorCount: string) => void
  isSubmitting: boolean
}

function MetadataForm({ onSubmit, isSubmitting }: MetadataFormProps) {
  const [pieceName, setPieceName] = React.useState('')
  const [variantName, setVariantName] = React.useState('')
  const [colorCount, setColorCount] = React.useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pieceName.trim() || !variantName.trim()) return
    onSubmit(pieceName.trim(), variantName.trim(), colorCount.trim())
  }

  const canSubmit = pieceName.trim().length > 0 && variantName.trim().length > 0 && !isSubmitting

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Artwork Piece */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="piece-name">Artwork Piece</FieldLabel>
        <input
          id="piece-name"
          type="text"
          value={pieceName}
          onChange={(e) => setPieceName(e.target.value)}
          placeholder="e.g. Front Logo"
          disabled={isSubmitting}
          autoFocus
          className={fieldInput}
        />
        <p className="text-xs text-muted-foreground">
          The named location or concept — shared across colorways
        </p>
      </div>

      {/* Design Name */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="variant-name">Design Name</FieldLabel>
        <input
          id="variant-name"
          type="text"
          value={variantName}
          onChange={(e) => setVariantName(e.target.value)}
          placeholder="e.g. Navy on White"
          disabled={isSubmitting}
          className={fieldInput}
        />
        <p className="text-xs text-muted-foreground">
          The specific colorway or treatment for this file
        </p>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="color-count">Colors</FieldLabel>
        <input
          id="color-count"
          type="number"
          min="1"
          max="16"
          value={colorCount}
          onChange={(e) => setColorCount(e.target.value)}
          placeholder="e.g. 3"
          disabled={isSubmitting}
          className={fieldInput}
        />
        <p className="text-xs text-muted-foreground">
          Ink color count — affects pricing. Leave blank to confirm after upload.
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          'mt-1 inline-flex min-h-(--mobile-touch-target) items-center justify-center gap-2 md:min-h-0',
          'rounded-lg bg-action px-4 py-2.5 text-sm font-medium text-white dark:text-black',
          'shadow-[4px_4px_0px_rgba(0,0,0,0.4)]',
          'transition-all hover:bg-action/90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
        )}
      >
        {isSubmitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Creating…' : 'Continue to File Upload'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Step 2: File upload zone
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES_LABEL = 'PNG, JPEG, WebP, SVG, TIFF, GIF, PDF — max 50 MB'
const ACCEPTED_TYPES_ATTR = '.png,.jpg,.jpeg,.webp,.svg,.tif,.tiff,.gif,.pdf'

type FileUploadZoneProps = {
  shopId: string
  variantId: string
  onSuccess: (result: ConfirmResult) => void
  onInitiate: UseFileUploadProps['onInitiate']
  onConfirm: UseFileUploadProps['onConfirm']
}

function FileUploadZone({
  shopId,
  variantId,
  onSuccess,
  onInitiate,
  onConfirm,
}: FileUploadZoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  // Wrap onInitiate to inject variantId into every upload
  const wrappedInitiate: UseFileUploadProps['onInitiate'] = React.useCallback(
    (params) => onInitiate({ ...params, variantId }),
    [onInitiate, variantId]
  )

  const { state, progress, error, artwork, upload } = useFileUpload({
    shopId,
    onInitiate: wrappedInitiate,
    onConfirm,
  })

  React.useEffect(() => {
    if (state === 'done' && artwork !== null) {
      const timer = setTimeout(() => {
        onSuccess(artwork)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state, artwork, onSuccess])

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
    if (file) void upload(file)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = ''
  }

  function handleZoneClick() {
    if (state === 'idle' || state === 'error') {
      fileInputRef.current?.click()
    }
  }

  const isActive = ['hashing', 'validating', 'uploading', 'confirming'].includes(state)
  const isDone = state === 'done'
  const isError = state === 'error'
  const isUploading = state === 'uploading'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">File</p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload artwork file"
        onClick={handleZoneClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleZoneClick()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
          isDragging && 'border-action bg-action/5',
          !isDragging && !isDone && !isError && 'border-border hover:border-action/50',
          isDone && 'border-success bg-success/5 cursor-default',
          isError && 'border-error bg-error/5',
          isActive && 'cursor-not-allowed'
        )}
      >
        {isDone && (
          <>
            <CheckCircle className="text-success" size={24} aria-hidden="true" />
            <p className="text-success text-sm font-medium">Upload complete</p>
          </>
        )}

        {isError && (
          <>
            <AlertCircle className="text-error" size={24} aria-hidden="true" />
            <p className="text-error text-sm font-medium">{error}</p>
            <p className="text-muted-foreground text-xs">Click to try again</p>
          </>
        )}

        {!isDone && !isError && (
          <>
            <Upload
              className={cn(
                'size-6 transition-colors',
                isDragging ? 'text-action' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            />

            {state === 'idle' && (
              <>
                <p className="text-foreground text-sm font-medium">
                  Drop file here or{' '}
                  <span className="text-action underline underline-offset-2">browse</span>
                </p>
                <p className="text-muted-foreground text-xs text-center">{ACCEPTED_TYPES_LABEL}</p>
              </>
            )}

            {state === 'hashing' && (
              <p className="text-muted-foreground text-sm">Computing checksum…</p>
            )}
            {state === 'validating' && <p className="text-muted-foreground text-sm">Validating…</p>}
            {state === 'confirming' && (
              <p className="text-muted-foreground text-sm">Confirming upload…</p>
            )}

            {isUploading && (
              <div className="w-full space-y-2">
                <p className="text-muted-foreground text-sm text-center">Uploading… {progress}%</p>
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

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES_ATTR}
        className="sr-only"
        onChange={handleFileInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type SheetStep = 'metadata' | 'upload'

export function ArtworkUploadSheet({
  open,
  onOpenChange,
  shopId,
  onSuccess,
  onCreatePieceAndVariant,
  onInitiate,
  onConfirm,
}: ArtworkUploadSheetProps) {
  const [step, setStep] = React.useState<SheetStep>('metadata')
  const [isCreating, setIsCreating] = React.useState(false)
  const [variantId, setVariantId] = React.useState<string | null>(null)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // Reset state when sheet closes
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Brief delay to let the close animation finish before resetting
      setTimeout(() => {
        setStep('metadata')
        setVariantId(null)
        setCreateError(null)
        setIsCreating(false)
      }, 300)
    }
    onOpenChange(nextOpen)
  }

  async function handleMetadataSubmit(
    pieceName: string,
    variantNameValue: string,
    colorCount: string
  ) {
    setIsCreating(true)
    setCreateError(null)
    try {
      const result = await onCreatePieceAndVariant(pieceName, variantNameValue, colorCount)
      setVariantId(result.variantId)
      setStep('upload')
    } catch {
      setCreateError('Failed to create artwork piece. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function handleUploadSuccess(result: ConfirmResult) {
    onSuccess(result)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-elevated border-border flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="text-foreground">Upload Artwork</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {step === 'metadata'
              ? 'Name the piece and design before uploading the file'
              : 'Drop or select the artwork file'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'metadata' && (
            <>
              <MetadataForm onSubmit={handleMetadataSubmit} isSubmitting={isCreating} />
              {createError && <p className="mt-3 text-xs text-error">{createError}</p>}
            </>
          )}

          {step === 'upload' && variantId && (
            <FileUploadZone
              shopId={shopId}
              variantId={variantId}
              onSuccess={handleUploadSuccess}
              onInitiate={onInitiate}
              onConfirm={onConfirm}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
