import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

/** jsdom ships no `PointerEvent`; Testing Library then sends a bare `Event` with no coordinates. */
export class PointerEventStub extends MouseEvent {
  readonly pointerId: number

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
  }
}

/** Pointer capture is what a scrub gesture uses in place of pointer lock, and jsdom has neither. */
export function stubPointerCapture(): void {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
}

/** Synchronous frames: the per-frame coalescing is what is under test, not the browser's scheduler. */
export function stubAnimationFrames(): void {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)

    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
}

/** What every test that touches a `ScrubField` needs before its first click. */
export function stubDragEnvironment(): void {
  vi.stubGlobal('PointerEvent', PointerEventStub)
  stubPointerCapture()
  stubAnimationFrames()
}

export interface DragStep {
  readonly clientX: number
  readonly shiftKey?: boolean
  readonly altKey?: boolean
}

/** A press, a run of moves, and a release, addressed to one element under pointer capture. */
export function drag(element: HTMLElement, steps: readonly DragStep[]): void {
  fireEvent.pointerDown(element, { clientX: 0, pointerId: 1 })

  for (const step of steps) {
    fireEvent.pointerMove(element, { pointerId: 1, ...step })
  }

  fireEvent.pointerUp(element, { clientX: steps.at(-1)?.clientX ?? 0, pointerId: 1 })
}
