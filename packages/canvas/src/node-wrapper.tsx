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
  /**
   * The same element as a drag *source* — operation 2 of DRAG_AND_DROP.md, ADR-359. The host owns the
   * drag layer, so what arrives here is the listeners and attributes it produced, plus its ref: this
   * package still imports nothing from dnd-kit.
   */
  readonly drag?: NodeDragHandle | undefined
}

export interface NodeDragHandle {
  readonly ref: (element: HTMLElement | null) => void
  /**
   * `object` rather than `Record<string, unknown>`: dnd-kit's own attribute and listener types are
   * closed shapes with no index signature, and widening them here would need a cast — which § 1.1 of
   * the contract calls a defect. Everything below spreads them onto an element and reads none of them.
   */
  readonly listeners: object | undefined
  readonly attributes: object
  readonly isDragging: boolean
}

/**
 * The host element hit testing looks for and the rect cache measures. The application's own
 * `NodeRenderer` renders the block into it — CANVAS.md § Node rendering — so the canvas still knows
 * nothing about what a Hero is.
 *
 * It is the only writer of `data-node-id`, which is what makes reading that attribute back as a
 * `NodeId` sound in `hit-test.ts`.
 */
export function NodeWrapper({ id, children, className, style, dropRef, drag }: NodeWrapperProps) {
  const cache = useRectCacheContext()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current

    if (element === null) {
      return
    }

    return cache.observe(id, element)
  }, [cache, id])

  /*
   * The drag *ref*, not the drag handle: the handle is a fresh object on every render, and depending
   * on it here rebuilt `attach` each time — which detaches and re-attaches the element, so the rect
   * cache re-observes on every render and the canvas never settles. dnd-kit's `setNodeRef` is stable,
   * which is what makes this safe.
   */
  const dragRef = drag?.ref

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      ref.current = element
      dropRef?.(element)
      dragRef?.(element)
    },
    [dropRef, dragRef],
  )

  return (
    <div
      className={cn(NODE_WRAPPER_CLASS, className)}
      data-dragging={drag?.isDragging === true ? '' : undefined}
      data-node-id={id}
      ref={attach}
      style={style}
      {...(drag?.attributes ?? {})}
      {...(drag?.listeners ?? {})}
    >
      {children}
    </div>
  )
}
