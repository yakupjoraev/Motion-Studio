import type { CanvasHandle } from '@motion-studio/canvas'
import { nodeId } from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { REVEAL_FRAMES, canvasRects, revealNode, setCanvasHandle } from './canvas-handle'

const ID = nodeId('node_1')

const handle = (overrides: Partial<CanvasHandle> = {}): CanvasHandle => ({
  documentRect: () => ({ x: 0, y: 0, width: 0, height: 0 }) as never,
  viewportRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  nodeRect: () => undefined,
  transform: () => ({ zoom: 1, pan: { x: 0, y: 0 } }),
  fitDocument: () => undefined,
  panBy: () => undefined,
  remeasure: () => undefined,
  reveal: () => true,
  ...overrides,
})

/** Frames as a queue a test drains by hand, rather than a real `requestAnimationFrame`. */
function frames() {
  const queue: (() => void)[] = []

  return {
    schedule: (callback: () => void) => queue.push(callback),
    run: () => {
      const next = queue.shift()

      next?.()

      return next !== undefined
    },
  }
}

afterEach(() => setCanvasHandle(null))

describe('revealNode', () => {
  it('does nothing before a canvas has mounted', () => {
    const clock = frames()

    revealNode(ID, { schedule: clock.schedule })

    // Every attempt is spent, and none of them threw for want of a canvas.
    for (let index = 0; index < REVEAL_FRAMES; index += 1) {
      clock.run()
    }

    expect(clock.run()).toBe(false)
  })

  it('stops on the first frame the node is measured on', () => {
    const reveal = vi.fn().mockReturnValueOnce(false).mockReturnValue(true)
    const clock = frames()

    setCanvasHandle(handle({ reveal }))
    revealNode(ID, { schedule: clock.schedule })

    expect(reveal).toHaveBeenCalledTimes(1)

    clock.run()

    expect(reveal).toHaveBeenCalledTimes(2)
    // The second call found it, so no third frame was queued.
    expect(clock.run()).toBe(false)
  })

  it('gives up after the insertion has had its frames', () => {
    const reveal = vi.fn().mockReturnValue(false)
    const clock = frames()

    setCanvasHandle(handle({ reveal }))
    revealNode(ID, { schedule: clock.schedule })

    while (clock.run()) {
      // Drain.
    }

    expect(reveal).toHaveBeenCalledTimes(REVEAL_FRAMES)
  })
})

describe('canvasRects', () => {
  it('answers from the mounted canvas and with nothing when there is none', () => {
    const rect: Rect = { x: 1, y: 2, width: 3, height: 4 }

    expect(canvasRects.get(ID)).toBeUndefined()

    setCanvasHandle(
      handle({ nodeRect: () => rect, transform: () => ({ zoom: 2, pan: { x: 0, y: 0 } }) }),
    )

    expect(canvasRects.get(ID)).toEqual(rect)
    expect(canvasRects.transform()?.zoom).toBe(2)
  })

  it('passes an auto-pan step to the canvas', () => {
    const panBy = vi.fn()

    setCanvasHandle(handle({ panBy }))
    canvasRects.panBy(12, -4)

    expect(panBy).toHaveBeenCalledWith(12, -4)
  })
})
