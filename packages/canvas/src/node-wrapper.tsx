'use client'

import type { NodeId } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef } from 'react'

import { NODE_WRAPPER_CLASS } from './canvas.styles'
import { useRectCacheContext } from './rects/use-rect-cache'

export interface NodeWrapperProps {
  readonly id: NodeId
  readonly children: ReactNode
  readonly className?: string | undefined
  /** The node's `css` escape hatch — ADR-274. The wrapper is the node's box, so it carries it. */
  readonly style?: CSSProperties | undefined
  /**
   * A second ref onto the same element, for a host that registers this node as a drop zone — ADR-181.
   * The zone's geometry is the node's own box, and this is how it gets it without `packages/canvas`
   * importing the drag layer or the host wrapping every node in an extra element.
   */
  readonly dropRef?: ((element: HTMLElement | null) => void) | undefined
}

/**
 * The host element hit testing looks for and the rect cache measures. The application's own
 * `NodeRenderer` renders the block into it — CANVAS.md § Node rendering — so the canvas still knows
 * nothing about what a Hero is.
 *
 * It is the only writer of `data-node-id`, which is what makes reading that attribute back as a
 * `NodeId` sound in `hit-test.ts`.
 */
export function NodeWrapper({ id, children, className, style, dropRef }: NodeWrapperProps) {
  const cache = useRectCacheContext()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current

    if (element === null) {
      return
    }

    return cache.observe(id, element)
  }, [cache, id])

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      ref.current = element
      dropRef?.(element)
    },
    [dropRef],
  )

  return (
    <div className={cn(NODE_WRAPPER_CLASS, className)} data-node-id={id} ref={attach} style={style}>
      {children}
    </div>
  )
}
