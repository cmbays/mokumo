import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  computeCapacitySummary,
  computeRiskLevel,
  computeTaskProgress,
  computeFilteredCards,
} from '../job.rules'
import type { BoardCard } from '@domain/entities/board-card'
import type { JobTask } from '@domain/entities/job'

// ---------------------------------------------------------------------------
// computeCapacitySummary
// ---------------------------------------------------------------------------

describe('computeCapacitySummary', () => {
  it('returns zeros for an empty array', () => {
    const result = computeCapacitySummary([])
    expect(result.rushQuantity).toBe(0)
    expect(result.totalQuantity).toBe(0)
    expect(result.totalRevenue).toBe(0)
    expect(result.cardsByLane).toEqual({
      ready: 0,
      in_progress: 0,
      review: 0,
      blocked: 0,
      done: 0,
    })
  })

  it('sums quantity of rush jobs', () => {
    const cards: BoardCard[] = [
      makeJobCard({ priority: 'rush', lane: 'ready', quantity: 50 }),
      makeJobCard({ priority: 'high', lane: 'ready', quantity: 100 }),
      makeJobCard({ priority: 'rush', lane: 'in_progress', quantity: 25 }),
    ]
    const result = computeCapacitySummary(cards)
    expect(result.rushQuantity).toBe(75)
  })

  it('accumulates quantity from jobs and quotes', () => {
    const cards: BoardCard[] = [
      makeJobCard({ quantity: 100, lane: 'ready' }),
      makeQuoteCard({ quantity: 200, lane: 'review' }),
      makeScratchNoteCard(),
    ]
    const result = computeCapacitySummary(cards)
    expect(result.totalQuantity).toBe(300)
  })

  it('tallies cards by lane across mixed types', () => {
    const cards: BoardCard[] = [
      makeJobCard({ lane: 'ready', quantity: 10 }),
      makeJobCard({ lane: 'ready', quantity: 20 }),
      makeQuoteCard({ lane: 'blocked' }),
      makeScratchNoteCard(), // always in ready
    ]
    const result = computeCapacitySummary(cards)
    expect(result.cardsByLane.ready).toBe(3)
    expect(result.cardsByLane.blocked).toBe(1)
  })

  it('accumulates revenue from jobs and quotes', () => {
    const cards: BoardCard[] = [
      makeJobCard({ quantity: 100, lane: 'ready' }), // orderTotal = 500
      makeJobCard({ quantity: 50, lane: 'in_progress' }), // orderTotal = 500
      makeQuoteCard({ quantity: 200, lane: 'review', total: 750 }),
      makeScratchNoteCard(),
    ]
    const result = computeCapacitySummary(cards)
    expect(result.totalRevenue).toBe(1750)
  })
})

// ---------------------------------------------------------------------------
// computeRiskLevel
// ---------------------------------------------------------------------------

describe('computeRiskLevel', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns on_track when no tasks', () => {
    expect(computeRiskLevel({ dueDate: '2026-03-01', tasks: [] })).toBe('on_track')
  })

  it('returns on_track when all tasks complete', () => {
    expect(
      computeRiskLevel({
        dueDate: '2020-01-01', // past due but doesn't matter
        tasks: [{ isCompleted: true }, { isCompleted: true }],
      })
    ).toBe('on_track')
  })

  it('returns at_risk when past due and incomplete', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15'))

    expect(
      computeRiskLevel({
        dueDate: '2026-03-10',
        tasks: [{ isCompleted: true }, { isCompleted: false }],
      })
    ).toBe('at_risk')
  })

  it('returns on_track when >50% done and >3 days to due', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01'))

    expect(
      computeRiskLevel({
        dueDate: '2026-03-10', // 9 days away
        tasks: [{ isCompleted: true }, { isCompleted: true }, { isCompleted: false }], // 66% done
      })
    ).toBe('on_track')
  })

  it('returns at_risk when <50% done and <5 days left', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08'))

    expect(
      computeRiskLevel({
        dueDate: '2026-03-10', // 2 days away
        tasks: [{ isCompleted: false }, { isCompleted: false }, { isCompleted: true }], // 33% done
      })
    ).toBe('at_risk')
  })

  it('returns getting_tight as fallthrough', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01'))

    // 50% done exactly, 5 days to due — doesn't match either branch
    expect(
      computeRiskLevel({
        dueDate: '2026-03-06',
        tasks: [{ isCompleted: true }, { isCompleted: false }],
      })
    ).toBe('getting_tight')
  })
})

// ---------------------------------------------------------------------------
// computeTaskProgress
// ---------------------------------------------------------------------------

