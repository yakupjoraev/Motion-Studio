'use client'

import type { NodeId } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'
import { type ReactNode, useEffect, useRef } from 'react'

import { NODE_WRAPPER_CLASS } from './canvas.styles'
import { useRectCacheContext } from './rects/use-rect-cache'

export interface NodeWrapperProps {
  readonly id: NodeId
  readonly children: ReactNode
  readonly className?: string | undefined
}

/**
 * The host element hit testing looks for and the rect cache measures. The application's own
 * `NodeRenderer` renders the block into it — CANVAS.md § Node rendering — so the canvas still knows
 * nothing about what a Hero is.
 *
 * It is the only writer of `data-node-id`, which is what makes reading that attribute back as a
 * `NodeId` sound in `hit-test.ts`.
 */
export function NodeWrapper({ id, children, className }: NodeWrapperProps) {
  const cache = useRectCacheContext()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current

    if (element === null) {
      return
    }

    return cache.observe(id, element)
  }, [cache, id])

  return (
    <div className={cn(NODE_WRAPPER_CLASS, className)} data-node-id={id} ref={ref}>
      {children}
    </div>
  )
}
