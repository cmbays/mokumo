import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}))

vi.mock('@infra/services/inventory-sync.service', () => ({
  syncInventoryFromSupplier: vi.fn(),
}))

import { handleInventoryRefresh } from '../inventory-refresh.handler'
import { syncInventoryFromSupplier } from '@infra/services/inventory-sync.service'

const mockSyncInventory = vi.mocked(syncInventoryFromSupplier)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleInventoryRefresh', () => {
  it('resolves when sync completes with zero errors', async () => {
    mockSyncInventory.mockResolvedValue({ synced: 500, rawInserted: 500, errors: 0 })

    await expect(handleInventoryRefresh({})).resolves.toBeUndefined()
    expect(mockSyncInventory).toHaveBeenCalledOnce()
  })

  it('throws when sync reports errors > 0 (triggers QStash retry)', async () => {
    mockSyncInventory.mockResolvedValue({ synced: 400, rawInserted: 500, errors: 3 })

    await expect(handleInventoryRefresh({})).rejects.toThrow('3 batch error')
  })

  it('propagates rejection when sync service itself throws', async () => {
    mockSyncInventory.mockRejectedValue(new Error('network timeout'))

    await expect(handleInventoryRefresh({})).rejects.toThrow('network timeout')
  })

  it('passes data argument through to the handler without error', async () => {
    mockSyncInventory.mockResolvedValue({ synced: 100, rawInserted: 100, errors: 0 })

    await expect(handleInventoryRefresh({ styleIds: ['ABC123'] })).resolves.toBeUndefined()
  })
})
