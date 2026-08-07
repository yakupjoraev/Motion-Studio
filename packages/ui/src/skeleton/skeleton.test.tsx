import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations } from './../test/axe'

import { Skeleton } from './skeleton'

const rendered = (element: HTMLElement): HTMLElement => element.firstElementChild as HTMLElement

describe('Skeleton', () => {
  it('renders at the exact final size, so nothing shifts when the content arrives', () => {
    const { container } = render(<Skeleton width={88} height={88} />)

    expect(rendered(container).style.width).toBe('88px')
    expect(rendered(container).style.height).toBe('88px')
  })

  it('takes a CSS length as well as a number', () => {
    const { container } = render(<Skeleton width="100%" height="2rem" />)

    expect(rendered(container).style.width).toBe('100%')
    expect(rendered(container).style.height).toBe('2rem')
  })

  it.each([
    ['rect', 'rounded-sm'],
    ['text', 'rounded-xs'],
    ['circle', 'rounded-full'],
  ] as const)('shapes %s', (shape, radius) => {
    const { container } = render(<Skeleton shape={shape} />)

    expect(rendered(container).className).toContain(radius)
  })

  it('gives a text line its own height without being told', () => {
    const { container } = render(<Skeleton shape="text" />)

    expect(rendered(container).className).toContain('h-[10px]')
  })

  it('is hidden from assistive technology', () => {
    // Announcing "blank" once per placeholder is worse than silence.
    const { container } = render(<Skeleton width={88} height={88} />)

    expect(rendered(container)).toHaveAttribute('aria-hidden', 'true')
  })

  it('takes its colour from a token, not from a hex', () => {
    const { container } = render(<Skeleton />)

    expect(rendered(container).className).toContain('bg-surface-2')
  })

  it('opts into the pulse, whose duration is a token and therefore honours reduced motion', () => {
    const { container } = render(<Skeleton />)

    expect(rendered(container)).toHaveAttribute('data-ms-skeleton')
  })

  it('keeps a caller style alongside its own size', () => {
    const { container } = render(<Skeleton width={40} style={{ marginTop: '4px' }} />)

    expect(rendered(container).style.marginTop).toBe('4px')
    expect(rendered(container).style.width).toBe('40px')
  })

  it('spreads unknown props and forwards its ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(<Skeleton ref={ref} data-testid="placeholder" />)

    expect(ref.current).toBe(rendered(container))
  })

  it('is axe clean', async () => {
    const { container } = render(<Skeleton width={88} height={88} />)

    await expectNoViolations(container)
  })
})
