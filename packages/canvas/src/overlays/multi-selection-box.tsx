'use client'

import type { NodeId } from '@motion-studio/schema'
import { useRef } from 'react'

import type { CanvasRect } from '../coords/index'

import { unionRect, writeBox } from './overlay-box'
import { MULTI_SELECTION_CLASS, OVERLAY_BOX_STYLE } from './overlay.styles'
import type { OverlayPainter } from './overlay.types'
import { useOverlayPaint } from './use-overlay-rects'

export interface MultiSelectionBoxProps {
  readonly ids: readonly NodeId[]
  readonly painter: OverlayPainter
}

/** The dashed union of the selection, drawn with a thin outline per node so what is in it is clear. */
export function MultiSelectionBox({ ids, painter }: MultiSelectionBoxProps) {
  const box = useRef<HTMLDivElement | null>(null)

  useOverlayPaint(painter, (frame) => {
    const rects: CanvasRect[] = []

    for (const id of ids) {
      const rect = frame.rect(id)

      if (rect !== undefined) {
        rects.push(rect)
      }
    }

    writeBox(box.current, unionRect(rects))
  })

  return (
    <div
      aria-hidden
      className={MULTI_SELECTION_CLASS}
      data-testid="multi-selection-box"
      ref={box}
      style={OVERLAY_BOX_STYLE}
    />
  )
}
