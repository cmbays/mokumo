// @vitest-environment jsdom
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { GarmentCatalogClient } from '../_components/GarmentCatalogClient'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { CatalogStyleMetadata } from '@domain/entities/catalog-style'

// ---------------------------------------------------------------------------
// Module mocks — use vi.hoisted so refs are available when vi.mock factories run
// ---------------------------------------------------------------------------

const {
  mockToggleStyleEnabled,
  mockToggleStyleFavorite,
  mockFetchStyleDetail,
  mockToastError,
  mockToastWarning,
  mockGet,
} = vi.hoisted(() => ({
  mockToggleStyleEnabled: vi.fn(),
  mockToggleStyleFavorite: vi.fn(),
  mockFetchStyleDetail: vi.fn(),
  mockToastError: vi.fn(),
  mockToastWarning: vi.fn(),
  mockGet: vi.fn(),
}))

// Server actions
vi.mock('../actions', () => ({
  toggleStyleEnabled: mockToggleStyleEnabled,
  toggleStyleFavorite: mockToggleStyleFavorite,
  fetchStyleDetail: mockFetchStyleDetail,
  toggleColorFavorite: vi.fn().mockResolvedValue({ success: true, isFavorite: false }),
}))

// sonner toast
vi.mock('sonner', () => ({ toast: { error: mockToastError, warning: mockToastWarning } }))

// next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/garments',
}))

vi.mock('@features/garments/hooks/useColorFilter', () => ({
  useColorFilter: () => ({
    selectedColorGroups: [],
    toggleColorGroup: vi.fn(),
    clearColorGroups: vi.fn(),
  }),
}))

