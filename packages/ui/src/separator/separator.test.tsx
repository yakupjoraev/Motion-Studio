import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Separator } from './separator'

describe('Separator', () => {
  it('is invisible to assistive technology by default', () => {
    // A rule that only groups things visually is noise in the accessibility tree.
    const { container } = render(<Separator />)

    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
    expect(container.firstElementChild).not.toBeNull()
  })

  it('announces itself when it carries meaning', () => {
    render(<Separator decorative={false} />)

    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it.each([
    ['horizontal', 'h-px'],
    ['vertical', 'w-px'],
  ] as const)('draws a hairline on the %s axis', (orientation, hairline) => {
    const { container } = render(<Separator orientation={orientation} />)

    expect(container.firstElementChild?.className).toContain(hairline)
  })

  it('reports its orientation when it is not decorative', () => {
    render(<Separator orientation="vertical" decorative={false} />)

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('spreads unknown props and forwards its ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Separator ref={ref} data-testid="rule" />)

    expect(ref.current).toBe(screen.getByTestId('rule'))
  })

  it('is axe clean', async () => {
    const { container } = render(<Separator decorative={false} />)

    await expectNoViolations(container)
  })
})
