import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { stubGestureEnvironment, stubReducedMotion } from '../test/pointer'

import { MOMENTUM_DECAY, MOMENTUM_STOP, decaySteps, prefersReducedMotion, usePan } from './use-pan'
import { type ViewportHandle, useViewport } from './use-viewport'

interface Mounted {
  readonly viewport: ViewportHandle
  readonly root: HTMLElement
}

function mount(): Mounted {
  let handle: ViewportHandle | null = null

  function Harness() {
    const viewport = useViewport()

    handle = viewport
    usePan(viewport)

    return (
      <div data-testid="root" ref={viewport.rootRef}>
        <div ref={viewport.sceneRef} />
      </div>
    )
  }

  const view = render(<Harness />)

  if (handle === null) {
    throw new Error('the hook did not run')
  }

  return { viewport: handle, root: view.getByTestId('root') }
}

const move = (root: HTMLElement, movementX: number, movementY: number): void => {
  fireEvent.pointerMove(root, { pointerId: 1, movementX, movementY })
}

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('usePan', () => {
  it('pans on a middle-button drag', () => {
    const { viewport, root } = mount()

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })
    move(root, 40, -20)
    fireEvent.pointerUp(root, { pointerId: 1 })

    expect(viewport.current().pan).toEqual({ x: 40, y: -20 })
  })

  it('ignores a left-button drag until space is held', () => {
    const { viewport, root } = mount()

    fireEvent.pointerDown(root, { button: 0, pointerId: 1 })
    move(root, 40, 0)

    expect(viewport.current().pan.x).toBe(0)

    act(() => {
      fireEvent.keyDown(window, { code: 'Space' })
    })

    expect(root.dataset['panMode']).toBe('true')

    fireEvent.pointerDown(root, { button: 0, pointerId: 1 })
    move(root, 40, 0)

    expect(viewport.current().pan.x).toBe(40)
  })

  it('leaves pan mode when the window loses focus mid-hold', () => {
    const { root } = mount()

    act(() => {
      fireEvent.keyDown(window, { code: 'Space' })
    })

    expect(root.dataset['panMode']).toBe('true')

    act(() => {
      fireEvent.blur(window)
    })

    expect(root.dataset['panMode']).toBeUndefined()

    fireEvent.pointerDown(root, { button: 0, pointerId: 1 })
    move(root, 25, 0)

    expect(root.dataset['panning']).toBeUndefined()
  })

  it('marks and unmarks the panning state around a drag', () => {
    const { root } = mount()

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })

    expect(root.dataset['panning']).toBe('true')

    fireEvent.pointerUp(root, { pointerId: 1 })

    expect(root.dataset['panning']).toBeUndefined()
  })

  it('pans on a trackpad wheel and commits when the wheel goes quiet', () => {
    let commits = 0

    function Harness() {
      const viewport = useViewport({
        onCommit: () => {
          commits += 1
        },
      })

      usePan(viewport)

      return (
        <div data-testid="root" ref={viewport.rootRef}>
          <div ref={viewport.sceneRef} />
        </div>
      )
    }

    const view = render(<Harness />)
    const root = view.getByTestId('root')

    for (let event = 0; event < 5; event += 1) {
      fireEvent.wheel(root, { deltaX: 10, deltaY: 20 })
      vi.advanceTimersByTime(16)
    }

    expect(commits).toBe(0)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(commits).toBe(1)
  })

  it('throws with momentum, and stops', () => {
    stubReducedMotion(false)

    const { viewport, root } = mount()

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })
    move(root, 30, 0)

    const atRelease = viewport.current().pan.x

    fireEvent.pointerUp(root, { pointerId: 1 })

    act(() => {
      for (let frame = 0; frame < 400; frame += 1) {
        vi.advanceTimersToNextFrame()
      }
    })

    const afterThrow = viewport.current().pan.x

    expect(afterThrow).toBeGreaterThan(atRelease)
    // The decay is geometric, so the whole throw is bounded by the sum of the series.
    expect(afterThrow).toBeLessThan(atRelease + 30 / (1 - MOMENTUM_DECAY))
  })

  it('does not throw under reduced motion', () => {
    stubReducedMotion(true)

    const { viewport, root } = mount()

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })
    move(root, 30, 0)
    fireEvent.pointerUp(root, { pointerId: 1 })

    const atRelease = viewport.current().pan.x

    act(() => {
      for (let frame = 0; frame < 60; frame += 1) {
        vi.advanceTimersToNextFrame()
      }
    })

    expect(viewport.current().pan.x).toBe(atRelease)
  })

  it('does not throw below the start threshold', () => {
    stubReducedMotion(false)

    const { viewport, root } = mount()

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })
    move(root, 0.5, 0)
    fireEvent.pointerUp(root, { pointerId: 1 })

    const atRelease = viewport.current().pan.x

    act(() => {
      for (let frame = 0; frame < 30; frame += 1) {
        vi.advanceTimersToNextFrame()
      }
    })

    expect(viewport.current().pan.x).toBe(atRelease)
  })
})

describe('momentum decay', () => {
  it('terminates from any starting velocity', () => {
    for (const velocity of [0.05, 1, 40, 4000]) {
      const frames = decaySteps(velocity)

      expect(frames).toBeLessThan(300)
      expect(Math.abs(velocity) * MOMENTUM_DECAY ** frames).toBeLessThan(MOMENTUM_STOP)
    }
  })
})

describe('prefersReducedMotion', () => {
  it('answers false without an element to read', () => {
    expect(prefersReducedMotion(null)).toBe(false)
  })

  it('reads the variable ADR-021 made the single answer', () => {
    const { root } = mount()

    stubReducedMotion(true)
    expect(prefersReducedMotion(root)).toBe(true)

    vi.restoreAllMocks()
    stubReducedMotion(false)
    expect(prefersReducedMotion(root)).toBe(false)
  })
})
