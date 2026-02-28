// @vitest-environment jsdom
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { GarmentMockup } from '../GarmentMockup'

vi.mock('@domain/constants/print-zones', () => ({
  getZoneForPosition: vi.fn().mockReturnValue({ x: 28, y: 18, width: 44, height: 35 }),
  getZonesForCategory: vi.fn().mockReturnValue([]),
}))

describe('GarmentMockup — base layer', () => {
  describe('when imageUrl is provided', () => {
    it('renders an SVG image element with the correct href', () => {
      const { container } = render(
        <GarmentMockup
          garmentCategory="t-shirts"
          imageUrl="https://cdn.ssactivewear.com/photo.jpg"
        />
      )
      const svgImage = container.querySelector('image[href]')
      expect(svgImage).not.toBeNull()
      expect(svgImage).toHaveAttribute('href', 'https://cdn.ssactivewear.com/photo.jpg')
    })

    it('does not render the empty state when imageUrl is provided', () => {
      render(
        <GarmentMockup
          garmentCategory="t-shirts"
          imageUrl="https://cdn.ssactivewear.com/photo.jpg"
        />
      )
      expect(screen.queryByText('No photo available')).not.toBeInTheDocument()
    })
  })

  describe('when imageUrl is absent (empty state)', () => {
    it('renders "No photo available" text for md size', () => {
      render(<GarmentMockup garmentCategory="t-shirts" size="md" />)
      expect(screen.getByText('No photo available')).toBeInTheDocument()
    })

    it('renders "No photo available" text for lg size', () => {
      render(<GarmentMockup garmentCategory="t-shirts" size="lg" />)
      expect(screen.getByText('No photo available')).toBeInTheDocument()
    })

    it('hides "No photo available" text for xs size', () => {
      render(<GarmentMockup garmentCategory="t-shirts" size="xs" />)
      expect(screen.queryByText('No photo available')).not.toBeInTheDocument()
    })

    it('hides "No photo available" text for sm size', () => {
      render(<GarmentMockup garmentCategory="t-shirts" size="sm" />)
      expect(screen.queryByText('No photo available')).not.toBeInTheDocument()
    })

    it('does not render an SVG image element when imageUrl is absent', () => {
      const { container } = render(<GarmentMockup garmentCategory="t-shirts" />)
      expect(container.querySelector('image[href]')).toBeNull()
    })
  })

  describe('aria', () => {
    it('has a descriptive aria-label on the SVG', () => {
      render(<GarmentMockup garmentCategory="t-shirts" view="front" />)
      expect(screen.getByRole('img', { name: /t-shirts mockup.*front view/i })).toBeInTheDocument()
    })
  })
})
