'use client'

import type { Point } from '@motion-studio/utils'
import { useEffect, useMemo, useRef } from 'react'

import type { DropTarget } from '../dnd.types'
import type { IndicatorHandle } from './indicator-handle'

/**
 * DRAG_AND_DROP.md § Performance. Most `pointermove` events during a slow drag are noise: the pointer
 * has not crossed anything, so resolving again would produce the same answer at the cost of a walk up
 * the tree and a pass over the siblings.
 */
export const RESOLVE_SKIP_PX = 2

export interface DropResolutionOptions {
  readonly indicator: IndicatorHandle
  /** Runs inside the frame, so it sees the drag as it is when the frame runs and not when it started. */
  readonly resolve: () => DropTarget | null
  readonly schedule?: ((callback: () => void) => number) | undefined
  readonly cancel?: ((handle: number) => void) | undefined
}

export interface DropResolution {
  /** Called per pointer move; at most one resolution per frame, and none for a move under 2 px. */
  request(point: Point | null): void
  /** End of the drag: no pending frame, no indicator. */
  stop(): void
}

export function useDropResolution({
  indicator,
  resolve,
  schedule = requestAnimationFrame,
  cancel = cancelAnimationFrame,
}: DropResolutionOptions): DropResolution {
  const latest = useRef(resolve)
  latest.current = resolve

  const state = useRef<{ frame: number | null; at: Point | null }>({ frame: null, at: null })

  const resolution = useMemo<DropResolution>(
    () => ({
      request(point) {
        if (
          point === null ||
          state.current.frame !== null ||
          moved(state.current.at, point) < RESOLVE_SKIP_PX
        ) {
          return
        }

        state.current.at = point
        state.current.frame = schedule(() => {
          state.current.frame = null
          indicator.set(latest.current()?.indicator ?? null)
        })
      },

      stop() {
        if (state.current.frame !== null) {
          cancel(state.current.frame)
          state.current.frame = null
        }

        state.current.at = null
        indicator.set(null)
      },
    }),
    [cancel, indicator, schedule],
  )

  useEffect(() => resolution.stop, [resolution])

  return resolution
}

/** `Infinity` for the first move of a drag, so it always resolves. */
const moved = (from: Point | null, to: Point): number =>
  from === null
    ? Number.POSITIVE_INFINITY
    : Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y))
