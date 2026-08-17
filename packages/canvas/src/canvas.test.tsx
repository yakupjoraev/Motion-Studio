import { nodeId } from '@motion-studio/schema'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Canvas } from './canvas'
import { SCENE_TRANSFORM } from './canvas.styles'
import { NodeWrapper } from './node-wrapper'
import { stubGestureEnvironment } from './test/pointer'
import { fakeScene } from './test/scene'
import { VIEWPORT_VARS } from './viewport/use-viewport'
import { useViewportContext } from './viewport/viewport-context'

const ROOT = nodeId('node_root')

const renderCanvas = (props: Partial<Parameters<typeof Canvas>[0]> = {}) => {
  const fake = fakeScene({ root: { children: [] } })

  return render(
    <Canvas
      artboardWidth={1440}
      renderNode={(id) => <div data-node-id={id}>{id}</div>}
      rootId={ROOT}
      scene={fake.scene}
      selection={fake.selection}
      {...props}
    />,
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Canvas', () => {
  it('renders the scene, the artboard and the node it was handed', () => {
    renderCanvas()

    expect(screen.getByTestId('canvas-root')).toHaveAttribute('role', 'application')
    expect(screen.getByTestId('canvas-scene')).toHaveStyle({ transform: SCENE_TRANSFORM })
    expect(screen.getByTestId('canvas-artboard')).toHaveStyle({ width: '1440px' })
    expect(screen.getByText('node_root')).toBeInTheDocument()
  })

  it('writes the initial transform on mount', () => {
    renderCanvas({ initialTransform: { zoom: 0.5, pan: { x: 12, y: 8 } } })

    act(() => {
      vi.advanceTimersToNextFrame()
    })

    // ADR-086: the variables live on the root, so the overlays outside the scene can read them.
    const root = screen.getByTestId('canvas-root')

    expect(root.style.getPropertyValue(VIEWPORT_VARS.zoom)).toBe('0.5')
    expect(root.style.getPropertyValue(VIEWPORT_VARS.x)).toBe('12px')
    // 0.5 is the top of the grid fade, so the dots are fully opaque there.
    expect(root.style.getPropertyValue(VIEWPORT_VARS.gridOpacity)).toBe('1')
  })

  it('shows the grid unless it is turned off', () => {
    const { unmount } = renderCanvas()

    expect(screen.getByTestId('canvas-grid')).toBeInTheDocument()

    unmount()
    renderCanvas({ showGrid: false })

    expect(screen.queryByTestId('canvas-grid')).not.toBeInTheDocument()
  })

  it('tells the store about a gesture once, when it is over', () => {
    const onTransformCommit = vi.fn()

    renderCanvas({ onTransformCommit })

    const root = screen.getByTestId('canvas-root')

    fireEvent.pointerDown(root, { button: 1, pointerId: 1 })

    for (let step = 0; step < 10; step += 1) {
      fireEvent.pointerMove(root, { pointerId: 1, movementX: 5, movementY: 0 })
    }

    expect(onTransformCommit).not.toHaveBeenCalled()

    fireEvent.pointerUp(root, { pointerId: 1 })

    // The release throws with momentum, so the gesture ends when the decay does — one commit either
    // way, which is the property under test.
    act(() => {
      for (let frame = 0; frame < 200; frame += 1) {
        vi.advanceTimersToNextFrame()
      }
    })

    expect(onTransformCommit).toHaveBeenCalledTimes(1)
    expect(onTransformCommit.mock.calls[0]?.[0]?.pan.x).toBeGreaterThanOrEqual(50)
  })

  it('refuses to hand out a viewport outside the canvas', () => {
    expect(() => renderHook(() => useViewportContext())).toThrow(/inside the Canvas/)
  })

  it('hands out a handle on mount and takes it back on unmount', () => {
    const onReady = vi.fn()
    const { unmount } = renderCanvas({ onReady, artboardWidth: 768 })

    const handle = onReady.mock.calls[0]?.[0]

    expect(handle).not.toBeNull()
    expect(handle.documentRect().width).toBe(768)
    expect(handle.transform().zoom).toBe(1)

    handle.fitDocument()

    act(() => {
      vi.advanceTimersToNextFrame()
    })

    // jsdom measures a zero-sized viewport, so the fit floors at the minimum zoom — what is under
    // test is that the call reaches the viewport at all.
    expect(handle.transform().zoom).toBeLessThan(1)

    unmount()

    expect(onReady).toHaveBeenLastCalledWith(null)
  })

  it('reports a node’s box under the current transform, not the one it was measured under', () => {
    const onReady = vi.fn()

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 200,
      top: 200,
      left: 100,
      right: 300,
      bottom: 260,
      width: 200,
      height: 60,
      toJSON: () => ({}),
    })

    // The rect cache holds what a `NodeWrapper` registered, which is what the application renders.
    renderCanvas({ onReady, renderNode: (id) => <NodeWrapper id={id}>{id}</NodeWrapper> })

    const handle = onReady.mock.calls[0]?.[0]

    act(() => {
      vi.advanceTimersToNextFrame()
    })

    const measured = handle.nodeRect(ROOT)

    expect(measured).toEqual({ x: 100, y: 200, width: 200, height: 60 })

    // Pan the scene 40 px right and 10 px down: the same cached rect has to come back moved by that
    // much, because that is where the node now is on screen — ADR-183.
    act(() => {
      handle.panBy(40, 10)
      vi.advanceTimersToNextFrame()
    })

    expect(handle.nodeRect(ROOT)).toEqual({ x: 140, y: 210, width: 200, height: 60 })
  })

  it('re-reads its geometry when asked, for a host about to trust it', () => {
    const onReady = vi.fn()

    renderCanvas({ onReady, renderNode: (id) => <NodeWrapper id={id}>{id}</NodeWrapper> })

    const handle = onReady.mock.calls[0]?.[0]

    act(() => {
      vi.advanceTimersToNextFrame()
    })

    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect')
    const before = rect.mock.calls.length

    act(() => {
      handle.remeasure()
      vi.advanceTimersToNextFrame()
    })

    expect(rect.mock.calls.length).toBeGreaterThan(before)
  })

  it('is one tab stop that names itself, with an overlay layer and a live region', () => {
    renderCanvas()

    const root = screen.getByTestId('canvas-root')

    expect(root).toHaveAttribute('aria-label', 'Design canvas')
    expect(root).toHaveAttribute('tabindex', '0')
    expect(screen.getByTestId('canvas-overlays')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
