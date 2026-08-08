import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { pointAt, renderCanvas } from '../test/harness'
import { stubGestureEnvironment } from '../test/pointer'
import { fakeScene } from '../test/scene'

const build = () =>
  fakeScene({
    root: { children: ['hero', 'gallery'], name: 'Page' },
    hero: { children: ['heading'], name: 'Hero' },
    heading: { name: 'Heading' },
    gallery: { children: [], name: 'Gallery' },
  })

const move = (over: string | null) => {
  pointAt(over)
  fireEvent.pointerMove(screen.getByTestId('canvas-root'), { clientX: 10, clientY: 10 })
}

const frame = () =>
  act(() => {
    vi.advanceTimersToNextFrame()
  })

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useHitTest', () => {
  it('reports the node the same filter chain would select', () => {
    const fake = build()

    renderCanvas(fake)
    move('heading')
    frame()

    expect(fake.selection.hover).toHaveBeenCalledWith(fake.id('hero'))
  })

  it('coalesces a burst of moves into one hit test', () => {
    const fake = build()

    renderCanvas(fake)
    move('heading')
    move('heading')
    move('heading')
    frame()

    expect(fake.selection.hover).toHaveBeenCalledTimes(1)
  })

  it('reports a change only when the node under the cursor changes', () => {
    const fake = build()

    renderCanvas(fake)
    move('heading')
    frame()
    move('heading')
    frame()

    expect(fake.selection.hover).toHaveBeenCalledTimes(1)

    move('gallery')
    frame()

    expect(fake.selection.hover).toHaveBeenLastCalledWith(fake.id('gallery'))
  })

  it('clears the hover when the pointer leaves the canvas', () => {
    const fake = build()

    renderCanvas(fake)
    move('heading')
    frame()
    fireEvent.pointerLeave(screen.getByTestId('canvas-root'))

    expect(fake.selection.hover).toHaveBeenLastCalledWith(null)
  })

  it('stands aside during a pan and during a marquee', () => {
    const fake = build()

    renderCanvas(fake)

    const root = screen.getByTestId('canvas-root')

    root.dataset['panning'] = 'true'
    move('heading')
    frame()

    expect(fake.selection.hover).not.toHaveBeenCalled()

    root.removeAttribute('data-panning')
    root.dataset['marquee'] = 'true'
    move('heading')
    frame()

    expect(fake.selection.hover).not.toHaveBeenCalled()
  })
})
