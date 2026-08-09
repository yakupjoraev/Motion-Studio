'use client'

import { useRef } from 'react'

import type { CanvasRect } from '../coords/index'

import { writeBox } from './overlay-box'
import { BREAKPOINT_FRAME_CLASS, BREAKPOINT_LABEL_CLASS, OVERLAY_BOX_STYLE } from './overlay.styles'
import type { OverlayPainter } from './overlay.types'
import { useOverlayPaint } from './use-overlay-rects'

export interface BreakpointFrameProps {
  readonly painter: OverlayPainter
  /** The artboard's own box: the width being previewed and what the document came to. */
  readonly documentRect: () => CanvasRect
  /** `md`, `lg` — the breakpoint the width belongs to, when the host names one. */
  readonly name?: string | undefined
}

/**
 * The edge of the frame the design is being made for. It is an overlay rather than a border on the
 * artboard so its line stays 1 px at 400 % zoom, like every other line in this layer.
 */
export function BreakpointFrame({ painter, documentRect, name }: BreakpointFrameProps) {
  const box = useRef<HTMLDivElement | null>(null)
  const label = useRef<HTMLSpanElement | null>(null)

  useOverlayPaint(painter, () => {
    const rect = documentRect()

    if (!writeBox(box.current, rect) || label.current === null) {
      return
    }

    label.current.textContent = name === undefined ? `${rect.width}` : `${name} · ${rect.width}`
  })

  return (
    <div
      aria-hidden
      className={BREAKPOINT_FRAME_CLASS}
      data-testid="breakpoint-frame"
      ref={box}
      style={OVERLAY_BOX_STYLE}
    >
      <span className={BREAKPOINT_LABEL_CLASS} data-testid="breakpoint-label" ref={label} />
    </div>
  )
}
