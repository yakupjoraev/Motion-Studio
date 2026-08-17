'use client'

import { RectCacheContext, createRectCache } from '@motion-studio/canvas'
import { BREAKPOINTS, type BreakpointId, type NodeId } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'
import { type ReactElement, useEffect, useState } from 'react'

import { NodeRenderer } from './node-renderer'

export interface ComparisonFrameProps {
  readonly breakpoint: BreakpointId
  readonly rootId: NodeId
  /** The breakpoint an inspector edit lands on. Exactly one frame carries it. */
  readonly editing: boolean
}

/**
 * One frame of the comparison — its own width, its own resolution (ADR-163), and no editing surface
 * of its own. The scale comes from `--ms-frame-scale`, written by the view above so a panel resize
 * moves three frames without re-rendering any of them.
 */
export function ComparisonFrame({
  breakpoint,
  rootId,
  editing,
}: ComparisonFrameProps): ReactElement {
  const { frame, label } = BREAKPOINTS[breakpoint]
  const cache = useNodeRects()

  return (
    <figure className="flex h-full min-h-0 flex-col gap-2" data-testid={`frame-${breakpoint}`}>
      <figcaption
        className={cn(
          'flex items-baseline gap-2 text-2xs',
          editing ? 'text-foreground' : 'text-foreground-muted',
        )}
        style={{ width: `calc(${frame}px * var(--ms-frame-scale, 1))` }}
      >
        <span className="font-medium">{breakpoint}</span>
        <span>
          {label} · {frame} px
        </span>
        {editing ? <span className="ml-auto text-accent">editing</span> : null}
      </figcaption>

      <div
        className={cn(
          'relative h-full overflow-hidden border bg-surface-0',
          editing ? 'border-accent' : 'border-border',
        )}
        style={{ width: `calc(${frame}px * var(--ms-frame-scale, 1))` }}
      >
        <div
          className="origin-top-left"
          style={{
            width: `${frame}px`,
            height: 'calc(100% / var(--ms-frame-scale, 1))',
            transform: 'scale(var(--ms-frame-scale, 1))',
          }}
        >
          <RectCacheContext.Provider value={cache}>
            <NodeRenderer breakpoint={breakpoint} id={rootId} />
          </RectCacheContext.Provider>
        </div>
      </div>
    </figure>
  )
}

/**
 * Node wrappers register with a rect cache, and this frame has no canvas to give them. Its own cache
 * is never read — nothing here hit-tests or draws an overlay — but it has to be disposed, or three
 * frames leave three `ResizeObserver`s behind every time the mode is toggled.
 */
function useNodeRects(): ReturnType<typeof createRectCache> {
  const [cache] = useState(createRectCache)

  useEffect(() => () => cache.dispose(), [cache])

  return cache
}
