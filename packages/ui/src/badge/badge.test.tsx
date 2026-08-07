import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders its text', () => {
    render(<Badge>Beta</Badge>)

    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it.each([
    ['neutral', 'bg-surface-2'],
    ['accent', 'bg-accent-muted'],
    ['success', 'bg-success-muted'],
    ['warning', 'bg-warning-muted'],
    ['danger', 'bg-danger-muted'],
    ['info', 'bg-info-muted'],
  ] as const)('tints the %s tone from its own muted token', (tone, background) => {
    render(<Badge tone={tone}>Beta</Badge>)

    expect(screen.getByText('Beta').className).toContain(background)
  })

  it('is neutral by default', () => {
    render(<Badge>Beta</Badge>)

    expect(screen.getByText('Beta').className).toContain('bg-surface-2')
  })

  it('is not interactive: no ring, no hover, no press', () => {
    render(<Badge>Beta</Badge>)

    const className = screen.getByText('Beta').className

    expect(className).not.toContain('hover:')
    expect(className).not.toContain('active:')
    expect(className).not.toContain('shadow-focus')
  })

  it('carries no role, because a badge is text', () => {
    render(<Badge>Beta</Badge>)

    expect(screen.getByText('Beta').tagName).toBe('SPAN')
    expect(screen.getByText('Beta')).not.toHaveAttribute('role')
  })

  it('spreads unknown props and forwards its ref', () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(
      <Badge ref={ref} data-testid="badge">
        Beta
      </Badge>,
    )

    expect(ref.current).toBe(screen.getByTestId('badge'))
  })

  it('is axe clean', async () => {
    const { container } = render(<Badge tone="danger">Error</Badge>)

    await expectNoViolations(container)
  })
})
