'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRightLeft, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@shared/ui/primitives/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/primitives/tabs'
import { BottomActionBar } from '@shared/ui/layouts/bottom-action-bar'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'

import {
  GarmentMockupCard,
  GarmentMockupModal,
} from '@features/quotes/components/mockup'
import type { ArtworkPlacement } from '@features/quotes/components/mockup'

import { JobHeader } from '../../_components/JobHeader'
import { QuickActionsBar } from '../../_components/QuickActionsBar'
import { TaskChecklist } from '../../_components/TaskChecklist'
import { JobDetailsSection } from '../../_components/JobDetailsSection'
import { NotesFeed } from '../../_components/NotesFeed'
import { LinkedEntitiesSection } from '../../_components/LinkedEntitiesSection'
import { BlockReasonBanner } from '../../_components/BlockReasonBanner'
import { BlockReasonDialog } from '../../_components/BlockReasonDialog'
import { MoveLaneDialog } from '../../_components/MoveLaneDialog'

import type { Job, Lane, JobNoteType } from '@domain/entities/job'
import type { InvoiceStatus } from '@domain/entities/invoice'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type MockupData = {
  garmentCategory: string
  artworkPlacements: ArtworkPlacement[]
} | null

type JobDetailProps = {
  initialJob: Job
  customerName: string
  quoteTotal: number | undefined
  invoiceStatus: InvoiceStatus | undefined
  mockupData: MockupData
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobDetail({
  initialJob,
  customerName,
  quoteTotal,
  invoiceStatus,
  mockupData,
}: JobDetailProps) {
  const router = useRouter()

  // Mobile tab state
  const [activeTab, setActiveTab] = useState('overview')

  const [job, setJob] = useState<Job>(() => structuredClone(initialJob))

  // Dialog state
  const [moveLaneDialogOpen, setMoveLaneDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  // ===========================================================================
  // State mutations (Phase 1 — client-side only)
  // ===========================================================================

  const toggleTask = useCallback((taskId: string) => {
    setJob((prev) => {
      const now = new Date().toISOString()
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          isCompleted: !t.isCompleted,
          completedAt: !t.isCompleted ? now : undefined,
        }
      })

      const toggledTask = prev.tasks.find((t) => t.id === taskId)
      const wasCompleted = toggledTask?.isCompleted
      const action = wasCompleted ? 'unchecked' : 'completed'
      const taskLabel = toggledTask?.label ?? 'Unknown'

      const systemNote = {
        id: crypto.randomUUID(),
        type: 'system' as const,
        content: `Task "${taskLabel}" ${action}`,
        author: 'System',
        createdAt: now,
      }

      return {
        ...prev,
        tasks: updatedTasks,
        notes: [...prev.notes, systemNote],
        updatedAt: now,
      }
    })
  }, [])

  const addNote = useCallback((type: JobNoteType, content: string) => {
    setJob((prev) => {
      const newNote = {
        id: crypto.randomUUID(),
        type,
        content,
        author: 'Gary',
        createdAt: new Date().toISOString(),
      }
      return {
        ...prev,
        notes: [...prev.notes, newNote],
        updatedAt: new Date().toISOString(),
      }
    })
    toast.success('Note added')
  }, [])

  const addCustomTask = useCallback((label: string, detail?: string) => {
    setJob((prev) => {
      const maxSortOrder = prev.tasks.reduce((max, t) => Math.max(max, t.sortOrder), -1)
      const newTask = {
        id: crypto.randomUUID(),
        label,
        detail,
        isCompleted: false,
        isCanonical: false,
        sortOrder: maxSortOrder + 1,
      }
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
        updatedAt: new Date().toISOString(),
      }
    })
    toast.success('Task added')
  }, [])

  const moveLane = useCallback((targetLane: Lane, blockReason?: string) => {
    setJob((prev) => {
      const now = new Date().toISOString()

      const historyEntry = {
        fromLane: prev.lane,
        toLane: targetLane,
        timestamp: now,
        note: blockReason,
      }

      const systemNote = {
        id: crypto.randomUUID(),
        type: 'system' as const,
        content:
          targetLane === 'blocked'
            ? `Job blocked: ${blockReason}`
            : `Job moved from ${prev.lane} to ${targetLane}`,
        author: 'System',
        createdAt: now,
      }

      return {
        ...prev,
        lane: targetLane,
        blockReason: targetLane === 'blocked' ? blockReason : undefined,
        blockedAt: targetLane === 'blocked' ? now : undefined,
        blockedBy: targetLane === 'blocked' ? 'Gary' : undefined,
        history: [...prev.history, historyEntry],
        notes: [...prev.notes, systemNote],
        updatedAt: now,
        completedAt: targetLane === 'done' ? now : prev.completedAt,
      }
    })
    toast.success(`Job moved to ${targetLane.replace('_', ' ')}`)
  }, [])

  const unblockJob = useCallback(() => {
    setJob((prev) => {
      const now = new Date().toISOString()

      const lastNonBlockedEntry = [...prev.history]
        .reverse()
        .find((entry) => entry.fromLane !== 'blocked')
      const restoreLane: Lane = lastNonBlockedEntry ? lastNonBlockedEntry.fromLane : 'ready'

      const historyEntry = {
        fromLane: 'blocked' as Lane,
        toLane: restoreLane,
        timestamp: now,
        note: 'Unblocked',
      }

      const systemNote = {
        id: crypto.randomUUID(),
        type: 'system' as const,
        content: `Job unblocked — restored to ${restoreLane.replace('_', ' ')}`,
        author: 'System',
        createdAt: now,
      }

      return {
        ...prev,
        lane: restoreLane,
        blockReason: undefined,
        blockedAt: undefined,
        blockedBy: undefined,
        history: [...prev.history, historyEntry],
        notes: [...prev.notes, systemNote],
        updatedAt: now,
      }
    })
    toast.success('Job unblocked')
  }, [])

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.jobsBoard, { label: job.jobNumber })} />
      <div className="flex flex-col gap-4 pb-24 md:pb-0">
        {/* Mobile: back button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 min-h-(--mobile-touch-target) text-muted-foreground"
            onClick={() => router.push('/jobs/board')}
          >
            <ArrowLeft className="size-4" />
            Back to Board
          </Button>
        </div>

        {/* Block reason banner */}
        {job.lane === 'blocked' && (
          <BlockReasonBanner
            blockReason={job.blockReason}
            blockedAt={job.blockedAt}
            blockedBy={job.blockedBy}
            onUnblock={unblockJob}
          />
        )}

        {/* Job header */}
        <JobHeader job={job} customerName={customerName} />

        {/* Desktop: Quick actions */}
        <div className="hidden md:block">
          <QuickActionsBar
            job={job}
            onMoveLane={() => setMoveLaneDialogOpen(true)}
            onBlock={() => setBlockDialogOpen(true)}
            onUnblock={unblockJob}
          />
        </div>

        {/* What We're Printing */}
        {mockupData && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">What We&apos;re Printing</h3>
            <GarmentMockupModal
              garmentCategory={
                mockupData.garmentCategory as Parameters<
                  typeof GarmentMockupCard
                >[0]['garmentCategory']
              }
              artworkPlacements={mockupData.artworkPlacements}
            >
              <GarmentMockupCard
                garmentCategory={
                  mockupData.garmentCategory as Parameters<
                    typeof GarmentMockupCard
                  >[0]['garmentCategory']
                }
                artworkPlacements={mockupData.artworkPlacements}
                size="md"
              />
            </GarmentMockupModal>
          </div>
        )}

        {/* Mobile: tabbed layout */}
        <div className="md:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="flex flex-col gap-4">
                <JobDetailsSection job={job} />
                <LinkedEntitiesSection
                  job={job}
                  customerName={customerName}
                  quoteTotal={quoteTotal}
                  invoiceStatus={invoiceStatus}
                />
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <TaskChecklist
                tasks={job.tasks}
                onToggleTask={toggleTask}
                onAddTask={addCustomTask}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesFeed notes={job.notes} onAddNote={addNote} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: two-column grid layout */}
        <div className="hidden md:grid md:grid-cols-1 md:gap-4 lg:grid-cols-3">
          {/* Main content — 2 cols */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <TaskChecklist tasks={job.tasks} onToggleTask={toggleTask} onAddTask={addCustomTask} />
            <NotesFeed notes={job.notes} onAddNote={addNote} />
          </div>

          {/* Sidebar — 1 col */}
          <div className="flex flex-col gap-4">
            <JobDetailsSection job={job} />
            <LinkedEntitiesSection
              job={job}
              customerName={customerName}
              quoteTotal={quoteTotal}
              invoiceStatus={invoiceStatus}
            />
          </div>
        </div>

        {/* Mobile: BottomActionBar — lane-aware actions */}
        {job.lane !== 'done' && (
          <BottomActionBar>
            {job.lane === 'blocked' ? (
              <Button
                variant="outline"
                className="flex-1 gap-1.5 min-h-(--mobile-touch-target)"
                onClick={unblockJob}
              >
                <ArrowRightLeft className="size-4" />
                Unblock
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 gap-1.5 min-h-(--mobile-touch-target)"
                onClick={() => setMoveLaneDialogOpen(true)}
              >
                <ArrowRightLeft className="size-4" />
                Move Lane
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-1.5 min-h-(--mobile-touch-target)"
              onClick={() => setActiveTab('notes')}
            >
              <MessageSquare className="size-4" />
              Add Note
            </Button>
          </BottomActionBar>
        )}

        {/* Move Lane Dialog */}
        {moveLaneDialogOpen && (
          <MoveLaneDialog
            open={moveLaneDialogOpen}
            onOpenChange={(open) => {
              if (!open) setMoveLaneDialogOpen(false)
            }}
            cardLabel={`${job.jobNumber}: ${customerName}`}
            currentLane={job.lane}
            onConfirm={(targetLane, blockReason) => {
              moveLane(targetLane, blockReason)
              setMoveLaneDialogOpen(false)
            }}
            onCancel={() => setMoveLaneDialogOpen(false)}
          />
        )}

        {/* Block Reason Dialog */}
        {blockDialogOpen && (
          <BlockReasonDialog
            open={blockDialogOpen}
            onOpenChange={(open) => {
              if (!open) setBlockDialogOpen(false)
            }}
            cardLabel={`${job.jobNumber}: ${customerName}`}
            onConfirm={(reason) => {
              moveLane('blocked', reason)
              setBlockDialogOpen(false)
            }}
            onCancel={() => setBlockDialogOpen(false)}
          />
        )}
      </div>
    </>
  )
}
