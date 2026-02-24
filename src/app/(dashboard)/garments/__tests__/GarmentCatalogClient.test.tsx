// @vitest-environment jsdom
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { GarmentCatalogClient } from '../_components/GarmentCatalogClient'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'

// ---------------------------------------------------------------------------
// Module mocks — use vi.hoisted so refs are available when vi.mock factories run
// ---------------------------------------------------------------------------

const {
  mockToggleStyleEnabled,
  mockToggleStyleFavorite,
  mockToastError,
  mockGet,
} = vi.hoisted(() => ({
  mockToggleStyleEnabled: vi.fn(),
  mockToggleStyleFavorite: vi.fn(),
  mockToastError: vi.fn(),
  mockGet: vi.fn(),
}))

// Server actions
vi.mock('../actions', () => ({
  toggleStyleEnabled: mockToggleStyleEnabled,
  toggleStyleFavorite: mockToggleStyleFavorite,
}))

// sonner toast
vi.mock('sonner', () => ({ toast: { error: mockToastError } }))

// next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/garments',
}))

// Heavy repos / rules that don't matter for toggle tests
vi.mock('@domain/rules/customer.rules', () => ({
  resolveEffectiveFavorites: () => [],
}))
vi.mock('@infra/repositories/colors', () => ({
  getColorsMutable: () => [],
}))
vi.mock('@infra/repositories/customers', () => ({
  getCustomersMutable: () => [],
}))
vi.mock('@infra/repositories/settings', () => ({
  getBrandPreferencesMutable: () => ({}),
}))
vi.mock('@features/garments/hooks/useColorFilter', () => ({
  useColorFilter: () => ({ selectedColorIds: [], toggleColor: vi.fn(), clearColors: vi.fn() }),
}))

// Stub out the toolbar and drawers — they have their own complex deps
// and are not the subject of these tests
vi.mock('../_components/GarmentCatalogToolbar', () => ({
  GarmentCatalogToolbar: () => <div data-testid="toolbar" />,
}))
vi.mock('../_components/GarmentDetailDrawer', () => ({
  GarmentDetailDrawer: () => null,
}))
vi.mock('../_components/BrandDetailDrawer', () => ({
  BrandDetailDrawer: () => null,
}))
// GarmentCard imports a mockup component — stub it out so grid view renders cleanly
vi.mock('@features/quotes/components/mockup', () => ({
  GarmentMockup: () => <div data-testid="mockup" />,
}))

// ---------------------------------------------------------------------------
// Global setup — jsdom requires localStorage to be defined explicitly
// ---------------------------------------------------------------------------

beforeAll(() => {
  const storage: Record<string, string> = {}
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k])
      },
    },
    writable: true,
  })
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STYLE_UUID_A = '00000000-0000-4000-8000-aaaaaaaaaaaa'
const STYLE_UUID_B = '00000000-0000-4000-8000-bbbbbbbbbbbb'

function makeGarment(overrides: Partial<GarmentCatalog> = {}): GarmentCatalog {
  return {
    id: 'garment-1',
    sku: 'BC3001',
    name: 'Unisex Jersey Tee',
    brand: 'Bella+Canvas',
    baseCategory: 't-shirts',
    basePrice: 4.25,
    availableColors: [],
    isEnabled: true,
    isFavorite: false,
    // add any other required fields the Drizzle schema defines
    ...overrides,
  } as GarmentCatalog
}

