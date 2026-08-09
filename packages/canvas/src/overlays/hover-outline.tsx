'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, useEffect, useMemo, useRef } from 'react'

import { writeBox } from './overlay-box'
import { HOVER_OUTLINE_CLASS, OVERLAY_BOX_STYLE } from './overlay.styles'
import type { OverlayPainter } from './overlay.types'
import { useOverlayPaint } from './use-overlay-rects'

/** ADR-093: the hit test's answer, held where the loop can read it and React cannot. */
export interface HoverSource {
  current(): NodeId | null
  report(id: NodeId | null): void
  subscribe(listener: () => void): () => void
}

export function useHoverSource(): HoverSource {
  const hovered = useRef<NodeId | null>(null)
  const listeners = useRef<Set<() => void>>(new Set())

  return useMemo<HoverSource>(
    () => ({
      current: () => hovered.current,

      report(id) {
        if (id === hovered.current) {
          return
        }

        hovered.current = id

        for (const listener of listeners.current) {
          listener()
        }
      },

      subscribe(listener) {
        listeners.current.add(listener)

        return () => {
          listeners.current.delete(listener)
        }
      },
    }),
    [],
  )
}

export interface HoverOutlineProps {
  readonly hover: HoverSource
  readonly painter: OverlayPainter
  /** The gestures that own the pointer: an outline chasing a marquee or a drag is noise. */
  readonly rootRef: RefObject<HTMLElement | null>
}

const BUSY = ['panning', 'marquee', 'dragging'] as const

export function HoverOutline({ hover, painter, rootRef }: HoverOutlineProps) {
  const box = useRef<HTMLDivElement | null>(null)

  useOverlayPaint(painter, (frame) => {
    const id = hover.current()
    const root = rootRef.current
    const busy = root !== null && BUSY.some((flag) => root.dataset[flag] === 'true')

    writeBox(box.current, id === null || busy ? undefined : frame.rect(id))
  })

  useEffect(() => hover.subscribe(painter.schedule), [hover, painter])

  return (
    <div
      aria-hidden
      className={HOVER_OUTLINE_CLASS}
      data-testid="hover-outline"
      ref={box}
      style={OVERLAY_BOX_STYLE}
    />
  )
}