describe('computeTaskProgress', () => {
  it('returns zeros and allComplete=false for empty array', () => {
    const result = computeTaskProgress([])
    expect(result).toEqual({
      completed: 0,
      total: 0,
      percentage: 0,
      allComplete: false,
    })
  })

  it('returns correct partial progress', () => {
    const tasks = [makeTask(true), makeTask(true), makeTask(false)]
    const result = computeTaskProgress(tasks)
    expect(result.completed).toBe(2)
    expect(result.total).toBe(3)
    expect(result.percentage).toBe(67)
    expect(result.allComplete).toBe(false)
  })

  it('returns allComplete when all done', () => {
    const tasks = [makeTask(true), makeTask(true)]
    const result = computeTaskProgress(tasks)
    expect(result.completed).toBe(2)
    expect(result.total).toBe(2)
    expect(result.percentage).toBe(100)
    expect(result.allComplete).toBe(true)
  })

  it('rounds percentage to integer', () => {
    // 1/3 = 33.33...% → should round to 33
    const tasks = [makeTask(true), makeTask(false), makeTask(false)]
    const result = computeTaskProgress(tasks)
    expect(result.percentage).toBe(33)
  })
})

// ---------------------------------------------------------------------------
// computeFilteredCards
// ---------------------------------------------------------------------------

