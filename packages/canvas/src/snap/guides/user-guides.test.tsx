import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { stubGestureEnvironment } from '../../test/pointer'
import { useViewport } from '../../viewport/use-viewport'
import type { CanvasGuidePort, UserGuide } from '../snap.types'

import { UserGuides } from './user-guides'

const VIEWPORT = { left: 0, top: 0, width: 800, height: 600 }

const port = (guides: readonly UserGuide[]): CanvasGuidePort => ({
  guides,
  add: vi.fn(),
  move: vi.fn(),
  remove: vi.fn(),
})

function mount(guides: CanvasGuidePort, zoom = 1) {
  function Harness() {
    const viewport = useViewport({ initial: { zoom, pan: { x: 0, y: 0 } } })

    return (
      <div ref={viewport.rootRef}>
        <div data-ruler="" data-testid="ruler" />
        <UserGuides guides={guides} viewport={viewport} />
      </div>
    )
  }

  return render(<Harness />)
}

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

describe('UserGuides', () => {
  it('places each guide with calc over the viewport variables', () => {
    mount(
      port([
        { id: 'g1', axis: 'x', value: 240 },
        { id: 'g2', axis: 'y', value: 80 },
      ]),
    )

    expect(screen.getByTestId('user-guide-g1').style.left).toBe(
      'calc((var(--ms-vp-x, 0px) + 240px) * var(--ms-vp-zoom, 1))',
    )
    expect(screen.getByTestId('user-guide-g2').style.top).toBe(
      'calc((var(--ms-vp-y, 0px) + 80px) * var(--ms-vp-zoom, 1))',
    )
  })

  it('follows the pointer during a drag and commits once, on release', () => {
    const guides = port([{ id: 'g1', axis: 'x', value: 240 }])

    mount(guides)

    const line = screen.getByTestId('user-guide-g1')

    fireEvent.pointerDown(line, { clientX: 240, clientY: 100, pointerId: 1 })

    act(() => {
      fireEvent.pointerMove(window, { clientX: 300, clientY: 100, pointerId: 1 })
      vi.advanceTimersToNextFrame()
    })

    expect(line.style.left).toBe('calc((var(--ms-vp-x, 0px) + 300px) * var(--ms-vp-zoom, 1))')
    expect(guides.move).not.toHaveBeenCalled()

    fireEvent.pointerUp(window, { clientX: 300, clientY: 100, pointerId: 1 })

    expect(guides.move).toHaveBeenCalledWith('g1', 300)
  })

  it('deletes the guide dropped back on a ruler', () => {
    const guides = port([{ id: 'g1', axis: 'x', value: 240 }])

    mount(guides)

    fireEvent.pointerDown(screen.getByTestId('user-guide-g1'), { clientX: 240, pointerId: 1 })
    pointerOver(screen.getByTestId('ruler'))
    fireEvent.pointerUp(window, { clientX: 10, clientY: 10, pointerId: 1 })

    expect(guides.remove).toHaveBeenCalledWith('g1')
    expect(guides.move).not.toHaveBeenCalled()
  })

  it('reads the dropped position in canvas units', () => {
    const guides = port([{ id: 'g1', axis: 'x', value: 240 }])

    mount(guides, 2)

    fireEvent.pointerDown(screen.getByTestId('user-guide-g1'), { clientX: 240, pointerId: 1 })
    fireEvent.pointerUp(window, { clientX: 300, clientY: 100, pointerId: 1 })

    expect(guides.move).toHaveBeenCalledWith('g1', 150)
  })

  it('takes an exact value on double-click', () => {
    const guides = port([{ id: 'g1', axis: 'x', value: 240 }])

    mount(guides)

    fireEvent.doubleClick(screen.getByTestId('user-guide-g1'))

    const input = screen.getByTestId('guide-input')

    expect(input).toHaveValue(240)

    fireEvent.change(input, { target: { value: '512' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(guides.move).toHaveBeenCalledWith('g1', 512)
    expect(screen.queryByTestId('guide-input')).not.toBeInTheDocument()
  })

  it('keeps the guide where it was when the edit is cancelled', () => {
    const guides = port([{ id: 'g1', axis: 'x', value: 240 }])

    mount(guides)

    fireEvent.doubleClick(screen.getByTestId('user-guide-g1'))
    fireEvent.change(screen.getByTestId('guide-input'), { target: { value: '9' } })
    fireEvent.keyDown(screen.getByTestId('guide-input'), { key: 'Escape' })

    expect(guides.move).not.toHaveBeenCalled()
    expect(screen.queryByTestId('guide-input')).not.toBeInTheDocument()
  })
})
