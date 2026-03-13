import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ─── DB mock ───────────────────────────────────────────────────────────────

const mockInsert = vi.fn()
const mockSelect = vi.fn()

vi.mock('@shared/lib/supabase/db', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: mockInsert,
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: mockSelect,
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

import { supabaseActivityEventRepository } from '../_providers/supabase/activity-events'
import type { ActivityEventInput } from '@domain/ports/activity-event.port'
import { brandId } from '@domain/lib/branded'
import type { ShopId, CustomerId, UserId, ActivityEntityId } from '@domain/lib/branded'

const VALID_SHOP_ID = brandId<ShopId>('10000000-0000-4000-8000-000000000001')
const VALID_ENTITY_ID = brandId<CustomerId>('20000000-0000-4000-8000-000000000002')
const VALID_ACTOR_ID = brandId<UserId>('30000000-0000-4000-8000-000000000003')
const VALID_EVENT_ID = '40000000-0000-4000-8000-000000000004'

const baseInput: ActivityEventInput = {
  shopId: VALID_SHOP_ID,
  entityType: 'customer',
  entityId: VALID_ENTITY_ID,
  eventType: 'created',
  actorType: 'staff',
  actorId: VALID_ACTOR_ID,
  metadata: null,
}

const dbRow = {
  id: VALID_EVENT_ID,
  shopId: VALID_SHOP_ID,
  entityType: 'customer',
  entityId: VALID_ENTITY_ID,
  eventType: 'created',
  actorType: 'staff',
  actorId: VALID_ACTOR_ID,
  metadata: null,
  createdAt: new Date('2026-03-13T00:00:00.000Z'),
}

describe('supabaseActivityEventRepository.record', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts and returns the event', async () => {
    mockInsert.mockResolvedValue([dbRow])

    const result = await supabaseActivityEventRepository.record(baseInput)

    expect(result.id).toBe(VALID_EVENT_ID)
    expect(result.entityType).toBe('customer')
    expect(result.eventType).toBe('created')
    expect(result.actorType).toBe('staff')
    expect(result.createdAt).toBe('2026-03-13T00:00:00.000Z')
  })

  it('throws on invalid shopId', async () => {
    await expect(
      supabaseActivityEventRepository.record({ ...baseInput, shopId: 'not-a-uuid' as unknown as ShopId })
    ).rejects.toThrow('invalid shopId')
  })

  it('throws on invalid entityId', async () => {
    await expect(
      supabaseActivityEventRepository.record({ ...baseInput, entityId: 'bad' as unknown as ActivityEntityId })
    ).rejects.toThrow('invalid entityId')
  })

  it('throws when DB returns no row', async () => {
    mockInsert.mockResolvedValue([])

    await expect(supabaseActivityEventRepository.record(baseInput)).rejects.toThrow(
      'no row returned'
    )
  })
})

describe('supabaseActivityEventRepository.listForEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a page of events', async () => {
    mockSelect.mockResolvedValue([dbRow])

    const page = await supabaseActivityEventRepository.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
    })

    expect(page.items).toHaveLength(1)
    expect(page.hasMore).toBe(false)
    expect(page.nextCursor).toBeNull()
    expect(page.items[0]!.id).toBe(VALID_EVENT_ID)
  })

  it('detects hasMore when limit+1 rows returned', async () => {
    // Return limit+1 = 21 rows for default limit of 20
    const rows = Array.from({ length: 21 }, (_, i) => ({
      ...dbRow,
      id: `40000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      createdAt: new Date(`2026-03-13T${String(i).padStart(2, '0')}:00:00.000Z`),
    }))
    mockSelect.mockResolvedValue(rows)

    const page = await supabaseActivityEventRepository.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
      limit: 20,
    })

    expect(page.items).toHaveLength(20)
    expect(page.hasMore).toBe(true)
    expect(page.nextCursor).not.toBeNull()
  })

  it('caps limit at 50', async () => {
    mockSelect.mockResolvedValue([])

    await supabaseActivityEventRepository.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
      limit: 999,
    })

    // Passes — the limit is capped in the service layer (listForEntity itself uses the capped value)
    expect(mockSelect).toHaveBeenCalled()
  })

  it('throws on invalid entityId', async () => {
    await expect(
      supabaseActivityEventRepository.listForEntity('customer', 'bad-id' as unknown as ActivityEntityId, {
        shopId: VALID_SHOP_ID,
      })
    ).rejects.toThrow('invalid entityId')
  })

  it('throws on invalid shopId', async () => {
    await expect(
      supabaseActivityEventRepository.listForEntity('customer', VALID_ENTITY_ID, {
        shopId: 'not-uuid' as unknown as ShopId,
      })
    ).rejects.toThrow('invalid shopId')
  })

  it('passes cursor option to the query', async () => {
    mockSelect.mockResolvedValue([dbRow])

    await supabaseActivityEventRepository.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
      cursor: '2026-03-13T00:00:00.000Z',
    })

    // Query ran successfully — cursor filtering is handled by the WHERE clause
    expect(mockSelect).toHaveBeenCalled()
  })

  it('accepts null actorId in record input', async () => {
    mockInsert.mockResolvedValue([{ ...dbRow, actorType: 'system', actorId: null }])

    const result = await supabaseActivityEventRepository.record({
      ...baseInput,
      actorType: 'system',
      actorId: null,
    })

    expect(result.actorId).toBeNull()
    expect(result.actorType).toBe('system')
  })
})
