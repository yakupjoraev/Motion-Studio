import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DropIndicator } from '../dnd.types'
import { DropIndicatorLayer } from './drop-indicator-layer'
import { createIndicatorHandle } from './indicator-handle'
import { INDICATOR_VARS } from './indicator.styles'

const rect = { x: 10, y: 20, width: 30, height: 40 }

describe('DropIndicatorLayer', () => {
  it('draws nothing until there is something to draw', () => {
    const handle = createIndicatorHandle()

    render(<DropIndicatorLayer handle={handle} />)

    expect(screen.queryByTestId('drop-line')).toBeNull()
    expect(screen.queryByTestId('drop-fill')).toBeNull()
  })

  it.each<[DropIndicator, string]>([
    [{ kind: 'line', axis: 'y', rect }, 'drop-line'],
    [{ kind: 'fill', rect }, 'drop-fill'],
    [{ kind: 'cell', rect }, 'drop-cell'],
    [{ kind: 'reject', rect, reason: 'Layer is locked' }, 'drop-reject'],
  ])('draws the element that goes with the kind', (indicator, testId) => {
    const handle = createIndicatorHandle()

    render(<DropIndicatorLayer handle={handle} />)
    act(() => {
      handle.set(indicator)
    })

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })

  it('positions the element it just mounted', () => {
    const handle = createIndicatorHandle()

    render(<DropIndicatorLayer handle={handle} />)
    act(() => {
      handle.set({ kind: 'fill', rect })
    })

    const box = screen.getByTestId('drop-fill')

    expect(box.style.getPropertyValue(INDICATOR_VARS.x)).toBe('10px')
    expect(box.style.getPropertyValue(INDICATOR_VARS.height)).toBe('40px')
  })

  it('shows the reason a target refused', () => {
    const handle = createIndicatorHandle()

    render(<DropIndicatorLayer handle={handle} />)
    act(() => {
      handle.set({ kind: 'reject', rect, reason: 'Navbar accepts up to 6 links' })
    })

    expect(screen.getByTestId('drop-reject-reason')).toHaveTextContent(
      'Navbar accepts up to 6 links',
    )
  })

  it('takes the element away when the drag ends', () => {
    const handle = createIndicatorHandle()

    render(<DropIndicatorLayer handle={handle} />)
    act(() => {
      handle.set({ kind: 'cell', rect })
    })
    act(() => {
      handle.set(null)
    })

    expect(screen.queryByTestId('drop-cell')).toBeNull()
  })
})
