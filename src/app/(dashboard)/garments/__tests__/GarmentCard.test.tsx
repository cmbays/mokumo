// @vitest-environment jsdom
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeAll } from 'vitest'
import { GarmentCard } from '../_components/GarmentCard'
import type { GarmentCatalog } from '@domain/entities/garment'

vi.mock('@shared/ui/organisms/GarmentImage', () => ({
  GarmentImage: ({ imageUrl }: { imageUrl?: string }) => (
    <div data-testid="garment-image" data-has-url={String(!!imageUrl)} />
  ),
}))
vi.mock('@infra/repositories/colors', () => ({
  getColorsMutable: () => [],
}))
vi.mock('@shared/ui/organisms/ColorSwatchStrip', () => ({
  ColorSwatchStrip: () => null,
}))

// localStorage stub for jsdom
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
        for (const k of Object.keys(storage)) delete storage[k]
      },
    },
    writable: true,
  })
})

const makeGarment = (overrides: Partial<GarmentCatalog> = {}): GarmentCatalog =>
  ({
    id: 'g1',
    sku: 'BC3001',
    name: 'Unisex Jersey Tee',
    brand: 'Bella+Canvas',
    baseCategory: 't-shirts',
    basePrice: 4.25,
    availableColors: [],
    isEnabled: true,
    isFavorite: false,
    availableSizes: [],
    ...overrides,
  }) as GarmentCatalog

const defaultProps = {
  showPrice: false,
  favoriteColorIds: [],
  onToggleFavorite: vi.fn(),
  onClick: vi.fn(),
}

describe('GarmentCard', () => {
  describe('image rendering', () => {
    it('renders GarmentImage with photo URL when frontImageUrl is provided', () => {
      render(
        <GarmentCard
          {...defaultProps}
          garment={makeGarment()}
          frontImageUrl="https://cdn.ssactivewear.com/Images/Color/79851_f_fm.jpg"
        />
      )
      const img = screen.getByTestId('garment-image')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('data-has-url', 'true')
    })

    it('renders GarmentImage without photo when no frontImageUrl is provided', () => {
      render(<GarmentCard {...defaultProps} garment={makeGarment()} />)
      const img = screen.getByTestId('garment-image')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('data-has-url', 'false')
    })
  })

  describe('metadata display', () => {
    it('shows brand, sku, and name', () => {
      render(<GarmentCard {...defaultProps} garment={makeGarment()} />)
      expect(screen.getByText(/bella\+canvas/i)).toBeInTheDocument()
      expect(screen.getByText(/BC3001/)).toBeInTheDocument()
      expect(screen.getByText('Unisex Jersey Tee')).toBeInTheDocument()
    })

    it('shows price when showPrice is true', () => {
      render(<GarmentCard {...defaultProps} garment={makeGarment({ basePrice: 4.25 })} showPrice />)
      expect(screen.getByText('$4.25')).toBeInTheDocument()
    })

    it('shows Disabled badge when garment is not enabled', () => {
      render(<GarmentCard {...defaultProps} garment={makeGarment({ isEnabled: false })} />)
      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })
  })
})
