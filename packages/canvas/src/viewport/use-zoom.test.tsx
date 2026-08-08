import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEPS,
  canvasRect,
  canvasToScreen,
  screenPoint,
  screenToCanvas,
} from '../coords/index'
import { stubGestureEnvironment } from '../test/pointer'

import { type ViewportHandle, useViewport } from './use-viewport'
import { WHEEL_ZOOM_CLAMP, nextZoomStep, useZoom, wheelZoomFactor } from './use-zoom'

const VIEWPORT_BOX = { left: 0, top: 0, width: 1200, height: 800 }

interface Mounted {
  readonly viewport: ViewportHandle
  readonly root: HTMLElement
  readonly commits: () => number
}

function mount(): Mounted {
  let handle: ViewportHandle | null = null
  let commits = 0

  function Harness() {
    const viewport = useViewport({
      onCommit: () => {
        commits += 1
      },
    })

    handle = viewport
    useZoom(viewport, {
      documentRect: () => canvasRect({ x: 0, y: 0, width: 1440, height: 900 }),
    })

    return (
      <div data-testid="root" ref={viewport.rootRef}>
        <div ref={viewport.sceneRef} />
      </div>
    )
  }

  const view = render(<Harness />)
  const root = view.getByTestId('root')

  // jsdom lays nothing out, and the anchor maths is measured against the canvas box.
  root.getBoundingClientRect = () => ({
    ...VIEWPORT_BOX,
    right: 1200,
    bottom: 800,
    x: 0,
    y: 0,
    toJSON: () => '',
  })

  if (handle === null) {
    throw new Error('the hook did not run')
  }

  return { viewport: handle, root, commits: () => commits }
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

describe('wheel zoom', () => {
  it('clamps a single event to one dropdown step', () => {
    expect(WHEEL_ZOOM_CLAMP).toBeCloseTo(4 / 3, 10)
    expect(wheelZoomFactor(-1000)).toBeCloseTo(WHEEL_ZOOM_CLAMP, 10)
    expect(wheelZoomFactor(1000)).toBeCloseTo(1 / WHEEL_ZOOM_CLAMP, 10)
    expect(wheelZoomFactor(-10)).toBeCloseTo(1.1, 10)
    expect(wheelZoomFactor(0)).toBe(1)
  })

  it('zooms at the cursor and keeps that point still', () => {
    const { viewport, root } = mount()
    const anchor = screenPoint(300, 200)
    const anchorCanvas = screenToCanvas(anchor, viewport.current(), VIEWPORT_BOX)

    fireEvent.wheel(root, { ctrlKey: true, deltaY: -20, clientX: anchor.x, clientY: anchor.y })

    const after = canvasToScreen(anchorCanvas, viewport.current(), VIEWPORT_BOX)

    expect(viewport.current().zoom).toBeCloseTo(1.2, 4)
    expect(after.x).toBeCloseTo(anchor.x, 6)
    expect(after.y).toBeCloseTo(anchor.y, 6)
  })

  it('stops the page from zooming with the canvas', () => {
    const { root } = mount()
    const event = new WheelEvent('wheel', {
      ctrlKey: true,
      deltaY: -20,
      cancelable: true,
      bubbles: true,
    })

    root.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves a wheel without the modifier to the pan hook', () => {
    const { viewport, root } = mount()

    fireEvent.wheel(root, { deltaY: -100 })

    expect(viewport.current().zoom).toBe(1)
  })

  it('commits once the wheel goes quiet, not per event', () => {
    const { root, commits } = mount()

    for (let event = 0; event < 6; event += 1) {
      fireEvent.wheel(root, { ctrlKey: true, deltaY: -10, clientX: 10, clientY: 10 })
      vi.advanceTimersByTime(16)
    }

    expect(commits()).toBe(0)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(commits()).toBe(1)
  })
})

describe('nextZoomStep', () => {
  it('walks the dropdown values in both directions', () => {
    expect(nextZoomStep(1, 1)).toBe(1.5)
    expect(nextZoomStep(1, -1)).toBe(0.75)
    expect(nextZoomStep(1.2, 1)).toBe(1.5)
    expect(nextZoomStep(1.2, -1)).toBe(1)
  })

  it('stops at the bounds', () => {
    expect(nextZoomStep(ZOOM_STEPS.at(-1) ?? 4, 1)).toBe(MAX_ZOOM)
    expect(nextZoomStep(ZOOM_STEPS[0] ?? 0.25, -1)).toBe(MIN_ZOOM)
  })
})

describe('keyboard zoom', () => {
  it('steps up and down through the dropdown values', () => {
    const { viewport } = mount()

    act(() => {
      fireEvent.keyDown(window, { key: '=', ctrlKey: true })
    })

    expect(viewport.current().zoom).toBe(1.5)

    act(() => {
      fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    })

    expect(viewport.current().zoom).toBe(1)
  })

  it('returns to 100 % and commits', () => {
    const { viewport, commits } = mount()

    act(() => {
      fireEvent.keyDown(window, { key: '=', ctrlKey: true })
      fireEvent.keyDown(window, { key: '=', ctrlKey: true })
      fireEvent.keyDown(window, { key: '0', ctrlKey: true })
    })

    expect(viewport.current().zoom).toBe(1)
    expect(commits()).toBe(3)
  })

  it('fits the document on Shift+1', () => {
    const { viewport } = mount()

    act(() => {
      fireEvent.keyDown(window, { code: 'Digit1', key: '!', shiftKey: true })
    })

    // 1440 wide against 1200 − 128 of padding is the tighter axis, and the document fit stops at 1:1.
    expect(viewport.current().zoom).toBeCloseTo((1200 - 128) / 1440, 4)
  })

  it('ignores the fit key when a modifier is held', () => {
    const { viewport } = mount()

    act(() => {
      fireEvent.keyDown(window, { code: 'Digit1', key: '1', shiftKey: true, ctrlKey: true })
    })

    expect(viewport.current().zoom).toBe(1)
  })
})