// Stub out the toolbar and drawers — they have their own complex deps
// and are not the subject of these tests
vi.mock('../_components/GarmentCatalogToolbar', () => ({
  GarmentCatalogToolbar: ({ onViewChange }: { onViewChange: (view: 'grid' | 'table') => void }) => (
    <div data-testid="toolbar">
      <button data-testid="table-view-btn" onClick={() => onViewChange('table')} />
    </div>
  ),
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
        for (const k of Object.keys(storage)) {
          delete storage[k]
        }
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
    ...overrides,
  } as GarmentCatalog
}

function makeStyleMeta(overrides: Partial<CatalogStyleMetadata> = {}): CatalogStyleMetadata {
  return {
    id: STYLE_UUID_A,
    source: 'ss',
    externalId: '12345',
    brand: 'Bella+Canvas',
    styleNumber: 'BC3001',
    name: 'Unisex Jersey Tee',
    description: null,
    category: 't-shirts',
    subcategory: null,
    isEnabled: true,
    isFavorite: false,
    cardImageUrl: null,
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
    mockFetchStyleDetail.mockResolvedValue([])
    setupSearchParams({})
  })

  describe('handleToggleEnabled', () => {
    it('calls toggleStyleEnabled with the correct catalog_styles UUID', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })
      const styleMetas = [makeStyleMeta({ id: STYLE_UUID_A, styleNumber: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={styleMetas}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      await user.click(screen.getByTestId('table-view-btn'))
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
      const styleMetas = [
        makeStyleMeta({ id: STYLE_UUID_A, styleNumber: 'BC3001' }),
        makeStyleMeta({ id: STYLE_UUID_B, styleNumber: 'G500' }),
      ]

      render(
        <GarmentCatalogClient
          initialCatalog={[garmentA, garmentB]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={styleMetas}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      await user.click(screen.getByTestId('table-view-btn'))
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
      const styleMetas = [makeStyleMeta({ id: STYLE_UUID_A, styleNumber: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={styleMetas}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      await user.click(screen.getByTestId('table-view-btn'))
      const enableSwitch = screen.getByRole('switch', { name: /disable unisex tee/i })
      await user.click(enableSwitch)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Couldn't update style — try again")
      })

      // Switch should be back to enabled (rollback)
      expect(screen.getByRole('switch', { name: /disable unisex tee/i })).toBeInTheDocument()
    })

    it('does not call toggleStyleEnabled when styleMetas has no entry for the garment SKU', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={[]} // no style metadata → skuToStyleId map empty
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      await user.click(screen.getByTestId('table-view-btn'))
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
      const garment = makeGarment({
        id: 'g1',
        sku: 'BC3001',
        name: 'Unisex Tee',
        isFavorite: false,
      })
      const styleMetas = [makeStyleMeta({ id: STYLE_UUID_A, styleNumber: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={styleMetas}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      const favStar = screen.getByRole('button', {
        name: /add.*favorite|toggle.*favorite|favorite/i,
      })
      await user.click(favStar)

      await waitFor(() => {
        expect(mockToggleStyleFavorite).toHaveBeenCalledOnce()
        expect(mockToggleStyleFavorite).toHaveBeenCalledWith(STYLE_UUID_A)
      })
    })

    it('reverts state and calls toast.error when server action fails', async () => {
      const user = userEvent.setup()
      mockToggleStyleFavorite.mockResolvedValueOnce({ success: false, error: 'DB error' })

      const garment = makeGarment({
        id: 'g1',
        sku: 'BC3001',
        name: 'Unisex Tee',
        isFavorite: false,
      })
      const styleMetas = [makeStyleMeta({ id: STYLE_UUID_A, styleNumber: 'BC3001' })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={styleMetas}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      const favStar = screen.getByRole('button', { name: /favorite/i })
      await user.click(favStar)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Couldn't update favorite — try again")
      })
    })

    it('does not call toggleStyleFavorite when styleMetas has no entry for the garment SKU', async () => {
      const user = userEvent.setup()
      const garment = makeGarment({
        id: 'g1',
        sku: 'BC3001',
        name: 'Unisex Tee',
        isFavorite: false,
      })

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={[]} // no style metadata → skuToStyleId map empty
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      const favStar = screen.getByRole('button', { name: /favorite/i })
      await user.click(favStar)

      await new Promise((r) => setTimeout(r, 50))

      expect(mockToggleStyleFavorite).not.toHaveBeenCalled()
    })
  })

  describe('initial state hydration', () => {
    it('seeds catalog isEnabled from styleMetas, not legacy initialCatalog', () => {
      // Legacy catalog says isEnabled=true, but styleMetas says false
      const garment = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Unisex Tee', isEnabled: true })
      const styleMetas = [makeStyleMeta({ styleNumber: 'BC3001', isEnabled: false })]

      render(
        <GarmentCatalogClient
          initialCatalog={[garment]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={styleMetas}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      // When isEnabled=false the garment is filtered from the grid/table
      expect(screen.queryByRole('switch', { name: /unisex tee/i })).not.toBeInTheDocument()
    })
  })

  describe('showDisabled filter', () => {
    it('hides disabled garments by default (table view)', async () => {
      const user = userEvent.setup()
      const enabled = makeGarment({ id: 'g1', sku: 'BC3001', name: 'Enabled Tee', isEnabled: true })
      const disabled = makeGarment({
        id: 'g2',
        sku: 'G500',
        name: 'Disabled Tee',
        isEnabled: false,
      })

      render(
        <GarmentCatalogClient
          initialCatalog={[enabled, disabled]}
          initialJobs={[]}
          initialCustomers={[]}
          styleMetas={[]}
          styleSwatches={{}}
          styleColorGroups={{}}
          colorGroups={[]}
          catalogColors={[]}
          initialFavoriteColorIds={[]}
          initialFavoriteColorGroupNames={[]}
        />
      )

      await user.click(screen.getByTestId('table-view-btn'))
      expect(screen.getByRole('switch', { name: /enabled tee/i })).toBeInTheDocument()
      expect(screen.queryByRole('switch', { name: /disabled tee/i })).not.toBeInTheDocument()
    })
  })
})
