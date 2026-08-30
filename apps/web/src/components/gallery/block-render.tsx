'use client'

import { loadBlockComponent } from '@motion-studio/blocks/lazy'
import type { BlockCategory, BlockId, UnknownProps } from '@motion-studio/schema'
import { type ComponentType, type ReactNode, Suspense, useEffect, useState } from 'react'

export interface BlockRenderProps {
  readonly id: BlockId
  readonly category: BlockCategory
  readonly props: UnknownProps
  /** Held at the frame's own height, so a chunk landing moves nothing. */
  readonly fallback: ReactNode
  /** What a slot-bearing block arranges — `slotFill`. Positional, which is how the canvas passes it. */
  readonly children?: ReactNode
}

/**
 * One block, loaded on demand and rendered with the props it was handed.
 *
 * The component is held in state rather than in a `lazy()`: fourteen blocks are already `lazy` in
 * their category's map, and a `lazy` around a `lazy` is the one thing React refuses to render. The
 * `Suspense` below is what makes those fourteen behave like the other fifty-eight.
 *
 * The props arrive already parsed — the server parses them for a card, `useBlockState` parses them
 * for the detail page — because both callers have to answer "is this valid" before they can decide
 * what to show, and parsing twice would let the two answers disagree.
 */
export function BlockRender({ id, category, props, fallback, children }: BlockRenderProps) {
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>> | null>(null)

  useEffect(() => {
    let cancelled = false

    loadBlockComponent(category, id).then(
      (loaded) => {
        if (!cancelled) {
          // The updater form, because a component *is* a function and `setState` would call it.
          setComponent(() => loaded)
        }
      },
      /*
       * A chunk request that does not arrive leaves the placeholder in place. It is not a
       * hypothetical: navigating away from the catalogue cancels the fetches its cards had started,
       * and without this the rejection escapes as an unhandled `ChunkLoadError` — which is what
       * WebKit reported when the flow spec walked seventy-two pages in a row.
       */
      () => undefined,
    )

    return () => {
      cancelled = true
    }
  }, [category, id])

  if (Component === null) {
    return fallback
  }

  return (
    <Suspense fallback={fallback}>
      <Component {...props}>{children}</Component>
    </Suspense>
  )
}
