import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ViewportTransform } from '../coords/index'

import {
  GRID_FADE_FROM,
  GRID_FADE_TO,
  VIEWPORT_VARS,
  type ViewportHandle,
  type ViewportOptions,
  gridOpacity,
  useViewport,
  wheelCommitter,
} from './use-viewport'

interface Mounted {
  readonly viewport: ViewportHandle
  readonly scene: HTMLDivElement
  readonly root: HTMLDivElement
}

/** Mounts the hook against a scene and a root, and reports how often React rendered. */
function mount(options: ViewportOptions = {}): Mounted & { renders: () => number } {
  let handle: ViewportHandle | null = null
  let renders = 0

  function Harness() {
    const viewport = useViewport(options)

    handle = viewport
    renders += 1

    return (
      <div data-testid="root" ref={viewport.rootRef} style={{ height: '800px', width: '1200px' }}>
        <div data-testid="scene" ref={viewport.sceneRef} />
      </div>
    )
  }

  const view = render(<Harness />)
  const scene = view.getByTestId('scene')
  const root = view.getByTestId('root')

  if (handle === null) {
    throw new Error('the hook did not run')
  }

  return {
    viewport: handle,
    scene: scene as HTMLDivElement,
    root: root as HTMLDivElement,
    renders: () => renders,
  }
}

const frames = (): void => {
  act(() => {
    vi.advanceTimersToNextFrame()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useViewport', () => {
  it('writes the transform as CSS variables on the canvas root', () => {
    const { viewport, root } = mount()

    act(() => {
      viewport.set({ zoom: 2, pan: { x: 30, y: -40 } })
    })
    frames()

    // ADR-086: the scene inherits them, and so does every overlay outside the scene transform.
    expect(root.style.getPropertyValue(VIEWPORT_VARS.x)).toBe('30px')
    expect(root.style.getPropertyValue(VIEWPORT_VARS.y)).toBe('-40px')
    expect(root.style.getPropertyValue(VIEWPORT_VARS.zoom)).toBe('2')
  })

  it('coalesces many updates in one frame into a single write', () => {
    const { viewport, root } = mount()

    frames()

    const writes = vi.spyOn(root.style, 'setProperty')

    act(() => {
      for (let step = 0; step < 20; step += 1) {
        viewport.panBy(1, 1)
      }
    })

    expect(writes).not.toHaveBeenCalled()

    frames()

    // Four properties, written once: x, y, zoom and the grid's opacity.
    expect(writes).toHaveBeenCalledTimes(4)
    expect(root.style.getPropertyValue(VIEWPORT_VARS.x)).toBe('20px')
  })

  it('tells its subscribers after each frame, and stops when they unsubscribe', () => {
    const { viewport } = mount()
    const listener = vi.fn()

    const unsubscribe = viewport.subscribe(listener)

    act(() => {
      viewport.panBy(10, 0)
    })
    frames()

    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()

    act(() => {
      viewport.panBy(10, 0)
    })
    frames()

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('renders React once, not per update', () => {
    const { viewport, renders } = mount()
    const before = renders()

    act(() => {
      for (let step = 0; step < 50; step += 1) {
        viewport.panBy(2, 0)
      }
    })
    frames()

    expect(renders()).toBe(before)
  })

  it('divides a screen delta by the zoom', () => {
    const { viewport } = mount({ initial: { zoom: 2, pan: { x: 0, y: 0 } } })

    act(() => {
      viewport.panBy(100, -50)
    })

    expect(viewport.current().pan).toEqual({ x: 50, y: -25 })

    act(() => {
      viewport.set({ zoom: 0.5, pan: { x: 0, y: 0 } })
      viewport.panBy(100, 0)
    })

    expect(viewport.current().pan.x).toBe(200)
  })

  it('promotes the scene for the length of a gesture and no longer', () => {
    const { viewport, scene } = mount()

    act(() => {
      viewport.panBy(10, 10)
    })

    expect(scene.style.willChange).toBe('transform')

    act(() => {
      viewport.commit()
    })

    expect(scene.style.willChange).toBe('')
  })

  it('hands the committed transform to the store once', () => {
    const committed: ViewportTransform[] = []
    const { viewport } = mount({ onCommit: (transform) => committed.push(transform) })

    act(() => {
      viewport.panBy(10, 0)
      viewport.panBy(10, 0)
      viewport.commit()
    })

    expect(committed).toHaveLength(1)
    expect(committed[0]?.pan.x).toBe(20)
  })

  it('clamps whatever it is handed', () => {
    const { viewport } = mount()

    act(() => {
      viewport.set({ zoom: 99, pan: { x: 0, y: 0 } })
    })

    expect(viewport.current().zoom).toBe(4)
  })
})

describe('gridOpacity', () => {
  it('hides below the fade, is solid above it, and ramps between', () => {
    expect(gridOpacity(0.2)).toBe(0)
    expect(gridOpacity(GRID_FADE_FROM)).toBe(0)
    expect(gridOpacity(0.375)).toBeCloseTo(0.5, 6)
    expect(gridOpacity(GRID_FADE_TO)).toBe(1)
    expect(gridOpacity(3)).toBe(1)
  })
})

describe('wheelCommitter', () => {
  it('commits once the wheel has been quiet, not per event', () => {
    const commit = vi.fn()
    const wheel = wheelCommitter(commit)

    for (let event = 0; event < 10; event += 1) {
      wheel.bump()
      vi.advanceTimersByTime(20)
    }

    expect(commit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)

    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('forgets a pending commit when cancelled', () => {
    const commit = vi.fn()
    const wheel = wheelCommitter(commit)

    wheel.bump()
    wheel.cancel()
    vi.advanceTimersByTime(500)

    expect(commit).not.toHaveBeenCalled()
  })
})