function makeNormalized(overrides: Partial<NormalizedGarmentCatalog> = {}): NormalizedGarmentCatalog {
  return {
    id: STYLE_UUID_A,
    source: 'ss',
    externalId: 'BC3001',
    brand: 'Bella+Canvas',
    styleNumber: '3001',
    name: 'Unisex Jersey Tee',
    description: null,
    category: 't-shirts',
    subcategory: null,
    colors: [],
    sizes: [],
    isEnabled: true,
    isFavorite: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helper: set up searchParams mock for table view
// ---------------------------------------------------------------------------

function setupSearchParams(params: Record<string, string | null> = {}) {
  mockGet.mockImplementation((key: string) => params[key] ?? null)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GarmentCatalogClient — toggle persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToggleStyleEnabled.mockResolvedValue({ success: true, isEnabled: false })
    mockToggleStyleFavorite.mockResolvedValue({ success: true, isFavorite: true })
    // Default: table view, no disabled filter
    setupSearchParams({ view: 'table' })
  })

  describe('handleToggleEnabled', () => {
    it('calls toggleStyleEnabled with the correct catalog_styles UUID', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })
      const normalized = [makeNormalized({ id: STYLE_UUID_A, externalId: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          normalizedCatalog={normalized}
        />
      )

      const enableSwitch = screen.getByRole('switch', { name: /disable unisex tee/i })
      await user.click(enableSwitch)

      await waitFor(() => {
        expect(mockToggleStyleEnabled).toHaveBeenCalledOnce()
        expect(mockToggleStyleEnabled).toHaveBeenCalledWith(STYLE_UUID_A)
      })
    })

    it('resolves the correct UUID when multiple garments are present', async () => {
      const user = userEvent.setup()
      const garmentA = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Tee A', isEnabled: true })
      const garmentB = makeGarment({ id: 'g2', sku: 'G500', name: 'Tee B', isEnabled: true })
      const normalized = [
        makeNormalized({ id: STYLE_UUID_A, externalId: 'BC3001' }),
        makeNormalized({ id: STYLE_UUID_B, externalId: 'G500' }),
      ]

      render(
        <GarmentCatalogClient
          initialCatalog={[garmentA, garmentB]}
          initialJobs={[]}
          initialCustomers={[]}
          normalizedCatalog={normalized}
        />
      )

      // Click the switch for garment B specifically
      const enableSwitchB = screen.getByRole('switch', { name: /disable tee b/i })
      await user.click(enableSwitchB)

      await waitFor(() => {
        expect(mockToggleStyleEnabled).toHaveBeenCalledWith(STYLE_UUID_B)
        expect(mockToggleStyleEnabled).not.toHaveBeenCalledWith(STYLE_UUID_A)
      })
    })

    it('reverts state and calls toast.error when server action fails', async () => {
      const user = userEvent.setup()
      mockToggleStyleEnabled.mockResolvedValueOnce({ success: false, error: 'DB error' })

      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })
      const normalized = [makeNormalized({ id: STYLE_UUID_A, externalId: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          normalizedCatalog={normalized}
        />
      )

      const enableSwitch = screen.getByRole('switch', { name: /disable unisex tee/i })
      await user.click(enableSwitch)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Couldn't update style — try again")
      })

      // Switch should be back to enabled (rollback)
      expect(screen.getByRole('switch', { name: /disable unisex tee/i })).toBeInTheDocument()
    })

    it('does not call toggleStyleEnabled when normalizedCatalog is absent', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          // no normalizedCatalog
        />
      )

      const enableSwitch = screen.getByRole('switch', { name: /disable unisex tee/i })
      await user.click(enableSwitch)

      // Give async handler time to complete
      await new Promise((r) => setTimeout(r, 50))

      expect(mockToggleStyleEnabled).not.toHaveBeenCalled()
    })
  })

  describe('handleToggleFavorite', () => {
    it('calls toggleStyleFavorite with the correct catalog_styles UUID', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isFavorite: false })
      const normalized = [makeNormalized({ id: STYLE_UUID_A, externalId: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          normalizedCatalog={normalized}
        />
      )

      const favStar = screen.getByRole('button', { name: /add.*favorite|toggle.*favorite|favorite/i })
      await user.click(favStar)

      await waitFor(() => {
        expect(mockToggleStyleFavorite).toHaveBeenCalledOnce()
        expect(mockToggleStyleFavorite).toHaveBeenCalledWith(STYLE_UUID_A)
      })
    })

    it('reverts state and calls toast.error when server action fails', async () => {
      const user = userEvent.setup()
      mockToggleStyleFavorite.mockResolvedValueOnce({ success: false, error: 'DB error' })

      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isFavorite: false })
      const normalized = [makeNormalized({ id: STYLE_UUID_A, externalId: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          normalizedCatalog={normalized}
        />
      )

      const favStar = screen.getByRole('button', { name: /favorite/i })
      await user.click(favStar)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Couldn't update favorite — try again")
      })
    })

    it('does not call toggleStyleFavorite when normalizedCatalog is absent', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isFavorite: false })

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
        />
      )

      const favStar = screen.getByRole('button', { name: /favorite/i })
      await user.click(favStar)

      await new Promise((r) => setTimeout(r, 50))

      expect(mockToggleStyleFavorite).not.toHaveBeenCalled()
    })
  })

  describe('initial state hydration', () => {
    it('seeds catalog isEnabled from normalizedCatalog, not legacy initialCatalog', () => {
      // Legacy catalog says isEnabled=true, but normalizedCatalog says false
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })
      const normalized = [
        makeNormalized({ externalId: 'BC3001', isEnabled: false }),
      ]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          normalizedCatalog={normalized}
        />
      )

      // When isEnabled=false and showDisabled is off, the garment is filtered out
      expect(screen.queryByRole('switch', { name: /unisex tee/i })).not.toBeInTheDocument()
    })
  })
})
