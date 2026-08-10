import type { ClientRect } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'

import { snapToCursorOffset } from './snap-to-cursor-offset'

const clientRect = (left: number, top: number, width: number, height: number): ClientRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

const source = clientRect(100, 100, 200, 100)

const apply = (
  ghost: ClientRect | null,
  event: Event | null,
  translate = { x: 0, y: 0 },
  from: ClientRect = source,
): { x: number; y: number } => {
  const result = snapToCursorOffset({
    activatorEvent: event,
    active: null,
    activeNodeRect: from,
    containerNodeRect: null,
    draggingNodeRect: ghost,
    over: null,
    overlayNodeRect: ghost,
    scrollableAncestors: [],
    scrollableAncestorRects: [],
    transform: { ...translate, scaleX: 1, scaleY: 1 },
    windowRect: null,
  })

  return { x: result.x, y: result.y }
}

/** The cursor grabbed the source at a quarter across and halfway down. */
const grab = new MouseEvent('pointerdown', { clientX: 150, clientY: 150 })

describe('snapToCursorOffset', () => {
  it('keeps the cursor at the same fraction across a smaller ghost', () => {
    // 50 px into a 200 px source is a quarter; a quarter of a 100 px ghost is 25, so it shifts 25 px.
    expect(apply(clientRect(0, 0, 100, 50), grab)).toEqual({ x: 25, y: 25 })
  })

  it('does nothing when the ghost is the size of the source', () => {
    expect(apply(source, grab)).toEqual({ x: 0, y: 0 })
  })

  it('shifts by a constant, so the ghost still tracks the cursor 1:1', () => {
    const ghost = clientRect(0, 0, 100, 50)
    const near = apply(ghost, grab, { x: 10, y: 10 })
    const far = apply(ghost, grab, { x: 310, y: 210 })

    expect({ x: far.x - near.x, y: far.y - near.y }).toEqual({ x: 300, y: 200 })
  })

  it('leaves a keyboard drag alone: there is no cursor to snap to', () => {
    const key = new KeyboardEvent('keydown', { code: 'Space' })

    expect(apply(clientRect(0, 0, 100, 50), key, { x: 8, y: 0 })).toEqual({ x: 8, y: 0 })
  })

  it('leaves the transform alone before the ghost has been measured', () => {
    expect(apply(null, grab, { x: 4, y: 4 })).toEqual({ x: 4, y: 4 })
  })

  it('has no fraction to preserve when the source has no size', () => {
    const collapsed = clientRect(100, 100, 0, 0)

    expect(apply(clientRect(0, 0, 100, 50), grab, { x: 2, y: 2 }, collapsed)).toEqual({
      x: 2,
      y: 2,
    })
  })
})
