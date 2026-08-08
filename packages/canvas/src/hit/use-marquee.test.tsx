import type { NodeId } from '@motion-studio/schema'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useMemo, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Canvas } from '../canvas'
import type { CanvasSelectionPort } from '../canvas.types'
import { NodeWrapper } from '../node-wrapper'
import { layoutNodes, pointAt } from '../test/harness'
import { stubGestureEnvironment } from '../test/pointer'
import { type FakeNodeSpec, fakeScene } from '../test/scene'

import { MARQUEE_VARS } from './use-marquee'

const NODE_COUNT = 200

/** 200 nodes in one row, 100 wide and 20 apart, so a band can cross an exact number of them. */
const wideScene = () => {
  const names = Array.from({ length: NODE_COUNT }, (_, index) => `n${index}`)
  const spec: Record<string, FakeNodeSpec> = { root: { children: names, name: 'Page' } }

  for (const name of names) {
    spec[name] = { name }
  }

  return fakeScene(spec)
}

const boxes = (): Record<string, Omit<DOMRect, 'toJSON'>> =>
  Object.fromEntries(
    Array.from({ length: NODE_COUNT }, (_, index) => [
      `n${index}`,
      {
        x: index * 120,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        left: index * 120,
        right: 0,
        bottom: 0,
      },
    ]),
  )

interface HostProps {
  readonly fake: ReturnType<typeof wideScene>
  readonly onRender: () => void
}

/**
 * The counter of the prompt's performance check: this component re-renders whenever the selection
 * changes, which is what a real studio does, so the count is the number of canvas renders a marquee
 * costs.
 */
function Host({ fake, onRender }: HostProps) {
  const [ids, setIds] = useState<readonly NodeId[]>([])

  onRender()

  const selection = useMemo<CanvasSelectionPort>(
    () => ({
      ...fake.selection,
      select(next, mode) {
        fake.selection.select(next, mode)
        setIds(next)
      },
    }),
    [fake],
  )

  return (
    <>
      <span data-testid="selected">{ids.length}</span>
      <Canvas
        artboardWidth={1440}
        renderNode={(id) => (
          <NodeWrapper id={id}>
            {fake.scene.node(id)?.children.map((child) => (
              <NodeWrapper id={child} key={child}>
                <span />
              </NodeWrapper>
            ))}
          </NodeWrapper>
        )}
        rootId={fake.rootId}
        scene={fake.scene}
        selection={selection}
      />
    </>
  )
}

const drag = (
  from: readonly [number, number],
  to: readonly [number, number],
  init: PointerEventInit = {},
) => {
  const root = screen.getByTestId('canvas-root')

  pointAt(null)
  fireEvent.pointerDown(root, { button: 0, clientX: from[0], clientY: from[1], pointerId: 1 })

  act(() => {
    vi.advanceTimersToNextFrame()
  })

  const steps = 20

  for (let step = 1; step <= steps; step += 1) {
    fireEvent.pointerMove(window, {
      clientX: from[0] + ((to[0] - from[0]) * step) / steps,
      clientY: from[1] + ((to[1] - from[1]) * step) / steps,
      pointerId: 1,
    })

    act(() => {
      vi.advanceTimersToNextFrame()
    })
  }

  fireEvent.pointerUp(window, { clientX: to[0], clientY: to[1], pointerId: 1, ...init })
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

describe('useMarquee', () => {
  it('selects every intersecting node across 200 of them, and renders the canvas once', () => {
    const fake = wideScene()
    const renders = vi.fn()

    render(<Host fake={fake} onRender={renders} />)
    layoutNodes(boxes())

    expect(renders).toHaveBeenCalledTimes(1)

    act(() => {
      drag([0, 10], [24_000, 90])
    })

    expect(screen.getByTestId('selected')).toHaveTextContent(String(NODE_COUNT))
    expect(renders).toHaveBeenCalledTimes(2)
  })

  it('writes the band geometry to CSS variables and takes it down on release', () => {
    const fake = wideScene()

    render(<Host fake={fake} onRender={() => undefined} />)
    layoutNodes(boxes())

    const root = screen.getByTestId('canvas-root')
    const band = screen.getByTestId('canvas-marquee')

    pointAt(null)
    fireEvent.pointerDown(root, { button: 0, clientX: 300, clientY: 40, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 90, pointerId: 1 })

    act(() => {
      vi.advanceTimersToNextFrame()
    })

    expect(band).toHaveAttribute('data-active', 'true')
    expect(band.style.getPropertyValue(MARQUEE_VARS.x)).toBe('100px')
    expect(band.style.getPropertyValue(MARQUEE_VARS.y)).toBe('40px')
    expect(band.style.getPropertyValue(MARQUEE_VARS.width)).toBe('200px')
    expect(band.style.getPropertyValue(MARQUEE_VARS.height)).toBe('50px')

    fireEvent.pointerUp(window, { clientX: 100, clientY: 90, pointerId: 1 })

    expect(band).not.toHaveAttribute('data-active')
    expect(root).not.toHaveAttribute('data-marquee')
  })

  it('requires full containment with Alt', () => {
    const fake = wideScene()

    render(<Host fake={fake} onRender={() => undefined} />)
    layoutNodes(boxes())

    act(() => {
      // Covers all of the first node and half of the second.
      drag([-10, -10], [170, 110], { altKey: true })
    })

    expect(fake.scene.selectedIds()).toEqual([fake.id('n0')])
  })

  it('commits nothing when the band has no area', () => {
    const fake = wideScene()

    render(<Host fake={fake} onRender={() => undefined} />)
    layoutNodes(boxes())

    act(() => {
      drag([50, 50], [50, 50])
    })

    expect(fake.scene.selectedIds()).toEqual([])
  })

  it('abandons the gesture when the browser cancels the pointer', () => {
    const fake = wideScene()

    render(<Host fake={fake} onRender={() => undefined} />)
    layoutNodes(boxes())

    const root = screen.getByTestId('canvas-root')

    pointAt(null)
    fireEvent.pointerDown(root, { button: 0, clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 400, clientY: 90, pointerId: 1 })
    fireEvent.pointerCancel(window, { pointerId: 1 })

    expect(root).not.toHaveAttribute('data-marquee')
    expect(screen.getByTestId('canvas-marquee')).not.toHaveAttribute('data-active')

    fireEvent.pointerUp(window, { clientX: 400, clientY: 90, pointerId: 1 })

    expect(fake.scene.selectedIds()).toEqual([])
  })

  it('keeps the press from starting a native text selection', () => {
    const fake = wideScene()

    render(<Host fake={fake} onRender={() => undefined} />)
    layoutNodes(boxes())
    pointAt(null)

    const press = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    })

    Object.defineProperty(press, 'button', { value: 0 })
    screen.getByTestId('canvas-root').dispatchEvent(press)

    expect(press.defaultPrevented).toBe(true)
  })

  it('abandons the gesture on Escape', () => {
    const fake = wideScene()

    render(<Host fake={fake} onRender={() => undefined} />)
    layoutNodes(boxes())

    const root = screen.getByTestId('canvas-root')

    pointAt(null)
    fireEvent.pointerDown(root, { button: 0, clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 400, clientY: 90, pointerId: 1 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.pointerUp(window, { clientX: 400, clientY: 90, pointerId: 1 })

    expect(fake.scene.selectedIds()).toEqual([])
    expect(root).not.toHaveAttribute('data-marquee')
  })
})
