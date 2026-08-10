import type { Rect } from '@motion-studio/utils'

import type { DropIndicator } from '../dnd.types'
import { INDICATOR_VARS } from './indicator.styles'

export type IndicatorKind = DropIndicator['kind'] | 'none'

/**
 * The drop indicator, split the way the canvas overlays are (ADR-091): its **kind** is React state,
 * because a line and a cell are different elements, and its **position** is four CSS variables written
 * straight to the element, because a pointer moves every frame and a re-render per frame is the thing
 * PERFORMANCE.md § Drag exists to prevent.
 */
export interface IndicatorHandle {
  kind(): IndicatorKind
  reason(): string | null
  rect(): Rect | null
  /** The whole update: geometry now, a render only if the kind or the reason changed. */
  set(indicator: DropIndicator | null): void
  /** The layer's `ref`. Attaching paints immediately, so a new element lands already positioned. */
  attach(element: HTMLElement | null): void
  subscribe(listener: () => void): () => void
}

export function createIndicatorHandle(): IndicatorHandle {
  const listeners = new Set<() => void>()
  let element: HTMLElement | null = null
  let kind: IndicatorKind = 'none'
  let reason: string | null = null
  let rect: Rect | null = null

  const paint = (): void => {
    if (element === null || rect === null) {
      return
    }

    element.style.setProperty(INDICATOR_VARS.x, `${rect.x}px`)
    element.style.setProperty(INDICATOR_VARS.y, `${rect.y}px`)
    element.style.setProperty(INDICATOR_VARS.width, `${rect.width}px`)
    element.style.setProperty(INDICATOR_VARS.height, `${rect.height}px`)
  }

  return {
    kind: () => kind,
    reason: () => reason,
    rect: () => rect,

    set(indicator) {
      const nextKind: IndicatorKind = indicator === null ? 'none' : indicator.kind
      const nextReason = indicator !== null && indicator.kind === 'reject' ? indicator.reason : null

      rect = indicator === null ? null : indicator.rect
      paint()

      if (nextKind === kind && nextReason === reason) {
        return
      }

      kind = nextKind
      reason = nextReason

      for (const listener of listeners) {
        listener()
      }
    },

    attach(next) {
      element = next
      paint()
    },

    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
