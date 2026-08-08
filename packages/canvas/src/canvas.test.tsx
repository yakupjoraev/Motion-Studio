import { nodeId } from '@motion-studio/schema'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Canvas } from './canvas'
import { SCENE_TRANSFORM } from './canvas.styles'
import { stubGestureEnvironment } from './test/pointer'
import { VIEWPORT_VARS } from './viewport/use-viewport'
import { useViewportContext } from './viewport/viewport-context'

const ROOT = nodeId('node_root')

const renderCanvas = (props: Partial<Parameters<typeof Canvas>[0]> = {}) =>
  render(
    <Canvas
      artboardWidth={1440}
      renderNode={(id) => <div data-node-id={id}>{id}</div>}
      rootId={ROOT}
      {...props}
    />,
  )

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

    const scene = screen.getByTestId('canvas-scene')

    expect(scene.style.getPropertyValue(VIEWPORT_VARS.zoom)).toBe('0.5')
    expect(scene.style.getPropertyValue(VIEWPORT_VARS.x)).toBe('12px')
    // 0.5 is the top of the grid fade, so the dots are fully opaque there.
    expect(scene.style.getPropertyValue(VIEWPORT_VARS.gridOpacity)).toBe('1')
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
})
