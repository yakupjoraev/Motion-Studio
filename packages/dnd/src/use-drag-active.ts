'use client'

import { useDndContext } from '@dnd-kit/core'

/**
 * Whether a drag is in flight, for a surface that has to behave differently while one is — the canvas
 * auto-panning near its edges, for instance. It is a boolean rather than the context itself so that
 * `@dnd-kit/core` stays an implementation detail of this package.
 */
export function useDragActive(): boolean {
  return useDndContext().active !== null
}
