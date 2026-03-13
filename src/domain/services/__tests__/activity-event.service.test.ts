import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivityEventService } from '../activity-event.service'
import type { IActivityEventRepository, ActivityEvent } from '@domain/ports/activity-event.port'
import { brandId } from '@domain/lib/branded'
import type { ShopId, CustomerId, UserId } from '@domain/lib/branded'

// ─── Mock repository ────────────────────────────────────────────────────────

const VALID_SHOP_ID = brandId<ShopId>('10000000-0000-4000-8000-000000000001')
const VALID_ENTITY_ID = brandId<CustomerId>('20000000-0000-4000-8000-000000000002')
const VALID_ACTOR_ID = brandId<UserId>('30000000-0000-4000-8000-000000000003')
const VALID_EVENT_ID = '40000000-0000-4000-8000-000000000004'

const mockRecord = vi.fn<IActivityEventRepository['record']>()
const mockListForEntity = vi.fn<IActivityEventRepository['listForEntity']>()

const mockRepo: IActivityEventRepository = {
  record: mockRecord,
  listForEntity: mockListForEntity,
}

const service = new ActivityEventService(mockRepo)

const stubEvent: ActivityEvent = {
  id: VALID_EVENT_ID,
  shopId: VALID_SHOP_ID,
  entityType: 'customer',
  entityId: VALID_ENTITY_ID,
  eventType: 'created',
  actorType: 'staff',
  actorId: VALID_ACTOR_ID,
  metadata: null,
  createdAt: '2026-03-13T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── record() ──────────────────────────────────────────────────────────────

describe('ActivityEventService.record', () => {
  it('delegates to repo.record with validated input', async () => {
    mockRecord.mockResolvedValue(stubEvent)

    const result = await service.record({
      shopId: VALID_SHOP_ID,
      entityType: 'customer',
      entityId: VALID_ENTITY_ID,
      eventType: 'created',
      actorType: 'staff',
      actorId: VALID_ACTOR_ID,
    })

    expect(result).toBe(stubEvent)
    expect(mockRecord).toHaveBeenCalledOnce()
  })

  it('applies default actorType = system when omitted', async () => {
    mockRecord.mockResolvedValue({ ...stubEvent, actorType: 'system', actorId: null })

    await service.record({
      shopId: VALID_SHOP_ID,
      entityType: 'customer',
      entityId: VALID_ENTITY_ID,
      eventType: 'updated',
    })

    const arg = mockRecord.mock.calls[0]![0]
    expect(arg.actorType).toBe('system')
  })

  it('applies default actorId = null when omitted', async () => {
    mockRecord.mockResolvedValue({ ...stubEvent, actorType: 'system', actorId: null })

    await service.record({
      shopId: VALID_SHOP_ID,
      entityType: 'customer',
      entityId: VALID_ENTITY_ID,
      eventType: 'updated',
    })

    const arg = mockRecord.mock.calls[0]![0]
    expect(arg.actorId).toBeNull()
  })

  it('applies default metadata = null when omitted', async () => {
    mockRecord.mockResolvedValue(stubEvent)

    await service.record({
      shopId: VALID_SHOP_ID,
      entityType: 'customer',
      entityId: VALID_ENTITY_ID,
      eventType: 'created',
      actorType: 'staff',
      actorId: VALID_ACTOR_ID,
    })

    const arg = mockRecord.mock.calls[0]![0]
    expect(arg.metadata).toBeNull()
  })

  it('preserves provided metadata', async () => {
    mockRecord.mockResolvedValue({ ...stubEvent, metadata: { fields: ['company'] } })

    await service.record({
      shopId: VALID_SHOP_ID,
      entityType: 'customer',
      entityId: VALID_ENTITY_ID,
      eventType: 'updated',
      actorType: 'staff',
      actorId: VALID_ACTOR_ID,
      metadata: { fields: ['company'] },
    })

    const arg = mockRecord.mock.calls[0]![0]
    expect(arg.metadata).toEqual({ fields: ['company'] })
  })

  it('throws ZodError when shopId is not a UUID', async () => {
    await expect(
      service.record({
        shopId: 'not-a-uuid' as unknown as ShopId,
        entityType: 'customer',
        entityId: VALID_ENTITY_ID,
        eventType: 'created',
        actorType: 'staff',
        actorId: null,
      })
    ).rejects.toThrow()

    expect(mockRecord).not.toHaveBeenCalled()
  })
})

// ─── listForEntity() ────────────────────────────────────────────────────────

describe('ActivityEventService.listForEntity', () => {
  const emptyPage = { items: [], nextCursor: null, hasMore: false }

  it('delegates to repo.listForEntity', async () => {
    mockListForEntity.mockResolvedValue(emptyPage)

    await service.listForEntity('customer', VALID_ENTITY_ID, { shopId: VALID_SHOP_ID })

    expect(mockListForEntity).toHaveBeenCalledOnce()
  })

  it('defaults limit to 20', async () => {
    mockListForEntity.mockResolvedValue(emptyPage)

    await service.listForEntity('customer', VALID_ENTITY_ID, { shopId: VALID_SHOP_ID })

    const opts = mockListForEntity.mock.calls[0]![2]
    expect(opts.limit).toBe(20)
  })

  it('caps limit at 50', async () => {
    mockListForEntity.mockResolvedValue(emptyPage)

    await service.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
      limit: 9999,
    })

    const opts = mockListForEntity.mock.calls[0]![2]
    expect(opts.limit).toBe(50)
  })

  it('passes cursor through to repo', async () => {
    mockListForEntity.mockResolvedValue(emptyPage)
    const cursor = '2026-03-13T00:00:00.000Z'

    await service.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
      cursor,
    })

    const opts = mockListForEntity.mock.calls[0]![2]
    expect(opts.cursor).toBe(cursor)
  })

  it('passes eventTypes filter through to repo', async () => {
    mockListForEntity.mockResolvedValue(emptyPage)

    await service.listForEntity('customer', VALID_ENTITY_ID, {
      shopId: VALID_SHOP_ID,
      eventTypes: ['created', 'archived'],
    })

    const opts = mockListForEntity.mock.calls[0]![2]
    expect(opts.eventTypes).toEqual(['created', 'archived'])
  })
})
