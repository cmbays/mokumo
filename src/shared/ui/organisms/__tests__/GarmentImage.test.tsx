// @vitest-environment jsdom
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { GarmentImage } from '../GarmentImage'

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
  }: {
    src: string
    alt: string
    onError?: () => void
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid="garment-photo" onError={onError} />
  ),
}))

const defaultProps = {
  brand: 'Bella+Canvas',
  sku: 'BC3001',
  name: 'Unisex Jersey Tee',
}

describe('GarmentImage', () => {
  describe('with imageUrl', () => {
    it('renders the photo when imageUrl is provided', () => {
      render(<GarmentImage {...defaultProps} imageUrl="https://cdn.example.com/photo.jpg" />)
      expect(screen.getByTestId('garment-photo')).toBeInTheDocument()
      expect(screen.getByTestId('garment-photo')).toHaveAttribute(
        'src',
        'https://cdn.example.com/photo.jpg'
      )
    })

    it('does not render the Shirt empty state when imageUrl is provided', () => {
      render(<GarmentImage {...defaultProps} imageUrl="https://cdn.example.com/photo.jpg" />)
      expect(screen.queryByText('BC3001')).not.toBeInTheDocument()
    })

    it('falls back to Shirt icon on image error', () => {
      render(<GarmentImage {...defaultProps} imageUrl="https://cdn.example.com/photo.jpg" />)
      const photo = screen.getByTestId('garment-photo')
      fireEvent.error(photo)
      // Photo should be gone, SKU text should appear (default md size)
      expect(screen.queryByTestId('garment-photo')).not.toBeInTheDocument()
      expect(screen.getByText('BC3001')).toBeInTheDocument()
    })
  })

  describe('without imageUrl', () => {
    it('renders Shirt empty state when no imageUrl is provided', () => {
      render(<GarmentImage {...defaultProps} />)
      expect(screen.queryByTestId('garment-photo')).not.toBeInTheDocument()
    })

    it('shows SKU text for md size (default)', () => {
      render(<GarmentImage {...defaultProps} />)
      expect(screen.getByText('BC3001')).toBeInTheDocument()
    })

    it('hides SKU text for sm size', () => {
      render(<GarmentImage {...defaultProps} size="sm" />)
      expect(screen.queryByText('BC3001')).not.toBeInTheDocument()
    })

    it('shows SKU text for lg size', () => {
      render(<GarmentImage {...defaultProps} size="lg" />)
      expect(screen.getByText('BC3001')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has a descriptive aria-label', () => {
      render(<GarmentImage {...defaultProps} />)
      expect(
        screen.getByRole('img', { name: /bella\+canvas bc3001 — unisex jersey tee/i })
      ).toBeInTheDocument()
    })
  })
})
