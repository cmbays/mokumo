/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Outline, OutlineGroup, OutlineItem } from '../index'

describe('Outline Component', () => {
  it('renders with multiple groups and items', () => {
    const { container } = render(
      <Outline>
        <OutlineGroup label="Feb 24 – Mar 2">
          <OutlineItem icon={CheckCircle} label="Job #42 completed" />
          <OutlineItem icon={AlertCircle} color="warning" label="Quote pending" />
        </OutlineGroup>
        <OutlineGroup label="Feb 17 – Feb 23">
          <OutlineItem icon={Clock} label="Screen burning started" />
        </OutlineGroup>
      </Outline>
    )

    expect(container.textContent).toContain('Feb 24 – Mar 2')
    expect(container.textContent).toContain('Feb 17 – Feb 23')
    expect(container.textContent).toContain('Job #42 completed')
    expect(container.textContent).toContain('Quote pending')
    expect(container.textContent).toContain('Screen burning started')
  })

  it('renders OutlineItem with icon and color', () => {
    const { container } = render(
      <OutlineItem icon={CheckCircle} color="success" label="Task completed" />
    )

    expect(container.textContent).toContain('Task completed')
  })

  it('renders OutlineItem with description', () => {
    const { container } = render(
      <OutlineItem icon={CheckCircle} label="Job completed" description="2,500 units pressed" />
    )

    expect(container.textContent).toContain('Job completed')
    expect(container.textContent).toContain('2,500 units pressed')
  })

  it('renders multiple items in a group', () => {
    const { container } = render(
      <OutlineGroup label="Screen Room">
        <OutlineItem icon={CheckCircle} label="Screen #12 burned" />
        <OutlineItem icon={CheckCircle} label="Emulsion prep complete" />
        <OutlineItem icon={AlertCircle} color="warning" label="Screen #5 needs cleaning" />
      </OutlineGroup>
    )

    expect(container.textContent).toContain('Screen Room')
    expect(container.textContent).toContain('Screen #12 burned')
    expect(container.textContent).toContain('Emulsion prep complete')
    expect(container.textContent).toContain('Screen #5 needs cleaning')
  })

  it('supports all color variants', () => {
    const { container } = render(
      <div>
        <OutlineItem icon={CheckCircle} color="success" label="Success" />
        <OutlineItem icon={AlertCircle} color="warning" label="Warning" />
        <OutlineItem icon={AlertCircle} color="error" label="Error" />
        <OutlineItem icon={CheckCircle} color="action" label="Action" />
        <OutlineItem icon={Clock} color="muted" label="Muted" />
      </div>
    )

    expect(container.textContent).toContain('Success')
    expect(container.textContent).toContain('Warning')
    expect(container.textContent).toContain('Error')
    expect(container.textContent).toContain('Action')
    expect(container.textContent).toContain('Muted')
  })
})