describe('computeFilteredCards', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns all cards when no filters active', () => {
    const cards: BoardCard[] = [
      makeJobCard({ lane: 'ready', quantity: 10 }),
      makeQuoteCard({ lane: 'review' }),
      makeScratchNoteCard(),
    ]
    expect(computeFilteredCards(cards, {})).toHaveLength(3)
  })

  it('filters by serviceType (excludes scratch notes)', () => {
    const cards: BoardCard[] = [
      makeJobCard({ serviceType: 'screen-print', lane: 'ready', quantity: 10 }),
      makeJobCard({ serviceType: 'dtf', lane: 'ready', quantity: 5 }),
      makeScratchNoteCard(),
    ]
    const result = computeFilteredCards(cards, {
      serviceType: 'screen-print',
    })
    expect(result).toHaveLength(1)
    expect((result[0] as { serviceType: string }).serviceType).toBe('screen-print')
  })

  it('filters by lane', () => {
    const cards: BoardCard[] = [
      makeJobCard({ lane: 'ready', quantity: 10 }),
      makeJobCard({ lane: 'blocked', quantity: 10 }),
      makeQuoteCard({ lane: 'blocked' }),
    ]
    const result = computeFilteredCards(cards, { lane: 'blocked' })
    expect(result).toHaveLength(2)
  })

  it('filters by risk (only applies to job cards)', () => {
    const cards: BoardCard[] = [
      makeJobCard({ riskLevel: 'at_risk', lane: 'ready', quantity: 10 }),
      makeJobCard({ riskLevel: 'on_track', lane: 'ready', quantity: 10 }),
      makeQuoteCard({ lane: 'ready' }),
    ]
    const result = computeFilteredCards(cards, { risk: 'at_risk' })
    expect(result).toHaveLength(1)
  })

  it('passes scratch notes through when no type-specific filters', () => {
    const cards: BoardCard[] = [makeScratchNoteCard(), makeJobCard({ lane: 'ready', quantity: 10 })]
    const result = computeFilteredCards(cards, { lane: 'ready' })
    expect(result).toHaveLength(2)
  })

  it('combines filters (serviceType + lane)', () => {
    const cards: BoardCard[] = [
      makeJobCard({
        serviceType: 'dtf',
        lane: 'in_progress',
        quantity: 10,
      }),
      makeJobCard({
        serviceType: 'dtf',
        lane: 'ready',
        quantity: 10,
      }),
      makeJobCard({
        serviceType: 'screen-print',
        lane: 'in_progress',
        quantity: 10,
      }),
    ]
    const result = computeFilteredCards(cards, {
      serviceType: 'dtf',
      lane: 'in_progress',
    })
    expect(result).toHaveLength(1)
  })

  describe('today filter', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('excludes job cards that start after today', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [
        makeJobCard({ startDate: '2026-02-15', lane: 'ready', quantity: 10 }),
        makeJobCard({ startDate: '2026-02-20', lane: 'ready', quantity: 10 }),
      ]

      const result = computeFilteredCards(cards, { today: true })
      expect(result).toHaveLength(1)
    })

    it('excludes job cards in done lane', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [
        makeJobCard({ startDate: '2026-02-15', lane: 'ready', quantity: 10 }),
        makeJobCard({ startDate: '2026-02-15', lane: 'done', quantity: 10 }),
      ]

      const result = computeFilteredCards(cards, { today: true })
      expect(result).toHaveLength(1)
    })

    it('excludes quote cards in done lane', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [makeQuoteCard({ lane: 'ready' }), makeQuoteCard({ lane: 'done' })]

      const result = computeFilteredCards(cards, { today: true })
      expect(result).toHaveLength(1)
    })

    it('always passes scratch notes through', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [makeScratchNoteCard(), makeScratchNoteCard()]

      const result = computeFilteredCards(cards, { today: true })
      expect(result).toHaveLength(2)
    })
  })

  describe('horizon filter', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('past_due: keeps cards with dueDate before today', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [
        makeJobCard({ dueDate: '2026-02-10', lane: 'ready', quantity: 10 }),
        makeJobCard({ dueDate: '2026-02-25', lane: 'ready', quantity: 10 }),
      ]

      const result = computeFilteredCards(cards, { horizon: 'past_due' })
      expect(result).toHaveLength(1)
    })

    it('this_week: keeps cards due within 0–7 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [
        makeJobCard({ dueDate: '2026-02-10', lane: 'ready', quantity: 10 }),
        makeJobCard({ dueDate: '2026-02-20', lane: 'ready', quantity: 10 }),
        makeJobCard({ dueDate: '2026-02-28', lane: 'ready', quantity: 10 }),
      ]

      const result = computeFilteredCards(cards, { horizon: 'this_week' })
      expect(result).toHaveLength(1)
    })

    it('next_week: keeps cards due within 7–14 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const cards: BoardCard[] = [
        makeJobCard({ dueDate: '2026-02-20', lane: 'ready', quantity: 10 }),
        makeJobCard({ dueDate: '2026-02-25', lane: 'ready', quantity: 10 }),
        makeJobCard({ dueDate: '2026-03-10', lane: 'ready', quantity: 10 }),
      ]

      const result = computeFilteredCards(cards, { horizon: 'next_week' })
      expect(result).toHaveLength(1)
    })

    it('excludes scratch notes from horizon filter', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const result = computeFilteredCards([makeScratchNoteCard()], { horizon: 'this_week' })
      expect(result).toHaveLength(0)
    })

    it('excludes cards with no dueDate from horizon filter', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-18'))

      const card = makeQuoteCard({ lane: 'ready' }) // quote with no dueDate
      const result = computeFilteredCards([card], { horizon: 'this_week' })
      expect(result).toHaveLength(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let cardCounter = 0

function makeJobCard(
  overrides: Partial<{
    lane: 'ready' | 'in_progress' | 'review' | 'blocked' | 'done'
    quantity: number
    priority: 'low' | 'medium' | 'high' | 'rush'
    serviceType: 'screen-print' | 'dtf' | 'embroidery'
    riskLevel: 'on_track' | 'getting_tight' | 'at_risk'
    startDate: string
    dueDate: string
  }> = {}
): BoardCard {
  cardCounter++
  return {
    type: 'job',
    id: `a1b2c3d4-e5f6-4a7b-8c9d-00000000${String(cardCounter).padStart(4, '0')}`,
    jobNumber: `J-${1000 + cardCounter}`,
    title: `Test Job ${cardCounter}`,
    customerId: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    customerName: 'Test Customer',
    lane: overrides.lane ?? 'ready',
    serviceType: overrides.serviceType ?? 'screen-print',
    quantity: overrides.quantity ?? 100,
    locationCount: 1,
    colorCount: 2,
    startDate: overrides.startDate ?? '2026-02-01',
    dueDate: overrides.dueDate ?? '2026-02-28',
    riskLevel: overrides.riskLevel ?? 'on_track',
    priority: overrides.priority ?? 'medium',
    taskProgress: { completed: 0, total: 8 },
    tasks: [],
    orderTotal: 500,
  }
}

function makeQuoteCard(
  overrides: Partial<{
    lane: 'ready' | 'in_progress' | 'review' | 'blocked' | 'done'
    quantity: number
    total: number
  }> = {}
): BoardCard {
  cardCounter++
  return {
    type: 'quote',
    quoteId: `b1b2c3d4-e5f6-4a7b-8c9d-00000000${String(cardCounter).padStart(4, '0')}`,
    customerId: 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    customerName: 'Quote Customer',
    description: 'Test quote',
    lane: overrides.lane ?? 'ready',
    quoteStatus: 'draft',
    isNew: false,
    notes: [],
    quantity: overrides.quantity,
    total: overrides.total,
  }
}

function makeScratchNoteCard(): BoardCard {
  cardCounter++
  return {
    type: 'scratch_note',
    id: `c1b2c3d4-e5f6-4a7b-8c9d-00000000${String(cardCounter).padStart(4, '0')}`,
    content: `Test note ${cardCounter}`,
    createdAt: '2026-02-12T10:00:00Z',
    isArchived: false,
    lane: 'ready',
  }
}

function makeTask(isCompleted: boolean): JobTask {
  cardCounter++
  return {
    id: `d1b2c3d4-e5f6-4a7b-8c9d-00000000${String(cardCounter).padStart(4, '0')}`,
    label: `Task ${cardCounter}`,
    isCompleted,
    isCanonical: true,
    sortOrder: cardCounter,
  }
}
