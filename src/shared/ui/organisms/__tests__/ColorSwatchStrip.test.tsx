// @vitest-environment jsdom
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { ColorSwatchStrip } from '../ColorSwatchStrip'

// Mock Tooltip primitives — no TooltipProvider in test environment
vi.mock('@shared/ui/primitives/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
    void asChild
    return <>{children}</>
  },
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}))

describe('ColorSwatchStrip', () => {
  it('renders nothing for an empty color array', () => {
    const { container } = render(<ColorSwatchStrip colors={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all swatches when colors ≤ maxVisible', () => {
    const colors = [
      { name: 'Red', hex: '#ff0000' },
      { name: 'Blue', hex: '#0000ff' },
      { name: 'Green', hex: '#00ff00' },
    ]
    render(<ColorSwatchStrip colors={colors} maxVisible={8} />)
    const swatches = screen.getAllByRole('img')
    expect(swatches).toHaveLength(3)
  })

  it('shows exactly maxVisible swatches when more colors exist', () => {
    const colors = Array.from({ length: 20 }, (_, i) => ({
      name: `Color ${i}`,
      hex: '#ff0000',
    }))
    render(<ColorSwatchStrip colors={colors} maxVisible={8} />)
    const swatches = screen.getAllByRole('img')
    expect(swatches).toHaveLength(8)
  })

  it('shows overflow badge (+N) when colors exceed maxVisible', () => {
    const colors = Array.from({ length: 20 }, (_, i) => ({
      name: `Color ${i}`,
      hex: '#ff0000',
    }))
    render(<ColorSwatchStrip colors={colors} maxVisible={8} />)
    // overflow = 20 - 8 = 12
    expect(screen.getByText('+12')).toBeInTheDocument()
  })

  it('does not show overflow badge when all colors fit', () => {
    const colors = [
      { name: 'Red', hex: '#ff0000' },
      { name: 'Blue', hex: '#0000ff' },
    ]
    render(<ColorSwatchStrip colors={colors} maxVisible={8} />)
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('renders a swatch for null hex (bg-surface fallback)', () => {
    const colors = [{ name: 'Unknown', hex: null }]
    render(<ColorSwatchStrip colors={colors} />)
    const swatch = screen.getByRole('img', { name: 'Unknown' })
    expect(swatch).toBeInTheDocument()
    // No backgroundColor inline style — falls back to CSS bg-surface class
    expect(swatch).not.toHaveAttribute('style')
  })

  it('renders a swatch using hex1 when hex is absent (CatalogColor shape)', () => {
    const colors = [{ name: 'Navy', hex1: '#000080' }]
    render(<ColorSwatchStrip colors={colors} />)
    const swatch = screen.getByRole('img', { name: 'Navy' })
    expect(swatch).toHaveStyle({ backgroundColor: '#000080' })
  })

  it('shows color names as aria-labels on swatches', () => {
    const colors = [
      { name: 'Scarlet Red', hex: '#ff2400' },
      { name: 'Navy Blue', hex: '#000080' },
    ]
    render(<ColorSwatchStrip colors={colors} />)
    expect(screen.getByRole('img', { name: 'Scarlet Red' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Navy Blue' })).toBeInTheDocument()
  })

  it('applies custom className to the container', () => {
    const colors = [{ name: 'Red', hex: '#ff0000' }]
    const { container } = render(<ColorSwatchStrip colors={colors} className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
