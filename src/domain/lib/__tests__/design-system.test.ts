import { describe, it, expect } from 'vitest'
import {
  statusBadge,
  categoryBadge,
  dotColor,
  textToBgColor,
  MUTED_BADGE,
  type StatusRole,
  type CategoryColor,
} from '../design-system'

describe('statusBadge', () => {
  const roles: StatusRole[] = ['action', 'success', 'warning', 'error']

  it.each(roles)('returns filled badge classes for %s', (role) => {
    const result = statusBadge(role)
    expect(result).toContain(`bg-${role}/10`)
    expect(result).toContain(`text-${role}`)
    expect(result).toContain(`border-${role}/20`)
  })

  it('returns exact string for action', () => {
    expect(statusBadge('action')).toBe('bg-action/10 text-action border border-action/20')
  })
})

describe('MUTED_BADGE', () => {
  it('is the expected neutral badge class string', () => {
    expect(MUTED_BADGE).toBe('bg-muted text-muted-foreground')
  })
})

describe('categoryBadge', () => {
  const colors: CategoryColor[] = [
    'purple',
    'magenta',
    'teal',
    'emerald',
    'lime',
    'brown',
    'amber',
    'graphite',
    'cyan',
  ]

  it.each(colors)('returns outline badge classes for %s', (color) => {
    const result = categoryBadge(color)
    expect(result).toContain(`text-${color}`)
    expect(result).toContain(`border-${color}/20`)
    // Outline badges should NOT have a background fill
    expect(result).not.toContain('bg-')
  })

  it('returns exact string for teal', () => {
    expect(categoryBadge('teal')).toBe('text-teal border border-teal/20')
  })
})

describe('dotColor', () => {
  it.each(['action', 'success', 'warning', 'error'] as const)(
    'returns bg class for status role %s',
    (role) => {
      expect(dotColor(role)).toBe(`bg-${role}`)
    }
  )

  it('returns bg-muted-foreground for muted', () => {
    expect(dotColor('muted')).toBe('bg-muted-foreground')
  })
})

describe('textToBgColor', () => {
  it.each([
    ['text-purple', 'bg-purple'],
    ['text-magenta', 'bg-magenta'],
    ['text-teal', 'bg-teal'],
    ['text-emerald', 'bg-emerald'],
    ['text-lime', 'bg-lime'],
    ['text-brown', 'bg-brown'],
    ['text-amber', 'bg-amber'],
    ['text-graphite', 'bg-graphite'],
    ['text-cyan', 'bg-cyan'],
    ['text-success', 'bg-success'],
    ['text-action', 'bg-action'],
  ] as const)('maps %s → %s', (text, expected) => {
    expect(textToBgColor(text)).toBe(expected)
  })

  it('falls back to bg-action for unknown text classes', () => {
    expect(textToBgColor('text-unknown')).toBe('bg-action')
    expect(textToBgColor('')).toBe('bg-action')
  })
})
