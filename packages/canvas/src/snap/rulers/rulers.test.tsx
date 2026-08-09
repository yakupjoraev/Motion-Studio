import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { stubGestureEnvironment } from '../../test/pointer'
import { type ViewportHandle, useViewport } from '../../viewport/use-viewport'
import type { CanvasGuidePort, SnapAxis } from '../snap.types'

import { Rulers } from './rulers'

interface Mounted {
  readonly viewport: ViewportHandle
  readonly added: { axis: SnapAxis; value: number }[]
}

const VIEWPORT = { left: 0, top: 0, width: 800, height: 600 }

function mount(zoom = 1): Mounted {
  let viewport: ViewportHandle | null = null
  const added: { axis: SnapAxis; value: number }[] = []

  const guides: CanvasGuidePort = {
    guides: [],
    add: (axis, value) => added.push({ axis, value }),
    move: vi.fn(),
    remove: vi.fn(),
  }

  function Harness() {
    const handle = useViewport({ initial: { zoom, pan: { x: 0, y: 0 } } })

    viewport = handle

    return (
      <div ref={handle.rootRef}>
        <Rulers guides={guides} viewport={handle} />
      </div>
    )
  }

  render(<Harness />)

  if (viewport === null) {
    throw new Error('the hook did not run')
  }

  return { viewport, added }
}

const labels = (axis: SnapAxis): string[] =>
  [...screen.getByTestId(`ruler-${axis}`).querySelectorAll('span')].map(
    (span) => span.textContent ?? '',
  )

const frames = (): void => {
  act(() => {
    vi.advanceTimersToNextFrame()
  })
}

/** jsdom implements neither of these, and the ruler needs both: a box to measure and a hit test. */
const pointerOver = (element: Element | null): void => {
  document.elementFromPoint = () => element
}

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(VIEWPORT as DOMRect)
  pointerOver(document.body)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Rulers', () => {
  it('labels every 100 canvas units at 100 % zoom', () => {
    mount()
    frames()

    // One viewport either side of what is visible, so a pan of half a screen needs no render.
    expect(labels('x').slice(0, 3)).toEqual(['-800', '-700', '-600'])
    expect(labels('x')).toEqual(expect.arrayContaining(['0', '100', '800', '1600']))
  })

  it('places a label with calc over the viewport variables, so a pan needs no render', () => {
    mount()
    frames()

    const label = [...screen.getByTestId('ruler-x').querySelectorAll('span')].find(
      (span) => span.textContent === '100',
    )

    expect(label?.style.left).toBe('calc((var(--ms-vp-x, 0px) + 100px) * var(--ms-vp-zoom, 1))')
  })

  it('re-spaces the labels when the zoom crosses a step', () => {
    const { viewport } = mount()

    frames()
    expect(labels('x')).toContain('100')

    act(() => {
      viewport.set({ zoom: 0.25, pan: { x: 0, y: 0 } })
    })
    frames()

    expect(labels('x')).not.toContain('100')
    expect(labels('x')).toContain('500')
  })

  it('follows the pointer with the cursor marker', () => {
    const { viewport } = mount()

    fireEvent.pointerMove(viewport.rootRef.current as HTMLElement, { clientX: 240, clientY: 90 })
    frames()

    expect(screen.getByTestId('ruler-cursor-x').style.getPropertyValue('--ms-ruler-cursor')).toBe(
      '240px',
    )
    expect(screen.getByTestId('ruler-cursor-y').style.getPropertyValue('--ms-ruler-cursor')).toBe(
      '90px',
    )
  })

  it('creates a horizontal guide dragged off the top ruler', () => {
    const { added } = mount()

    const strip = screen.getByTestId('ruler-x')

    fireEvent.pointerDown(strip, { clientX: 300, clientY: 10, pointerId: 1 })

    expect(screen.getByTestId('guide-preview-y')).toHaveAttribute('data-active')

    act(() => {
      fireEvent.pointerMove(window, { clientX: 300, clientY: 240, pointerId: 1 })
    })
    frames()

    expect(screen.getByTestId('guide-preview-y').style.top).toBe(
      'calc((var(--ms-vp-y, 0px) + 240px) * var(--ms-vp-zoom, 1))',
    )

    fireEvent.pointerUp(window, { clientX: 300, clientY: 240, pointerId: 1 })

    expect(added).toEqual([{ axis: 'y', value: 240 }])
    expect(screen.getByTestId('guide-preview-y')).not.toHaveAttribute('data-active')
  })

  it('creates a vertical guide dragged off the left ruler', () => {
    const { added } = mount()

    fireEvent.pointerDown(screen.getByTestId('ruler-y'), {
      clientX: 10,
      clientY: 300,
      pointerId: 1,
    })
    fireEvent.pointerUp(window, { clientX: 420, clientY: 300, pointerId: 1 })

    expect(added).toEqual([{ axis: 'x', value: 420 }])
  })

  it('creates nothing when the press is released back on the ruler', () => {
    const { added } = mount()

    const strip = screen.getByTestId('ruler-x')

    fireEvent.pointerDown(strip, { clientX: 300, clientY: 10, pointerId: 1 })
    pointerOver(strip)
    fireEvent.pointerUp(window, { clientX: 300, clientY: 10, pointerId: 1 })

    expect(added).toEqual([])
  })

  it('reads the value in canvas units, not screen pixels', () => {
    const { added, viewport } = mount(2)

    act(() => {
      viewport.set({ zoom: 2, pan: { x: 40, y: 0 } })
    })

    fireEvent.pointerDown(screen.getByTestId('ruler-y'), {
      clientX: 10,
      clientY: 300,
      pointerId: 1,
    })
    fireEvent.pointerUp(window, { clientX: 400, clientY: 300, pointerId: 1 })

    // 400 screen px at zoom 2 is 200 canvas units, less the 40 of pan.
    expect(added).toEqual([{ axis: 'x', value: 160 }])
  })
})
